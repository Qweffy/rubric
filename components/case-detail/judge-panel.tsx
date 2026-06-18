"use client";

import { type ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { type CaseJudgeVerdict } from "@/lib/queries/cases";

/** Highest score a judge rubric can reach in the seed (criteria total). */
const JUDGE_SCALE = 5;

/**
 * The judge label state for a case. `pending` renders the PASS / FAIL human
 * affordance (Awaiting Human state); `diverged` renders the amber disagreement
 * banner (judge-disagrees state, e.g. case_103). `agreed` is the quiet default.
 */
export type HumanLabelState =
  | { kind: "none" }
  | { kind: "pending"; awaitingTotal?: number; awaitingIndex?: number }
  | { kind: "agreed"; label: "pass" | "fail" }
  | { kind: "diverged"; label: "pass" | "fail" };

export interface JudgePanelProps {
  verdict: CaseJudgeVerdict;
  human: HumanLabelState;
}

/** PARTIAL when the judge passed but not every rubric criterion did. */
function judgeBadge(verdict: CaseJudgeVerdict): { status: string; label: string } {
  if (!verdict.pass) return { status: "FAIL", label: "FAIL" };
  const allPass = verdict.rubric.every((r) => r.pass);
  return allPass
    ? { status: "PASS", label: "PASS" }
    : { status: "PARTIAL", label: "PARTIAL" };
}

/** Animated judge orb — the violet AI mark from the handoff's panel header. */
function JudgeOrb(): ReactNode {
  return (
    <svg viewBox="0 0 44 40" width={26} height={24} aria-hidden="true">
      <defs>
        <filter id="rb-judge-orb" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(22 20)">
        <ellipse
          rx="18"
          ry="7"
          fill="none"
          stroke="var(--violet)"
          strokeOpacity="0.5"
          strokeWidth="1.4"
          transform="rotate(-24)"
        />
        <circle
          className="rb-judge-orb-pulse"
          r="5.5"
          fill="none"
          stroke="var(--violet)"
          strokeWidth="1.6"
          filter="url(#rb-judge-orb)"
        />
        <circle r="2" fill="var(--violet)" />
      </g>
    </svg>
  );
}

/**
 * The judge score dial — a violet gauge reading `score/JUDGE_SCALE` with the
 * fraction at center. The handoff draws three tick notches at the band cuts;
 * we keep the same 116-unit geometry.
 */
function JudgeGauge({ score, size = 104 }: { score: number; size?: number }): ReactNode {
  const CIRC = 311; // matches the handoff's dasharray for r=49.5
  const pct = Math.max(0, Math.min(1, score / JUDGE_SCALE));
  return (
    <svg viewBox="0 0 116 116" width={size} height={size} role="img" aria-label={`Judge score ${String(score)} of ${String(JUDGE_SCALE)}`}>
      <defs>
        <filter id="rb-judge-gauge" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="58" cy="58" r="49.5" fill="none" stroke="var(--violet-16)" strokeWidth="11" />
      {[144, 216, 288].map((deg) => (
        <line
          key={deg}
          x1="58"
          y1="3"
          x2="58"
          y2="14"
          stroke="var(--bg-void)"
          strokeWidth="2"
          transform={`rotate(${String(deg)} 58 58)`}
        />
      ))}
      <circle
        cx="58"
        cy="58"
        r="49.5"
        fill="none"
        stroke="var(--violet)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - pct)}
        transform="rotate(-90 58 58)"
        filter="url(#rb-judge-gauge)"
      />
      <text
        x="58"
        y="56"
        textAnchor="middle"
        fill="var(--text-hi)"
        fontFamily="var(--font-mono)"
        fontWeight={600}
        fontSize={26}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}/{JUDGE_SCALE}
      </text>
      <text
        x="58"
        y="74"
        textAnchor="middle"
        fill="var(--text-muted)"
        fontFamily="var(--font-mono)"
        fontSize={10}
      >
        score
      </text>
    </svg>
  );
}

/** Format a token count and cost into the panel's mono cost line. */
function costLine(verdict: CaseJudgeVerdict): string {
  const parts = [verdict.judgeName];
  if (verdict.tokens != null) parts.push(`${verdict.tokens.toLocaleString()} tok`);
  if (verdict.costUsd != null) parts.push(`$${verdict.costUsd.toFixed(3)}`);
  return parts.join(" · ");
}

export function JudgePanel({ verdict, human }: JudgePanelProps): ReactNode {
  const badge = judgeBadge(verdict);
  const diverged = human.kind === "diverged";

  return (
    <div
      style={{
        border: "1px solid color-mix(in srgb, var(--violet) 40%, transparent)",
        borderRadius: "var(--radius-card)",
        background: "var(--violet-12)",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between"
        style={{
          gap: 12,
          padding: "10px 12px",
          borderBottom: "1px solid color-mix(in srgb, var(--violet) 24%, transparent)",
        }}
      >
        <div className="flex items-center" style={{ gap: 9 }}>
          <JudgeOrb />
          <SectionLabel tone="violet">JUDGE</SectionLabel>
          <StatusBadge status={badge.status} label={badge.label} />
          <span style={{ font: "var(--mono-sm)", color: "var(--violet)" }}>
            {verdict.score}/{JUDGE_SCALE}
          </span>
        </div>
        {diverged ? (
          <span
            className="inline-flex items-center"
            style={{
              gap: 6,
              height: 22,
              padding: "0 8px",
              font: "500 11px/1 var(--font-mono)",
              color: "var(--amber)",
              border: "1px solid color-mix(in srgb, var(--amber) 40%, transparent)",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }}
            />
            human: {human.label.toUpperCase()}
          </span>
        ) : (
          <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
            {costLine(verdict)}
          </span>
        )}
      </div>

      {/* divergence callout — judge verdict and human label disagree */}
      {diverged && (
        <div style={{ padding: 12 }}>
          <div
            className="flex items-center"
            style={{
              gap: 10,
              padding: "10px 12px",
              background: "var(--amber-14)",
              border: "1px solid color-mix(in srgb, var(--amber) 40%, transparent)",
              borderRadius: "var(--radius-control)",
            }}
          >
            <Icon name="alert-triangle" size={16} style={{ color: "var(--amber)", flexShrink: 0 }} />
            <span className="flex-1" style={{ font: "var(--text-sm)", color: "var(--text-hi)" }}>
              Judge says {badge.label} ({verdict.score}/{JUDGE_SCALE}) but the human
              label is {human.label.toUpperCase()}.
            </span>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center whitespace-nowrap bg-transparent"
              style={{
                height: 30,
                padding: "0 11px",
                font: "600 12px/1 var(--font-ui)",
                color: "var(--amber)",
                border: "1px solid color-mix(in srgb, var(--amber) 40%, transparent)",
                borderRadius: "var(--radius-control)",
              }}
            >
              See in calibration
            </button>
          </div>
        </div>
      )}

      {/* gauge + rubric */}
      <div className="flex" style={{ gap: 14, padding: 12 }}>
        <div className="flex flex-none flex-col items-center" style={{ gap: 4 }}>
          <JudgeGauge score={verdict.score} />
        </div>
        <div className="flex flex-1 flex-col" style={{ gap: 6 }}>
          <SectionLabel tone="violet">RUBRIC</SectionLabel>
          {verdict.rubric.map((r, i) => (
            <span
              key={i}
              style={{ font: "var(--mono-sm)", color: "var(--text-body)" }}
            >
              {i + 1}. {r.criterion}{" "}
              <span style={{ color: r.pass ? "var(--phosphor)" : "var(--red)" }}>
                {r.pass ? "✓" : "✗"}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* reasoning */}
      {verdict.reasoning != null && (
        <div style={{ padding: "0 12px 12px" }}>
          <SectionLabel tone="violet" style={{ marginBottom: 6 }}>
            REASONING
          </SectionLabel>
          <div style={{ borderLeft: "2px solid var(--violet)", padding: "2px 0 2px 12px" }}>
            <span style={{ font: "var(--text-sm)", color: "var(--text-body)" }}>
              {verdict.reasoning}
            </span>
          </div>
        </div>
      )}

      {/* awaiting-human affordance */}
      {human.kind === "pending" && (
        <div style={{ padding: "0 12px 14px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 12,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              background: "var(--surface-card)",
            }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <SectionLabel>HUMAN LABEL</SectionLabel>
              <StatusBadge status="PENDING" label="PENDING REVIEW" />
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <button
                type="button"
                className="inline-flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap bg-transparent"
                style={{
                  height: 30,
                  gap: 6,
                  font: "600 12px/1 var(--font-ui)",
                  color: "var(--phosphor)",
                  border: "1px solid color-mix(in srgb, var(--phosphor) 40%, transparent)",
                  borderRadius: "var(--radius-control)",
                }}
              >
                <span style={{ fontSize: 12 }}>✓</span> PASS
              </button>
              <button
                type="button"
                className="inline-flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap bg-transparent"
                style={{
                  height: 30,
                  gap: 6,
                  font: "600 12px/1 var(--font-ui)",
                  color: "var(--red)",
                  border: "1px solid color-mix(in srgb, var(--red) 42%, transparent)",
                  borderRadius: "var(--radius-control)",
                }}
              >
                <span style={{ fontSize: 12 }}>✗</span> FAIL
              </button>
            </div>
            <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
              your label feeds Judge Calibration
            </span>
          </div>
        </div>
      )}

      <style href="rb-judge-orb-pulse" precedence="default">{`
@keyframes rb-judge-orb { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }
.rb-judge-orb-pulse { animation: rb-judge-orb 2.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .rb-judge-orb-pulse { animation: none; opacity: 1 } }
`}</style>
    </div>
  );
}
