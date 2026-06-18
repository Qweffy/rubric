"use client";

import { type CSSProperties, type HTMLAttributes } from "react";

import { useCountUp } from "@/components/ui/use-count-up";
import { cn } from "@/lib/cn";

export interface ScoreGaugeProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The value to render. In `score` mode (default) this is 0-100. In `kappa`
   * mode it is a Cohen's κ in 0.00-1.00 and the ring fills to `value * 100%`.
   */
  value?: number;
  /** `score` = 0-100 integer; `kappa` = 0.00-1.00 agreement coefficient. @default 'score' */
  mode?: "score" | "kappa";
  /** Diameter in px. @default 140 */
  size?: number;
  /** Optional mono label beneath. Defaults to "COHEN κ" in kappa mode. */
  label?: string;
}

// Geometry is ported 1:1 from the design system's κ gauge (Rubric Judge
// Calibration.dc.html → KAPPA CARD): a 148-unit viewBox, r=63, 12-unit stroke.
// We keep those proportions and scale the SVG to `size`.
const VB = 148;
const CENTER = VB / 2;
const R = 63;
const STROKE = 12;
const CIRC = 2 * Math.PI * R; // 395.84

// Band thresholds rendered as TICK MARKS on the track (not colored arc
// segments) — a single continuous violet fill carries the value. poor<0.4 /
// fair / good / strong>0.8, so the cuts sit at fractions 0.4, 0.6, 0.8.
const BAND_TICKS = [0.4, 0.6, 0.8];

const KAPPA_BANDS: { label: string; flex: number; color: string }[] = [
  { label: "poor <.4", flex: 40, color: "color-mix(in srgb, var(--red) 45%, transparent)" },
  { label: "fair", flex: 20, color: "color-mix(in srgb, var(--amber) 45%, transparent)" },
  { label: "good", flex: 20, color: "color-mix(in srgb, var(--violet) 40%, transparent)" },
  { label: "strong >.8", flex: 20, color: "var(--phosphor)" },
];

const ARC_CSS = `
.rb-gauge-arc { transition: stroke-dashoffset 80ms linear; }
@media (prefers-reduced-motion: reduce) {
  .rb-gauge-arc { transition: none; }
}
`;

/**
 * Radial violet gauge for ALL judge / AI scores. Counts up on mount.
 *
 * - `mode="score"`: 0-100, fills `value/100` of the ring, shows the integer.
 * - `mode="kappa"`: 0.00-1.00 Cohen's κ, fills `value*100%` of the ring, shows
 *   two decimals with a κ glyph and the "COHEN κ" label.
 *
 * The quality bands (poor/fair/good/strong) appear as tick marks cut into the
 * track, never as colored arc segments — the fill itself stays one violet sweep.
 */
export function ScoreGauge({
  value = 0,
  mode = "score",
  size = 140,
  label,
  className,
  style,
  ...rest
}: ScoreGaugeProps) {
  const isKappa = mode === "kappa";

  // Animate on an integer track so the count-up reads cleanly, then derive the
  // displayed string + fill fraction from it. κ animates over 0-100 (hundredths).
  const target = isKappa
    ? Math.round(Math.max(0, Math.min(1, value)) * 100)
    : Math.round(Math.max(0, Math.min(100, value)));
  const shown = useCountUp(target);

  const pct = isKappa ? shown / 100 : shown / 100;
  const display = isKappa ? (shown / 100).toFixed(2) : String(shown);
  const resolvedLabel = label ?? (isKappa ? "COHEN κ" : undefined);

  const numFontPx = Math.round(size * 0.24);
  const kappaGlyphPx = Math.round(size * 0.08);

  const rootStyle: CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    ...style,
  };

  return (
    <div className={cn(className)} style={rootStyle} {...rest}>
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        width={size}
        height={size}
        role="img"
        aria-label={
          isKappa ? `Cohen kappa ${display}` : `Score ${display} of 100`
        }
      >
        <defs>
          <filter id="rb-gauge-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="var(--violet-16)"
          strokeWidth={STROKE}
        />

        {/* band threshold tick marks — notches cut into the track in the void
            color, marking 0.4 / 0.6 / 0.8. Drawn before the fill so the fill
            sits over them where reached. */}
        {BAND_TICKS.map((t) => (
          <line
            key={t}
            x1={CENTER}
            y1={CENTER - R - STROKE / 2}
            x2={CENTER}
            y2={CENTER - R + STROKE / 2}
            stroke="var(--bg-void)"
            strokeWidth={2.5}
            transform={`rotate(${t * 360} ${CENTER} ${CENTER})`}
          />
        ))}

        {/* single continuous violet fill */}
        <circle
          className="rb-gauge-arc"
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="var(--violet)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct)}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          filter="url(#rb-gauge-glow)"
        />

        <text
          x={CENTER}
          y={isKappa ? CENTER + numFontPx * 0.12 : CENTER + numFontPx * 0.34}
          textAnchor="middle"
          fill="var(--text-hi)"
          fontFamily="var(--font-mono)"
          fontWeight={600}
          fontSize={numFontPx}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {display}
        </text>
        {isKappa && (
          <text
            x={CENTER}
            y={CENTER + numFontPx * 0.12 + kappaGlyphPx + 6}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontFamily="var(--font-mono)"
            fontSize={kappaGlyphPx}
          >
            κ
          </text>
        )}
      </svg>

      {resolvedLabel && (
        <span
          style={{
            font: "var(--label-mono)",
            letterSpacing: "var(--label-tracking)",
            textTransform: "uppercase",
            color: isKappa ? "var(--violet)" : "var(--text-label)",
          }}
        >
          {resolvedLabel}
        </span>
      )}

      {isKappa && (
        <div style={{ width: "100%", maxWidth: size + 20 }}>
          <div
            style={{
              display: "flex",
              height: 6,
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {KAPPA_BANDS.map((b) => (
              <div
                key={b.label}
                style={{ flex: `0 0 ${b.flex}%`, background: b.color }}
              />
            ))}
            {/* value marker — paired with the numeric readout so the band is
                never the only signal of where the score lands. */}
            <div
              style={{
                position: "absolute",
                left: `${Math.max(0, Math.min(100, pct * 100))}%`,
                top: -3,
                bottom: -3,
                width: 2,
                background: "var(--text-hi)",
                boxShadow: "0 0 6px var(--text-hi)",
                transform: "translateX(-1px)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            {KAPPA_BANDS.map((b, i) => (
              <span
                key={b.label}
                style={{
                  font: "500 9px/1 var(--font-mono)",
                  color:
                    i === KAPPA_BANDS.length - 1
                      ? "var(--phosphor)"
                      : "var(--text-muted)",
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <style href="rb-score-gauge-arc" precedence="default">
        {ARC_CSS}
      </style>
    </div>
  );
}
