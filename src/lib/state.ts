// ─── App state shape + derived result hook ──────────────────────────────────
import { useMemo } from "react";
import type { Freq, Method, RateType, PrepayFreq, PrepayMode, MoratoriumMode, AmortizeResult } from "./engine";
import {
  calculateAmortization, calculateProcessingFee, calculateGST, calculateLTV,
} from "./engine";
import { loanById, type LoanId, type LoanCfg } from "./loans";
import { parseMonthInput, toMonthInput, SAFE } from "./format";

export interface LoanInputs {
  loanId: LoanId;
  method: Method;
  rateType: RateType;
  rate: number;                 // % p.a.
  tenureMonths: number;         // canonical tenure
  ppy: Freq;                    // payments per year
  startMonth: string;           // "YYYY-MM"
  amount: number;               // principal (direct-edit loans)
  price: number;                // asset price (home/car/etc.)
  downPct: number;
  downAmt: number;
  downMode: "pct" | "amt";
  // education
  courseFee: number;
  otherExpenses: number;
  studyMonths: number;
  moraMonths: number;
  moraMode: MoratoriumMode;
  // gold
  goldValue: number;
  goldWeight: number;
  goldPurity: number;           // carat
  // loan against property
  lapValue: number;
  lapExisting: number;
  // business grace
  graceMonths: number;
  // fees
  pfType: "percent" | "fixed";
  pfValue: number;
  gstPct: number;
  docCharges: number;
  legalCharges: number;
  insurance: number;
  insuranceFinanced: boolean;
  otherCharges: number;
  // prepayment
  preOn: boolean;
  pAmount: number;
  pStart: number;
  pFreq: PrepayFreq;
  pMode: PrepayMode;
}

export function defaultInputs(): LoanInputs {
  const cfg = loanById("personal");
  return {
    loanId: "personal",
    method: cfg.methods[0],
    rateType: "fixed",
    rate: cfg.defaults.rate,
    tenureMonths: cfg.defaults.tenureMonths,
    ppy: 12,
    startMonth: toMonthInput(new Date()),
    amount: cfg.defaults.amount,
    price: 5_000_000,
    downPct: 20,
    downAmt: 1_000_000,
    downMode: "pct",
    courseFee: 1_200_000,
    otherExpenses: 300_000,
    studyMonths: 24,
    moraMonths: 12,
    moraMode: "capitalize",
    goldValue: 300_000,
    goldWeight: 40,
    goldPurity: 22,
    lapValue: 5_000_000,
    lapExisting: 0,
    graceMonths: 0,
    pfType: "percent",
    pfValue: cfg.defaults.pfPct,
    gstPct: 18,
    docCharges: 0,
    legalCharges: 0,
    insurance: 0,
    insuranceFinanced: false,
    otherCharges: 0,
    preOn: false,
    pAmount: 100_000,
    pStart: 12,
    pFreq: "once",
    pMode: "reduce_tenure",
  };
}

export interface FeeBreakdown {
  processingFee: number;
  gst: number;
  documentation: number;
  legal: number;
  insurance: number;
  other: number;
  total: number;
}

export interface Derived {
  cfg: LoanCfg;
  downAmt: number;
  principalFinanced: number;    // before financed insurance
  principal: number;            // amortization opening principal
  periods: number;
  ltv: number | null;
  monthsMoratorium: number;
  result: AmortizeResult;
  fees: FeeBreakdown;
  totalRepayment: number;       // schedule outflow (EMIs + extras + moratorium interest)
  totalCost: number;            // totalRepayment + fees
  errors: Record<string, string>;
}

export function derive(inp: LoanInputs): Derived {
  const cfg = loanById(inp.loanId);
  const errors: Record<string, string> = {};

  const price = Math.max(0, SAFE(inp.price));
  const downAmt = cfg.hasPrice ? Math.max(0, SAFE(inp.downAmt)) : 0;

  if (cfg.hasPrice) {
    if (!(price > 0)) errors.price = "Enter the price to continue.";
    if (downAmt > price) errors.down = "Down payment cannot exceed the price.";
  }
  if (!(inp.rate >= 0)) errors.rate = "Interest rate must be 0% or more.";
  if (inp.rate > 60) errors.rate = "Please enter a realistic annual rate (0–60%).";
  if (!(inp.tenureMonths > 0)) errors.tenure = "Tenure must be more than 0.";
  if (inp.tenureMonths > 600) errors.tenure = "Tenure above 50 years is not supported.";

  let principalFinanced = cfg.hasPrice ? Math.max(0, price - downAmt) : Math.max(0, SAFE(inp.amount));
  if (!(principalFinanced > 0)) errors.amount = "Loan amount must be more than ₹0.";

  let principal = principalFinanced;
  if (cfg.allowInsuranceFinanced && inp.insuranceFinanced && inp.insurance > 0) {
    principal += inp.insurance;
  }

  const periods = Math.max(1, Math.round((inp.tenureMonths * inp.ppy) / 12));
  const start = parseMonthInput(inp.startMonth);

  const monthsMoratorium =
    cfg.isEducation ? Math.max(0, SAFE(inp.studyMonths) + SAFE(inp.moraMonths))
    : cfg.hasGrace ? Math.max(0, SAFE(inp.graceMonths))
    : 0;

  const result = calculateAmortization({
    principal,
    annualRate: inp.rate,
    periods,
    ppy: inp.ppy,
    start,
    method: inp.method,
    moratoriumMonths: monthsMoratorium || undefined,
    moratoriumMode: cfg.isEducation ? inp.moraMode : monthsMoratorium ? "capitalize" : undefined,
    prepay: {
      enabled: inp.preOn,
      amount: inp.pAmount,
      startPeriod: Math.max(1, Math.min(periods, Math.round(inp.pStart || 1))),
      freq: inp.pFreq,
      mode: inp.pMode,
    },
  });

  const processingFee = calculateProcessingFee(principalFinanced, { type: inp.pfType, value: inp.pfValue });
  const gst = calculateGST(processingFee, inp.gstPct);
  const documentation = Math.max(0, SAFE(inp.docCharges));
  const legal = Math.max(0, SAFE(inp.legalCharges));
  const insurance = Math.max(0, SAFE(inp.insurance));
  const other = Math.max(0, SAFE(inp.otherCharges));
  const fees: FeeBreakdown = {
    processingFee: SAFE(processingFee),
    gst: SAFE(gst),
    documentation,
    legal,
    insurance,
    other,
    total: SAFE(processingFee + gst + documentation + legal + insurance + other),
  };

  const ltv = cfg.hasPrice
    ? (price > 0 ? calculateLTV(principal, price) : null)
    : cfg.isLAP
      ? (inp.lapValue > 0 ? calculateLTV(principal + Math.max(0, SAFE(inp.lapExisting)), inp.lapValue) : null)
      : cfg.isGold
        ? (inp.goldValue > 0 ? calculateLTV(principal, inp.goldValue) : null)
        : null;

  const totalRepayment = SAFE(result.totalPaid);
  const totalCost = SAFE(totalRepayment + fees.total);

  return { cfg, downAmt, principalFinanced, principal, periods, ltv, monthsMoratorium, result, fees, totalRepayment, totalCost, errors };
}

export const useLoanResult = (inp: LoanInputs): Derived => useMemo(() => derive(inp), [inp]);

export const FREQ_LABEL: Record<Freq, string> = {
  12: "Monthly",
  4: "Quarterly",
  2: "Half-yearly",
  1: "Yearly",
};

export const FREQ_UNIT: Record<Freq, string> = {
  12: "month",
  4: "quarter",
  2: "half-year",
  1: "year",
};
