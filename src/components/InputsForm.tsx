// ─── Loan details form: dynamic per loan type ────────────────────────────────
import { useState } from "react";
import { Receipt, Sparkles, CalendarDays, Wallet } from "lucide-react";
import AmountField from "./AmountField";
import { Field, NumInput, PctInput, Slider, Segmented, ChipRow, QUICK_RATES, QUICK_TENURES, Accordion, Note, Card } from "./ui";
import { METHOD_LABEL, METHOD_NOTE } from "../lib/loans";
import type { LoanInputs, Derived } from "../lib/state";
import { FREQ_LABEL } from "../lib/state";
import type { Freq, Method, MoratoriumMode } from "../lib/engine";
import { compactIN, fmtINR, clamp, SAFE } from "../lib/format";
import { cn } from "../utils/cn";

const DOWN_PCTS = [0, 10, 20, 25, 30, 40];
const GST_PCTS = [
  { label: "No GST", value: 0 },
  { label: "5%", value: 5 },
  { label: "18%", value: 18 },
  { label: "28%", value: 28 },
];

export default function InputsForm({
  inp, d, patch,
}: { inp: LoanInputs; d: Derived; patch: (p: Partial<LoanInputs>) => void }) {
  const cfg = d.cfg;
  const [unit, setUnit] = useState<"months" | "years">(inp.tenureMonths % 12 === 0 ? "years" : "months");
  const errors = d.errors;

  const tenureInUnit = unit === "years" ? Math.round((inp.tenureMonths / 12) * 10) / 10 : inp.tenureMonths;
  const setTenure = (v: number) =>
    patch({ tenureMonths: Math.max(1, Math.round(unit === "years" ? v * 12 : v)) });

  const downPct = inp.price > 0 ? (d.downAmt / inp.price) * 100 : 0;

  return (
    <div className="space-y-3">
      <Card className="p-4 sm:p-5">
        <div className="space-y-5">
          {/* ── Asset price + down payment ── */}
          {cfg.hasPrice && (
            <>
              <AmountField
                label={cfg.priceLabel ?? "Price"}
                value={inp.price}
                onChange={(n) => {
                  const dp = inp.downMode === "pct" ? (n * inp.downPct) / 100 : inp.downAmt;
                  patch({ price: n, downAmt: Math.min(dp, n) });
                }}
                min={cfg.slider.min}
                max={cfg.slider.max}
                step={cfg.slider.step}
                error={errors.price}
                showPresets={false}
              />
              <Field
                label="Down payment"
                error={errors.down}
                hint={inp.price > 0 ? <span><span className="font-semibold text-brand-700">{downPct.toFixed(0)}%</span> of {cfg.priceLabel?.toLowerCase() ?? "price"} · <span className="font-semibold text-brand-700">{compactIN(d.downAmt)}</span></span> : undefined}
              >
                <NumInput value={d.downAmt} onChange={(n) => patch({ downAmt: clamp(n, 0, inp.price), downMode: "amt", downPct: inp.price > 0 ? (n / inp.price) * 100 : 0 })} />
                <div className="mt-3">
                  <Slider
                    value={downPct}
                    onChange={(p) => patch({ downPct: p, downMode: "pct", downAmt: Math.round((inp.price * p) / 100) })}
                    min={0} max={90} step={1} accent="gold"
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-300">
                    <span>0%</span><span>90%</span>
                  </div>
                </div>
                <ChipRow className="mt-2.5" items={DOWN_PCTS.map((p) => ({ label: `${p}%`, value: p }))} active={Math.round(downPct)} onPick={(p) => patch({ downPct: p, downMode: "pct", downAmt: Math.round((inp.price * p) / 100) })} />
              </Field>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-900 px-4 py-3.5 text-sand-50">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-sand-300">{cfg.amountLabel}</p>
                  <p className="mt-0.5 font-display text-xl font-semibold num">{fmtINR(d.principalFinanced)}</p>
                  <p className="mt-0.5 text-[11.5px] text-sand-300">{fmtINR(inp.price)} price − {fmtINR(d.downAmt)} down payment</p>
                </div>
                {d.ltv != null && (
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-sand-300">LTV</p>
                    <p className="mt-0.5 font-display text-xl font-semibold text-gold-300 num">{d.ltv.toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Education specifics ── */}
          {cfg.isEducation && (
            <div className="grid gap-5 sm:grid-cols-2">
              <AmountField label="Course fee" value={inp.courseFee} onChange={(n) => patch({ courseFee: n })} min={0} max={cfg.slider.max} step={cfg.slider.step} showPresets={false} />
              <AmountField label="Other education expenses" value={inp.otherExpenses} onChange={(n) => patch({ otherExpenses: n })} min={0} max={cfg.slider.max} step={cfg.slider.step} showPresets={false} hint="Hostel, travel, books, laptop…" />
            </div>
          )}

          {/* ── Loan amount ── */}
          {!cfg.hasPrice && (
            <AmountField
              label={cfg.isLAP ? "Requested loan amount" : cfg.amountLabel}
              value={inp.amount}
              onChange={(n) => patch({ amount: n })}
              min={cfg.slider.min}
              max={cfg.slider.max}
              step={cfg.slider.step}
              error={errors.amount}
              hintOverride={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-brand-700">{compactIN(inp.amount)}</span>
                  {cfg.isEducation && (
                    <button
                      type="button"
                      onClick={() => patch({ amount: SAFE(inp.courseFee + inp.otherExpenses) })}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-95"
                    >
                      <Sparkles className="size-3" /> Use fee + expenses ({compactIN(inp.courseFee + inp.otherExpenses)})
                    </button>
                  )}
                </span>
              }
            />
          )}

          {/* ── Gold specifics ── */}
          {cfg.isGold && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <AmountField
                  label="Value of your gold (enter manually)"
                  value={inp.goldValue}
                  onChange={(n) => patch({ goldValue: n })}
                  min={10_000} max={20_000_000} step={5_000} showPresets={false}
                  hint="We do not fetch live gold prices — enter today's assessed value."
                />
                <div className="mobile-stack grid grid-cols-2 gap-3">
                  <Field label="Weight">
                    <NumInput value={inp.goldWeight} onChange={(n) => patch({ goldWeight: n })} prefix=" " suffix="grams" />
                  </Field>
                  <Field label="Purity">
                    <div className="mt-1">
                      <Segmented
                        size="sm"
                        options={[24, 22, 21, 18].map((k) => ({ value: k as 24 | 22 | 21 | 18, label: `${k}K` }))}
                        value={inp.goldPurity as 24 | 22 | 21 | 18}
                        onChange={(v) => patch({ goldPurity: v })}
                      />
                    </div>
                  </Field>
                </div>
              </div>
              {d.ltv != null && (
                <Note>Loan-to-Value: <strong>{d.ltv.toFixed(1)}%</strong> of your gold value. Indian primary-lender LTV caps are set by regulation and can change — this is only an informational ratio.</Note>
              )}
            </>
          )}

          {/* ── Loan against property specifics ── */}
          {cfg.isLAP && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <AmountField label="Property value" value={inp.lapValue} onChange={(n) => patch({ lapValue: n })} min={cfg.slider.min} max={cfg.slider.max} step={cfg.slider.step} showPresets={false} />
                <AmountField label="Existing loan on this property" value={inp.lapExisting} onChange={(n) => patch({ lapExisting: n })} min={0} max={cfg.slider.max} step={cfg.slider.step} showPresets={false} />
              </div>
              {d.ltv != null && (
                <Note>Total LTV including existing loan: <strong>{d.ltv.toFixed(1)}%</strong> ({fmtINR(d.principal + Math.max(0, inp.lapExisting))} ÷ {fmtINR(inp.lapValue)}).</Note>
              )}
            </>
          )}

          {/* ── Interest rate ── */}
          <Field
            label="Annual interest rate"
            error={errors.rate}
            trailing={cfg.allowRateType ? (
              <Segmented
                size="sm"
                options={[{ value: "fixed", label: "Fixed" }, { value: "floating", label: "Floating" }]}
                value={inp.rateType}
                onChange={(v: "fixed" | "floating") => patch({ rateType: v })}
              />
            ) : undefined}
          >
            <div className="relative">
              <PctInput value={inp.rate} onChange={(n) => patch({ rate: n })} invalid={!!errors.rate} />
              <span className="pointer-events-none absolute -top-2 right-3 rounded-md bg-brand-700 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
                {inp.rate === 0 ? "0% · No-cost EMI" : `${inp.rate.toFixed(2)}%`}
              </span>
            </div>
            <div className="mt-3">
              <Slider value={inp.rate} onChange={(n) => patch({ rate: n })} min={0} max={24} step={0.05} />
              <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-300"><span>0%</span><span>24%</span></div>
            </div>
            <ChipRow className="mt-2.5" items={QUICK_RATES.map((r) => ({ label: `${r}%`, value: r }))} active={inp.rate} onPick={(r) => patch({ rate: r })} />
          </Field>

          {/* ── Tenure ── */}
          <Field
            label="Loan tenure"
            error={errors.tenure}
            trailing={
              <Segmented
                size="sm"
                options={[{ value: "months", label: "Months" }, { value: "years", label: "Years" }]}
                value={unit}
                onChange={(v) => setUnit(v)}
              />
            }
          >
            <NumInput
              value={tenureInUnit}
              onChange={setTenure}
              prefix=""
              suffix={unit}
              invalid={!!errors.tenure}
              inputMode="numeric"
            />
            <div className="mt-3">
              <Slider value={inp.tenureMonths} onChange={(n) => patch({ tenureMonths: n })} min={6} max={360} step={6} />
              <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-300"><span>6 months</span><span>30 years</span></div>
            </div>
            <ChipRow
              className="mt-2.5"
              items={QUICK_TENURES.map((t) => ({ label: t.label, value: t.months }))}
              active={inp.tenureMonths}
              onPick={(m) => patch({ tenureMonths: m })}
            />
          </Field>

          {/* ── Frequency / method / start date ── */}
          <div className="grid gap-5 sm:grid-cols-2">
            {cfg.allowFrequency && (
              <Field label="Instalment frequency">
                <Segmented
                  options={([12, 4, 2, 1] as Freq[]).map((f) => ({ value: f, label: FREQ_LABEL[f] }))}
                  value={inp.ppy}
                  onChange={(v: Freq) => patch({ ppy: v })}
                />
              </Field>
            )}
            <Field label="First disbursement month" hint="EMI dates in the schedule start from the end of this month.">
              <div className="flex h-12 items-center rounded-xl border border-line bg-white px-3 transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15">
                <CalendarDays className="mr-2 size-4 text-ink-300" />
                <input
                  type="month"
                  value={inp.startMonth}
                  onChange={(e) => patch({ startMonth: e.target.value })}
                  className="num h-full w-full bg-transparent text-[15px] font-semibold text-ink-900 outline-none"
                />
              </div>
            </Field>
          </div>

          {cfg.methods.length > 1 && (
            <Field label="Interest calculation method">
              <Segmented
                options={cfg.methods.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
                value={inp.method}
                onChange={(v: Method) => patch({ method: v })}
              />
              <div className="mt-2.5"><Note>{METHOD_NOTE[inp.method]}</Note></div>
            </Field>
          )}

          {cfg.hasGrace && (
            <Field label="Grace period (before repayments start)" hint="Simple interest accrues during the grace period and is added to the principal when repayments begin.">
              <NumInput value={inp.graceMonths} onChange={(n) => patch({ graceMonths: clamp(n, 0, 12) })} prefix="" suffix="months" inputMode="numeric" />
            </Field>
          )}

          {/* ── Education: study + moratorium ── */}
          {cfg.isEducation && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Study period" hint="Course duration.">
                  <NumInput value={inp.studyMonths} onChange={(n) => patch({ studyMonths: clamp(n, 0, 120) })} prefix="" suffix="months" inputMode="numeric" />
                </Field>
                <Field label="Moratorium after course" hint="Usual buffer: 6–12 months.">
                  <NumInput value={inp.moraMonths} onChange={(n) => patch({ moraMonths: clamp(n, 0, 60) })} prefix="" suffix="months" inputMode="numeric" />
                </Field>
              </div>
              <Field label="Interest during study + moratorium (simple interest)">
                <Segmented
                  options={[
                    { value: "capitalize", label: "Add to principal" },
                    { value: "pay", label: "Pay during moratorium" },
                    { value: "separate", label: "Show separately" },
                  ]}
                  value={inp.moraMode}
                  onChange={(v: MoratoriumMode) => patch({ moraMode: v })}
                />
              </Field>
            </>
          )}
        </div>
      </Card>

      {/* ── Fees & GST ── */}
      <Accordion
        title="Fees, processing charges & GST"
        desc={`Processing fee, GST, documentation, insurance…${d.fees.total > 0 ? ` · ${fmtINR(d.fees.total)} total` : ""}`}
        icon={<Receipt className="size-4.5" />}
      >
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Processing fee"
              trailing={
                <Segmented
                  size="sm"
                  options={[{ value: "percent", label: "% of loan" }, { value: "fixed", label: "Fixed ₹" }]}
                  value={inp.pfType}
                  onChange={(v: "percent" | "fixed") => patch({ pfType: v })}
                />
              }
            >
              {inp.pfType === "percent" ? (
                <PctInput value={inp.pfValue} onChange={(n) => patch({ pfValue: clamp(n, 0, 10) })} max={10} />
              ) : (
                <NumInput value={inp.pfValue} onChange={(n) => patch({ pfValue: n })} />
              )}
              <p className="mt-1.5 text-[12px] text-ink-400">= <span className="font-semibold text-ink-700 num">{fmtINR(d.fees.processingFee)}</span></p>
            </Field>
            <Field label="GST on processing fee" hint="GST varies by lender and fee type — edit as per your loan offer.">
              <PctInput value={inp.gstPct} onChange={(n) => patch({ gstPct: clamp(n, 0, 40) })} max={40} />
              <ChipRow className="mt-2.5" items={GST_PCTS} active={inp.gstPct} onPick={(v) => patch({ gstPct: v })} />
              <p className="mt-1.5 text-[12px] text-ink-400">GST = <span className="font-semibold text-ink-700 num">{fmtINR(d.fees.gst)}</span></p>
            </Field>
            <Field label="Documentation charges"><NumInput value={inp.docCharges} onChange={(n) => patch({ docCharges: n })} /></Field>
            <Field label="Legal charges"><NumInput value={inp.legalCharges} onChange={(n) => patch({ legalCharges: n })} /></Field>
            <Field
              label="Insurance premium"
              trailing={cfg.allowInsuranceFinanced ? (
                <button
                  type="button"
                  onClick={() => patch({ insuranceFinanced: !inp.insuranceFinanced })}
                  className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold transition active:scale-95", inp.insuranceFinanced ? "bg-brand-700 text-white" : "bg-sand-100 text-ink-500")}
                >
                  {inp.insuranceFinanced ? "Financed with loan ✓" : "Add to loan amount"}
                </button>
              ) : undefined}
            >
              <NumInput value={inp.insurance} onChange={(n) => patch({ insurance: n })} />
            </Field>
            <Field label="Any other charges"><NumInput value={inp.otherCharges} onChange={(n) => patch({ otherCharges: n })} /></Field>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-sand-100 px-4 py-3">
            <span className="text-[13px] font-medium text-ink-600">Total fees & charges</span>
            <span className="num font-display text-lg font-semibold text-ink-900">{fmtINR(d.fees.total)}</span>
          </div>
        </div>
      </Accordion>

      {/* ── Prepayment ── */}
      <Accordion
        title="Prepayment / part-payment"
        desc={inp.preOn ? `${compactIN(inp.pAmount)} · ${inp.pFreq} · from payment #${inp.pStart}` : "Plan a one-time or recurring part-payment and see its effect."}
        icon={<Wallet className="size-4.5" />}
        badge={
          <button
            type="button"
            role="switch"
            aria-checked={inp.preOn}
            onClick={(e) => { e.stopPropagation(); patch({ preOn: !inp.preOn }); }}
            className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", inp.preOn ? "bg-brand-700" : "bg-line")}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", inp.preOn ? "left-[22px]" : "left-0.5")} />
          </button>
        }
      >
        {inp.preOn ? (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <AmountField label="Prepayment amount" value={inp.pAmount} onChange={(n) => patch({ pAmount: n })} min={1_000} max={Math.max(100_000, d.principal)} step={1_000} showPresets={false} />
              <Field label={`Start from payment no.`} hint={`1 – ${d.periods}`}>
                <NumInput value={inp.pStart} onChange={(n) => patch({ pStart: clamp(Math.round(n), 1, d.periods) })} prefix="" suffix={FREQ_LABEL[inp.ppy]} inputMode="numeric" />
              </Field>
              <Field label="How often">
                <Segmented
                  options={[{ value: "once", label: "One-time" }, { value: "yearly", label: "Every year" }, { value: "monthly", label: "Every period" }]}
                  value={inp.pFreq}
                  onChange={(v: typeof inp.pFreq) => patch({ pFreq: v })}
                />
              </Field>
              <Field label="After prepayment">
                <Segmented
                  options={[{ value: "reduce_tenure", label: "Reduce tenure" }, { value: "reduce_emi", label: "Reduce EMI" }]}
                  value={inp.pMode}
                  onChange={(v: typeof inp.pMode) => patch({ pMode: v })}
                />
              </Field>
            </div>
            {d.result.prepayImpact && (
              <Note>
                <span className="font-semibold">Projected effect:</span> interest changes by{" "}
                <strong className="text-brand-700">−{compactIN(d.result.prepayImpact.interestSaved)}</strong>
                {inp.pMode === "reduce_tenure" ? `, loan closes ${d.result.prepayImpact.periodsReduced} payment${d.result.prepayImpact.periodsReduced === 1 ? "" : "s"} earlier` : `, scheduled instalment drops to ${fmtINR(d.result.prepayImpact.emiAfter)}`}
                . Compare both options in detail below in Tools → Prepayment.
              </Note>
            )}
          </div>
        ) : (
          <p className="text-[13.5px] text-ink-500">Use the switch above to model part-prepayments. You can compare “reduce EMI” vs “reduce tenure” numerically in the Tools section.</p>
        )}
      </Accordion>
    </div>
  );
}
