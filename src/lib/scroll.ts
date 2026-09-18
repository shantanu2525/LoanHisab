// ─── Butter-smooth eased scrolling ───────────────────────────────────────────
// Native smooth scrolls vary by browser (and fight heavy re-renders).
// This rAF loop with cubic easing feels identical on every device.

let raf = 0;

const prefersReduced = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function smoothScrollToEl(
  el: HTMLElement | null,
  { offset = 92, duration = 650 }: { offset?: number; duration?: number } = {}
): void {
  if (!el) return;
  const startY = window.scrollY;
  const targetY = Math.max(0, el.getBoundingClientRect().top + startY - offset);
  const delta = targetY - startY;

  if (Math.abs(delta) < 4 || prefersReduced()) {
    window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
    return;
  }

  cancelAnimationFrame(raf);
  const t0 = performance.now();
  const ease = (k: number) =>
    k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / duration);
    // "instant" overrides the CSS scroll-behavior:smooth on <html>
    window.scrollTo({ top: startY + delta * ease(k), behavior: "instant" as ScrollBehavior });
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

export function smoothScrollById(id: string, opts?: { offset?: number; duration?: number }): void {
  smoothScrollToEl(document.getElementById(id), opts);
}
