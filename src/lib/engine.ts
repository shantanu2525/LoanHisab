// ─── Calculation engine ─────────────────────────────────────────────────────
// Pure functions only — no React, no DOM, no UI strings.
// New Indian loan products / formulas can be added here without touching UI.

import { fyLabel, cyLabel, monthEnd, SAFE } from "./format";

export type Freq = 1 | 2 | 4 | 12; // payments per year
export type Method = "reducing" | "flat" | "interest_only";
export type RateType = "fixed" | "floating";
export type PrepayFreq = "once" | "monthly" | "yearly";
export type PrepayMode = "reduce_tenure" | "reduce_emi";
export type MoratoriumMode = "pay" | "capitalize" | "separate";

export interface PayRow {
  n: number;
  date: Date;
  opening: number;
  emi: number; // scheduled instalment for the period
  interest: number; // interest portion of EMI
  principal: number; // principal portion of EMI
  extra: number; // prepayment paid this period
  closing: number;
}

export interface PrepayConfig {
  enabled: boolean;
  amount: number;
  startPeriod: number; // paid together with EMI no. N (1-indexed)
  freq: PrepayFreq;
  mode: PrepayMode;
}

export interface AmortizeInput {
  principal: number;
  annualRate: number; // % p.a.
  periods: number; // total count at chosen frequency
  ppy: Freq;
  start: Date;
  method: Method;
  prepay?: PrepayConfig;
  /** Ad-hoc one-off lump sums paid together with instalment no. N (any N, any amount) */
  extraPayments?: Array<{ period: number; amount: number }>;
  /** How ad-hoc extras behave when no recurring prepay is set */
  extrasMode?: PrepayMode;
  moratoriumMonths?: number; // interest-only accrual before repayment starts (education)
  moratoriumMode?: MoratoriumMode;
}

export interface AmortizeResult {
  rows: PayRow[];
  emiFirst: number; // scheduled instalment (first period of repayment)
  emiLast: number;
  scheduledEmiFinal: number; // scheduled instalment after all prepayment effects
  periodsInput: number; // periods entered by user
  periodsActual: number; // periods actually taken (may shrink with prepay)
  totalInterest: number; // repayment-phase interest
  moratoriumInterest: number; // simple interest accrued during moratorium (education)
  moratoriumMode: MoratoriumMode | null;
  adjustedPrincipal: number; // principal at repayment start (may be capitalised)
  principalPaid: number;
  totalPaid: number; // EMIs + extras (incl. moratorium interest if payable)
  totalExtra: number;
  endDate: Date | null;
  prepayImpact: PrepayImpact | null;
}

export interface PrepayImpact {
  interestSaved: number;
  periodsReduced: number;
  emiBefore: number;
  emiAfter: number; // scheduled EMI after prepay (reduce_emi mode)
  outstandingAfter: number; // principal outstanding right after prepay window
  baselineInterest: number;
  baselinePeriods: number;
}

export interface YearRow {
  label: string;
  opening: number;
  emi: number;
  principal: number;
  interest: number;
  extra: number;
  closing: number;
}

// ─── Core formulas ───────────────────────────────────────────────────────────

export const periodicRate = (annualRate: number, ppy: Freq): number =>
  SAFE(annualRate) / 100 / ppy;

/** Standard reducing-balance instalment. EMI = P·r·(1+r)ⁿ / ((1+r)ⁿ − 1). 0% → P/n */
export function calculateReducingEMI(P: number, annualRate: number, n: number, ppy: Freq = 12): number {
  if (!(P > 0) || !(n > 0)) return 0;
  const r = periodicRate(annualRate, ppy);
  if (r <= 0) return P / n;
  const f = Math.pow(1 + r, n);
  if (!Number.isFinite(f) || f === 1) return P / n;
  return SAFE((P * r * f) / (f - 1));
}

/** Flat interest: Interest = P × rate × years */
export function calculateFlatInterest(P: number, annualRate: number, years: number): number {
  if (!(P > 0)) return 0;
  return SAFE(P * (SAFE(annualRate) / 100) * SAFE(years));
}

/** Simple interest: P × r × t (t in years) */
export const calculateSimpleInterest = calculateFlatInterest;

export interface InterestOnlyResult {
  periodicInterest: number;
  finalPayment: number;
  totalInterest: number;
  totalPayable: number;
}

/** Interest-only repayments with principal payable at the end (gold loan bullet) */
export function calculateInterestOnly(P: number, annualRate: number, periods: number, ppy: Freq = 12): InterestOnlyResult {
  const r = periodicRate(annualRate, ppy);
  const periodicInterest = P * r;
  const totalInterest = periodicInterest * Math.max(0, periods);
  return {
    periodicInterest: SAFE(periodicInterest),
    finalPayment: SAFE(P + periodicInterest),
    totalInterest: SAFE(totalInterest),
    totalPayable: SAFE(P + totalInterest),
  };
}

/** Theoretical principal for a target instalment: P = E·((1+r)ⁿ−1) / (r·(1+r)ⁿ) */
export function calculateReverseEMI(emi: number, annualRate: number, n: number, ppy: Freq = 12): number {
  if (!(emi > 0) || !(n > 0)) return 0;
  const r = periodicRate(annualRate, ppy);
  if (r <= 0) return SAFE(emi * n);
  const f = Math.pow(1 + r, n);
  if (!Number.isFinite(f)) return 0;
  return SAFE((emi * (f - 1)) / (r * f));
}

/** Months/periods needed for a target EMI. null when EMI cannot even cover periodic interest. */
export function calculateReverseTenure(P: number, annualRate: number, emi: number, ppy: Freq = 12): number | null {
  if (!(P > 0) || !(emi > 0)) return null;
  const r = periodicRate(annualRate, ppy);
  if (r <= 0) return SAFE(P / emi, null as unknown as number);
  const floor = P * r;
  if (!(emi > floor)) return null;
  const n = Math.log(emi / (emi - floor)) / Math.log(1 + r);
  return Number.isFinite(n) ? n : null;
}

// ─── Fees ────────────────────────────────────────────────────────────────────

export function calculateProcessingFee(
  base: number,
  fee: { type: "percent" | "fixed"; value: number }
): number {
  if (!(base > 0)) return 0;
  return SAFE(fee.type === "percent" ? (base * SAFE(fee.value)) / 100 : SAFE(fee.value));
}

/** GST on a charge. gstPct is fully user-controlled (0 = no GST). */
export function calculateGST(base: number, gstPct: number): number {
  if (!(base > 0) || !(gstPct > 0)) return 0;
  return SAFE((base * gstPct) / 100);
}

/** Loan-to-Value = loan / asset value × 100 */
export function calculateLTV(loan: number, assetValue: number): number {
  if (!(assetValue > 0)) return 0;
  return SAFE((loan / assetValue) * 100);
}

// ─── Amortization ────────────────────────────────────────────────────────────

const MAX_ROWS = 720;

export function calculateAmortization(inp: AmortizeInput): AmortizeResult {
  const P = Math.max(0, SAFE(inp.principal));
  const ppy = inp.ppy;
  const r = periodicRate(inp.annualRate, ppy);
  const years = inp.periods / ppy;
  const method: Method = inp.method;

  // — education: moratorium accrual (simple interest) —
  const mMonths = Math.max(0, SAFE(inp.moratoriumMonths ?? 0));
  const moratoriumMode = mMonths > 0 ? (inp.moratoriumMode ?? "capitalize") : null;
  const moratoriumInterest =
    mMonths > 0 ? calculateSimpleInterest(P, inp.annualRate, mMonths / 12) : 0;
  const adjustedP = moratoriumMode === "capitalize" ? P + moratoriumInterest : P;

  const flatTotal =
    method === "flat" ? calculateFlatInterest(adjustedP, inp.annualRate, years) : 0;

  const baseEmi =
    method === "reducing"
      ? calculateReducingEMI(adjustedP, inp.annualRate, inp.periods, ppy)
      : method === "flat"
        ? inp.periods > 0
          ? (adjustedP + flatTotal) / inp.periods
          : 0
        : adjustedP * r; // interest_only

  const prepay: PrepayConfig | null =
    inp.prepay && inp.prepay.enabled && inp.prepay.amount > 0 ? inp.prepay : null;

  // Ad-hoc extras, merged per instalment no.
  const extraMap = new Map<number, number>();
  for (const ep of inp.extraPayments ?? []) {
    if (ep.amount > 0 && ep.period >= 1) {
      extraMap.set(Math.round(ep.period), (extraMap.get(Math.round(ep.period)) ?? 0) + ep.amount);
    }
  }
  const reduceEmiAfterExtras = (prepay?.mode ?? inp.extrasMode) === "reduce_emi";

  const rows: PayRow[] = [];
  let balance = adjustedP;
  let scheduledEmi = baseEmi;
  let totalInterest = 0;
  let totalExtra = 0;
  let principalPaid = 0;
  let emiAfter = baseEmi;
  let outstandingAfterPrepay = balance;

  if (P > 0 && inp.periods > 0) {
    let i = 1;
    while (balance > 0.005 && i <= MAX_ROWS) {
      const opening = balance;
      let interest = 0;
      let principal = 0;
      let emi = 0;

      if (method === "interest_only") {
        interest = opening * r;
        const isFinal = i >= inp.periods || opening * r <= 0;
        if (isFinal) {
          emi = opening + interest;
          principal = opening;
        } else {
          emi = interest;
          principal = 0;
        }
      } else if (method === "flat") {
        interest = flatTotal / inp.periods;
        principal = Math.min(opening, r > 0 ? scheduledEmi - interest : scheduledEmi);
        // If scheduled EMI cannot cover flat interest, fall back gracefully
        if (principal < 0) { principal = 0; }
        interest = Math.min(interest, Math.max(0, scheduledEmi - principal));
        if (opening <= principal + 0.005) {
          principal = opening;
          emi = principal + interest;
        } else {
          emi = principal + interest;
        }
      } else {
        // reducing balance
        interest = opening * r;
        principal = scheduledEmi - interest;
        if (principal <= 0) principal = 0;
        if (opening + interest < scheduledEmi || i >= inp.periods) {
          principal = opening;
          emi = opening + interest;
        } else {
          emi = scheduledEmi;
        }
      }

      let closing = opening - principal;

      // — prepayment events: ad-hoc extras + recurring plan —
      let extra = 0;
      if (method !== "flat") {
        let extraDue = extraMap.get(i) ?? 0;
        if (prepay) {
          const due =
            prepay.freq === "once"
              ? i === prepay.startPeriod
              : prepay.freq === "monthly"
                ? i >= prepay.startPeriod
                : i >= prepay.startPeriod && (i - prepay.startPeriod) % 12 === 0;
          if (due) extraDue += prepay.amount;
        }
        if (extraDue > 0 && closing > 0) {
          extra = Math.min(extraDue, closing);
          closing -= extra;
          totalExtra += extra;
          outstandingAfterPrepay = closing;
          if (reduceEmiAfterExtras) {
            const remaining = Math.max(0, inp.periods - i);
            if (remaining > 0 && closing > 0) {
              scheduledEmi =
                method === "reducing"
                  ? calculateReducingEMI(closing, inp.annualRate, remaining, ppy)
                  : scheduledEmi;
              emiAfter = scheduledEmi;
            }
          }
        }
      }

      totalInterest += interest;
      principalPaid += principal + extra;
      balance = Math.max(0, closing);

      rows.push({
        n: i,
        date: monthEnd(inp.start, Math.ceil((i * 12) / ppy)),
        opening,
        emi,
        interest,
        principal,
        extra,
        closing: balance,
      });

      if (method === "interest_only" && principal > 0) break;
      i++;
    }
  }

  const periodsActual = rows.length;
  const emiFirst = rows[0]?.emi ?? baseEmi;
  const emiLast = rows[rows.length - 1]?.emi ?? baseEmi;

  // — prepay impact vs a clean baseline —
  let prepayImpact: PrepayImpact | null = null;
  if (prepay) {
    const baseline = calculateAmortization({ ...inp, prepay: undefined });
    prepayImpact = {
      interestSaved: Math.max(0, baseline.totalInterest - totalInterest),
      periodsReduced: Math.max(0, baseline.periodsActual - periodsActual),
      emiBefore: baseline.emiFirst,
      emiAfter: prepay.mode === "reduce_emi" ? emiAfter : baseline.emiFirst,
      outstandingAfter: outstandingAfterPrepay,
      baselineInterest: baseline.totalInterest,
      baselinePeriods: baseline.periodsActual,
    };
  }

  const siOutsideSchedule = moratoriumMode === "pay" || moratoriumMode === "separate" ? moratoriumInterest : 0;

  const totalPaid =
    rows.reduce((s, r2) => s + r2.emi + r2.extra, 0) + siOutsideSchedule;

  return {
    rows,
    emiFirst: SAFE(emiFirst),
    emiLast: SAFE(emiLast),
    scheduledEmiFinal: SAFE(scheduledEmi),
    periodsInput: inp.periods,
    periodsActual,
    totalInterest: SAFE(totalInterest + siOutsideSchedule),
    moratoriumInterest: SAFE(moratoriumInterest),
    moratoriumMode,
    adjustedPrincipal: SAFE(adjustedP),
    principalPaid: SAFE(principalPaid + (moratoriumMode === "capitalize" ? 0 : 0)),
    totalPaid: SAFE(totalPaid),
    totalExtra: SAFE(totalExtra),
    endDate: rows.length ? rows[rows.length - 1].date : null,
    prepayImpact,
  };
}

// ─── Yearly summary (FY / CY) ────────────────────────────────────────────────

export function calculateYearlySummary(rows: PayRow[], basis: "FY" | "CY"): YearRow[] {
  const out: YearRow[] = [];
  const idx = new Map<string, YearRow>();
  for (const r of rows) {
    const label = basis === "FY" ? fyLabel(r.date) : cyLabel(r.date);
    let y = idx.get(label);
    if (!y) {
      y = { label, opening: r.opening, emi: 0, principal: 0, interest: 0, extra: 0, closing: r.closing };
      idx.set(label, y);
      out.push(y);
    }
    y.emi += r.emi;
    y.principal += r.principal;
    y.interest += r.interest;
    y.extra += r.extra;
    y.closing = r.closing;
  }
  return out;
}

// ─── Prepayment comparison (reduce EMI vs reduce tenure) ────────────────────

export interface PrepayCompareResult {
  mode: PrepayMode;
  emiBefore: number;
  emiAfter: number;
  tenureBefore: number;
  tenureAfter: number;
  periodsReduced: number;
  interestBefore: number;
  interestAfter: number;
  interestSaved: number;
  outstandingAfter: number;
}

export function calculatePrepayment(base: Omit<AmortizeInput, "prepay">, prepay: Omit<PrepayConfig, "mode" | "enabled">): PrepayCompareResult[] {
  const clean = calculateAmortization({ ...base, prepay: undefined });
  return (["reduce_tenure", "reduce_emi"] as PrepayMode[]).map((mode) => {
    const res = calculateAmortization({ ...base, prepay: { ...prepay, mode, enabled: true } });
    const impact = res.prepayImpact;
    return {
      mode,
      emiBefore: clean.emiFirst,
      emiAfter: mode === "reduce_emi" ? res.emiLast : clean.emiFirst,
      tenureBefore: clean.periodsActual,
      tenureAfter: res.periodsActual,
      periodsReduced: impact?.periodsReduced ?? 0,
      interestBefore: clean.totalInterest,
      interestAfter: res.totalInterest,
      interestSaved: impact?.interestSaved ?? 0,
      outstandingAfter: impact?.outstandingAfter ?? 0,
    };
  });
}

// ─── Foreclosure ─────────────────────────────────────────────────────────────

export interface ForeclosureInput {
  outstanding: number;
  chargePct: number;
  gstPct: number;
  otherCharges: number;
}

export interface ForeclosureResult {
  outstanding: number;
  charge: number;
  gst: number;
  other: number;
  closure: number;
}

export function calculateForeclosure(i: ForeclosureInput): ForeclosureResult {
  const outstanding = Math.max(0, SAFE(i.outstanding));
  const charge = calculateGST(outstanding, i.chargePct); // same % math
  const gst = calculateGST(charge, i.gstPct);
  const other = Math.max(0, SAFE(i.otherCharges));
  return {
    outstanding,
    charge: SAFE(charge),
    gst: SAFE(gst),
    other,
    closure: SAFE(outstanding + charge + gst + other),
  };
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface CompareInput {
  amount: number;
  annualRate: number;
  tenureMonths: number;
  feeType: "percent" | "fixed";
  feeValue: number;
  otherCharges: number;
}

export interface CompareResult {
  emi: number;
  totalInterest: number;
  fee: number;
  other: number;
  totalRepayment: number;
  costOfBorrowing: number;
}

export function calculateLoanComparison(items: CompareInput[]): CompareResult[] {
  return items.map((it) => {
    const emi = calculateReducingEMI(it.amount, it.annualRate, it.tenureMonths, 12);
    const totalInterest = Math.max(0, emi * it.tenureMonths - it.amount);
    const fee = calculateProcessingFee(it.amount, { type: it.feeType, value: it.feeValue });
    const other = Math.max(0, SAFE(it.otherCharges));
    return {
      emi: SAFE(emi),
      totalInterest: SAFE(totalInterest),
      fee: SAFE(fee),
      other,
      totalRepayment: SAFE(it.amount + totalInterest),
      costOfBorrowing: SAFE(it.amount + totalInterest + fee + other),
    };
  });
}
