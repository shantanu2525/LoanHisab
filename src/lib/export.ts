// ─── Export helpers: CSV download + print ────────────────────────────────────
import type { PayRow, YearRow } from "./engine";
import { fmtDate } from "./format";

export interface ExportSummary {
  loanType: string;
  principal: number;
  methodLabel: string;
  annualRate: number;
  tenureLabel: string;
  frequencyLabel: string;
  emi: number;
  totalInterest: number;
  totalRepayment: number;
  fees: number;
  extraPaid: number;
  periodsActual: number;
}

export interface ExportFeesBreakdown {
  processingFee: number;
  gst: number;
  documentation: number;
  legal: number;
  insurance: number;
  other: number;
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const line = (cells: Array<string | number>) => cells.map(csvCell).join(",");

export function buildExportCSV(
  s: ExportSummary,
  fees: ExportFeesBreakdown,
  rows: PayRow[],
  yearly: YearRow[],
  yearlyBasisLabel: string
): string {
  const out: string[] = [];
  out.push("LOANHISAB — LOAN SUMMARY (ESTIMATE)");
  out.push(line(["Loan type", s.loanType]));
  out.push(line(["Loan amount (INR)", Math.round(s.principal)]));
  out.push(line(["Calculation method", s.methodLabel]));
  out.push(line(["Annual interest rate (% p.a.)", s.annualRate]));
  out.push(line(["Tenure", s.tenureLabel]));
  out.push(line(["Payment frequency", s.frequencyLabel]));
  out.push(line(["Instalment amount (INR)", Math.round(s.emi)]));
  out.push(line(["Total interest (INR)", Math.round(s.totalInterest)]));
  out.push(line(["Total repayment (INR)", Math.round(s.totalRepayment)]));
  out.push(line(["Total fees & charges (INR)", Math.round(s.fees)]));
  out.push(line(["Prepayments made (INR)", Math.round(s.extraPaid)]));
  out.push(line(["Payments made (count)", s.periodsActual]));
  out.push("");
  out.push("FEE BREAKDOWN (user entered)");
  out.push(line(["Processing fee (INR)", Math.round(fees.processingFee)]));
  out.push(line(["GST on fee (INR)", Math.round(fees.gst)]));
  out.push(line(["Documentation charges (INR)", Math.round(fees.documentation)]));
  out.push(line(["Legal charges (INR)", Math.round(fees.legal)]));
  out.push(line(["Insurance (INR)", Math.round(fees.insurance)]));
  out.push(line(["Other charges (INR)", Math.round(fees.other)]));
  out.push("");
  out.push(`YEARLY SUMMARY — grouped by ${yearlyBasisLabel}`);
  out.push(line(["Period", "Opening balance (INR)", "EMI paid (INR)", "Principal (INR)", "Interest (INR)", "Prepayment (INR)", "Closing balance (INR)"]));
  for (const y of yearly) {
    out.push(line([y.label, Math.round(y.opening), Math.round(y.emi), Math.round(y.principal), Math.round(y.interest), Math.round(y.extra), Math.round(y.closing)]));
  }
  out.push("");
  out.push("REPAYMENT SCHEDULE");
  out.push(line(["Payment no.", "Date", "Opening balance (INR)", "Instalment (INR)", "Principal (INR)", "Interest (INR)", "Prepayment (INR)", "Closing balance (INR)"]));
  for (const r of rows) {
    out.push(line([r.n, fmtDate(r.date), Math.round(r.opening), Math.round(r.emi), Math.round(r.principal), Math.round(r.interest), Math.round(r.extra), Math.round(r.closing)]));
  }
  out.push("");
  out.push("Disclaimer: Estimates for informational purposes only. Verify all figures with your lender.");
  return out.join("\n");
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function printPage(): void {
  window.print();
}
