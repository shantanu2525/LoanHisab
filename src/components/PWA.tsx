// ─── PWA UI: install banner, iOS guide sheet, update toast, offline toast ───
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download, X, ChevronUp, Plus, WifiOff, Share, RefreshCw,
  Smartphone, BadgeCheck, Home,
} from "lucide-react";
import {
  useInstallState, useServiceWorker, INSTALL_KEYS,
  type BeforeInstallPromptEvent,
} from "../lib/pwa";

// — shared sub-pieces —
function DismissBtn({ onClick, label = "Dismiss" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-sand-100 hover:text-ink-700 active:scale-90"
    >
      <X className="size-4.5" />
    </button>
  );
}

// ═══ 1. Install banner (Android native prompt; desktop Chromium) ════════════
export function InstallBanner() {
  const inst = useInstallState();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const eligible = inst.showAndroidBanner && inst.androidPrompt != null;

  useEffect(() => {
    if (!eligible) { setVisible(false); return; }
    // Delight, don't interrupt: wait until engagement settles in.
    const t = window.setTimeout(() => setVisible(true), 2_200);
    return () => window.clearTimeout(t);
  }, [eligible]);

  const install = async (prompt: BeforeInstallPromptEvent) => {
    setBusy(true);
    try {
      await prompt.prompt();
      await prompt.userChoice.catch(() => undefined);
    } finally {
      setBusy(false);
      setVisible(false);
    }
  };

  if (!eligible) return null;

  return (
    <AnimatePresence>
      {visible && inst.androidPrompt && (
        <motion.div
          role="complementary"
          aria-label="Install LoanHisab"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="no-print fixed inset-x-3 z-[80] rounded-2xl border border-ink-800/60 bg-ink-900 text-sand-50 shadow-2xl shadow-ink-900/40"
          style={{ bottom: "calc(max(0.85rem, env(safe-area-inset-bottom)) + 3.25rem)" }}
        >
          <div className="flex items-start gap-3 p-4">
            <span className="brand-mark grid size-11 shrink-0 place-items-center rounded-xl text-white">
              <Download className="size-5" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold">Install App</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-sand-300">
                Install this app on your device for faster access — works offline too.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => install(inst.androidPrompt!)}
                  disabled={busy}
                  className="rounded-full bg-gold-500 px-4.5 py-2.5 text-[13px] font-bold text-ink-900 shadow transition hover:bg-gold-400 active:scale-95 disabled:opacity-60"
                >
                  {busy ? "Opening…" : "Install App"}
                </button>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  className="px-2 py-2 text-[12.5px] font-semibold text-sand-300 underline-offset-2 hover:underline"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setVisible(false); inst.dismissAndroid(); }}
              aria-label="Dismiss install banner and don't show again"
              className="grid size-8 shrink-0 place-items-center rounded-full text-sand-300/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
          {/* subtle "swipe up" affordance */}
          <div className="flex justify-center pb-1.5 -mt-1">
            <ChevronUp className="size-3.5 animate-bounce text-white/25" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══ 2. iOS "Add to Home Screen" bottom sheet ══════════════════════════════
function Step({ n, title, icon, children }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700">{n}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px] text-ink-700">
        {title} {icon}
      </div>
      <div className="text-[12px] text-ink-400">{children}</div>
    </li>
  );
}

export function IOSInstallSheet({
  open, onClose,
}: { open: boolean; onClose: (dontShowAgain: boolean) => void }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dontShow, setDontShow] = useState(false);
  void dontShow;

  // Focus management
  useEffect(() => {
    if (!open) return;
    const closeBtn = sheetRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    closeBtn?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
            className="fixed inset-0 z-[90] bg-ink-900/45 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Add LoanHisab to your home screen"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[95] mx-auto w-full max-w-lg rounded-t-3xl bg-white shadow-2xl"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-line" />
            <div className="px-5 pb-5 pt-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="brand-mark grid size-11 place-items-center rounded-xl text-white">
                    <Smartphone className="size-5" />
                  </span>
                  <div>
                    <p className="text-[15.5px] font-bold text-ink-900">Add to Home Screen</p>
                    <p className="text-[12.5px] text-ink-500">Install this app for quick access from your home screen.</p>
                  </div>
                </div>
                <DismissBtn onClick={() => onClose(false)} />
              </div>

              <ol className="mt-4 space-y-3.5 rounded-2xl bg-sand-50 p-4">
                <Step n={1} title="Tap the" children="in Safari" icon={<Share className="size-4 shrink-0 text-chakra" aria-label="Share button" />} />
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700">2</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px] text-ink-700">
                    Select <span className="flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-1 text-[12.5px] font-bold text-brand-700"><Plus className="size-3.5" /> Add to Home Screen</span>
                  </span>
                </li>
                <Step n={3} title='Tap "Add"' children="top-right" icon={<Home className="size-4 shrink-0 text-brand-700" />} />
              </ol>

              <label className="mt-4 flex items-center gap-2.5 text-[13px] font-medium text-ink-600">
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(e) => setDontShow(e.target.checked)}
                  className="size-4.5 accent-brand-700"
                />
                Don't show again
              </label>

              <button
                type="button"
                data-autofocus
                onClick={() => onClose(dontShow)}
                className="mt-4 w-full rounded-2xl bg-brand-700 py-3.5 text-[14.5px] font-bold text-white shadow transition hover:bg-brand-800 active:scale-[0.98]"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══ 3. Auto-behaviour: decides when install UI may appear ═════════════════
export function PWAMounts() {
  const inst = useInstallState();
  const [iosOpen, setIosOpen] = useState(false);
  const autoShown = useRef(INSTALL_KEYS.dismissedIOS != null || sessionStorage.getItem("lh-ios-auto") === "1");
  void autoShown;

  // iOS: open the guide sheet automatically once per install-lifetime (after 45s)
  useEffect(() => {
    if (!inst.showIOSGuideDefault) return;
    if (autoShown.current) return;
    const t = window.setTimeout(() => {
      setIosOpen(true);
      try { sessionStorage.setItem("lh-ios-auto", "1"); } catch { /* ignore */ }
      autoShown.current = true;
    }, 45_000);
    return () => window.clearTimeout(t);
  }, [inst.showIOSGuideDefault]);

  const closeSheet = (dontShowAgain: boolean) => {
    setIosOpen(false);
    if (dontShowAgain) inst.dismissIOS();
  };

  return (
    <>
      <InstallBanner />
      {inst.iOS && !inst.standalone && <IOSInstallSheet open={iosOpen} onClose={closeSheet} />}
    </>
  );
}

// ═══ 4. Update toast ════════════════════════════════════════════════════════
export function UpdateToast() {
  const sw = useServiceWorker();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sw.updateAvailable) setVisible(true);
  }, [sw.updateAvailable]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="no-print fixed inset-x-3 top-2 z-[85] mx-auto max-w-md rounded-2xl border border-brand-100 bg-white/95 shadow-xl backdrop-blur"
          style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2.5">
            <BadgeCheck className="size-5 shrink-0 text-brand-600" />
            <p className="min-w-0 flex-1 text-[13px] font-semibold text-ink-800">New version available</p>
            <button
              type="button"
              onClick={() => sw.applyUpdate()}
              className="flex items-center gap-1.5 rounded-full bg-brand-700 px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-brand-800 active:scale-95"
            >
              <RefreshCw className="size-3.5" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Dismiss update notice"
              className="grid size-8 place-items-center rounded-full text-ink-400 transition hover:bg-sand-100 hover:text-ink-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══ 5. Offline toast ═══════════════════════════════════════════════════════
export function OfflineToast() {
  const sw = useServiceWorker();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only surface connectivity loss, never on first paint when SW may still be waking
    if (!sw.online) {
      setVisible(true);
      return;
    }
    const t = window.setTimeout(() => setVisible(false), 2_500);
    return () => window.clearTimeout(t);
  }, [sw.online, sw.supported]);

  return (
    <AnimatePresence>
      {visible && !sw.online && (
        <motion.div
          role="alert"
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="no-print fixed inset-x-3 z-[85] mx-auto max-w-sm rounded-2xl bg-gold-600 shadow-xl"
          style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3 text-white">
            <WifiOff className="size-4.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">You're offline</p>
              <p className="text-[11.5px] text-white/85">Please check your internet connection and try again.</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="grid size-8.5 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25 active:scale-90"
              aria-label="Retry"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
