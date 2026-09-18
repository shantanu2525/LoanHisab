// ─── Language architecture ───────────────────────────────────────────────────
// UI strings live here, separate from components and engine.
// English is complete. Other Indian languages are wired for future translation
// (no auto-translation APIs are used — fallback is English).

export type Lang = "en" | "hi" | "mr" | "kn" | "ta" | "te" | "bn" | "gu" | "ml";

export interface LangMeta {
  id: Lang;
  native: string;
  english: string;
  ready: boolean;
}

export const LANGUAGES: LangMeta[] = [
  { id: "en", native: "English", english: "English", ready: true },
  { id: "hi", native: "हिन्दी", english: "Hindi", ready: false },
  { id: "mr", native: "मराठी", english: "Marathi", ready: false },
  { id: "kn", native: "ಕನ್ನಡ", english: "Kannada", ready: false },
  { id: "ta", native: "தமிழ்", english: "Tamil", ready: false },
  { id: "te", native: "తెలుగు", english: "Telugu", ready: false },
  { id: "bn", native: "বাংলা", english: "Bengali", ready: false },
  { id: "gu", native: "ગુજરાતી", english: "Gujarati", ready: false },
  { id: "ml", native: "മലയാളം", english: "Malayalam", ready: false },
];

const en = {
  "app.title": "LoanHisab",
  "app.subtitle": "Calculate EMI, total interest, repayment schedule and loan cost.",
  "app.tag": "Free • No sign-up • Runs fully in your browser",
  "nav.overview": "Overview",
  "nav.schedule": "Schedule",
  "nav.whatif": "What-if",
  "nav.tools": "Tools",
  "nav.compare": "Compare",
  "nav.export": "Export",
  "loan.select": "Select loan type",
  "loan.details": "Loan details",
  "loan.advanced": "Fees, charges & prepayment",
  "result.emi": "Monthly EMI",
  "result.interest": "Total interest",
  "result.repayment": "Total repayment",
  "result.principal": "Loan amount",
  "result.cost": "Total loan cost",
  "result.charges": "Total charges",
  "disclaimer.main": "Calculations are estimates for informational purposes only. Actual EMI, interest, fees, taxes, prepayment charges, foreclosure charges and repayment amounts may vary based on the lender, loan agreement, applicable rules, rounding and other terms. Verify the final figures with your lender.",
  "disclaimer.tax": "Tax treatment may vary based on applicable Indian tax laws, financial year, taxpayer circumstances and the applicable tax regime. This calculator does not provide tax advice.",
  "disclaimer.reverse": "This is a mathematical estimate and is not an indication of loan eligibility.",
  "disclaimer.foreclosure": "Actual foreclosure amounts depend on the lender's loan agreement and applicable charges.",
} as const;

export type StringKey = keyof typeof en;

// Future translations: fill these dictionaries gradually. Missing keys fall back to English.
const dict: Record<Lang, Partial<Record<StringKey, string>>> = {
  en,
  hi: {}, mr: {}, kn: {}, ta: {}, te: {}, bn: {}, gu: {}, ml: {},
};

export const translate = (lang: Lang, key: StringKey): string =>
  dict[lang]?.[key] ?? en[key] ?? String(key);
