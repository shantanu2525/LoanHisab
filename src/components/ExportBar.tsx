// ─── Export: CSV + print ─────────────────────────────────────────────────────
import { FileDown, Printer } from "lucide-react";
import { buildExportCSV, downloadCSV, printPage } from "../lib/export";
import { calculateYearlySummary } from "../lib/engine";
import { METHOD_LABEL } from "../lib/loans";
import { FREQ_LABEL } from "../lib/state";
import { fmtPct } from "../lib/format";
import type { LoanInputs, Derived } from "../lib/state";

export default function ExportBar({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const ok = d.principal > 0 && d.result.rows.length > 0;

  const doCSV = () => {
    const yearlyFY = calculateYearlySummary(d.result.rows, "FY");
    const csv = buildExportCSV(
      {
        loanType: d.cfg.name,
        principal: d.principal,
        methodLabel: METHOD_LABEL[inp.method],
        annualRate: inp.rate,
        tenureLabel: `${inp.tenureMonths} months (${d.periods} ${FREQ_LABEL[inp.ppy].toLowerCase()} payments)`,
        frequencyLabel: FREQ_LABEL[inp.ppy],
        emi: d.result.emiFirst,
        totalInterest: d.result.totalInterest,
        totalRepayment: d.totalRepayment,
        fees: d.fees.total,
        extraPaid: d.result.totalExtra,
        periodsActual: d.result.periodsActual,
      },
      {
        processingFee: d.fees.processingFee,
        gst: d.fees.gst,
        documentation: d.fees.documentation,
        legal: d.fees.legal,
        insurance: d.fees.insurance,
        other: d.fees.other,
      },
      d.result.rows,
      yearlyFY,
      "Indian Financial Year (Apr–Mar)"
    );
    downloadCSV(`loanhisab-${inp.loanId}-${fmtPct(inp.rate, 2).replace("%", "pct")}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
      <button
        type="button"
        onClick={doCSV}
        disabled={!ok}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-brand-800 active:scale-[0.98] disabled:opacity-40"
      >
        <FileDown className="size-4.5" /> Download CSV — summary + full schedule
      </button>
      <button
        type="button"
        onClick={printPage}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink-900/15 bg-white px-4 py-3.5 text-[14px] font-semibold text-ink-800 transition hover:border-ink-900/30 active:scale-[0.98]"
      >
        <Printer className="size-4.5" /> Print / save as PDF
      </button>
    </div>
  );
}
