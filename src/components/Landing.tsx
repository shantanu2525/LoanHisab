// ─── Landing screen: carved temple doors that swing open into the app ───────
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, ShieldCheck, Calculator, PieChart, CalendarRange } from "lucide-react";
import { Chakra, Toran, AnimalParade, Rangoli, Squiggle } from "./Ornaments";

const reducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const EASE_DOOR = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.32, 0.72, 0, 1] as const;

const HIGHLIGHTS = [
  { icon: Calculator, label: "EMI in one tap" },
  { icon: PieChart, label: "Interest breakdown" },
  { icon: CalendarRange, label: "Full schedule" },
];

const AUTO_OPEN_MS = 2800;

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const [opening, setOpening] = useState(false);
  const reduced = reducedMotion();
  const timer = useRef(0);

  const open = useCallback(() => {
    setOpening((already) => {
      if (already) return already;
      window.clearTimeout(timer.current);
      window.setTimeout(onEnter, reduced ? 0 : 980);
      return true;
    });
  }, [onEnter, reduced]);

  // The landing opens itself — no button needed.
  useEffect(() => {
    timer.current = window.setTimeout(() => open(), reduced ? 400 : AUTO_OPEN_MS);
    return () => window.clearTimeout(timer.current);
  }, [open, reduced]);

  // Enter / Space opens immediately
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock page scroll while the doors are closed
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const doorT = { duration: reduced ? 0.01 : 0.95, ease: EASE_DOOR };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Welcome to LoanHisab">
      {/* ── Door panels ── */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: opening ? "-101%" : 0 }}
        transition={doorT}
        className="temple-door absolute inset-y-0 left-0 w-[calc(50%+1px)] will-change-transform"
      >
        <Rangoli className="absolute -left-16 top-10 size-48 text-gold-500 opacity-[0.10] animate-spin-rev" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/60 to-transparent" />
      </motion.div>

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: opening ? "101%" : 0 }}
        transition={doorT}
        className="temple-door absolute inset-y-0 right-0 w-[calc(50%+1px)] will-change-transform"
      >
        <Rangoli className="absolute -right-16 bottom-10 size-48 text-brand-700 opacity-[0.09] animate-spin-slow" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold-500/60 to-transparent" />
      </motion.div>

      {/* Warm light spilling through the opening seam */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scaleX: 0 }}
        animate={opening ? { opacity: [0, 1, 0], scaleX: [0.2, 1, 1.6] } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.95, ease: "easeOut" }}
        className="pointer-events-none absolute inset-y-0 left-1/2 w-40 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(233,142,21,0.5),transparent_70%)] blur-2xl"
      />

      {/* ── Content ── */}
      <motion.div
        animate={{ opacity: opening ? 0 : 1, scale: opening ? 0.95 : 1, y: opening ? -8 : 0 }}
        transition={{ duration: reduced ? 0.01 : 0.38, ease: EASE_OUT }}
        className="relative z-10 flex h-full flex-col"
      >
        <div className="tricolor-bar h-[3px] w-full shrink-0" />
        <Toran className="shrink-0" count={26} />

        <div className="no-scrollbar relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-6 text-center">
          <Chakra
            spin
            className="pointer-events-none absolute left-1/2 top-1/2 size-[420px] max-w-[115vw] -translate-x-1/2 -translate-y-1/2 text-chakra opacity-[0.06]"
          />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 190, damping: 15, delay: reduced ? 0 : 0.1 }}
            className="brand-mark relative grid size-16 place-items-center rounded-2xl text-white shadow-xl shadow-brand-700/30"
          >
            <IndianRupee className="size-8" strokeWidth={2.6} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.22, ease: EASE_OUT }}
            className="relative mt-5 font-display text-[40px] font-bold leading-none tracking-tight text-ink-900 sm:text-[56px]"
          >
            Loan<span className="text-brand-700">Hisab</span>
          </motion.h1>

          <motion.p
            lang="hi"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.32, ease: EASE_OUT }}
            className="font-dv mt-1.5 text-[17px] font-semibold text-gold-600"
          >
            लोन हिसाब
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.4, ease: EASE_OUT }}
            className="relative mt-5 font-display text-[21px] font-semibold leading-snug text-ink-800 sm:text-[26px]"
          >
            Har loan ka,{" "}
            <span className="relative inline-block text-brand-700">
              poora hisab
              <Squiggle />
            </span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.48, ease: EASE_OUT }}
            className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-500"
          >
            Calculate EMI, total interest, repayment schedule and the full cost of your loan — in rupees, lakhs and crores.
          </motion.p>

          {/* auto-open indicator: a gold dot blooming under the tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: opening ? 0 : 1 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.55 }}
            className="mt-8 flex h-6 items-center gap-2.5 text-[12.5px] font-medium text-ink-400"
          >
            <span className="relative grid size-4 place-items-center">
              <span className="absolute inset-0 rounded-full border border-line" />
              <motion.span
                initial={{ scale: 0.15, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: AUTO_OPEN_MS / 1000, ease: "linear" }}
                className="size-1.5 rounded-full bg-gold-500"
              />
            </span>
            Opening your calculator…
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.7 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-1.5"
          >
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-ink-600"
              >
                <Icon className="size-3.5 text-brand-600" /> {label}
              </span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.8 }}
            className="mt-4 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-400"
          >
            <ShieldCheck className="size-3.5 text-brand-600" />
            No sign-up · runs fully on your device · free
          </motion.p>
        </div>

        <div className="shrink-0">
          <AnimalParade className="h-11" speed={60} opacity="opacity-[0.28]" />
          <p className="pb-4 pt-1 text-center text-[11px] text-ink-400">
            A calculator only — no lender recommendations, no approvals.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
