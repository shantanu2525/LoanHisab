// ─── Loan comparison: up to 3 scenarios, no ranking ─────────────────────────
import { useMemo, useState } from "react";
import { Copy, Eraser } from "lucide-react";
import { Card, Field, NumInput, PctInput, Note } from "./ui";
import { calculateLoanComparison, type CompareInput } from "../lib/engine";
import { fmtINR, fmtPct, clamp } from "../lib/format";
import type { LoanInputs, Derived } from "../lib/state";
import { cn } from "../utils/cn";

const SLOT_NAMES = ["Loan A", "Loan B", "Loan C"];

const blank = (): CompareInput => ({ amount: 1_000_000, annualRate: 8.5, tenureMonths: 60, feeType: "percent", feeValue: 1, otherCharges: 0 });

export default function Comparison({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [items, setItems] = useState<CompareInput[]>([blank(), blank(), blank()]);
  const [used, setUsed] = useState<boolean[]>([true, true, true]);

  const set = (i: number, p: Partial<CompareInput>) =>
    setItems((arr) => arr.map((it, j) => (j === i ? { ...it, ...p } : it)));

  const copyCurrent = (i: number) => {
    set(i, {
      amount: d.principal,
      annualRate: inp.rate,
      tenureMonths: inp.tenureMonths,
      feeType: inp.pfType,
      feeValue: inp.pfValue,
      otherCharges: inp.docCharges + inp.legalCharges + inp.insurance + inp.otherCharges,
    });
    setUsed((u) => u.map((v, j) => (j === i ? true : v)));
  };

  const activeIdx = items.map((_, i) => i).filter((i) => used[i]);
  const active = activeIdx.map((i) => items[i]);
  const results = useMemo(() => calculateLoanComparison(active), [active]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((it, i) => {
          const on = used[i];
          return (
            <Card key={i} className={cn("p-4", !on && "opacity-50")}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => setUsed((u) => u.map((v, j) => (j === i ? !v : v)))}
                    className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-brand-700" : "bg-line")}
                  >
                    <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
                  </button>
                  <span className="font-display text-[15px] font-semibold text-ink-900">{SLOT_NAMES[i]}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => copyCurrent(i)}
                    title="Copy current loan"
                    className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-brand-50 hover:text-brand-700 active:scale-90"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => set(i, blank())}
                    title="Reset"
                    className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-brand-50 hover:text-brand-700 active:scale-90"
                  >
                    <Eraser className="size-4" />
                  </button>
                </div>
              </div>
              {on && (
                <div className="mobile-stack grid grid-cols-2 gap-3">
                  <Field label="Amount"><NumInput value={it.amount} onChange={(n) => set(i, { amount: n })} words /></Field>
                  <Field label="Rate"><PctInput value={it.annualRate} onChange={(n) => set(i, { annualRate: n })} /></Field>
                  <Field label="Tenure (months)"><NumInput value={it.tenureMonths} onChange={(n) => set(i, { tenureMonths: clamp(Math.round(n), 1, 600) })} prefix="" inputMode="numeric" /></Field>
                  <Field label="Other charges"><NumInput value={it.otherCharges} onChange={(n) => set(i, { otherCharges: n })} /></Field>
                  <Field label="Fee"><PctInput value={it.feeValue} onChange={(n) => set(i, { feeValue: clamp(n, 0, 10) })} max={10} /></Field>
                  <Field label="Charge as">
                    <button
                      type="button"
                      onClick={() => set(i, { feeType: it.feeType === "percent" ? "fixed" : "percent" })}
                      className="h-12 w-full rounded-xl border border-line text-[13px] font-semibold text-ink-700 transition hover:border-brand-600/40 active:scale-[0.98]"
                    >
                      {it.feeType === "percent" ? "% of loan" : "Fixed ₹"}
                    </button>
                  </Field>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {results.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-right text-[13px]">
              <thead>
                <tr className="bg-sand-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2.5 text-left">Compare</th>
                  {activeIdx.map((i) => (
                    <th key={i} className="px-3 py-2.5">{SLOT_NAMES[i]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="num">
                <CmpRow label="Loan amount" values={active.map((a) => fmtINR(a.amount))} />
                <CmpRow label="Interest rate" values={active.map((a) => fmtPct(a.annualRate))} />
                <CmpRow label="Tenure" values={active.map((a) => `${a.tenureMonths} months`)} />
                <CmpRow label="Monthly EMI" values={results.map((r) => fmtINR(r.emi))} strong />
                <CmpRow label="Total interest" values={results.map((r) => fmtINR(r.totalInterest))} />
                <CmpRow label="Processing fee" values={results.map((r) => fmtINR(r.fee))} />
                <CmpRow label="Other charges" values={results.map((r) => fmtINR(r.other))} />
                <CmpRow label="Total repayment" values={results.map((r) => fmtINR(r.totalRepayment))} />
                <CmpRow label="Cost of borrowing" values={results.map((r) => fmtINR(r.costOfBorrowing))} strong />
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-3">
            <Note className="border-0 bg-transparent p-0">
              This table lists the numbers only — it does not rank loans or suggest which one to pick. Use the copy icon above any slot to load your current loan.
            </Note>
          </div>
        </Card>
      )}
    </div>
  );
}

function CmpRow({ label, values, strong }: { label: string; values: string[]; strong?: boolean }) {
  return (
    <tr className="border-t border-line/60">
      <td className="px-3 py-2 text-left font-medium text-ink-600">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={cn("px-3 py-2", strong ? "font-bold text-ink-900" : "text-ink-700")}>{v}</td>
      ))}
    </tr>
  );
}
