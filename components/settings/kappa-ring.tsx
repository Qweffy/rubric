import { type CSSProperties } from "react";

/**
 * Inline 28px violet κ ring used in the JUDGE CONFIG rows. Ported 1:1 from the
 * design (Rubric Settings Connections.dc.html → JUDGE CONFIG): a 32-unit
 * viewBox, r=12 (circumference 75.4), with the fill arc length = κ · 75.4 so
 * the ring reads the Cohen κ directly. Decorative — the numeric κ sits beside
 * it as the meaning-bearing signal.
 */
const CIRC = 2 * Math.PI * 12; // 75.398…

export interface KappaRingProps {
  /** Cohen κ in 0.00–1.00; null renders an empty track. */
  kappa: number | null;
  style?: CSSProperties;
}

export function KappaRing({ kappa, style }: KappaRingProps) {
  const fill = kappa === null ? 0 : Math.max(0, Math.min(1, kappa)) * CIRC;

  return (
    <svg
      viewBox="0 0 32 32"
      width={28}
      height={28}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="none"
        stroke="var(--violet-16)"
        strokeWidth="3"
      />
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="none"
        stroke="var(--violet)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${fill.toFixed(1)} ${CIRC.toFixed(1)}`}
        transform="rotate(-90 16 16)"
        style={{ filter: "drop-shadow(0 0 3px color-mix(in srgb, var(--violet) 50%, transparent))" }}
      />
    </svg>
  );
}
