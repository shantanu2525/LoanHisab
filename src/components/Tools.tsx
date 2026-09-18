// ─── Advanced tools: what-if, prepayment, rate scenarios, affordability,
//     reverse EMI, reverse tenure, foreclosure, tax reference ────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Shuffle, Wallet, TrendingUp, Home, RotateCcw, Clock3, FileWarning, Landmark,
  Plus, X, HandCoins, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, Field, NumInput, PctInput, Slider, Segmented, Note, KV } from "./ui";
import AmountField from "./AmountField";
import {
  calculateReducingEMI, calculateReverseEMI, calculateReverseTenure,
  calculateForeclosure, calculateAmortization, calculatePrepayment,
  periodicRate, type PrepayMode, type AmortizeResult,
} from "../lib/engine";
import { fmtINR, fmtPct, compactIN, clamp, parseMonthInput, fmtMonthYear } from "../lib/format";
import type { LoanInputs, Derived } from "../lib/state";
import { FREQ_LABEL } from "../lib/state";
import { cn } from "../utils/cn";

const TABS = [
  { id: "whatif", label: "What-if", icon: Shuffle },
  { id: "prepay", label: "Prepayment", icon: Wallet },
  { id: "extra", label: "Pay any amount", icon: HandCoins },
  { id: "rates", label: "Rate scenarios", icon: TrendingUp },
  { id: "afford", label: "Affordability", icon: Home },
  { id: "reverse", label: "Reverse EMI", icon: RotateCcw },
  { id: "revtenure", label: "Reverse tenure", icon: Clock3 },
  { id: "foreclose", label: "Foreclosure", icon: FileWarning },
  { id: "tax", label: "Tax reference", icon: Landmark },
] as const;

type TabId = (typeof TABS)[number]["id"];

function RailButton({ dir, show, onClick }: { dir: "left" | "right"; show: boolean; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!show}
      aria-label={dir === "left" ? "Scroll tabs left" : "Scroll tabs right"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border bg-white text-ink-600 transition-all duration-200 active:scale-90",
        show
          ? "border-line opacity-100 shadow-sm hover:border-brand-600/50 hover:text-brand-700"
          : "border-line/50 cursor-default opacity-25"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Horizontal rail with arrow buttons; keeps the active tab in view. */
function useRail() {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<{ left: boolean; right: boolean }>({ left: false, right: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  const nudge = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.7), behavior: "smooth" });
  };

  return { ref, edge, measure, nudge };
}

export default function Tools({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [tab, setTab] = useState<TabId>("whatif");
  const rail = useRail();

  // Keep the active tab centred — only when the tab actually changes.
  useEffect(() => {
    const el = rail.ref.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [tab, rail.ref]);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-4 sm:p-5">
        <h3 className="font-display text-lg font-semibold text-ink-900">Advanced tools</h3>
        <p className="mt-0.5 text-[12px] text-ink-400">Every tool re-computes live and never affects your main inputs.</p>
        <div className="mt-3 flex items-center gap-1.5">
          <RailButton dir="left" show={rail.edge.left} onClick={() => rail.nudge(-1)} />
          <div className="relative min-w-0 flex-1">
            <div
              ref={rail.ref}
              onScroll={rail.measure}
              className="no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth py-0.5"
            >
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-active={active}
                    onClick={() => setTab(t.id)}
                    aria-current={active}
                    className={cn(
                      "flex shrink-0 snap-center items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-semibold transition-all duration-200 active:scale-95",
                      active
                        ? "border-brand-700 bg-brand-700 text-white shadow-md shadow-brand-700/20"
                        : "border-line bg-white text-ink-600 hover:-translate-y-px hover:border-brand-600/40 hover:text-brand-700"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            {rail.edge.left && <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />}
            {rail.edge.right && <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />}
          </div>
          <RailButton dir="right" show={rail.edge.right} onClick={() => rail.nudge(1)} />
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {tab === "whatif" && <WhatIf inp={inp} d={d} />}
        {tab === "prepay" && <PrepayCompare inp={inp} d={d} />}
        {tab === "extra" && <ExtraPayments inp={inp} d={d} />}
        {tab === "rates" && <RateScenarios inp={inp} d={d} />}
        {tab === "afford" && <Affordability inp={inp} d={d} />}
        {tab === "reverse" && <ReverseEMI inp={inp} />}
        {tab === "revtenure" && <ReverseTenure inp={inp} />}
        {tab === "foreclose" && <Foreclosure d={d} />}
        {tab === "tax" && <TaxReference />}
      </div>
    </Card>
  );
}

// ───────────────────────── 1. WHAT-IF ────────────────────────────────────────
function WhatIf({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [amt, setAmt] = useState(d.principal);
  const [rate, setRate] = useState(inp.rate);
  const [months, setMonths] = useState(inp.tenureMonths);
  const [targetEmi, setTargetEmi] = useState(0);
  const [prepayNow, setPrepayNow] = useState(0);

  const periods = (m: number) => Math.max(1, Math.round((m * inp.ppy) / 12));
  const out = useMemo(() => {
    const P = Math.max(0, amt);
    const n = periods(Math.max(1, months));
    const emi = calculateReducingEMI(P, rate, n, inp.ppy);
    const interest = Math.max(0, emi * n - P);
    let newTenure: number | null = null;
    if (targetEmi > 0) newTenure = calculateReverseTenure(P, rate, targetEmi, inp.ppy);
    let saved = 0;
    if (prepayNow > 0 && P > 0) {
      const res = calculateAmortization({
        principal: P, annualRate: rate, periods: n, ppy: inp.ppy,
        start: new Date(), method: "reducing",
        prepay: { enabled: true, amount: prepayNow, startPeriod: 1, freq: "once", mode: "reduce_tenure" },
      });
      saved = res.prepayImpact?.interestSaved ?? 0;
    }
    return { emi, interest, newTenure, saved, n };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amt, rate, months, targetEmi, prepayNow, inp.ppy]);

  const baseEmi = d.result.emiFirst;
  const baseInterest = d.result.totalInterest;

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-500">
        Adjust any value — the scenario re-calculates instantly against your current loan ({fmtINR(baseEmi)} EMI · {fmtINR(baseInterest)} interest).
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={`Scenario ${d.cfg.amountLabel.toLowerCase()}`} hint={<span className="font-semibold text-brand-700">{compactIN(amt)}</span>}>
          <NumInput value={amt} onChange={setAmt} words />
          <div className="mt-3"><Slider value={amt} onChange={setAmt} min={d.cfg.slider.min} max={d.cfg.slider.max} step={d.cfg.slider.step} /></div>
        </Field>
        <Field label="Scenario rate">
          <PctInput value={rate} onChange={setRate} />
          <div className="mt-3"><Slider value={rate} onChange={setRate} min={0} max={24} step={0.05} /></div>
        </Field>
        <Field label="Scenario tenure">
          <NumInput value={months} onChange={(n) => setMonths(clamp(Math.round(n), 3, 600))} prefix="" suffix="months" inputMode="numeric" />
          <div className="mt-3"><Slider value={months} onChange={setMonths} min={6} max={360} step={6} /></div>
        </Field>
        <Field label="Or target a fixed EMI" hint="Leave at 0 to ignore. Works out the new tenure.">
          <NumInput value={targetEmi} onChange={setTargetEmi} />
        </Field>
        <Field label="One-time prepayment (with 1st instalment)" hint="Leave at 0 to ignore.">
          <NumInput value={prepayNow} onChange={setPrepayNow} />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[460px] text-right text-[13px]">
          <thead>
            <tr className="bg-sand-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2.5 text-left">Measure</th>
              <th className="px-3 py-2.5">Current</th>
              <th className="px-3 py-2.5">Scenario</th>
              <th className="px-3 py-2.5">Difference</th>
            </tr>
          </thead>
          <tbody className="num">
            <tr className="border-t border-line/60">
              <td className="px-3 py-2 text-left font-medium text-ink-600">Instalment</td>
              <td className="px-3 py-2 text-ink-500">{fmtINR(baseEmi)}</td>
              <td className="px-3 py-2 font-semibold text-ink-900">{fmtINR(out.emi)}</td>
              <DiffCell delta={out.emi - baseEmi} invert />
            </tr>
            <tr className="border-t border-line/60">
              <td className="px-3 py-2 text-left font-medium text-ink-600">Total interest</td>
              <td className="px-3 py-2 text-ink-500">{fmtINR(baseInterest)}</td>
              <td className="px-3 py-2 font-semibold text-ink-900">{fmtINR(out.interest)}</td>
              <DiffCell delta={out.interest - baseInterest} invert />
            </tr>
            {out.newTenure != null && (
              <tr className="border-t border-line/60">
                <td className="px-3 py-2 text-left font-medium text-ink-600">Tenure at target EMI</td>
                <td className="px-3 py-2 text-ink-500">{out.n} payments · {FREQ_LABEL[inp.ppy]}</td>
                <td className="px-3 py-2 font-semibold text-ink-900">{Math.ceil(out.newTenure)} payments</td>
                <td className={cn("px-3 py-2 font-semibold", out.newTenure <= out.n ? "text-brand-700" : "text-gold-600")}>
                  {out.newTenure <= out.n ? `−${(out.n - out.newTenure).toFixed(0)}` : `+${(out.newTenure - out.n).toFixed(0)}`} payments
                </td>
              </tr>
            )}
            {out.saved > 0 && (
              <tr className="border-t border-line/60">
                <td className="px-3 py-2 text-left font-medium text-ink-600">Interest saved by prepayment</td>
                <td className="px-3 py-2 text-ink-500">{fmtINR(prepayNow)} paid</td>
                <td className="px-3 py-2 font-semibold text-brand-700">{fmtINR(out.saved)}</td>
                <td className="px-3 py-2 text-brand-700">saved</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffCell({ delta, invert = false }: { delta: number; invert?: boolean }) {
  const good = invert ? delta <= 0 : delta >= 0;
  return (
    <td className={cn("px-3 py-2 font-semibold", Math.abs(delta) < 1 ? "text-ink-400" : good ? "text-brand-700" : "text-gold-600")}>
      {Math.abs(delta) < 1 ? "same" : `${delta > 0 ? "+" : "−"}${fmtINR(Math.abs(delta)).replace("₹", "₹")}`}
    </td>
  );
}

// ───────────────────── 2. PREPAYMENT COMPARISON ──────────────────────────────
function PrepayCompare({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [amount, setAmount] = useState(Math.max(10_000, Math.round(d.principal * 0.1)));
  const [start, setStart] = useState(12);
  const [freq, setFreq] = useState<"once" | "yearly" | "monthly">("once");

  const results = useMemo(
    () =>
      calculatePrepayment(
        {
          principal: d.principal, annualRate: inp.rate, periods: d.periods, ppy: inp.ppy,
          start: new Date(), method: "reducing",
        },
        { amount, startPeriod: clamp(Math.round(start), 1, d.periods), freq }
      ),
    [amount, start, freq, d.principal, d.periods, inp.rate, inp.ppy]
  );

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-500">
        Compare one choice against the other for the same part-payment. Neither option is labelled “better” — pick whichever suits your cash flow.
      </p>
      <div className="grid gap-5 sm:grid-cols-3">
        <AmountField label="Part-payment amount" value={amount} onChange={setAmount} min={1_000} max={Math.max(100_000, d.principal)} step={1_000} showPresets={false} />
        <Field label="From payment no."><NumInput value={start} onChange={(n) => setStart(clamp(Math.round(n), 1, d.periods))} prefix="" inputMode="numeric" /></Field>
        <Field label="Frequency">
          <Segmented options={[{ value: "once", label: "One-time" }, { value: "yearly", label: "Yearly" }, { value: "monthly", label: "Every EMI" }]} value={freq} onChange={setFreq} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r) => (
          <div key={r.mode} className="rounded-2xl border border-line bg-sand-50 p-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-brand-700">
              {r.mode === "reduce_tenure" ? "Option A — Reduce tenure" : "Option B — Reduce EMI"}
            </p>
            <div className="mt-2 divide-y divide-line/70">
              <KV k="EMI before" v={fmtINR(r.emiBefore)} />
              <KV k="EMI after" v={fmtINR(r.emiAfter)} strong={r.mode === "reduce_emi"} />
              <KV k="Tenure before" v={`${r.tenureBefore} payments`} />
              <KV k="New tenure" v={`${r.tenureAfter} payments`} strong={r.mode === "reduce_tenure"} />
              <KV k="Payments reduced" v={`${r.periodsReduced}`} />
              <KV k="Interest before" v={fmtINR(r.interestBefore)} />
              <KV k="Interest after" v={fmtINR(r.interestAfter)} />
              <KV k="Interest saved" v={fmtINR(r.interestSaved)} strong />
            </div>
          </div>
        ))}
      </div>
      <Note>Many lenders charge prepayment fees on some products (check your agreement). Charges, if any, are not included here.</Note>
    </div>
  );
}

// ───────────────────── 3. RATE SCENARIOS ─────────────────────────────────────
function RateScenarios({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [scenarios, setScenarios] = useState<number[]>([8, 9, 10, 11].filter((r) => Math.abs(r - inp.rate) > 0.01).slice(0, 3));
  const [custom, setCustom] = useState(0);

  const baseEmi = d.result.emiFirst;
  const baseInt = d.result.totalInterest;

  const rows = useMemo(
    () =>
      scenarios
        .slice(0, 6)
        .map((r) => {
          const emi = calculateReducingEMI(d.principal, r, d.periods, inp.ppy);
          const interest = Math.max(0, emi * d.periods - d.principal);
          return { r, emi, interest };
        })
        .sort((a, b) => a.r - b.r),
    [scenarios, d.principal, d.periods, inp.ppy]
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-500">
        {inp.rateType === "floating"
          ? "Your rate is marked floating — see how EMIs would move if the benchmark rate changes."
          : "Model how your EMI would change at different interest rates."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {[7, 8, 9, 10, 11, 12, 15].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setScenarios((s) => (s.includes(r) ? s : [...s, r]))}
            className={cn(
              "h-8 rounded-full border px-3 text-[12.5px] font-semibold transition active:scale-95",
              scenarios.includes(r) ? "border-brand-700 bg-brand-50 text-brand-700" : "border-line text-ink-600 hover:border-brand-600/40"
            )}
          >
            {r}%
          </button>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-24"><PctInput value={custom} onChange={setCustom} /></div>
          <button
            type="button"
            onClick={() => { if (custom > 0) { setScenarios((s) => (s.includes(custom) ? s : [...s, custom])); setCustom(0); } }}
            className="grid size-9 place-items-center rounded-full bg-brand-700 text-white transition active:scale-90"
            aria-label="Add scenario"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] text-right text-[13px]">
          <thead>
            <tr className="bg-sand-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-3 py-2.5 text-left">Rate</th>
              <th className="px-3 py-2.5">Instalment</th>
              <th className="px-3 py-2.5">Δ EMI</th>
              <th className="px-3 py-2.5">Total interest</th>
              <th className="px-3 py-2.5">Δ interest</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="num">
            <tr className="border-t border-line/60 bg-brand-50/50">
              <td className="px-3 py-2 text-left font-semibold text-brand-800">{fmtPct(inp.rate)} · current</td>
              <td className="px-3 py-2 font-semibold">{fmtINR(baseEmi)}</td>
              <td className="px-3 py-2 text-ink-400">—</td>
              <td className="px-3 py-2">{fmtINR(baseInt)}</td>
              <td className="px-3 py-2 text-ink-400">—</td>
              <td className="px-3 py-2" />
            </tr>
            {rows.map((row) => (
              <tr key={row.r} className="border-t border-line/60">
                <td className="px-3 py-2 text-left font-semibold text-ink-800">{fmtPct(row.r)}</td>
                <td className="px-3 py-2 font-semibold text-ink-900">{fmtINR(row.emi)}</td>
                <DiffCell delta={row.emi - baseEmi} invert />
                <td className="px-3 py-2 text-ink-700">{fmtINR(row.interest)}</td>
                <DiffCell delta={row.interest - baseInt} invert />
                <td className="px-3 py-2">
                  <button type="button" onClick={() => setScenarios((s) => s.filter((x) => x !== row.r))} aria-label="Remove">
                    <X className="size-4 text-ink-300 hover:text-danger" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────────── 4. AFFORDABILITY ─────────────────────────────────────
function Affordability({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [income, setIncome] = useState(75_000);
  const [existing, setExisting] = useState(0);
  const [expenses, setExpenses] = useState(30_000);
  const disposable = Math.max(0, income - existing - expenses);
  const [share, setShare] = useState(50);
  const emi = (disposable * share) / 100;
  const loan = calculateReverseEMI(emi, inp.rate, d.periods, inp.ppy);
  const ratio = income > 0 ? (emi / income) * 100 : 0;

  return (
    <div className="space-y-5">
      <Note tone="warn">
        Informational estimates only — <strong>not</strong> a lender eligibility decision. Actual approval depends on the lender's own criteria.
      </Note>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Net monthly income"><NumInput value={income} onChange={setIncome} /></Field>
        <Field label="Existing EMI obligations"><NumInput value={existing} onChange={setExisting} /></Field>
        <Field label="Monthly expenses"><NumInput value={expenses} onChange={setExpenses} /></Field>
      </div>
      <Field
        label="Share of disposable income you would set aside"
        hint={<span>Disposable income: <span className="font-semibold text-brand-700">{fmtINR(disposable)}</span> · you chose <span className="font-semibold text-brand-700">{share}%</span></span>}
      >
        <Slider value={share} onChange={setShare} min={0} max={100} step={5} accent="gold" />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="EMI you set aside" v={fmtINR(emi)} strong />
        <Mini label="Estimated loan amount" v={fmtINR(loan)} sub={`@ ${fmtPct(inp.rate)}, ${d.periods} payments`} strong />
        <Mini label="EMI-to-income ratio" v={`${ratio.toFixed(1)}%`} />
        <Mini label="Left after EMI & expenses" v={fmtINR(Math.max(0, disposable - emi))} />
      </div>
    </div>
  );
}

function Mini({ label, v, sub, strong }: { label: string; v: string; sub?: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-sand-50 p-3.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={cn("num mt-1 font-display text-[17px] leading-tight text-ink-900", strong && "font-semibold")}>{v}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>}
    </div>
  );
}

// ───────────────────── 5. REVERSE EMI ────────────────────────────────────────
function ReverseEMI({ inp }: { inp: LoanInputs }) {
  const [emi, setEmi] = useState(25_000);
  const [rate, setRate] = useState(inp.rate || 9);
  const [years, setYears] = useState(Math.max(1, Math.round(inp.tenureMonths / 12)) || 5);
  const principal = calculateReverseEMI(emi, rate, Math.max(1, Math.round(years * 12)), 12);

  return (
    <div className="space-y-5">
      <p className="text-[14px] font-semibold text-ink-900">“How much loan can my EMI buy?”</p>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Maximum EMI you can pay"><NumInput value={emi} onChange={setEmi} /></Field>
        <Field label="Interest rate"><PctInput value={rate} onChange={setRate} /></Field>
        <Field label="Tenure (years)"><NumInput value={years} onChange={(n) => setYears(clamp(n, 0.5, 40))} prefix="" suffix="years" /></Field>
      </div>
      <div className="rounded-2xl bg-ink-900 p-5 text-center text-sand-50">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-300">Theoretical loan amount</p>
        <p className="num mt-1.5 font-display text-4xl font-semibold">{fmtINR(principal)}</p>
        <p className="mt-1.5 text-[12.5px] text-sand-300">{compactIN(principal)} · using the standard reducing-balance formula</p>
      </div>
      <Note tone="warn">This is a mathematical estimate and is <strong>not</strong> an indication of loan eligibility.</Note>
    </div>
  );
}

// ───────────────────── 6. REVERSE TENURE ─────────────────────────────────────
function ReverseTenure({ inp }: { inp: LoanInputs }) {
  const [amount, setAmount] = useState(1_000_000);
  const [rate, setRate] = useState(inp.rate || 9);
  const [emi, setEmi] = useState(25_000);

  const n = calculateReverseTenure(amount, rate, emi, 12);
  const floor = amount * periodicRate(rate, 12);
  const totalPaid = n != null ? emi * Math.ceil(n) : 0;
  const int = totalPaid - amount;

  return (
    <div className="space-y-5">
      <p className="text-[14px] font-semibold text-ink-900">“How long will it take at my EMI?”</p>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Loan amount"><NumInput value={amount} onChange={setAmount} words /></Field>
        <Field label="Interest rate"><PctInput value={rate} onChange={setRate} /></Field>
        <Field label="Target EMI"><NumInput value={emi} onChange={setEmi} /></Field>
      </div>
      {n == null ? (
        <Note tone="warn">
          This EMI is too small — it must be more than the first month's interest
          {amount > 0 && rate > 0 ? <> (<strong>{fmtINR(floor)}</strong>)</> : null}. Increase the EMI, lower the rate, or reduce the amount.
        </Note>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Estimated tenure" v={n >= 24 ? `${(n / 12).toFixed(1)} years` : `${Math.ceil(n)} months`} sub={`${Math.ceil(n)} payments`} strong />
          <Mini label="Number of EMIs" v={`${Math.ceil(n)}`} />
          <Mini label="Total interest" v={fmtINR(Math.max(0, int))} />
          <Mini label="Total repayment" v={fmtINR(totalPaid)} />
        </div>
      )}
    </div>
  );
}

// ───────────────────── 7. FORECLOSURE ────────────────────────────────────────
function Foreclosure({ d }: { d: Derived }) {
  const rows = d.result.rows;
  const predicted = rows[Math.min(24, Math.max(0, rows.length - 1))]?.closing ?? d.principal;
  const [outstanding, setOutstanding] = useState(Math.round(predicted || d.principal));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [charge, setCharge] = useState(2);
  const [gst, setGst] = useState(18);
  const [other, setOther] = useState(0);

  const r = calculateForeclosure({ outstanding, chargePct: charge, gstPct: gst, otherCharges: other });

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Current outstanding principal"
          hint={rows.length ? <>Balance after ~{Math.min(24, rows.length)} payments ≈ <span className="font-semibold text-brand-700">{fmtINR(predicted)}</span> — adjust to your actual statement.</> : undefined}
        >
          <NumInput value={outstanding} onChange={setOutstanding} words />
        </Field>
        <Field label="Intended foreclosure date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="num h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] font-semibold text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
          />
        </Field>
        <Field label="Foreclosure charge"><PctInput value={charge} onChange={setCharge} max={10} /></Field>
        <Field label="GST on foreclosure charge"><PctInput value={gst} onChange={setGst} max={40} /></Field>
        <Field label="Other payable charges"><NumInput value={other} onChange={setOther} /></Field>
      </div>
      <div className="rounded-2xl border border-line p-4">
        <div className="divide-y divide-line/70">
          <KV k="Outstanding principal" v={fmtINR(r.outstanding)} />
          <KV k={`Foreclosure charge (${fmtPct(charge)})`} v={fmtINR(r.charge)} />
          <KV k={`GST on charge (${fmtPct(gst)})`} v={fmtINR(r.gst)} />
          <KV k="Other charges" v={fmtINR(r.other)} />
          <KV k="Estimated closure amount" v={fmtINR(r.closure)} strong />
        </div>
      </div>
      <Note>Actual foreclosure amounts depend on the lender's loan agreement and applicable charges. Many floating-rate home loans to individuals in India carry no prepayment penalty — verify with your lender.</Note>
    </div>
  );
}

// ───────────────────── 8. TAX REFERENCE ──────────────────────────────────────
const FY_OPTIONS = ["FY 2023-24", "FY 2024-25", "FY 2025-26", "FY 2026-27", "FY 2027-28"];

function TaxReference() {
  const [fy, setFy] = useState("FY 2026-27");
  const [interest, setInterest] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [benefit, setBenefit] = useState(0);

  return (
    <div className="space-y-5">
      <Note>
        This section does <strong>not</strong> assume tax rules. Enter the amounts that apply to you and keep them as a reference alongside your schedule.
      </Note>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Applicable financial year">
          <div className="flex flex-wrap gap-1.5">
            {FY_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFy(f)}
                className={cn(
                  "h-9 rounded-full border px-3.5 text-[12.5px] font-semibold transition active:scale-95",
                  fy === f ? "border-brand-700 bg-brand-700 text-white" : "border-line text-ink-600"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Eligible interest amount (as per your records)"><NumInput value={interest} onChange={setInterest} /></Field>
        <Field label="Eligible principal amount (as per your records)"><NumInput value={principal} onChange={setPrincipal} /></Field>
        <Field label="Applicable tax benefit amount"><NumInput value={benefit} onChange={setBenefit} /></Field>
      </div>
      <div className="rounded-2xl border border-line bg-sand-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Your entered reference — {fy}</p>
        <div className="mt-1 divide-y divide-line/70">
          <KV k="Eligible interest" v={fmtINR(interest)} />
          <KV k="Eligible principal" v={fmtINR(principal)} />
          <KV k="Tax benefit (user entered)" v={fmtINR(benefit)} strong />
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-ink-400">
        Tax treatment may vary based on applicable Indian tax laws, financial year, taxpayer circumstances and the applicable tax regime. This calculator does not provide tax advice.
      </p>
    </div>
  );
}

// ───────────────────── 2b. PAY ANY AMOUNT, ANY TIME ─────────────────────────
// Ad-hoc lump sums already paid (or planned) in any month — bonus, FD maturity,
// savings — with combined effect + what each payment individually saves.
interface ExtraRow { id: number; period: number; amount: number; }

function ExtraPayments({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const [rows, setRows] = useState<ExtraRow[]>([{ id: 1, period: 12, amount: 50_000 }]);
  const [mode, setMode] = useState<PrepayMode>("reduce_tenure");
  const nextId = useRef(2);

  const setRow = (id: number, p: Partial<ExtraRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const out = useMemo(() => {
    const base = {
      principal: d.principal,
      annualRate: inp.rate,
      periods: d.periods,
      ppy: inp.ppy,
      start: parseMonthInput(inp.startMonth),
      method: inp.method,
      extrasMode: mode,
    };
    const clean = rows
      .map((r) => ({ period: Math.round(clamp(r.period, 1, d.periods)), amount: Math.max(0, r.amount) }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => a.period - b.period);
    const without = calculateAmortization(base);
    if (!clean.length || inp.method === "flat") {
      return { without, withP: null as AmortizeResult | null, marginals: [] as { period: number; amount: number; saved: number }[], clean };
    }
    const withP = calculateAmortization({ ...base, extraPayments: clean });
    // Marginal saving of each payment = (interest with all others) − (interest with all)
    const marginals =
      clean.length > 1
        ? clean.map((r) => {
            const others = clean.filter((o) => o !== r);
            const res = calculateAmortization({
              ...base,
              extraPayments: others.map((o) => ({ period: o.period, amount: o.amount })),
            });
            return { ...r, saved: Math.max(0, res.totalInterest - withP.totalInterest) };
          })
        : [];
    return { without, withP, marginals, clean };
  }, [rows, mode, inp.rate, inp.ppy, inp.startMonth, inp.method, d.principal, d.periods]);

  const totalExtra = out.clean.reduce((s, r) => s + r.amount, 0);
  const saved = out.withP ? Math.max(0, out.without.totalInterest - out.withP.totalInterest) : 0;

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-500">
        Paid (or plan to pay) some random lump sums — a bonus, an FD maturity, festival savings? Add each one-off payment and instantly see what they do together to this loan.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[{ value: "reduce_tenure", label: "Close loan earlier" }, { value: "reduce_emi", label: "Lower my EMI" }]}
          value={mode}
          onChange={setMode}
        />
        <span className="text-[12px] text-ink-400">up to 8 payments · any month, any amount</span>
      </div>

      {inp.method === "flat" ? (
        <Note tone="warn">Your loan is set to <strong>flat interest</strong> — interest is fixed on the original principal, so ad-hoc payments don't change it in this model. Switch the method to reducing balance (in Loan details) to see the effect.</Note>
      ) : (
        <>
          <div className="space-y-2.5">
            {rows.map((row, idx) => (
              <div key={row.id} className="flex items-end gap-2">
                <Field label={idx === 0 ? "Paid with instalment no." : undefined} className="w-[112px] shrink-0">
                  <NumInput
                    value={row.period}
                    onChange={(n) => setRow(row.id, { period: clamp(Math.round(n || 1), 1, d.periods) })}
                    prefix=" " suffix={`of ${d.periods}`}
                    inputMode="numeric"
                  />
                </Field>
                <Field label={idx === 0 ? "Amount paid" : undefined} className="min-w-0 flex-1">
                  <NumInput value={row.amount} onChange={(n) => setRow(row.id, { amount: n })} words />
                </Field>
                <button
                  type="button"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== row.id) : [{ id: 1, period: 12, amount: 50_000 }]))}
                  aria-label="Remove payment"
                  className="grid size-12 shrink-0 place-items-center rounded-xl border border-line text-ink-400 transition hover:border-danger/40 hover:text-danger active:scale-95"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (rows.length >= 8) return;
              const last = rows[rows.length - 1];
              setRows((rs) => [...rs, { id: nextId.current++, period: Math.min(d.periods, (last?.period ?? 0) + 12), amount: 50_000 }]);
            }}
            disabled={rows.length >= 8}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-600/40 bg-brand-50/50 py-3 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-50 active:scale-[0.99] disabled:opacity-40"
          >
            <Plus className="size-4" /> Add another payment
          </button>

          {out.withP && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Mini label="Total extra paid" v={fmtINR(totalExtra)} sub={`${out.clean.length} payment${out.clean.length > 1 ? "s" : ""}`} />
                <Mini label="Interest saved" v={fmtINR(saved)} sub={`${fmtINR(out.without.totalInterest)} → ${fmtINR(out.withP.totalInterest)}`} strong />
                {mode === "reduce_tenure" ? (
                  <Mini
                    label="Closes earlier by"
                    v={`${out.without.periodsActual - out.withP.periodsActual} EMIs`}
                    sub={`${out.without.periodsActual} → ${out.withP.periodsActual} payments`}
                  />
                ) : (
                  <Mini label="EMI comes down to" v={fmtINR(out.withP.scheduledEmiFinal)} sub={`was ${fmtINR(out.without.emiFirst)}`} />
                )}
                <Mini
                  label="New loan end"
                  v={out.withP.endDate ? fmtMonthYear(out.withP.endDate) : "—"}
                  sub={`was ${out.without.endDate ? fmtMonthYear(out.without.endDate) : "—"}`}
                />
              </div>

              {out.marginals.length > 0 && (
                <div className="rounded-xl border border-line">
                  <p className="border-b border-line bg-sand-50 px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-ink-500">
                    What each payment saves on its own
                  </p>
                  <div className="divide-y divide-line/60">
                    {out.marginals.map((m) => (
                      <div key={`${m.period}-${m.amount}`} className="num flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                        <span className="text-ink-600">
                          <span className="font-semibold text-ink-900">{fmtINR(m.amount)}</span> with instalment #{m.period}
                        </span>
                        <span className="font-semibold text-brand-700">saves {fmtINR(m.saved)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="bg-sand-50/60 px-3.5 py-2 text-[11.5px] leading-snug text-ink-400">
                    Individual savings overlap, so they may not add up exactly to the total ({fmtINR(saved)}).
                  </p>
                </div>
              )}
              <Note>Charges on prepayment, if your lender levies any, are not included — verify with your loan agreement.</Note>
            </>
          )}
        </>
      )}
    </div>
  );
}
