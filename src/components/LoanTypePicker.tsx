// ─── Loan type selector (mobile-first card grid) ────────────────────────────
import { Check } from "lucide-react";
import { LOANS } from "../lib/loans";
import type { LoanId } from "../lib/loans";
import { cn } from "../utils/cn";
import { motion } from "framer-motion";

export default function LoanTypePicker({
  value, onChange,
}: { value: LoanId; onChange: (id: LoanId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-5">
      {LOANS.map((l, i) => {
        const active = l.id === value;
        const Icon = l.icon;
        return (
          <motion.button
            key={l.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
            onClick={() => onChange(l.id)}
            aria-pressed={active}
            className={cn(
              "group relative flex min-h-[92px] flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98]",
              active
                ? "border-brand-700 bg-brand-700 text-white shadow-lg shadow-brand-700/20"
                : "border-line bg-white text-ink-900 hover:border-brand-600/40 hover:shadow-md"
            )}
          >
            <span
              className={cn(
                "grid size-9 place-items-center rounded-xl transition-colors",
                active ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700 group-hover:bg-brand-100"
              )}
            >
              <Icon className="size-4.5" />
            </span>
            <span>
              <span className={cn("block text-[13.5px] font-semibold leading-tight", active ? "text-white" : "text-ink-900")}>
                {l.name}
              </span>
              <span className={cn("mt-0.5 block text-[11.5px] leading-tight", active ? "text-white/70" : "text-ink-400")}>
                {l.blurb}
              </span>
            </span>
            {active && (
              <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-gold-500 text-ink-900">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
