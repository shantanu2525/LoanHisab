// ─── PWA runtime: platform detection, install prompt, SW updates, offline ───
import { useCallback, useEffect, useRef, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

// — platform / environment detection —
export const getPlatform = () => {
  const ua = navigator.userAgent;
  const iOS =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS desktop UA
  const android = /Android/i.test(ua);
  const mobile = iOS || android || /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true; // iOS Safari
  return { iOS, android, mobile, standalone };
};

// — localStorage (optional, resilient) —
const read = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, v: string): void => {
  try { localStorage.setItem(key, v); } catch { /* private mode */ }
};

export const INSTALL_KEYS = {
  dismissedAndroid: "lh-install-dismissed",
  dismissedIOS: "lh-ios-hide",
  installed: "lh-installed",
} as const;

// — shared captured beforeinstallprompt (module-level singleton) —
let capturedPrompt: BeforeInstallPromptEvent | null = null;
type PromptListener = (e: BeforeInstallPromptEvent | null) => void;
const promptListeners = new Set<PromptListener>();

let watched = false;
function watchInstallEvents(): void {
  if (watched || typeof window === "undefined") return;
  watched = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    capturedPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn(capturedPrompt));
  });
  window.addEventListener("appinstalled", () => {
    capturedPrompt = null;
    write(INSTALL_KEYS.installed, "1");
    write(INSTALL_KEYS.dismissedAndroid, "1");
    write(INSTALL_KEYS.dismissedIOS, "1");
    promptListeners.forEach((fn) => fn(null));
  });
}

export function onInstallPrompt(fn: PromptListener): () => void {
  watchInstallEvents();
  promptListeners.add(fn);
  // late-joining component gets current state
  fn(capturedPrompt);
  return () => { promptListeners.delete(fn); };
}

/** One-shot subscription helper: waits for the event during app lifetime. */
export function useDeferredPrompt(): BeforeInstallPromptEvent | null {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(capturedPrompt);
  useEffect(() => onInstallPrompt(setPrompt), []);
  return prompt;
}

// — install prompt hook (with smart banner timing) —
export interface InstallState {
  androidPrompt: BeforeInstallPromptEvent | null;
  showAndroidBanner: boolean;
  showIOSGuideDefault: boolean;
  standalone: boolean;
  installed: boolean;
  iOS: boolean;
  android: boolean;
  mobile: boolean;
  dismissAndroid: () => void;
  dismissIOS: () => void;
  markIOSHidden: () => void;
}

export function useInstallState(): InstallState {
  const plat = useRef(getPlatform());
  const [androidPrompt, setAndroidPrompt] = useState<BeforeInstallPromptEvent | null>(capturedPrompt);

  useEffect(() => onInstallPrompt(setAndroidPrompt), []);

  // Listen for display-mode changes (e.g. installed while tab open)
  const [standalone, setStandalone] = useState(plat.current.standalone);
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const sync = () => setStandalone(mq.matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    mq.addEventListener?.("change", sync);
    sync();
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const installed = standalone || read(INSTALL_KEYS.installed) === "1";

  // Android banner eligibility: native prompt available + not dismissed + not installed
  const dismissedAndroid = read(INSTALL_KEYS.dismissedAndroid) != null;

  // iOS guide default: auto-open the sheet once (after a delay) unless hidden before
  const dismissedIOS = read(INSTALL_KEYS.dismissedIOS) != null;
  const showIOSGuideDefault =
    plat.current.iOS && plat.current.mobile && !standalone && !installed && !dismissedIOS;

  const dismissAndroid = useCallback(() => {
    write(INSTALL_KEYS.dismissedAndroid, String(Date.now()));
    setAndroidPrompt(null);
    capturedPrompt = null;
  }, []);

  const dismissIOS = useCallback(() => {
    write(INSTALL_KEYS.dismissedIOS, "1");
  }, []);

  return {
    androidPrompt,
    showAndroidBanner: !!androidPrompt && !standalone && !installed && !dismissedAndroid,
    showIOSGuideDefault,
    standalone,
    installed,
    iOS: plat.current.iOS,
    android: plat.current.android,
    mobile: plat.current.mobile,
    dismissAndroid,
    dismissIOS,
    markIOSHidden: dismissIOS,
  };
}

// — service worker registration + update flow —
export interface SWState {
  supported: boolean;
  online: boolean;
  updateAvailable: boolean;
  applyUpdate: () => void;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker(): SWState {
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const reloadedRef = useRef(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!supported) return;

    // reload once the new worker takes control (after user clicked Refresh)
    const onControllerChange = () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("sw.js", { scope: "./" })
      .then((reg) => {
        setRegistration(reg);

        const trackWaiting = (sw: ServiceWorker | null) => {
          if (sw && sw.state === "installed" && navigator.serviceWorker.controller) {
            waitingRef.current = sw;
            setUpdateAvailable(true);
          }
        };

        // warm start: an update may already be queued
        trackWaiting(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            trackWaiting(installing);
            trackWaiting(reg.waiting);
          });
        });

        // re-check periodically (each minute, cheap)
        const interval = window.setInterval(() => reg.update().catch(() => undefined), 60_000);
        return () => window.clearInterval(interval);
      })
      .catch(() => { /* offline or unsupported — app must keep working */ });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [supported]);

  const applyUpdate = useCallback(() => {
    const waiting = waitingRef.current;
    if (waiting) {
      waiting.postMessage("SKIP_WAITING");
    } else {
      // fallback: hard update + reload
      registration?.update().finally(() => window.location.reload());
    }
  }, [registration]);

  return { supported, online, updateAvailable, applyUpdate, registration };
}
