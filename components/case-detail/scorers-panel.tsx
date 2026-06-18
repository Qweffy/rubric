"use client";

import { type ReactNode } from "react";

import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { type CaseJudgeVerdict, type ScorerVerdict } from "@/lib/queries/cases";

import { JudgePanel, type HumanLabelState } from "./judge-panel";

export interface ScorersPanelProps {
  scorers: ScorerVerdict[];
  judgeVerdicts: CaseJudgeVerdict[];
  human: HumanLabelState;
}

/** Inline mono code chip used inside scorer detail sentences. */
function Code({ children, tone }: { children: ReactNode; tone?: string }): ReactNode {
  return (
    <span style={{ font: "500 12px/1 var(--font-mono)", color: tone ?? "var(--text-body)" }}>
      {children}
    </span>
  );
}

/**
 * Renders one non-judge scorer verdict card: name + PASS/FAIL badge (with the
 * raw score when it is a sub-1.0 fraction, as the design surfaces 0.71 for
 * field-accuracy), the detail sentence, and a SCHEMA ERRORS sub-block when the
 * scorer reported concrete errors.
 */
function ScorerCard({ scorer }: { scorer: ScorerVerdict }): ReactNode {
  // Surface the numeric score next to the badge only when it is a partial
  // fraction (the design shows 0.71 on field-accuracy, nothing on binary ones).
  const showScore = scorer.score > 0 && scorer.score < 1;
  const errorsHeading =
    scorer.scorerName === "schema" ? "SCHEMA ERRORS" : "ERRORS";

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        padding: "11px 12px",
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ font: "var(--mono-sm)", color: "var(--text-hi)", fontSize: 13 }}>
          {scorer.scorerName}
        </span>
        <div className="flex items-center" style={{ gap: 8 }}>
          {showScore && (
            <span
              style={{
                font: "var(--mono-sm)",
                fontSize: 13,
                color: scorer.pass ? "var(--phosphor)" : "var(--red)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {scorer.score.toFixed(2)}
            </span>
          )}
          <StatusBadge
            status={scorer.pass ? "PASS" : "FAIL"}
            label={scorer.pass ? "✓ PASS" : "✗ FAIL"}
          />
        </div>
      </div>

      {scorer.detail != null && (
        <div style={{ font: "var(--text-sm)", color: "var(--text-body)", marginTop: 7 }}>
          {scorer.detail}
        </div>
      )}

      {!scorer.pass && scorer.errors.length > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            background: "var(--surface-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <SectionLabel style={{ marginBottom: 5 }}>{errorsHeading}</SectionLabel>
          <div className="flex flex-col" style={{ gap: 2 }}>
            {scorer.errors.map((err, i) => (
              <Code key={i} tone="var(--red)">
                · {err}
              </Code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The SCORERS panel: every non-judge scorer's verdict card stacked above the
 * judge verdict panel(s). The count in the header is the total scorers that ran
 * (non-judge cards + judge verdicts), matching the handoff's "SCORERS · 4".
 */
export function ScorersPanel({
  scorers,
  judgeVerdicts,
  human,
}: ScorersPanelProps): ReactNode {
  const nonJudge = scorers.filter((s) => s.scorerName !== "judge");
  const total = nonJudge.length + judgeVerdicts.length;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 14px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel>SCORERS · {total}</SectionLabel>
      </div>
      <div className="flex flex-col" style={{ gap: 8, padding: 10 }}>
        {nonJudge.map((s) => (
          <ScorerCard key={s.scorerName} scorer={s} />
        ))}
        {judgeVerdicts.map((v) => (
          <JudgePanel key={v.judgeId} verdict={v} human={human} />
        ))}
      </div>
    </div>
  );
}
