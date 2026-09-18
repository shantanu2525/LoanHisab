// ─── Amortization schedule + yearly summary ──────────────────────────────────
import { useMemo, useState } from "react";
import { Card, Segmented } from "./ui";
import { fmtINR, fmtDate } from "../lib/format";
import { calculateYearlySummary } from "../lib/engine";
import type { Derived } from "../lib/state";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";

type View = "monthly" | "yearly";

export default function Schedule({ d }: { d: Derived }) {
  const [view, setView] = useState<View>("monthly");
  const [basis, setBasis] = useState<"FY" | "CY">("FY");
  const [expanded, setExpanded] = useState(false);

  const rows = d.result.rows;
  const hasExtra = rows.some((r) => r.extra > 0);
  const visible = expanded ? rows : rows.slice(0, 12);
  const yearly = useMemo(() => calculateYearlySummary(rows, basis), [rows, basis]);

  if (!rows.length) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line p-4 sm:p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-900">Repayment schedule</h3>
          <p className="mt-0.5 text-[12px] text-ink-400">
            {rows.length} instalments · grouped by {basis === "FY" ? "Indian financial year (Apr–Mar)" : "calendar year"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            size="sm"
            options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly summary" }]}
            value={view}
            onChange={setView}
          />
          {view === "yearly" && (
            <Segmented
              size="sm"
              options={[{ value: "FY", label: "Financial year" }, { value: "CY", label: "Calendar year" }]}
              value={basis}
              onChange={setBasis}
            />
          )}
        </div>
      </div>

      {view === "monthly" ? (
        <>
          <div className="overflow-x-auto no-print">
            <table className="w-full min-w-[680px] text-right text-[12.5px]">
              <thead>
                <tr className="bg-sand-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2.5 text-left font-semibold">EMI no.</th>
                  <th className="px-3 py-2.5 text-left">Date</th>
                  <th className="px-3 py-2.5">Opening balance</th>
                  <th className="px-3 py-2.5">EMI</th>
                  <th className="px-3 py-2.5">Principal</th>
                  <th className="px-3 py-2.5">Interest</th>
                  {hasExtra && <th className="px-3 py-2.5">Prepay</th>}
                  <th className="px-3 py-2.5">Closing balance</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.n} className={cn("border-t border-line/60 num", r.extra > 0 && "bg-gold-50/70")}>
                    <td className="px-3 py-2 text-left font-semibold text-ink-700">{r.n}</td>
                    <td className="px-3 py-2 text-left text-ink-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className="px-3 py-2 text-ink-700">{fmtINR(r.opening)}</td>
                    <td className="px-3 py-2 font-semibold text-ink-900">{fmtINR(r.emi)}</td>
                    <td className="px-3 py-2 text-brand-700">{fmtINR(r.principal)}</td>
                    <td className="px-3 py-2 text-gold-600">{fmtINR(r.interest)}</td>
                    {hasExtra && <td className="px-3 py-2 font-semibold text-gold-600">{r.extra > 0 ? fmtINR(r.extra) : "—"}</td>}
                    <td className="px-3 py-2 font-medium text-ink-900">{fmtINR(r.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 12 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="no-print flex w-full items-center justify-center gap-1.5 border-t border-line py-3 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-50/60"
            >
              {expanded ? "Show less" : `Show all ${rows.length} payments`}
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </button>
          )}

        </>
      ) : (
        <div className="overflow-x-auto no-print">
          <table className="w-full min-w-[640px] text-right text-[12.5px]">
            <thead>
              <tr className="bg-sand-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-3 py-2.5 text-left font-semibold">{basis === "FY" ? "Financial year" : "Year"}</th>
                <th className="px-3 py-2.5">Opening balance</th>
                <th className="px-3 py-2.5">EMI paid</th>
                <th className="px-3 py-2.5">Principal paid</th>
                <th className="px-3 py-2.5">Interest paid</th>
                {hasExtra && <th className="px-3 py-2.5">Prepayment</th>}
                <th className="px-3 py-2.5">Closing balance</th>
              </tr>
            </thead>
            <tbody>
              {yearly.map((y) => (
                <tr key={y.label} className="num border-t border-line/60">
                  <td className="px-3 py-2 text-left font-semibold text-ink-800">{y.label}</td>
                  <td className="px-3 py-2 text-ink-700">{fmtINR(y.opening)}</td>
                  <td className="px-3 py-2 font-medium text-ink-900">{fmtINR(y.emi)}</td>
                  <td className="px-3 py-2 text-brand-700">{fmtINR(y.principal)}</td>
                  <td className="px-3 py-2 text-gold-600">{fmtINR(y.interest)}</td>
                  {hasExtra && <td className="px-3 py-2 text-gold-600">{y.extra > 0 ? fmtINR(y.extra) : "—"}</td>}
                  <td className="px-3 py-2 font-medium text-ink-900">{fmtINR(y.closing)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="num border-t-2 border-ink-900/10 bg-sand-100/60 font-bold text-ink-900">
                <td className="px-3 py-2 text-left">Total</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2">{fmtINR(yearly.reduce((s, y) => s + y.emi, 0))}</td>
                <td className="px-3 py-2">{fmtINR(yearly.reduce((s, y) => s + y.principal, 0))}</td>
                <td className="px-3 py-2">{fmtINR(yearly.reduce((s, y) => s + y.interest, 0))}</td>
                {hasExtra && <td className="px-3 py-2">{fmtINR(yearly.reduce((s, y) => s + y.extra, 0))}</td>}
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Print-only: complete schedule + yearly summary (renders regardless of view) */}
      <div className="print-only">
        <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px" }}>Yearly summary — Indian Financial Year (Apr–Mar)</h4>
        <table className="w-full text-right text-[10px]">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">FY</th>
              <th className="px-2 py-1">Opening</th>
              <th className="px-2 py-1">EMI paid</th>
              <th className="px-2 py-1">Principal</th>
              <th className="px-2 py-1">Interest</th>
              <th className="px-2 py-1">Closing</th>
            </tr>
          </thead>
          <tbody>
            {calculateYearlySummary(rows, "FY").map((y) => (
              <tr key={y.label} className="border-t border-line/50">
                <td className="px-2 py-1 text-left">{y.label}</td>
                <td className="px-2 py-1">{fmtINR(y.opening)}</td>
                <td className="px-2 py-1">{fmtINR(y.emi)}</td>
                <td className="px-2 py-1">{fmtINR(y.principal)}</td>
                <td className="px-2 py-1">{fmtINR(y.interest)}</td>
                <td className="px-2 py-1">{fmtINR(y.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h4 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 6px" }}>Full repayment schedule</h4>
        <table className="w-full text-right text-[10px]">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">EMI</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1">Opening</th>
              <th className="px-2 py-1">Amount</th>
              <th className="px-2 py-1">Principal</th>
              <th className="px-2 py-1">Interest</th>
              <th className="px-2 py-1">Closing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className="border-t border-line/50">
                <td className="px-2 py-1 text-left">{r.n}</td>
                <td className="px-2 py-1 text-left">{fmtDate(r.date)}</td>
                <td className="px-2 py-1">{fmtINR(r.opening)}</td>
                <td className="px-2 py-1">{fmtINR(r.emi + r.extra)}</td>
                <td className="px-2 py-1">{fmtINR(r.principal + r.extra)}</td>
                <td className="px-2 py-1">{fmtINR(r.interest)}</td>
                <td className="px-2 py-1">{fmtINR(r.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
