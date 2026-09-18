// ─── Indian loan product catalogue ───────────────────────────────────────────
// Data-driven: each loan type declares defaults + which field groups it uses.
// Adding a new product = adding one entry here (engine stays untouched).

import {
  Home, User, Car, Bike, GraduationCap, Coins, Briefcase, Building2,
  Package, Stethoscope, HeartHandshake, HardHat, Map, TrendingUp, Settings2,
  type LucideIcon,
} from "lucide-react";
import type { Method } from "./engine";

export type LoanId =
  | "home" | "personal" | "car" | "twowheeler" | "education" | "gold"
  | "business" | "lap" | "consumer" | "medical" | "wedding" | "construction"
  | "plot" | "securities" | "custom";

export interface LoanCfg {
  id: LoanId;
  name: string;
  blurb: string;
  icon: LucideIcon;
  amountLabel: string; // label for the main principal field
  amountHint?: string;
  defaults: { amount: number; rate: number; tenureMonths: number; pfPct: number };
  slider: { min: number; max: number; step: number };
  methods: Method[];
  allowFrequency: boolean; // quarterly / half-yearly / yearly choice
  allowRateType: boolean; // fixed vs floating selector
  hasPrice: boolean; // asset price + down payment drive the loan amount
  priceLabel?: string;
  isEducation?: boolean;
  isGold?: boolean;
  isLAP?: boolean;
  allowInsuranceFinanced?: boolean;
  hasGrace?: boolean;
  highlight?: boolean; // shown in the hero picker row
}

export const LOANS: LoanCfg[] = [
  { id: "home", name: "Home Loan", blurb: "Buy or own a house", icon: Home, amountLabel: "Loan amount",
    defaults: { amount: 4_500_000, rate: 8.5, tenureMonths: 240, pfPct: 0.5 },
    slider: { min: 100_000, max: 50_000_000, step: 10_000 }, methods: ["reducing"],
    allowFrequency: false, allowRateType: true, hasPrice: true, priceLabel: "Property price", highlight: true },
  { id: "personal", name: "Personal Loan", blurb: "Unsecured, any purpose", icon: User, amountLabel: "Loan amount",
    defaults: { amount: 500_000, rate: 11.5, tenureMonths: 36, pfPct: 2 },
    slider: { min: 25_000, max: 4_000_000, step: 5_000 }, methods: ["reducing", "flat"],
    allowFrequency: false, allowRateType: true, hasPrice: false, highlight: true },
  { id: "car", name: "Car Loan", blurb: "New or used cars", icon: Car, amountLabel: "Financed amount",
    defaults: { amount: 900_000, rate: 9, tenureMonths: 60, pfPct: 0.5 },
    slider: { min: 100_000, max: 5_000_000, step: 10_000 }, methods: ["reducing", "flat"],
    allowFrequency: false, allowRateType: false, hasPrice: true, priceLabel: "On-road price",
    allowInsuranceFinanced: true, highlight: true },
  { id: "twowheeler", name: "Two-Wheeler", blurb: "Bikes & scooters", icon: Bike, amountLabel: "Financed amount",
    defaults: { amount: 100_000, rate: 10.99, tenureMonths: 36, pfPct: 1.5 },
    slider: { min: 20_000, max: 500_000, step: 2_500 }, methods: ["reducing", "flat"],
    allowFrequency: false, allowRateType: false, hasPrice: true, priceLabel: "Vehicle price", highlight: true },
  { id: "education", name: "Education Loan", blurb: "Study in India or abroad", icon: GraduationCap, amountLabel: "Loan amount",
    defaults: { amount: 1_500_000, rate: 10.5, tenureMonths: 96, pfPct: 1 },
    slider: { min: 100_000, max: 7_500_000, step: 10_000 }, methods: ["reducing"],
    allowFrequency: false, allowRateType: true, hasPrice: false, isEducation: true, highlight: true },
  { id: "gold", name: "Gold Loan", blurb: "Against gold jewellery", icon: Coins, amountLabel: "Loan amount",
    defaults: { amount: 200_000, rate: 9.5, tenureMonths: 12, pfPct: 0.5 },
    slider: { min: 10_000, max: 5_000_000, step: 5_000 }, methods: ["reducing", "interest_only", "flat"],
    allowFrequency: false, allowRateType: false, hasPrice: false, isGold: true, highlight: true },
  { id: "business", name: "Business Loan", blurb: "Working capital & growth", icon: Briefcase, amountLabel: "Loan amount",
    defaults: { amount: 1_500_000, rate: 13, tenureMonths: 60, pfPct: 2 },
    slider: { min: 100_000, max: 10_000_000, step: 10_000 }, methods: ["reducing", "flat"],
    allowFrequency: true, allowRateType: true, hasPrice: false, hasGrace: true },
  { id: "lap", name: "Loan Against Property", blurb: "Mortgage an existing property", icon: Building2, amountLabel: "Requested loan",
    defaults: { amount: 2_500_000, rate: 9.75, tenureMonths: 120, pfPct: 1 },
    slider: { min: 200_000, max: 50_000_000, step: 10_000 }, methods: ["reducing"],
    allowFrequency: false, allowRateType: true, hasPrice: false, isLAP: true },
  { id: "consumer", name: "Consumer Durable", blurb: "Phones, TVs, appliances", icon: Package, amountLabel: "Financed amount",
    defaults: { amount: 50_000, rate: 0, tenureMonths: 12, pfPct: 0 },
    slider: { min: 5_000, max: 500_000, step: 1_000 }, methods: ["reducing", "flat"],
    allowFrequency: false, allowRateType: false, hasPrice: true, priceLabel: "Product price", highlight: true },
  { id: "medical", name: "Medical Loan", blurb: "Treatment & emergencies", icon: Stethoscope, amountLabel: "Loan amount",
    defaults: { amount: 300_000, rate: 12, tenureMonths: 24, pfPct: 2 },
    slider: { min: 25_000, max: 2_500_000, step: 5_000 }, methods: ["reducing", "flat"],
    allowFrequency: false, allowRateType: false, hasPrice: false },
  { id: "wedding", name: "Wedding Loan", blurb: "Ceremonies & events", icon: HeartHandshake, amountLabel: "Loan amount",
    defaults: { amount: 600_000, rate: 11, tenureMonths: 36, pfPct: 2 },
    slider: { min: 50_000, max: 3_000_000, step: 5_000 }, methods: ["reducing", "flat"],
    allowFrequency: false, allowRateType: false, hasPrice: false },
  { id: "construction", name: "Construction Loan", blurb: "Build on your plot", icon: HardHat, amountLabel: "Loan amount",
    defaults: { amount: 3_000_000, rate: 9, tenureMonths: 180, pfPct: 0.5 },
    slider: { min: 200_000, max: 20_000_000, step: 10_000 }, methods: ["reducing"],
    allowFrequency: false, allowRateType: true, hasPrice: true, priceLabel: "Estimated construction cost" },
  { id: "plot", name: "Plot / Land Loan", blurb: "Buy residential land", icon: Map, amountLabel: "Loan amount",
    defaults: { amount: 2_000_000, rate: 9.4, tenureMonths: 120, pfPct: 0.5 },
    slider: { min: 200_000, max: 20_000_000, step: 10_000 }, methods: ["reducing"],
    allowFrequency: false, allowRateType: true, hasPrice: true, priceLabel: "Land price" },
  { id: "securities", name: "Loan Against Securities", blurb: "Shares, funds, bonds", icon: TrendingUp, amountLabel: "Loan amount",
    defaults: { amount: 500_000, rate: 10.5, tenureMonths: 24, pfPct: 0.5 },
    slider: { min: 50_000, max: 20_000_000, step: 5_000 }, methods: ["reducing", "interest_only"],
    allowFrequency: false, allowRateType: true, hasPrice: false },
  { id: "custom", name: "Custom Loan", blurb: "Build your own scenario", icon: Settings2, amountLabel: "Loan amount",
    defaults: { amount: 1_000_000, rate: 8.5, tenureMonths: 60, pfPct: 1 },
    slider: { min: 10_000, max: 50_000_000, step: 5_000 }, methods: ["reducing", "flat", "interest_only"],
    allowFrequency: true, allowRateType: true, hasPrice: false, hasGrace: true, highlight: true },
];

export const HERO_LOANS = LOANS.filter((l) => l.highlight);

export const loanById = (id: LoanId): LoanCfg =>
  LOANS.find((l) => l.id === id) ?? LOANS[14];

export const METHOD_LABEL: Record<Method, string> = {
  reducing: "Reducing balance",
  flat: "Flat interest",
  interest_only: "Interest-only (bullet)",
};

export const METHOD_NOTE: Record<Method, string> = {
  reducing: "Interest is charged only on the outstanding principal each period — the most common method for Indian bank loans.",
  flat: "Interest is charged on the full original principal for the entire tenure: Interest = Principal × Rate × Years. A flat rate is NOT directly equivalent to a reducing-balance rate.",
  interest_only: "Only interest is paid each period and the full principal is returned at the end — common for short-tenure gold / securities loans.",
};
