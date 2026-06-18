import { type CSSProperties, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Rubric run / health / calibration statuses. Grouped by the design system's
 * STATUS MAP (Rubric Design System.dc.html → "Status and confidence badges"):
 *
 * - phosphor + dot   PASS HEALTHY WELL-CALIBRATED ALIGNED
 * - phosphor + pulse RUNNING CALIBRATING
 * - phosphor-08      COMPLETED LIVE IMPROVED
 * - red              FAIL BLOCKED REGRESSED DIVERGED
 * - amber            PARTIAL STALE FLAKY PENDING UNDER-CALIBRATED OVERRIDDEN
 * - cyan             NEUTRAL SKIPPED INFO
 * - violet           JUDGE AI DRIFTED
 */
export type StatusValue =
  | "PASS"
  | "HEALTHY"
  | "WELL-CALIBRATED"
  | "ALIGNED"
  | "RUNNING"
  | "CALIBRATING"
  | "COMPLETED"
  | "LIVE"
  | "IMPROVED"
  | "FAIL"
  | "BLOCKED"
  | "REGRESSED"
  | "DIVERGED"
  | "PARTIAL"
  | "STALE"
  | "FLAKY"
  | "PENDING"
  | "UNDER-CALIBRATED"
  | "OVERRIDDEN"
  | "NEUTRAL"
  | "SKIPPED"
  | "INFO"
  | "JUDGE"
  | "AI"
  | "DRIFTED";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  // `string & {}` keeps autocomplete for the known StatusValues while still
  // accepting arbitrary strings, without `string` swallowing the literal union.
  status: StatusValue | (string & {});
  /** Override the displayed text (defaults to the uppercased status). */
  label?: string;
}

interface StatusStyle {
  color: string;
  fill: string;
  border: string;
  dot?: boolean;
  pulse?: boolean;
}

// Color is NEVER the only signal: every badge pairs its hue with the mono
// uppercase status word, and the meaning-bearing groups add a dot or pulse.
const PHOSPHOR_SOLID: StatusStyle = {
  color: "var(--phosphor)",
  fill: "var(--phosphor-12)",
  border: "color-mix(in srgb, var(--phosphor) 30%, transparent)",
  dot: true,
};
const PHOSPHOR_PULSE: StatusStyle = {
  color: "var(--phosphor)",
  fill: "var(--phosphor-12)",
  border: "color-mix(in srgb, var(--phosphor) 30%, transparent)",
  pulse: true,
};
const PHOSPHOR_QUIET: StatusStyle = {
  color: "var(--phosphor)",
  fill: "var(--phosphor-08)",
  border: "color-mix(in srgb, var(--phosphor) 22%, transparent)",
};
const RED: StatusStyle = {
  color: "var(--danger)",
  fill: "var(--red-14)",
  border: "color-mix(in srgb, var(--danger) 40%, transparent)",
};
const AMBER: StatusStyle = {
  color: "var(--amber)",
  fill: "var(--amber-14)",
  border: "color-mix(in srgb, var(--amber) 38%, transparent)",
};
const CYAN: StatusStyle = {
  color: "var(--cyan)",
  fill: "var(--cyan-12)",
  border: "color-mix(in srgb, var(--cyan) 38%, transparent)",
};
const VIOLET: StatusStyle = {
  color: "var(--violet)",
  fill: "var(--violet-16)",
  border: "color-mix(in srgb, var(--violet) 40%, transparent)",
};

const FALLBACK: StatusStyle = {
  color: "var(--text-mid)",
  fill: "transparent",
  border: "var(--border)",
};

const STATUS_STYLES: Record<StatusValue, StatusStyle> = {
  PASS: PHOSPHOR_SOLID,
  HEALTHY: PHOSPHOR_SOLID,
  "WELL-CALIBRATED": PHOSPHOR_SOLID,
  ALIGNED: PHOSPHOR_SOLID,
  RUNNING: PHOSPHOR_PULSE,
  CALIBRATING: PHOSPHOR_PULSE,
  COMPLETED: PHOSPHOR_QUIET,
  LIVE: PHOSPHOR_QUIET,
  IMPROVED: PHOSPHOR_QUIET,
  FAIL: { ...RED, dot: true },
  BLOCKED: RED,
  REGRESSED: { ...RED, dot: true },
  DIVERGED: RED,
  PARTIAL: AMBER,
  STALE: AMBER,
  FLAKY: AMBER,
  PENDING: AMBER,
  "UNDER-CALIBRATED": AMBER,
  OVERRIDDEN: AMBER,
  NEUTRAL: CYAN,
  SKIPPED: CYAN,
  INFO: CYAN,
  JUDGE: { ...VIOLET, dot: true },
  AI: VIOLET,
  DRIFTED: VIOLET,
};

const isStatusValue = (key: string): key is StatusValue =>
  Object.prototype.hasOwnProperty.call(STATUS_STYLES, key);

const PULSE_CSS = `
@keyframes rb-badge-ping {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.6); opacity: 0; }
}
.rb-badge-pulse { animation: rb-badge-ping 1.8s var(--ease-out) infinite; }
@media (prefers-reduced-motion: reduce) {
  .rb-badge-pulse { animation: none; }
}
`;

/**
 * Sharp-corner mono status badge (`.rb-badge`): height 20, radius-sm (NOT a
 * pill), 600 10px/0.10em uppercase. Color, dot, and pulse derive from `status`.
 * Pass/fail is never hue-only — the status word and dot/pulse carry it too.
 */
export function StatusBadge({
  status,
  label,
  className,
  style,
  ...rest
}: StatusBadgeProps) {
  const key = status.toUpperCase();
  const s = isStatusValue(key) ? STATUS_STYLES[key] : FALLBACK;

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
    <span className={cn(className)} style={badgeStyle} {...rest}>
      {/* reason: genuine boolean OR — `??` would wrongly return `false` for
          `dot` and skip `pulse`. dot/pulse are boolean flags, not nullable data. */}
      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
      {(s.dot || s.pulse) && (
        <span
          style={{ position: "relative", width: 6, height: 6, flexShrink: 0 }}
          aria-hidden="true"
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "currentColor",
            }}
          />
          {s.pulse && (
            <span
              className="rb-badge-pulse"
              style={{
                position: "absolute",
                inset: -1,
                borderRadius: "50%",
                border: "1.5px solid currentColor",
              }}
            />
          )}
        </span>
      )}
      {label ?? key}
      {s.pulse && (
        <style href="rb-status-badge-pulse" precedence="default">
          {PULSE_CSS}
        </style>
      )}
    </span>
  );
}
