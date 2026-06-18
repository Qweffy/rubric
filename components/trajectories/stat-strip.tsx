"use client";

import { type CSSProperties, type ReactNode } from "react";

import  { type TrajectoryStats } from "@/components/trajectories/trajectories-view";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";

/** One stat tile (`.scard`): mono label, big number, and a free-form footer. */
function StatCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const cardStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: "14px 16px",
    background: "var(--surface-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-card)",
  };
  return (
    <div style={cardStyle}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

const BIG_NUMBER: CSSProperties = {
  font: "600 32px/1 var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

const FOOTER_MONO: CSSProperties = {
  font: "var(--mono-sm)",
  fontSize: 11,
  fontVariantNumeric: "tabular-nums",
};

/** Tool-selection-accuracy delta vs. the prior run (design: ▼ 2.1). */
const TOOL_ACC_DELTA = 2.1;

/**
 * StatStrip — the four KPI tiles above the heatmap. Numbers come from the
 * seeded query (TrajectoryStats); only the headline delta and tile copy are
 * fixed framing. Tool-acc is violet, exact-match amber, final-pass phosphor.
 */
export function StatStrip({ stats }: { stats: TrajectoryStats }) {
  const stepsFraction = stats.stepBudget > 0 ? stats.avgSteps / stats.stepBudget : 0;
  const stepsPct = Math.max(0, Math.min(1, stepsFraction)) * 100;

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}
    >
      {/* TOOL-SELECTION ACCURACY */}
      <StatCard label="TOOL-SELECTION ACCURACY">
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span style={{ ...BIG_NUMBER, color: "var(--violet)" }}>
            {stats.toolSelectionAccuracyPct.toFixed(1)}%
          </span>
          <span style={{ ...FOOTER_MONO, fontSize: 12, color: "var(--red)" }}>
            ▼ {TOOL_ACC_DELTA.toFixed(1)}
          </span>
        </div>
        <span style={{ ...FOOTER_MONO, color: "var(--text-muted)" }}>
          right tool, right order
        </span>
      </StatCard>

      {/* EXACT-SEQUENCE MATCH */}
      <StatCard label="EXACT-SEQUENCE MATCH">
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span style={{ ...BIG_NUMBER, color: "var(--amber)" }}>
            {stats.exactMatchPct.toFixed(1)}%
          </span>
          <span style={{ ...FOOTER_MONO, fontSize: 12, color: "var(--text-muted)" }}>
            {stats.exactMatch}/{stats.total}
          </span>
        </div>
        <span style={{ ...FOOTER_MONO, color: "var(--text-muted)" }}>
          step-for-step identical
        </span>
      </StatCard>

      {/* FINAL-ANSWER PASS */}
      <StatCard label="FINAL-ANSWER PASS">
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span style={{ ...BIG_NUMBER, color: "var(--phosphor)" }}>
            {stats.finalAnswerPassPct.toFixed(1)}%
          </span>
          <span style={{ ...FOOTER_MONO, fontSize: 12, color: "var(--text-muted)" }}>
            {stats.finalAnswerPass}/{stats.total}
          </span>
        </div>
        <span
          className="flex items-center"
          style={{ ...FOOTER_MONO, gap: 5, color: "var(--violet)" }}
        >
          <Icon name="scale" size={11} strokeWidth={2} />
          judge-graded
        </span>
      </StatCard>

      {/* AVG STEPS */}
      <StatCard label="AVG STEPS">
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span style={{ ...BIG_NUMBER, color: "var(--text-hi)" }}>
            {stats.avgSteps.toFixed(1)}
          </span>
          <span style={{ ...FOOTER_MONO, fontSize: 12, color: "var(--text-muted)" }}>
            / budget {stats.stepBudget.toFixed(1)}
          </span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 3,
            background: "var(--surface-panel)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${stepsPct}%`,
              height: "100%",
              background: "var(--phosphor)",
              borderRadius: 3,
            }}
          />
        </div>
      </StatCard>
    </div>
  );
}
