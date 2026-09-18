// ─── The friendly Indian amount field: numeric input + slider + presets ─────
import { Field, NumInput, Slider, ChipRow, QUICK_AMOUNTS } from "./ui";
import { compactIN } from "../lib/format";

export default function AmountField({
  label, value, onChange, min, max, step, hint, error, showPresets = true, hintOverride,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
  error?: string | null;
  showPresets?: boolean;
  hintOverride?: React.ReactNode;
}) {
  return (
    <Field
      label={label}
      hint={hintOverride ?? (value > 0 ? <span><span className="font-semibold text-brand-700">{compactIN(value)}</span>{hint ? ` — ${hint}` : ""}</span> : hint)}
      error={error}
    >
      <NumInput value={value} onChange={onChange} words min={0} />
      <div className="mt-3">
        <Slider value={value} onChange={onChange} min={min} max={max} step={step} />
        <div className="mt-1 flex justify-between text-[11px] font-medium text-ink-300">
          <span>{compactIN(min)}</span>
          <span>{compactIN(max)}</span>
        </div>
      </div>
      {showPresets && (
        <ChipRow
          className="mt-2.5"
          items={QUICK_AMOUNTS}
          active={value}
          onPick={onChange}
        />
      )}
    </Field>
  );
}
