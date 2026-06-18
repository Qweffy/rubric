"use client";

import {
  type AnswerSegment,
  type RubricCriterion,
  type TrajectoryModel,
} from "@/components/trajectory-detail/model";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";

interface FinalAnswerJudgeProps {
  model: TrajectoryModel;
}

/**
 * FinalAnswerJudge — the outcome-only verdict, scored independently of the
 * tool path. Left column: the agent's final answer + the rubric criteria.
 * Right column: the PASS gauge, the judge's reasoning, and cost-vs-budget.
 */
export function FinalAnswerJudge({ model }: FinalAnswerJudgeProps) {
  const pass = model.finalAnswerPass;
  return (
    <Card
      id="final-answer"
      padding={false}
      className="overflow-hidden"
      style={{
        borderColor: "color-mix(in srgb, var(--violet) 40%, transparent)",
        boxShadow: "0 0 0 1px var(--violet-12) inset, var(--shadow-card)",
        scrollMarginTop: 16,
      }}
    >
      {/* head */}
      <div
        className="flex items-center justify-between"
        style={{
          gap: 12,
          padding: "11px 16px",
          borderBottom:
            "1px solid color-mix(in srgb, var(--violet) 22%, transparent)",
          background: "var(--violet-08)",
        }}
      >
        <div className="flex items-center" style={{ gap: 11 }}>
          <JudgeOrb />
          <SectionLabel tone="violet" icon="scale">
            FINAL-ANSWER JUDGE
          </SectionLabel>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            outcome scored independently of path
          </span>
        </div>
        <StatusBadge
          status="JUDGE"
          label={`${model.finalAnswerVerdict} · ${model.judgeScore}/${model.judgeMax}`}
          style={{ height: 24 }}
        />
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: "minmax(0,1.45fr) minmax(0,1fr)" }}
      >
        {/* LEFT: answer + rubric */}
        <div
          className="flex flex-col"
          style={{ padding: "18px 20px", borderRight: "1px solid var(--divider)", gap: 16 }}
        >
          <div className="flex flex-col" style={{ gap: 8 }}>
            <SectionLabel>AGENT FINAL ANSWER</SectionLabel>
            <p
              style={{
                font: "var(--text-base)",
                color: "var(--text-mid)",
                margin: 0,
                lineHeight: 1.7,
                maxWidth: "60ch",
              }}
            >
              {model.agentFinalAnswer.map((seg, i) => (
                <AnswerSpan key={i} seg={seg} />
              ))}
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: 9 }}>
            <SectionLabel>RUBRIC</SectionLabel>
            <div className="flex flex-col" style={{ gap: 7 }}>
              {model.rubric.map((c) => (
                <RubricRow key={c.index} criterion={c} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: gauge + reasoning */}
        <div
          className="flex flex-col items-center"
          style={{ padding: "18px 20px", gap: 16 }}
        >
          <VerdictGauge
            verdict={model.finalAnswerVerdict}
            score={model.judgeScore}
            max={model.judgeMax}
            pass={pass}
          />

          <div className="flex flex-col" style={{ gap: 8, width: "100%" }}>
            <SectionLabel tone="violet">REASONING</SectionLabel>
            <div style={{ borderLeft: "2px solid var(--violet)", padding: "2px 0 2px 13px" }}>
              <p
                style={{
                  font: "var(--text-sm)",
                  color: "var(--text-mid)",
                  margin: 0,
                  lineHeight: 1.7,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{model.judgeReasoning}&rdquo;
              </p>
            </div>
            <span
              className="mono flex items-center"
              style={{ fontSize: 11, color: "var(--text-muted)", gap: 7 }}
            >
              <JudgeOrb size={18} />
              {model.judgeModel} · {model.judgeTokens} tok
            </span>
          </div>

          <div
            className="flex flex-col"
            style={{ gap: 6, width: "100%", paddingTop: 4, borderTop: "1px solid var(--divider)" }}
          >
            <div className="flex items-baseline justify-between">
              <SectionLabel>COST VS BUDGET</SectionLabel>
              <span className="mono" style={{ fontSize: 11, color: model.cost.tone }}>
                {model.cost.verdict}
              </span>
            </div>
            <div className="flex items-baseline" style={{ gap: 6 }}>
              <span className="mono" style={{ fontSize: 15, color: "var(--text-hi)" }}>
                {model.costLabel}
              </span>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-low)" }}>
                / {model.budgetLabel}
              </span>
            </div>
            <CostBar fraction={model.cost.fraction} barColor={model.cost.barColor} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

/** One run of the agent's final answer — plain, heading-lifted, or mono code. */
function AnswerSpan({ seg }: { seg: AnswerSegment }) {
  if (!("tone" in seg)) {
    return <span>{seg.text}</span>;
  }
  if (seg.tone === "hi") {
    return <span style={{ color: "var(--text-hi)" }}>{seg.text}</span>;
  }
  return (
    <span className="mono" style={{ color: seg.color ?? "var(--text-hi)" }}>
      {seg.text}
    </span>
  );
}

function RubricRow({ criterion }: { criterion: RubricCriterion }) {
  const minor = criterion.verdict === "MINOR";
  const fail = criterion.verdict === "FAIL";
  const flagged = minor || fail;
  const accent = fail ? "var(--red)" : minor ? "var(--amber)" : "var(--phosphor)";

  return (
    <div
      className="flex items-center"
      style={{
        gap: 10,
        padding: "9px 12px",
        background: flagged
          ? "color-mix(in srgb, var(--amber) 8%, transparent)"
          : "var(--surface-panel)",
        border: flagged
          ? "1px solid color-mix(in srgb, var(--amber) 32%, transparent)"
          : "1px solid var(--divider)",
        borderRadius: "var(--radius-control)",
      }}
    >
      <span className="mono" style={{ fontSize: 14, color: accent, width: 14 }}>
        {flagged ? "✗" : "✓"}
      </span>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-low)" }}>
        {criterion.index}.
      </span>
      <span style={{ font: "var(--text-sm)", color: "var(--text-hi)", flex: 1 }}>
        {criterion.label}
      </span>
      <span className="mono" style={{ fontSize: 11, color: accent }}>
        {criterion.verdict}
      </span>
    </div>
  );
}

/** PASS/FAIL ring — full violet sweep with the verdict + score inside. */
function VerdictGauge({
  verdict,
  score,
  max,
  pass,
}: {
  verdict: string;
  score: number;
  max: number;
  pass: boolean;
}) {
  const circ = 2 * Math.PI * 60; // 376.99
  const fraction = max > 0 ? score / max : 0;
  const accent = pass ? "var(--violet)" : "var(--red)";
  return (
    <div style={{ position: "relative", width: 148, height: 148, flex: "none" }}>
      <svg viewBox="0 0 148 148" width={148} height={148} role="img" aria-label={`Judge ${verdict} ${score} of ${max}`}>
        <circle cx={74} cy={74} r={60} fill="none" stroke="var(--divider)" strokeWidth={10} />
        <circle
          cx={74}
          cy={74}
          r={60}
          fill="none"
          stroke={accent}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - fraction)}
          transform="rotate(-90 74 74)"
          style={{ filter: "drop-shadow(0 0 6px rgba(167,139,250,0.55))" }}
        />
      </svg>
      <div
        className="flex flex-col items-center justify-center"
        style={{ position: "absolute", inset: 0, gap: 2 }}
      >
        <span className="mono" style={{ font: "700 22px/1 var(--font-mono)", color: accent }}>
          {verdict}
        </span>
        <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)" }}>
          {score} / {max}
        </span>
        <SectionLabel style={{ fontSize: 9 }}>JUDGE SCORE</SectionLabel>
      </div>
    </div>
  );
}

function CostBar({ fraction, barColor }: { fraction: number; barColor: string }) {
  const capped = Math.min(1, fraction);
  return (
    <div
      style={{
        height: 6,
        borderRadius: 3,
        background: "var(--surface-panel)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${capped * 100}%`,
          background: barColor,
          boxShadow: "var(--glow-phosphor-sm)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -2,
          bottom: -2,
          left: "100%",
          width: 2,
          background: "var(--text-low)",
        }}
      />
    </div>
  );
}

/** The violet judge orb with the live ring, matching `.jorb.active`. */
function JudgeOrb({ size = 30 }: { size?: number }) {
  const showIcon = size >= 24;
  return (
    <>
      <span
        className="rb-jorb"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flex: "none",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--violet-16)",
          border: "1px solid color-mix(in srgb, var(--violet) 50%, transparent)",
          boxShadow: "0 0 14px rgba(167,139,250,0.22)",
        }}
      >
        {showIcon && (
          <Icon name="scale" size={Math.round(size * 0.5)} strokeWidth={1.7} style={{ color: "var(--violet)" }} />
        )}
      </span>
      <style href="rb-jorb" precedence="default">{`
        @keyframes rb-jorb-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .rb-jorb::after {
          content: ""; position: absolute; inset: -4px; border-radius: 50%;
          border: 1px solid color-mix(in srgb, var(--violet) 40%, transparent);
          animation: rb-jorb-ring 2.2s var(--ease-out) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-jorb::after { animation: none; }
        }
      `}</style>
    </>
  );
}
