// ─── Live results dashboard ──────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Banknote, HelpCircle, AlertCircle, ArrowUpRight } from "lucide-react";
import { Card, Stat, Accordion, KV, AnimatedMoney, Note, useAnimatedNumber } from "./ui";
import { fmtINR, fmtPct, fmtMonthYear, compactIN, SAFE } from "../lib/format";
import { Chakra } from "./Ornaments";
import { smoothScrollById } from "../lib/scroll";
import { METHOD_LABEL } from "../lib/loans";
import { periodicRate } from "../lib/engine";
import type { LoanInputs, Derived } from "../lib/state";
import { FREQ_UNIT } from "../lib/state";
import { cn } from "../utils/cn";

export function EmptyState({ errors }: { errors: Record<string, string> }) {
  return (
    <Card className="border-dashed p-6 text-center">
      <AlertCircle className="mx-auto size-8 text-gold-500" />
      <p className="mt-3 text-[15px] font-semibold text-ink-900">A small correction is needed</p>
      <ul className="mx-auto mt-2 max-w-sm space-y-1 text-[13px] text-ink-500">
        {Object.values(errors).map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </Card>
  );
}

export default function Dashboard({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const { result, fees } = d;
  const emiAnim = useAnimatedNumber(result.emiFirst, 450);
  const intShare = d.totalRepayment > 0 ? (result.totalInterest / d.totalRepayment) * 100 : 0;
  const unit = FREQ_UNIT[inp.ppy];
  const emiLabel = inp.ppy === 12 ? "Monthly EMI" : `Instalment / ${unit}`;

  const principalSlice = d.principalFinanced;
  const interestSlice = result.totalInterest;
  const feesSlice = fees.total;
  const slices = [
    { label: "Principal", value: principalSlice, color: "#0E5C46" },
    { label: "Interest", value: interestSlice, color: "#E98E15" },
    ...(feesSlice > 0 ? [{ label: "Fees & charges", value: feesSlice, color: "#A9B7AF" }] : []),
  ];
  const totalCost = Math.max(0, SAFE(d.totalCost));
  let acc = 0;
  const stops = slices.map((s) => {
    const from = totalCost > 0 ? (acc / totalCost) * 100 : 0;
    acc += s.value;
    const to = totalCost > 0 ? (acc / totalCost) * 100 : 0;
    return `${s.color} ${from.toFixed(2)}% ${to.toFixed(2)}%`;
  });

  return (
    <div className="space-y-3">
      {/* ── Hero EMI card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 text-sand-50 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand-700/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-gold-500/15 blur-3xl" />
        <Chakra className="pointer-events-none absolute -right-10 -bottom-12 size-52 rotate-12 text-white/[0.05]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-gold-300">
                <Banknote className="size-4" /> {emiLabel}
                {inp.ppy === 12 && <span lang="hi" className="font-dv tracking-normal text-gold-200/80">· मासिक किस्त</span>}
                <span className="text-sand-300/60 normal-case tracking-normal">· {METHOD_LABEL[inp.method]}</span>
              </p>
              <p className="num mt-2 font-display text-[44px] font-semibold leading-none tracking-tight sm:text-[56px]">
                {fmtINR(emiAnim)}
              </p>
              <p className="mt-2 text-[13px] text-sand-300">
                {d.periods} {unit}{d.periods > 1 ? "s" : ""}
                {result.periodsActual !== d.periods && <> · closes in {result.periodsActual} after prepayment</>}
                {inp.rateType === "floating" ? " · floating rate" : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-sand-300">Rate</p>
                <p className="num mt-0.5 text-[15px] font-semibold">{fmtPct(inp.rate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-sand-300">Starts</p>
                <p className="num mt-0.5 text-[15px] font-semibold">{ result.rows[0] ? fmtMonthYear(result.rows[0].date) : "—" }</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-sand-300">Interest share</p>
                <p className="num mt-0.5 text-[15px] font-semibold text-gold-300">{intShare.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-sand-300">Ends</p>
                <p className="num mt-0.5 text-[15px] font-semibold">{result.endDate ? fmtMonthYear(result.endDate) : "—"}</p>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500"
                animate={{ width: `${Math.max(0, Math.min(100, intShare))}%` }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-sand-300">
              <span>{(100 - intShare).toFixed(1)}% goes to principal</span>
              <span>{intShare.toFixed(1)}% goes to interest</span>
            </div>
          </div>
          {result.moratoriumInterest > 0 && (
            <p className="mt-4 rounded-xl bg-white/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-sand-200">
              During study {result.moratoriumMode === "capitalize" ? "+ moratorium" : "period"}, simple interest of{" "}
              <strong className="text-gold-300">{fmtINR(result.moratoriumInterest)}</strong>{" "}
              {result.moratoriumMode === "capitalize" && <>is added — repayments begin on <strong>{fmtINR(result.adjustedPrincipal)}</strong>.</>}
              {result.moratoriumMode === "pay" && "is assumed paid during the moratorium, so EMIs start on the original principal."}
              {result.moratoriumMode === "separate" && "accrues separately (shown in totals, not in the EMI schedule)."}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Summary cards ── */}
      <div className="mobile-stack grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <Stat label="Loan amount"><AnimatedMoney value={principalSlice} /></Stat>
        <Stat label="Total interest" tone="gold"><AnimatedMoney value={interestSlice} /></Stat>
        <Stat label="Total repayment" sub="principal + interest"><AnimatedMoney value={result.totalPaid} /></Stat>
        <Stat
          label="Total loan cost"
          tone="dark"
          sub={<span className="inline-flex items-center gap-1">repayment + fees <ArrowUpRight className="size-3" /></span>}
        >
          <AnimatedMoney value={d.totalCost} />
        </Stat>
      </div>

      {/* ── Cost breakdown ── */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink-900">Loan cost breakdown</h3>
          <span className="num text-[12.5px] font-semibold text-ink-500">{compactIN(d.totalCost)}</span>
        </div>
        {totalCost > 0 && (
          <>
            <div className="h-4 w-full overflow-hidden rounded-full" style={{ background: `linear-gradient(to right, ${stops.join(", ")})` }} />
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {slices.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-600">
                  <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label} <span className="num text-ink-400">{fmtINR(s.value)}</span>
                </span>
              ))}
            </div>
          </>
        )}
        <div className="mt-3 divide-y divide-line">
          {d.cfg.hasPrice && <KV k={`Down payment (paid up front)`} v={fmtINR(d.downAmt)} />}
          <KV k="Principal" v={fmtINR(principalSlice)} />
          {inp.method === "interest_only" ? (
            <KV k="Interest (paid periodically, principal at the end)" v={fmtINR(interestSlice)} />
          ) : (
            <KV k="Interest" v={fmtINR(interestSlice)} />
          )}
          {result.moratoriumInterest > 0 && (
            <KV
              k={`Moratorium interest (simple) — ${result.moratoriumMode === "capitalize" ? "added to principal" : result.moratoriumMode === "pay" ? "paid during moratorium" : "payable separately"}`}
              v={fmtINR(result.moratoriumInterest)}
            />
          )}
          <KV k="Processing fee + GST" v={fmtINR(fees.processingFee + fees.gst)} />
          {(fees.documentation + fees.legal + fees.insurance + fees.other) > 0 && (
            <KV k="Documentation · legal · insurance · other" v={fmtINR(fees.documentation + fees.legal + fees.insurance + fees.other)} />
          )}
          {result.totalExtra > 0 && <KV k="Prepayments (included in repayment)" v={fmtINR(result.totalExtra)} />}
          <KV k="Total cost of the loan" v={fmtINR(d.totalCost)} strong />
          {d.ltv != null && <KV k="Loan-to-Value (LTV)" v={`${d.ltv.toFixed(1)}%`} />}
        </div>
      </Card>

      {/* ── How was this calculated ── */}
      <Accordion
        title="How was this calculated?"
        desc="Every variable, formula and assumption — expanded for full transparency."
        icon={<HelpCircle className="size-4.5" />}
      >
        <Explainer inp={inp} d={d} />
      </Accordion>
    </div>
  );
}

// ─── Calculation transparency ────────────────────────────────────────────────
function Explainer({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const r = periodicRate(inp.rate, inp.ppy);
  const unit = FREQ_UNIT[inp.ppy];
  const monthlyPct = r * 100;
  const yrs = inp.tenureMonths / 12;

  const rows: Array<[string, string]> = [];
  if (d.cfg.hasPrice) {
    rows.push([`${d.cfg.priceLabel ?? "Price"}`, fmtINR(inp.price)]);
    rows.push([`Down payment`, fmtINR(d.downAmt)]);
  }
  rows.push(["Principal (P)", fmtINR(d.principal)]);
  if (d.result.moratoriumMode === "capitalize" && d.result.moratoriumInterest > 0) {
    rows.push([
      `+ Moratorium interest (${d.monthsMoratorium} mo simple)`,
      fmtINR(d.result.moratoriumInterest),
    ]);
    rows.push(["Repayment principal", fmtINR(d.result.adjustedPrincipal)]);
  }
  rows.push(["Annual interest rate", fmtPct(inp.rate)]);
  rows.push([`Rate per ${unit} (r = annual ÷ ${inp.ppy})`, `${monthlyPct.toFixed(4)}%`]);
  rows.push([`Number of instalments (n)`, `${d.periods} ${unit}s`]);

  return (
    <div className="space-y-4">
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-dashed border-line pb-2">
            <dt className="text-[12.5px] text-ink-500">{k}</dt>
            <dd className="num text-[13px] font-semibold text-ink-900">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl bg-ink-900 p-4 font-mono text-[12.5px] leading-relaxed text-sand-100">
        {inp.method === "reducing" && (
          <>
            {inp.rate === 0 ? (
              <p>Interest is 0%, so EMI = P ÷ n = {fmtINR(d.principal)} ÷ {d.periods} = <span className="text-gold-300">{fmtINR(d.result.emiFirst)}</span></p>
            ) : (
              <>
                <p>EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1)</p>
                <p className="mt-1.5">
                  = {fmtINR(d.result.adjustedPrincipal)} × {monthlyPct.toFixed(4)}% × (1+{monthlyPct.toFixed(4)}%)^{d.periods} ÷ ((1+{monthlyPct.toFixed(4)}%)^{d.periods} − 1)
                </p>
                <p className="mt-1.5">= <span className="text-gold-300">{fmtINR(d.result.emiFirst)}</span> per {unit}</p>
              </>
            )}
            <p className="mt-2 text-sand-300">Total interest = (EMI × n) − principal = {fmtINR(d.result.totalInterest)}</p>
          </>
        )}
        {inp.method === "flat" && (
          <>
            <p>Interest = P × rate × years = {fmtINR(d.principal)} × {fmtPct(inp.rate)} × {yrs.toFixed(2)} yr</p>
            <p className="mt-1.5">Monthly payment = (P + interest) ÷ n = <span className="text-gold-300">{fmtINR(d.result.emiFirst)}</span></p>
            <p className="mt-2 text-sand-300">Flat rates are NOT directly comparable to reducing-balance rates — the effective cost is higher.</p>
          </>
        )}
        {inp.method === "interest_only" && (
          <>
            <p>Periodic interest = P × r = {fmtINR(d.principal)} × {monthlyPct.toFixed(4)}% = <span className="text-gold-300">{fmtINR(d.result.emiFirst)}</span></p>
            <p className="mt-1.5">Final payment = P + one period's interest. Principal stays outstanding throughout.</p>
          </>
        )}
      </div>

      <Note>Figures use standard compound calculation without lender-specific rounding. Instalment schedules are generated period by period on the reducing outstanding balance (unless the flat / interest-only method is selected above).</Note>
    </div>
  );
}

// ─── Sticky mini summary (mobile) ────────────────────────────────────────────
export function MiniSummaryBar({ inp, d, visible }: { inp: LoanInputs; d: Derived; visible: boolean }) {
  const valid = d.principal > 0 && Object.keys(d.errors).length === 0;
  return (
    <div
      className={cn(
        "mobile-mini-summary fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 transition-all duration-300 md:hidden",
        visible && valid ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <button
        type="button"
        onClick={() => smoothScrollById("overview", { offset: 96 })}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 text-sand-50 shadow-2xl shadow-ink-900/40 backdrop-blur"
      >
        <span className="min-w-0">
          <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-gold-300">
            {inp.ppy === 12 ? "Monthly EMI" : `Per ${FREQ_UNIT[inp.ppy]}`}
          </span>
          <span className="num block truncate font-display text-xl font-semibold leading-tight">{fmtINR(d.result.emiFirst)}</span>
        </span>
        <span className="shrink-0 text-right text-[11.5px] leading-snug text-sand-300">
          Interest <span className="num font-semibold text-sand-50">{compactIN(d.result.totalInterest)}</span>
          <br />Repay <span className="num font-semibold text-sand-50">{compactIN(d.totalRepayment)}</span>
        </span>
      </button>
    </div>
  );
}
