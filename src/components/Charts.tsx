// ─── Charts: donut, balance line, yearly stacked bars ────────────────────────
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from "recharts";
import { Card, Segmented } from "./ui";
import { fmtINR, axisIN, fmtMonthYear } from "../lib/format";
import { calculateYearlySummary } from "../lib/engine";
import type { Derived } from "../lib/state";

const BRAND = "#0E5C46";
const GOLD = "#E98E15";
const LINE_BRAND = "#12765A";
const GRID = "#EBE5D9";
const TICK = { fill: "#82948A", fontSize: 11 };

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      {label != null && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="num flex items-center gap-2 text-[12.5px] font-medium text-ink-700">
          <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.color }} />
          {p.name}: <span className="font-bold text-ink-900">{fmtINR(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function Charts({ d }: { d: Derived }) {
  const [barMode, setBarMode] = useState<"year" | "instalment">("year");
  const { result, fees } = d;

  const donut = useMemo(
    () => [
      { name: "Principal", value: Math.max(0, result.adjustedPrincipal), color: BRAND },
      { name: "Interest", value: Math.max(0, result.totalInterest), color: GOLD },
      { name: "Fees", value: Math.max(0, fees.total), color: "#A9B7AF" },
    ].filter((s) => s.value > 0.5),
    [result, fees]
  );

  const balanceData = useMemo(() => {
    const rows = result.rows;
    if (!rows.length) return [];
    const step = Math.max(1, Math.ceil(rows.length / 96));
    const out = [];
    for (let i = 0; i < rows.length; i += step) {
      const r = rows[i];
      out.push({ label: fmtMonthYear(r.date), balance: Math.round(r.closing) });
    }
    const last = rows[rows.length - 1];
    if (out[out.length - 1]?.label !== fmtMonthYear(last.date)) {
      out.push({ label: fmtMonthYear(last.date), balance: Math.round(last.closing) });
    }
    return out;
  }, [result.rows]);

  const yearlyBars = useMemo(
    () =>
      calculateYearlySummary(result.rows, "CY").map((y) => ({
        label: y.label.length > 4 ? y.label.replace("20", "'") : y.label,
        Principal: Math.round(y.principal + y.extra),
        Interest: Math.round(y.interest),
      })),
    [result.rows]
  );

  const emiBars = useMemo(
    () =>
      result.rows.slice(0, 30).map((r) => ({
        label: `#${r.n}`,
        Principal: Math.round(r.principal),
        Interest: Math.round(r.interest),
      })),
    [result.rows]
  );

  if (!result.rows.length) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Donut */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold text-ink-900">Principal vs interest</h3>
        <p className="mt-0.5 text-[12px] text-ink-400">Share of the total amount you pay</p>
        <div className="relative mx-auto mt-2 h-[220px] max-w-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donut}
                dataKey="value"
                innerRadius="68%"
                outerRadius="94%"
                startAngle={90}
                endAngle={450}
                paddingAngle={2}
                strokeWidth={0}
                animationDuration={500}
              >
                {donut.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">You repay</p>
              <p className="num font-display text-xl font-semibold text-ink-900">{fmtINR(result.totalPaid + fees.total)}</p>
            </div>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {donut.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-600">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
              {s.name} <span className="num text-ink-400">{fmtINR(s.value)}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* Balance line */}
      <Card className="p-4 sm:p-5">
        <h3 className="text-[15px] font-semibold text-ink-900">Outstanding balance</h3>
        <p className="mt-0.5 text-[12px] text-ink-400">How your loan reduces over time</p>
        <div className="mt-2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LINE_BRAND} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={LINE_BRAND} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={42} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={axisIN} width={44} />
              <Tooltip content={<MoneyTooltip />} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke={LINE_BRAND} strokeWidth={2.25} fill="url(#balFill)" animationDuration={500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stacked bars */}
      <Card className="p-4 sm:p-5 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-ink-900">
              {barMode === "year" ? "Principal vs interest, by year" : "EMI composition, first 30 instalments"}
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-400">
              {barMode === "year" ? "Each calendar year's payments split into principal and interest" : "From interest-heavy to principal-heavy"}
            </p>
          </div>
          <Segmented
            size="sm"
            options={[{ value: "year", label: "By year" }, { value: "instalment", label: "First 30 EMIs" }]}
            value={barMode}
            onChange={setBarMode}
          />
        </div>
        <div className="mt-2 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barMode === "year" ? yearlyBars : emiBars} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} tickFormatter={axisIN} width={44} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(14,92,70,0.05)" }} />
              <Bar dataKey="Principal" stackId="a" fill={BRAND} radius={[0, 0, 0, 0]} animationDuration={450} />
              <Bar dataKey="Interest" stackId="a" fill={GOLD} radius={[4, 4, 0, 0]} animationDuration={450} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex justify-center gap-5">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-600"><span className="size-2.5 rounded-full" style={{ background: BRAND }} /> Principal</span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-600"><span className="size-2.5 rounded-full" style={{ background: GOLD }} /> Interest</span>
        </div>
      </Card>
    </div>
  );
}
