// ─── Indian Loan Calculator — app shell ──────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Globe, Printer, IndianRupee, Sparkles, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Chakra, Toran, Squiggle, AnimalParade, Rangoli, Elephant, Peacock } from "./components/Ornaments";

import LoanTypePicker from "./components/LoanTypePicker";
import InputsForm from "./components/InputsForm";
import Dashboard, { EmptyState, MiniSummaryBar } from "./components/Dashboard";
import Charts from "./components/Charts";
import Schedule from "./components/Schedule";
import Tools from "./components/Tools";
import Comparison from "./components/Comparison";
import Scenarios from "./components/Scenarios";
import ExportBar from "./components/ExportBar";
import Landing from "./components/Landing";
import { PWAMounts, UpdateToast, OfflineToast, IOSInstallSheet } from "./components/PWA";
import { useInstallState } from "./lib/pwa";
import { SectionTitle, Card, Reveal } from "./components/ui";

import { defaultInputs, useLoanResult, type LoanInputs, type Derived } from "./lib/state";
import { loanById, type LoanId } from "./lib/loans";
import { LANGUAGES, translate, type Lang } from "./lib/i18n";
import { fmtINR, SAFE } from "./lib/format";
import { smoothScrollById } from "./lib/scroll";

const NAV = [
  { id: "loan", label: "Loan type" },
  { id: "details", label: "Details" },
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "tools", label: "Tools" },
  { id: "compare", label: "Compare" },
  { id: "export", label: "Export" },
];

function NavArrow({ dir, show, onClick }: { dir: "left" | "right"; show: boolean; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!show}
      aria-label={dir === "left" ? "Scroll sections left" : "Scroll sections right"}
      className={`grid size-7 shrink-0 place-items-center rounded-full border bg-white transition-all duration-200 active:scale-90 ${
        show ? "border-line text-ink-600 opacity-100 shadow-sm hover:border-brand-600/50 hover:text-brand-700" : "cursor-default border-line/40 text-ink-300 opacity-25"
      }`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export default function App() {
  const [inp, setInp] = useState<LoanInputs>(defaultInputs);
  const [lang, setLang] = useState<Lang>("en");
  const [miniVisible, setMiniVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [viewportObscured, setViewportObscured] = useState(false);
  const [flash, setFlash] = useState(0);
  const [manualIOSOpen, setManualIOSOpen] = useState(false);
  const install = useInstallState();

  const enterApp = useCallback(() => {
    setEntered(true);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
  const navRef = useRef<HTMLDivElement>(null);
  const [navEdge, setNavEdge] = useState({ left: false, right: true });

  const measureNav = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setNavEdge({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  const nudgeNav = (dir: -1 | 1) => {
    const el = navRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  useEffect(() => {
    measureNav();
    const el = navRef.current;
    const ro = typeof ResizeObserver !== "undefined" && el
      ? new ResizeObserver(measureNav)
      : null;
    if (el) ro?.observe(el);
    window.addEventListener("resize", measureNav);
    document.fonts?.ready.then(measureNav).catch(() => undefined);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measureNav);
    };
  }, [measureNav]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const zoomed = viewport.scale > 1.04;
      const keyboardLike = viewport.height < window.innerHeight * 0.7;
      setViewportObscured(zoomed || keyboardLike);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);
  const d = useLoanResult(inp);
  const t = useCallback((k: Parameters<typeof translate>[1]) => translate(lang, k), [lang]);

  const patch = useCallback((p: Partial<LoanInputs>) => setInp((s) => ({ ...s, ...p })), []);

  // Ease down to the details after picking a loan type (with a soft highlight pulse)
  const pickLoan = (id: LoanId) => {
    if (id === inp.loanId) return;
    const cfg = loanById(id);
    setInp((s) => {
      const price = Math.round(cfg.defaults.amount * 1.25);
      const down = cfg.hasPrice ? price - cfg.defaults.amount : 0;
      return {
        ...s,
        loanId: id,
        method: cfg.methods.includes(s.method) ? s.method : cfg.methods[0],
        rateType: cfg.allowRateType ? s.rateType : "fixed",
        rate: cfg.defaults.rate,
        tenureMonths: cfg.defaults.tenureMonths,
        ppy: cfg.allowFrequency ? s.ppy : 12,
        amount: cfg.defaults.amount,
        pfValue: cfg.defaults.pfPct,
        pfType: "percent",
        price,
        downAmt: down,
        downPct: price > 0 ? (down / price) * 100 : 0,
      };
    });
    // Let the per-loan fields swap in, then glide down
    window.setTimeout(() => {
      smoothScrollById("details", { offset: 96, duration: 720 });
      setFlash((f) => f + 1);
    }, 90);
  };

  // Sticky mobile mini-summary visibility
  useEffect(() => {
    const el = document.getElementById("overview-hero");
    if (!el) return;
    // Show only after the result has been passed, not while editing inputs above it.
    const io = new IntersectionObserver(
      ([e]) => setMiniVisible(!e.isIntersecting && e.boundingClientRect.top < 80),
      { rootMargin: "-80px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const valid = d.principal > 0 && Object.keys(d.errors).length === 0;

  return (
    <>
    <div
      className="min-h-dvh bg-sand-100 font-sans text-ink-900 antialiased"
      aria-hidden={!entered}
      inert={!entered}
    >
      {/* ── Sticky header + section nav ── */}
      <div className="tricolor-bar pwa-safe-top h-[3px] sticky top-0 z-[60] w-full no-print" />
      <header className="sticky top-[3px] z-50 border-b border-line/80 bg-sand-100/85 backdrop-blur-md no-print"
        style={{ top: "calc(3px + env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex h-13 min-w-0 max-w-5xl items-center justify-between gap-2 px-3.5 sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex min-w-0 items-center gap-2 sm:gap-2.5"
          >
            <span className="brand-mark grid size-8.5 place-items-center rounded-xl text-white shadow-md shadow-brand-700/25">
              <IndianRupee className="size-4.5" strokeWidth={2.5} />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="truncate font-display text-[17px] font-bold tracking-tight sm:text-[18px]">
                Loan<span className="text-brand-700">Hisab</span>
              </span>
              <span lang="hi" className="font-dv hidden text-[12px] font-semibold text-gold-600 sm:inline">लोन हिसाब</span>
            </span>
          </button>
          <div className="flex items-center gap-1.5">
            {/* ── Install App pill: appears only when a real install path exists ── */}
            {!install.standalone && install.androidPrompt && (
              <button
                type="button"
                onClick={async () => {
                  await install.androidPrompt?.prompt();
                  await install.androidPrompt?.userChoice.catch(() => undefined);
                }}
                aria-label="Install LoanHisab app"
                className="flex h-9 items-center gap-1.5 rounded-full bg-brand-700 px-3 text-[12.5px] font-bold text-white shadow-sm transition hover:bg-brand-800 active:scale-95"
              >
                <Download className="size-3.5" strokeWidth={2.5} />
                <span className="hidden min-[420px]:inline">Install App</span>
                <span className="min-[420px]:hidden">Install</span>
              </button>
            )}
            {!install.standalone && !install.androidPrompt && install.iOS && install.mobile && (
              <button
                type="button"
                onClick={() => setManualIOSOpen(true)}
                aria-label="How to install LoanHisab on iPhone"
                className="flex h-9 items-center gap-1.5 rounded-full bg-brand-700 px-3 text-[12.5px] font-bold text-white shadow-sm transition hover:bg-brand-800 active:scale-95"
              >
                <Download className="size-3.5" strokeWidth={2.5} />
                <span className="hidden min-[420px]:inline">Install App</span>
                <span className="min-[420px]:hidden">Install</span>
              </button>
            )}
            <div className="relative max-[359px]:w-10">
              <Globe className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                aria-label="Language"
                className="h-9 w-full appearance-none rounded-full border border-line bg-white pl-8 pr-7 text-[12.5px] font-semibold text-ink-700 outline-none transition hover:border-brand-600/40 max-[359px]:text-transparent"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235B6B62' stroke-width='2.4'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center" }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id} disabled={!l.ready}>
                    {l.native}{l.ready ? "" : " (soon)"}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              title="Print / save PDF"
              className="grid size-9 place-items-center rounded-full border border-line bg-white text-ink-600 transition hover:border-brand-600/40 hover:text-brand-700 active:scale-95"
            >
              <Printer className="size-4" />
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-3.5 pb-2 sm:px-5" aria-label="Sections">
          <div className="flex items-center gap-1.5">
            <NavArrow dir="left" show={navEdge.left} onClick={() => nudgeNav(-1)} />
            <div
              ref={navRef}
              onScroll={measureNav}
              className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto scroll-smooth"
            >
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => smoothScrollById(n.id, { offset: 96 })}
                  className="shrink-0 rounded-full border border-line/70 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-all duration-200 hover:-translate-y-px hover:border-brand-600/50 hover:text-brand-700 active:scale-95"
                >
                  {n.label}
                </button>
              ))}
            </div>
            <NavArrow dir="right" show={navEdge.right} onClick={() => nudgeNav(1)} />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-3.5 pb-28 pt-5 sm:px-5 md:pb-16">
        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative mb-7 mt-3 sm:mt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -top-10 -bottom-8 -z-10"
            style={{
              background:
                "radial-gradient(560px 220px at 18% 22%, rgba(18,118,90,0.10), transparent 70%), radial-gradient(420px 200px at 78% 70%, rgba(224,163,54,0.12), transparent 70%)",
            }}
          />
          <Chakra spin className="pointer-events-none absolute -right-14 -top-8 size-52 text-chakra opacity-[0.09] sm:size-64" />
          <Rangoli className="pointer-events-none absolute -left-20 top-24 size-44 text-gold-500 opacity-[0.10] animate-spin-rev" />
          <div className="flex items-center gap-2">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-brand-600">
              <Sparkles className="size-3.5" /> For every Indian borrower
            </p>
          </div>
          <h1 className="mt-2 max-w-2xl font-display text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[46px]">
            Har loan ka,{" "}
            <span className="relative inline-block text-brand-700">
              poora hisab
              <Squiggle />
            </span>
            .
          </h1>
          <p className="mt-2.5 max-w-xl text-[14.5px] leading-relaxed text-ink-500">{t("app.subtitle")}</p>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {["15 Indian loan types", "No sign-up", "Runs on your device", "Free forever"].map((c) => (
              <span key={c} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-600">
                <ShieldCheck className="size-3.5 text-brand-600" /> {c}
              </span>
            ))}
          </div>
          <div className="relative mt-6">
            <Toran className="rounded-t-sm" />
            <AnimalParade className="mt-1 h-10" speed={75} />
          </div>
        </motion.div>

        {/* ── 1. Loan type ── */}
        <SectionTitle id="loan" eyebrow="Step 1" title={t("loan.select")} desc="Pick a product — fields, defaults and calculation methods adjust automatically." />
        <LoanTypePicker value={inp.loanId} onChange={pickLoan} />

        {/* ── 2. Loan details ── */}
        <div className="mt-10">
          <SectionTitle
            id="details"
            eyebrow="Step 2"
            title={t("loan.details")}
            desc={
              <>
                Editing <strong>{d.cfg.name.toLowerCase()}</strong> · every value is editable — sliders and chips are just quick-fill helpers.
              </>
            }
          />
          <div className="relative">
            {flash > 0 && (
              <motion.div
                key={flash}
                initial={{ opacity: 0.9, scale: 0.997 }}
                animate={{ opacity: 0, scale: 1.008 }}
                transition={{ duration: 1.15, ease: [0.32, 0.72, 0, 1] }}
                className="pointer-events-none absolute -inset-1.5 z-10 rounded-[22px] ring-[3px] ring-gold-500"
              />
            )}
            <InputsForm inp={inp} d={d} patch={patch} />
          </div>
        </div>

        {/* ── 3. Live results ── */}
        <div className="mt-10" id="overview-hero">
          <SectionTitle id="overview" eyebrow="Step 3 · updates live" title="Your loan at a glance" />
          {valid ? <Dashboard inp={inp} d={d} /> : <EmptyState errors={d.errors} />}
        </div>

        {valid && (
          <>
            <div className="mt-6"><Charts d={d} /></div>

            {/* ── 4. Schedule ── */}
            <Reveal className="mt-10">
              <SectionTitle id="schedule" eyebrow="Deep dive" title="Instalment & yearly summary" desc="Month-by-month schedule with Indian financial-year grouping (Apr–Mar) or calendar-year grouping." />
              <Schedule d={d} />
            </Reveal>

            <AnimalParade className="mt-8 h-9" speed={85} opacity="opacity-[0.16]" />

            {/* ── 5. Tools ── */}
            <Reveal className="mt-8">
              <SectionTitle id="tools" eyebrow="Explore scenarios" title="What-if & advanced tools" desc="Prepayment effects, ad-hoc lump-sum payments, floating-rate scenarios, affordability estimates, reverse calculators, foreclosure and tax reference." />
              <Tools inp={inp} d={d} />
            </Reveal>

            {/* ── 6. Comparison ── */}
            <Reveal className="mt-10">
              <SectionTitle id="compare" eyebrow="Side by side" title="Compare up to 3 loans" desc="Numbers only — no rankings, no recommendations." />
              <Comparison inp={inp} d={d} />
            </Reveal>
          </>
        )}

        {/* ── 7. Export + scenarios ── */}
        <div className="mt-10 space-y-3">
          <SectionTitle id="export" eyebrow="Keep & share" title="Save, export & print" />
          <Card className="p-4 sm:p-5"><ExportBar inp={inp} d={d} /></Card>
          <Card className="p-4 sm:p-5"><Scenarios inp={inp} d={d} onRestore={(s) => setInp(s)} /></Card>
        </div>

        {/* ── Disclaimer ── */}
        <Card className="mt-10 border-gold-200 bg-gold-50/60 p-4 sm:p-5">
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-gold-600">Important disclaimer</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">{t("disclaimer.main")}</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
            This tool performs mathematical calculations only. It does not approve loans, recommend lenders or products, rank options, or predict rates. No lender, WhatsApp-style forwarding or agent is behind these numbers.
          </p>
        </Card>

        <footer className="mt-10 pb-4 text-center no-print">
          <AnimalParade className="mb-4 h-11" speed={95} opacity="opacity-[0.3]" />
          <Toran className="mx-auto mb-5 max-w-md" count={22} />
          <div className="mb-3 flex items-end justify-center gap-4 text-brand-700/30">
            <Elephant className="h-7 w-auto animate-walk" />
            <Chakra spin className="size-7 text-chakra/40" />
            <Peacock className="h-8 w-auto animate-walk" />
          </div>
          <p className="font-display text-[15px] font-semibold text-ink-800">
            Loan<span className="text-brand-700">Hisab</span>
            <span lang="hi" className="font-dv ml-1.5 text-[12px] font-medium text-gold-600">लोन हिसाब</span>
          </p>
          <p className="mt-1 text-[12px] text-ink-400">
            Made for lakhs and crores, not lines of figures you'll never read · {new Date().getFullYear()}
          </p>
        </footer>
      </main>

      {/* ── Print-only summary ── */}
      <PrintSummary inp={inp} d={d} />

      <MiniSummaryBar inp={inp} d={d} visible={entered && miniVisible && !viewportObscured} />
    </div>

    {/* ── Landing doors sit above the app and open into it ── */}
    <AnimatePresence>
      {!entered && <Landing key="landing" onEnter={enterApp} />}
    </AnimatePresence>

    {/* ── PWA: install banners, iOS guide, update & offline toasts ── */}
    {entered && <PWAMounts />}
    <UpdateToast />
    <OfflineToast />
    {install.iOS && !install.standalone && (
      <IOSInstallSheet
        open={manualIOSOpen}
        onClose={(hide) => { setManualIOSOpen(false); if (hide) install.dismissIOS(); }}
      />
    )}
    </>
  );
}

// ─── Print-only header block ─────────────────────────────────────────────────
function PrintSummary({ inp, d }: { inp: LoanInputs; d: Derived }) {
  const cfg = loanById(inp.loanId);
  const ok = d.principal > 0;
  return (
    <div className="print-only px-2">
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>LoanHisab — {cfg.name} (estimate)</h1>
      <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
        Loan amount {fmtINR(SAFE(d.principal))} · Rate {inp.rate}% p.a. · Tenure {inp.tenureMonths} months · Generated {new Date().toLocaleDateString("en-IN")}
      </p>
      {ok && (
        <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
          Instalment {fmtINR(d.result.emiFirst)} · Total interest {fmtINR(d.result.totalInterest)} · Total repayment {fmtINR(d.totalRepayment)} · Fees &amp; charges {fmtINR(d.fees.total)}
        </p>
      )}
      <p style={{ fontSize: 11, color: "#777", marginTop: 8 }}>
        Estimates for informational purposes only. Verify all figures with your lender.
      </p>
    </div>
  );
}
