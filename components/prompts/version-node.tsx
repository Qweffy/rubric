"use client";

import { type CSSProperties } from "react";

import { type TimelineVersion } from "@/components/prompts/prompt-timeline-view";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";

/** Rail tone drives the connector line + node head colour. */
type RailTone = "red" | "phosphor" | "cyan" | "neutral";

function railTone(v: TimelineVersion): RailTone {
  if (v.isRegressed) return "red";
  if (v.isLive || v.isImproved) return "phosphor";
  if (v.isCostWin) return "cyan";
  return "neutral";
}

const RAIL_COLOR: Record<RailTone, string> = {
  red: "var(--red)",
  phosphor: "var(--phosphor)",
  cyan: "var(--cyan)",
  neutral: "var(--text-mid)",
};

const RAIL_HEAD_GLOW: Record<RailTone, string> = {
  red: "0 0 10px var(--red)",
  phosphor: "var(--glow-phosphor)",
  cyan: "var(--glow-cyan)",
  neutral: "none",
};

/** Format a stored pass-rate fraction (0-1) as a percentage string. */
function pct(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

/** Signed Δ chip text, e.g. "Δ −5.6" / "Δ +2.4" / "Δ +0.0". */
function deltaText(delta: number | null): string | null {
  if (delta === null) return null;
  const rounded = delta.toFixed(1);
  const sign = delta >= 0 ? "+" : "−";
  return `Δ ${sign}${Math.abs(Number(rounded)).toFixed(1)}`;
}

/** Cost Δ chip text, e.g. "cost +$0.02" / "cost −$0.15" / "cost 0". */
function costText(delta: number | null): string | null {
  if (delta === null) return null;
  if (Math.abs(delta) < 0.005) return "cost 0";
  const sign = delta >= 0 ? "+" : "−";
  return `cost ${sign}$${Math.abs(delta).toFixed(2)}`;
}

export interface VersionNodeProps {
  version: TimelineVersion;
  /** Whether a connector line descends to the next (older) node. */
  hasNext: boolean;
  /** Compare selection state. */
  checked: boolean;
  /** Toggle compare selection; disabled when the cap (2) is reached. */
  onToggle: () => void;
  toggleDisabled: boolean;
}

/**
 * One row of the prompt-version timeline: a compare checkbox, the git-rail
 * dot + connector, and the version card (label, ref, date, status/branch tags,
 * pass-rate + Δ + cost chips). Mirrors the `.node-body` nodes in
 * "Rubric Prompt Timeline.dc.html".
 */
export function VersionNode({
  version,
  hasNext,
  checked,
  onToggle,
  toggleDisabled,
}: VersionNodeProps) {
  const tone = railTone(version);
  const railColor = RAIL_COLOR[tone];

  const passColor = version.isRegressed
    ? "var(--red)"
    : version.passRate !== null
      ? "var(--phosphor)"
      : "var(--text-mid)";

  // Node-body emphasis: regressed = red wash; live/improved = phosphor border + glow.
  const bodyStyle: CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-card)",
    background: "var(--bg-raised)",
    boxShadow: "var(--shadow-card)",
    padding: "13px 16px",
    marginBottom: hasNext ? 18 : 0,
  };
  if (version.isRegressed) {
    bodyStyle.border = "1px solid color-mix(in srgb, var(--red) 40%, transparent)";
    bodyStyle.background = "var(--red-14)";
  } else if (version.isLive) {
    bodyStyle.border = "1px solid var(--border-strong)";
    bodyStyle.boxShadow = "var(--shadow-card), var(--glow-phosphor-sm)";
  } else if (version.isImproved) {
    bodyStyle.border = "1px solid var(--border-strong)";
    bodyStyle.boxShadow = "var(--shadow-card), var(--glow-phosphor-sm)";
  }

  const deltaChip = deltaText(version.passDelta);
  const costChip = costText(version.costDelta);

  // Δ chip tone: negative = red, positive = phosphor, zero = muted.
  const deltaTone =
    version.passDelta === null
      ? "neutral"
      : version.passDelta < 0
        ? "red"
        : version.passDelta > 0
          ? "phosphor"
          : "neutral";
  // Cost chip tone: a win is phosphor, a regression is amber, else muted.
  const costTone = version.isCostWin
    ? "phosphor"
    : version.isCostRegression
      ? "amber"
      : "neutral";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "24px 28px 1fr",
        gap: 12,
      }}
    >
      {/* compare checkbox */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 16,
        }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={`Compare ${version.label}`}
          onClick={onToggle}
          disabled={toggleDisabled && !checked}
          className={cn(
            "inline-flex items-center justify-center transition",
            toggleDisabled && !checked ? "cursor-not-allowed" : "cursor-pointer",
          )}
          style={{
            width: 16,
            height: 16,
            borderRadius: "var(--radius-sm)",
            border: checked
              ? "1px solid var(--phosphor)"
              : "1px solid var(--border-strong)",
            background: checked ? "var(--phosphor)" : "transparent",
            color: "var(--bg-void)",
            opacity: toggleDisabled && !checked ? 0.4 : 1,
            padding: 0,
            flex: "none",
          }}
        >
          {checked && <Icon name="check" size={11} strokeWidth={2.4} />}
        </button>
      </div>

      {/* git rail */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {hasNext && (
          <div
            style={{
              position: "absolute",
              top: 24,
              bottom: -18,
              width: 2,
              background:
                tone === "neutral"
                  ? "var(--divider)"
                  : railColor,
              boxShadow:
                tone === "neutral"
                  ? "none"
                  : `0 0 6px color-mix(in srgb, ${railColor} 55%, transparent)`,
            }}
          />
        )}
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: railColor,
            boxShadow: RAIL_HEAD_GLOW[tone],
            marginTop: 16,
            zIndex: 1,
            border: "2px solid var(--bg-void)",
          }}
        />
      </div>

      {/* node body */}
      <div style={bodyStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-hi)",
              }}
            >
              {version.label}
            </span>
            {version.ref && (
              <a
                href="#"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--cyan)",
                  textDecoration: "none",
                }}
              >
                {version.ref}
              </a>
            )}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {version.createdAt.slice(0, 10)}
            </span>
            {version.isLive ? (
              <StatusBadge status="LIVE" />
            ) : version.isRegressed ? (
              <StatusBadge status="REGRESSED" />
            ) : version.isImproved ? (
              <StatusBadge status="IMPROVED" />
            ) : version.isCostWin ? (
              <Tag tone="cyan">NEUTRAL-COST-WIN</Tag>
            ) : version.isCostRegression ? (
              <Tag tone="amber">NEUTRAL-COST-REGRESSION</Tag>
            ) : version.branch ? (
              <Tag tone="cyan">{version.branch}</Tag>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ font: "500 18px/1 var(--font-mono)", color: passColor }}>
              {pct(version.passRate)}
            </span>
            {deltaChip && <Tag tone={deltaTone}>{deltaChip}</Tag>}
            {costChip && <Tag tone={costTone}>{costChip}</Tag>}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 9,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            you · {version.branch ?? "main"}
          </span>
          <a
            href="#"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--cyan)",
              textDecoration: "none",
            }}
          >
            Compare to live
          </a>
        </div>
      </div>
    </div>
  );
}
