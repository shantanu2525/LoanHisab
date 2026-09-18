// ─── Indian number formatting, parsing & display helpers ────────────────────
// All UI text/number formatting lives here — calculation logic lives in engine.ts

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });

export const SAFE = (n: number, fb = 0): number =>
  Number.isFinite(n) ? n : fb;

/** ₹1,00,000 — guards NaN / Infinity / undefined */
export const fmtINR = (n: number | null | undefined): string => {
  const v = SAFE(Number(n ?? 0));
  return inr.format(Math.round(v));
};

/** ₹1,00,000.50 */
export const fmtINR2 = (n: number | null | undefined): string => {
  const v = SAFE(Number(n ?? 0));
  return inr2.format(v);
};

/** 1,00,000 (grouped digits, no symbol) */
export const fmtNum = (n: number | null | undefined): string =>
  num.format(SAFE(Number(n ?? 0)));

/** 8.50% */
export const fmtPct = (n: number | null | undefined, dp = 2): string =>
  `${SAFE(Number(n ?? 0)).toFixed(dp)}%`;

const trim = (v: number) => {
  const s = v.toFixed(2);
  return s.replace(/\.?0+$/, "");
};

/** ₹1.5 Crore / ₹25 Lakh / ₹10 thousand — spoken-style compact form */
export function compactIN(n: number): string {
  const v = Math.abs(SAFE(Number(n)));
  if (v >= 1e7) return `₹${trim(v / 1e7)} Crore`;
  if (v >= 1e5) return `₹${trim(v / 1e5)} Lakh`;
  if (v >= 1e3) return `₹${trim(v / 1e3)} Thousand`;
  return `₹${Math.round(v)}`;
}

/** Short axis form for charts: 1Cr / 25L / 50k */
export function axisIN(n: number): string {
  const v = SAFE(Number(n));
  const a = Math.abs(v);
  if (a >= 1e7) return `${trim(v / 1e7)}Cr`;
  if (a >= 1e5) return `${trim(v / 1e5)}L`;
  if (a >= 1e3) return `${trim(v / 1e3)}k`;
  return `${Math.round(v)}`;
}

/**
 * Parses user-typed Indian amounts:
 *   "1000000" → 1000000        "10,00,000" → 1000000
 *   "25 lakh" → 2500000        "1.5 crore" → 15000000
 *   "1 cr" → 10000000          "50k" → 50000
 * Returns null when unparseable.
 */
export function parseIndianAmount(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/[₹,\s]/g, "");
  const m = s.match(/^(-?\d*\.?\d+)(crore|cr|crores|lakh|lakhs|lac|lacs|thousand|k|l)?$/);
  if (!m) return null;
  let v = parseFloat(m[1]);
  if (!Number.isFinite(v)) return null;
  const unit = m[2];
  switch (unit) {
    case "crore": case "crores": case "cr": v *= 1e7; break;
    case "lakh": case "lakhs": case "lac": case "lacs": case "l": v *= 1e5; break;
    case "thousand": case "k": v *= 1e3; break;
  }
  return SAFE(v, null as unknown as number);
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** 01 Oct 2026 */
export function fmtDate(d: Date): string {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Oct 2026 */
export function fmtMonthYear(d: Date): string {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function addMonths(d: Date, m: number): Date {
  const c = new Date(d.getTime());
  c.setMonth(c.getMonth() + m);
  return c;
}

/** Last day of the month m months after d — EMI payment dates */
export function monthEnd(d: Date, m: number): Date {
  const base = new Date(d.getFullYear(), d.getMonth(), 1);
  base.setMonth(base.getMonth() + m);
  return new Date(base.getFullYear(), base.getMonth(), 0);
}

/** "2026-04" style input value → Date (1st of month) */
export function parseMonthInput(v: string): Date {
  const m = /^(\d{4})-(\d{2})$/.exec(v || "");
  if (!m) return new Date();
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function toMonthInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Indian Financial Year label: Oct 2026 → "FY 2026-27" */
export function fyLabel(d: Date): string {
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 3 ? y : y - 1;
  return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** Calendar year label: "2026" */
export const cyLabel = (d: Date): string => `${d.getFullYear()}`;

export const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
