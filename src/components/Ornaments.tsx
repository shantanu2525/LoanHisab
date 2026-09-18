// ─── Indian ornamental motifs (pure SVG, no images) ─────────────────────────
import { cn } from "../utils/cn";

/** Ashoka-Chakra-inspired wheel with 24 spokes. `spin` rotates it slowly. */
export function Chakra({ className, spin = false, reverse = false }: { className?: string; spin?: boolean; reverse?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(className, spin && (reverse ? "animate-spin-rev" : "animate-spin-slow"))}
      aria-hidden
      fill="none"
    >
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4.5" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="50" y1="50" x2="50" y2="7"
          stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"
          transform={`rotate(${i * 15} 50 50)`}
        />
      ))}
    </svg>
  );
}

/** Toran — the festive bunting of triangles hung above Indian doorways. */
export function Toran({ className, count = 30 }: { className?: string; count?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none border-t-2 border-brand-700/25", className)}>
      <div className="flex items-start">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="h-3 min-w-0 flex-1 animate-sway"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: i % 2 ? "var(--color-brand-700)" : "var(--color-gold-500)",
              opacity: i % 2 ? 0.85 : 0.9,
              animationDelay: `${(i % 7) * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Hand-drawn turmeric underline flourish for headings. */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden
      className={cn("absolute -bottom-1.5 left-0 h-2.5 w-full text-gold-500", className)}
    >
      <path
        d="M2 7.5 Q 16 2 31 6.5 T 60 6.5 T 90 6.2 T 118 4.5"
        fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Animal silhouettes ──────────────────────────────────────────────────────

/** Elephant — the temple procession gajah. */
export function Elephant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden fill="currentColor">
      <ellipse cx="50" cy="40" rx="30" ry="21" />
      <circle cx="87" cy="36" r="16" />
      <ellipse cx="80" cy="33" rx="10" ry="12" opacity="0.65" />
      <rect className="leg-a" x="28" y="55" width="10" height="25" rx="4.5" />
      <rect className="leg-b" x="45" y="55" width="10" height="25" rx="4.5" />
      <rect className="leg-b" x="62" y="55" width="10" height="25" rx="4.5" />
      <rect className="leg-a" x="76" y="55" width="10" height="25" rx="4.5" />
      <path d="M100 41 q11 8 8 20 q-2 9 -8 13" stroke="currentColor" strokeWidth="7.5" fill="none" strokeLinecap="round" />
      <path d="M95 48 q7 5 12 4" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M21 33 q-9 -5 -7 -14" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Peacock — the national bird, tail fanned. */
export function Peacock({ className }: { className?: string }) {
  const feathers = [-58, -44, -30, -16, -2, 12];
  return (
    <svg viewBox="0 0 130 96" className={className} aria-hidden fill="currentColor">
      <g opacity="0.55">
        {feathers.map((a) => (
          <g key={a} transform={`rotate(${a} 48 70)`}>
            <ellipse cx="48" cy="28" rx="6" ry="22" />
            <circle cx="48" cy="10" r="5.5" opacity="0.8" />
          </g>
        ))}
      </g>
      <ellipse cx="56" cy="66" rx="18" ry="14" />
      <path d="M70 58 q14 -6 16 -26" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="87" cy="28" r="7" />
      <path d="M94 27 l9 3 -9 3z" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M85 19 l-2 -8" /><path d="M89 19 l1 -8" /><path d="M92 21 l4 -7" />
      </g>
      <rect className="leg-a" x="49" y="78" width="4.5" height="16" rx="2" />
      <rect className="leg-b" x="61" y="78" width="4.5" height="16" rx="2" />
    </svg>
  );
}

/** Camel — the Thar desert ship. */
export function Camel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 88" className={className} aria-hidden fill="currentColor">
      <ellipse cx="52" cy="46" rx="27" ry="14" />
      <path d="M30 38 q10 -20 21 -3 z" />
      <path d="M52 37 q11 -21 22 -3 z" />
      <path d="M72 42 q13 -6 18 -24" stroke="currentColor" strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="92" cy="16" rx="9" ry="6" transform="rotate(-18 92 16)" />
      <rect className="leg-a" x="31" y="57" width="7.5" height="28" rx="3.5" />
      <rect className="leg-b" x="44" y="57" width="7.5" height="28" rx="3.5" />
      <rect className="leg-b" x="60" y="57" width="7.5" height="28" rx="3.5" />
      <rect className="leg-a" x="71" y="57" width="7.5" height="28" rx="3.5" />
      <path d="M26 42 q-8 6 -6 16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Royal Bengal tiger — the national animal. */
export function Tiger({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 136 80" className={className} aria-hidden fill="currentColor">
      <ellipse cx="58" cy="42" rx="32" ry="16" />
      <circle cx="98" cy="35" r="14" />
      <circle cx="91" cy="23" r="5" />
      <circle cx="105" cy="23" r="5" />
      <rect className="leg-a" x="34" y="54" width="9" height="24" rx="4" />
      <rect className="leg-b" x="50" y="54" width="9" height="24" rx="4" />
      <rect className="leg-b" x="72" y="54" width="9" height="24" rx="4" />
      <rect className="leg-a" x="86" y="54" width="9" height="24" rx="4" />
      <path d="M27 38 q-16 -4 -18 -20" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const ANIMALS = [Elephant, Peacock, Camel, Tiger] as const;

/**
 * A slow marching parade of Indian animals — a decorative band.
 * Content is duplicated so the marquee loops seamlessly.
 */
export function AnimalParade({
  className, speed = 70, height = "h-9", opacity = "opacity-[0.22]",
}: { className?: string; speed?: number; height?: string; opacity?: string }) {
  const group = Array.from({ length: 8 }).map((_, i) => {
    const A = ANIMALS[i % ANIMALS.length];
    return (
      <span key={i} className="mx-6 inline-flex shrink-0 items-end sm:mx-9">
        <A className={cn(height, "w-auto animate-walk")} />
      </span>
    );
  });
  return (
    <div aria-hidden className={cn("relative overflow-hidden", className)}>
      <div
        className="animate-parade flex w-max items-end text-brand-800"
        style={{ animationDuration: `${speed}s` }}
      >
        <span className={cn("flex items-end", opacity)}>{group}</span>
        <span className={cn("flex items-end", opacity)}>{group}</span>
      </div>
      {/* soft edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-sand-100 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-sand-100 to-transparent" />
    </div>
  );
}

/** Lotus-petal rangoli ring — decorative divider. */
export function Rangoli({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="none" stroke="currentColor">
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse
          key={i} cx="50" cy="28" rx="9" ry="20" strokeWidth="2"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="7" strokeWidth="2" />
    </svg>
  );
}
