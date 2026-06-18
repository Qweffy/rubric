import { type CSSProperties, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** Confidence strength — violet at a fixed opacity per band. */
export type ConfidenceLevel = "HIGH" | "MED" | "LOW";

export interface ConfidenceBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** @default 'HIGH' */
  level?: ConfidenceLevel;
  /**
   * Optional raw confidence in 0-1. When given, it is shown to two decimals
   * after the leading text (e.g. "MATCH 0.94"). It does NOT pick the level —
   * pass `level` for that — so the encoded opacity stays explicit.
   */
  value?: number;
  /** Leading text before the optional value. @default 'MATCH' */
  prefix?: string;
  /** Fully override the displayed text (ignores `prefix`/`value`). */
  label?: string;
}

interface LevelStyle {
  color: string;
  fill: string;
  border: string;
}

// Opacity is the encoding: violet is held constant, strength rides on alpha.
// Values are ported from the design system's CONFIDENCEBADGE row
// (Rubric Design System.dc.html → "violet, opacity = strength").
const LEVEL_STYLES: Record<ConfidenceLevel, LevelStyle> = {
  HIGH: {
    color: "var(--violet)",
    fill: "color-mix(in srgb, var(--violet) 14%, transparent)",
    border: "color-mix(in srgb, var(--violet) 50%, transparent)",
  },
  MED: {
    color: "color-mix(in srgb, var(--violet) 60%, var(--bg-void))",
    fill: "color-mix(in srgb, var(--violet) 8%, transparent)",
    border: "color-mix(in srgb, var(--violet) 30%, transparent)",
  },
  LOW: {
    color: "color-mix(in srgb, var(--violet) 35%, var(--bg-void))",
    fill: "color-mix(in srgb, var(--violet) 5%, transparent)",
    border: "color-mix(in srgb, var(--violet) 18%, transparent)",
  },
};

/**
 * Sharp-corner mono confidence badge (`.rb-badge` geometry): violet, with the
 * strength band encoded in opacity (HIGH 1.0 / MED 0.6 / LOW 0.35). The level
 * word is always present, so strength is never opacity-only.
 */
export function ConfidenceBadge({
  level = "HIGH",
  value,
  prefix = "MATCH",
  label,
  className,
  style,
  ...rest
}: ConfidenceBadgeProps) {
  const s = LEVEL_STYLES[level];

  const text =
    label ?? (value != null ? `${prefix} ${value.toFixed(2)}` : prefix);

  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 20,
    padding: "0 7px",
    font: "600 10px/1 var(--font-mono)",
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: s.color,
    background: s.fill,
    border: `1px solid ${s.border}`,
    borderRadius: "var(--radius-sm)",
    whiteSpace: "nowrap",
    ...style,
  };

  return (
    <span
      className={cn(className)}
      style={badgeStyle}
      title={`${level} confidence`}
      {...rest}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          flexShrink: 0,
          borderRadius: "50%",
          background: "currentColor",
        }}
      />
      {text}
    </span>
  );
}
