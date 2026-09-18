// ─── Session scenarios: temporary, optional, stored on this device only ─────
import { useEffect, useState } from "react";
import { Save, Trash2, RotateCcw } from "lucide-react";
import { Note } from "./ui";
import { fmtINR } from "../lib/format";
import type { LoanInputs } from "../lib/state";
import type { Derived } from "../lib/state";
import { loanById } from "../lib/loans";

const KEY = "ilc.scenarios.v1";

export interface Scenario {
  id: string;
  name: string;
  savedAt: number;
  inp: LoanInputs;
  emi: number;
  interest: number;
  repayment: number;
}

function load(): Scenario[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function Scenarios({
  inp, d, onRestore,
}: { inp: LoanInputs; d: Derived; onRestore: (i: LoanInputs) => void }) {
  const [list, setList] = useState<Scenario[]>(() => load());

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(list));
    } catch { /* storage may be unavailable — feature stays optional */ }
  }, [list]);

  const save = () => {
    const s: Scenario = {
      id: `s-${Date.now()}`,
      name: `Scenario ${list.length + 1}`,
      savedAt: Date.now(),
      inp,
      emi: d.result.emiFirst,
      interest: d.result.totalInterest,
      repayment: d.totalRepayment,
    };
    setList((l) => [...l, s]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-700">
          {list.length ? `${list.length} saved snapshot${list.length > 1 ? "s" : ""}` : "Save the current calculator state as a temporary snapshot."}
        </p>
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-800 active:scale-95"
        >
          <Save className="size-4" /> Save as “Scenario {list.length + 1}”
        </button>
      </div>
      {list.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div key={s.id} className="rounded-xl border border-line bg-sand-50 p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[13.5px] font-semibold text-ink-900">{s.name}</p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onRestore(s.inp)}
                    title="Restore"
                    className="grid size-7 place-items-center rounded-lg text-brand-700 transition hover:bg-brand-50 active:scale-90"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setList((l) => l.filter((x) => x.id !== s.id))}
                    title="Delete"
                    className="grid size-7 place-items-center rounded-lg text-ink-400 transition hover:bg-gold-50 hover:text-danger active:scale-90"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[12px] text-ink-500">
                {loanById(s.inp.loanId).name} · EMI <span className="num font-semibold text-ink-800">{fmtINR(s.emi)}</span>
              </p>
              <p className="text-[11.5px] text-ink-400">Interest {fmtINR(s.interest)} · Saved {new Date(s.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          ))}
        </div>
      )}
      <Note>
        Snapshots stay in this browser tab's session storage and disappear when you close it. Nothing is sent anywhere and no account is needed. Please avoid typing personal data (names, account numbers) anywhere — the calculator never needs it.
      </Note>
    </div>
  );
}
