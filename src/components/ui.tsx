// ─── Design system primitives ────────────────────────────────────────────────
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, AlertCircle, Info } from "lucide-react";
import { cn } from "../utils/cn";
import { fmtNum, parseIndianAmount, SAFE, clamp, fmtINR } from "../lib/format";

// — Animated number (ease-out count) —
export function useAnimatedNumber(target: number, duration = 500): number {
  const [v, setV] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const to = SAFE(target);
    if (Math.abs(to - from) < 0.5) {
      setV(to);
      fromRef.current = to;
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = clamp((t - t0) / duration, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const cur = from + (to - from) * e;
      setV(cur);
      fromRef.current = cur;
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return v;
}

export function AnimatedMoney({ value, className }: { value: number; className?: string }) {
  const v = useAnimatedNumber(value);
  return <span className={cn("num", className)}>{fmtINR(v)}</span>;
}

// — Scroll reveal: fades sections up as they enter the viewport —
export function Reveal({
  children, delay = 0, className,
}: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px 0px -40px 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.32, 0.72, 0, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// — Layout —
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(21,32,27,0.05)]", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow, title, desc, right, id,
}: { eyebrow?: string; title: string; desc?: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <div id={id} className="mb-4 flex flex-wrap items-end justify-between gap-3 scroll-mt-28">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>
        )}
        <h2 className="font-display text-[22px] font-semibold leading-tight text-ink-900 sm:text-2xl">{title}</h2>
        {desc && <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-500">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

// — Field shell —
export function Field({
  label, hint, error, children, className, trailing,
}: { label?: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string; trailing?: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <div className="mb-1.5 flex min-w-0 flex-wrap items-center justify-between gap-2">
          <label className="min-w-0 text-[13px] font-medium text-ink-700">{label}</label>
          {trailing}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

// — Numeric input with Indian parsing ("25 lakh" → 25,00,000) —
export function NumInput({
  value, onChange, prefix = "₹", suffix, min = 0, max, words = false, placeholder = "0",
  invalid = false, inputMode = "decimal",
}: {
  value: number; onChange: (n: number) => void; prefix?: string; suffix?: string;
  min?: number; max?: number; words?: boolean; placeholder?: string; invalid?: boolean;
  inputMode?: "decimal" | "numeric";
}) {
  const [text, setText] = useState<string>(() => (value > 0 ? fmtNum(value) : ""));
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (!focus) setText(value > 0 ? fmtNum(value) : "");
  }, [value, focus]);

  const commit = (raw: string) => {
    setText(raw);
    const n = words ? parseIndianAmount(raw) : parseIndianAmount(raw.replace(/[^0-9.,kKlL]/g, ""));
    if (n == null) {
      if (raw.trim() === "") onChange(0);
      return;
    }
    onChange(clamp(Math.max(min, n), min, max ?? Number.MAX_SAFE_INTEGER));
  };

  return (
    <div
      className={cn(
        "flex h-12 items-center rounded-xl border bg-white transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15",
        invalid ? "border-danger/60" : "border-line"
      )}
    >
      {prefix && <span className="pl-3.5 pr-1.5 text-[15px] font-semibold text-ink-400">{prefix}</span>}
      <input
        value={text}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => commit(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="num h-full w-full min-w-0 bg-transparent text-[16px] font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-300"
        aria-invalid={invalid}
      />
      {suffix && <span className="pr-3.5 pl-1.5 whitespace-nowrap text-[13px] font-medium text-ink-400">{suffix}</span>}
    </div>
  );
}

// — Percent input —
export function PctInput({
  value, onChange, max = 100, invalid = false, step = 0.05,
}: { value: number; onChange: (n: number) => void; max?: number; invalid?: boolean; step?: number }) {
  const [text, setText] = useState(() => (value || value === 0 ? String(value) : ""));
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (!focus) setText(String(value ?? 0));
  }, [value, focus]);
  return (
    <div
      className={cn(
        "flex h-12 items-center rounded-xl border bg-white transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15",
        invalid ? "border-danger/60" : "border-line"
      )}
    >
      <input
        value={text}
        inputMode="decimal"
        onChange={(e) => {
          setText(e.target.value);
          const n = parseFloat(e.target.value.replace("%", ""));
          if (Number.isFinite(n)) onChange(clamp(n, 0, max));
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => {
          setFocus(false);
          setText(String(value ?? 0));
        }}
        step={step}
        className="num h-full w-full min-w-0 bg-transparent pl-3.5 text-[16px] font-semibold text-ink-900 outline-none"
      />
      <span className="pr-3.5 pl-1.5 text-[13px] font-medium text-ink-400">% p.a.</span>
    </div>
  );
}

// — Slider with filled track —
export function Slider({
  value, onChange, min, max, step = 1, accent = "brand",
}: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number; accent?: "brand" | "gold" }) {
  const fill = max > min ? ((clamp(value, min, max) - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={clamp(value, min, max)}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("range", accent === "gold" && "range-gold")}
      style={{ ["--fill" as string]: `${fill}%` }}
      aria-label="slider"
    />
  );
}

export const QUICK_AMOUNTS = [
  { label: "₹1 Lakh", value: 100_000 },
  { label: "₹5 Lakh", value: 500_000 },
  { label: "₹10 Lakh", value: 1_000_000 },
  { label: "₹25 Lakh", value: 2_500_000 },
  { label: "₹50 Lakh", value: 5_000_000 },
  { label: "₹1 Crore", value: 10_000_000 },
];

export const QUICK_RATES = [7, 8, 9, 10, 12, 15];

export const QUICK_TENURES = [
  { label: "3 Yr", months: 36 },
  { label: "5 Yr", months: 60 },
  { label: "10 Yr", months: 120 },
  { label: "15 Yr", months: 180 },
  { label: "20 Yr", months: 240 },
  { label: "30 Yr", months: 360 },
];

export function ChipRow({
  items, active, onPick, className,
}: { items: { label: string; value: number }[]; active: number; onPick: (v: number) => void; className?: string }) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5", className)}>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => onPick(it.value)}
          className={cn(
            "h-8 shrink-0 rounded-full border px-3 text-[12.5px] font-medium transition-all active:scale-95",
            active === it.value
              ? "border-brand-700 bg-brand-700 text-white shadow-sm"
              : "border-line bg-white text-ink-600 hover:border-brand-600/40 hover:text-brand-700"
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// — Segmented control —
export function Segmented<T extends string | number>({
  options, value, onChange, className, size = "md",
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T; onChange: (v: T) => void; className?: string; size?: "sm" | "md";
}) {
  return (
    <div className={cn("no-scrollbar inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-sand-100 p-1", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-lg font-medium transition-all active:scale-[0.97]",
            size === "sm" ? "h-8 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]",
            value === o.value ? "bg-white text-ink-900 shadow-sm ring-1 ring-line" : "text-ink-500 hover:text-ink-700"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// — Accordion —
export function Accordion({
  title, desc, defaultOpen = false, badge, children, className, icon,
}: {
  title: ReactNode; desc?: ReactNode; defaultOpen?: boolean; badge?: ReactNode;
  children: ReactNode; className?: string; icon?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(21,32,27,0.05)]", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
        aria-expanded={open}
      >
        {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-semibold text-ink-900">{title}</span>
          {desc && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-400">{desc}</span>}
        </span>
        {badge}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-ink-400">
          <ChevronDown className="size-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="border-t border-line px-4 py-4 sm:px-5 sm:py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// — Stat tile —
export function Stat({
  label, children, sub, tone = "default", className,
}: { label: string; children: ReactNode; sub?: ReactNode; tone?: "default" | "brand" | "gold" | "dark"; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "default" && "border-line bg-white",
        tone === "brand" && "border-brand-100 bg-brand-50",
        tone === "gold" && "border-gold-100 bg-gold-50",
        tone === "dark" && "border-ink-800 bg-ink-900 text-sand-50",
        className
      )}
    >
      <p className={cn("text-[11.5px] font-medium uppercase tracking-wide", tone === "dark" ? "text-sand-300" : "text-ink-400")}>
        {label}
      </p>
      <div className={cn("mt-1 font-display text-[22px] font-semibold leading-tight", tone === "dark" ? "text-white" : "text-ink-900")}>
        {children}
      </div>
      {sub && <div className={cn("mt-1 text-[12px]", tone === "dark" ? "text-sand-300" : "text-ink-400")}>{sub}</div>}
    </div>
  );
}

// — Inline note —
export function Note({ children, tone = "info", className }: { children: ReactNode; tone?: "info" | "warn"; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border p-3 text-[12.5px] leading-relaxed",
        tone === "info" && "border-brand-100 bg-brand-50/60 text-ink-600",
        tone === "warn" && "border-gold-200 bg-gold-50 text-ink-700",
        className
      )}
    >
      <Info className={cn("mt-0.5 size-4 shrink-0", tone === "warn" ? "text-gold-600" : "text-brand-600")} />
      <div>{children}</div>
    </div>
  );
}

// — Key/value row —
export function KV({ k, v, strong, className }: { k: ReactNode; v: ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", className)}>
      <span className="text-[13px] text-ink-500">{k}</span>
      <span className={cn("num text-right text-[14px] text-ink-900", strong ? "font-bold" : "font-medium")}>{v}</span>
    </div>
  );
}
