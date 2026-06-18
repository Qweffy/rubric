"use client";

import { type CSSProperties, type HTMLAttributes } from "react";

import { Sparkline } from "@/components/ui/sparkline";
import { useCountUp } from "@/components/ui/use-count-up";
import { cn } from "@/lib/cn";

export type ScorecardTone = "phosphor" | "violet" | "cyan";

export interface ScorecardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  /** Unit suffix in mono, e.g. "%", "cases", "pts". */
  suffix?: string;
  /** Signed change vs last run. */
  delta?: number;
  /** Trailing copy after the delta number. @default 'vs last run' */
  deltaLabel?: string;
  /** Sparkline series. */
  spark?: number[];
  /** @default 'phosphor' */
  tone?: ScorecardTone;
}

const TONE_ACCENT: Record<ScorecardTone, string> = {
  phosphor: "var(--text-hi)",
  violet: "var(--violet)",
  cyan: "var(--cyan)",
};

/**
 * Metric tile: mono label, big mono number (counts up on mount), optional
 * delta + sparkline. The KPI atom of the mission-control dashboard — suite
 * pass-rate, κ, regressed count, cost.
 */
export function Scorecard({
  label,
  value,
  suffix,
  delta,
  deltaLabel = "vs last run",
  spark,
  tone = "phosphor",
  className,
  style,
  ...rest
}: ScorecardProps) {
  const shown = useCountUp(value);
  const accent = TONE_ACCENT[tone];
  const deltaUp = delta != null && delta >= 0;

  const cardStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "var(--pad-card)",
    minWidth: 150,
    background: "var(--bg-raised)",
    border: "var(--border-1)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-card)",
    ...style,
  };

  return (
    <div className={cn(className)} style={cardStyle} {...rest}>
      <span
        style={{
          font: "var(--label-mono)",
          letterSpacing: "var(--label-tracking)",
          textTransform: "uppercase",
          color: "var(--text-label)",
        }}
      >
        {label}
      </span>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              font: "var(--mono-xl)",
              color: accent,
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {shown.toLocaleString("en-US")}
          </span>
          {suffix && (
            <span style={{ font: "var(--mono-base)", color: "var(--text-low-content)" }}>
              {suffix}
            </span>
          )}
        </div>
        {spark && <Sparkline data={spark} tone={tone} />}
      </div>
      {delta != null && (
        <span
          style={{
            font: "var(--mono-sm)",
            color: deltaUp ? "var(--phosphor)" : "var(--red)",
          }}
        >
          {deltaUp ? "+" : ""}
          {delta} <span style={{ color: "var(--text-low-content)" }}>{deltaLabel}</span>
        </span>
      )}
    </div>
  );
}
