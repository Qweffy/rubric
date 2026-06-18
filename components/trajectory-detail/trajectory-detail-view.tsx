"use client";

import { useMemo, useState } from "react";

import { AlignedTimeline } from "@/components/trajectory-detail/aligned-timeline";
import { FinalAnswerJudge } from "@/components/trajectory-detail/final-answer-judge";
import {
  buildTrajectoryModel,
  type TrajectoryStepView,
} from "@/components/trajectory-detail/model";
import { Dot, MonoStyle } from "@/components/trajectory-detail/shared";
import { StepDrawer } from "@/components/trajectory-detail/step-drawer";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { type TrajectoryDetail } from "@/lib/queries/trajectories";

export interface TrajectoryDetailViewProps {
  /** Logical task id from the route. */
  taskId: string;
  /** Loaded trajectory, or null when the taskId is unknown / not yet run. */
  detail: TrajectoryDetail | null;
  /** `?step=` deep link — selects the actual call the drawer opens on. */
  initialStepIdx: number | null;
}

/**
 * TrajectoryDetailView — the per-task expected↔actual trace. Renders inside the
 * persistent app shell (provided by `app/(app)/layout.tsx`), so it emits only the
 * routed content: the header, summary strip, dual-track aligned timeline, the
 * step drawer, and the outcome-only final-answer judge. It owns which step the
 * drawer focuses (defaulting to the first divergence). All numbers come from the
 * seeded query; derived presentational detail (per-call latency/cost/tokens,
 * judge copy) is computed deterministically from that data in `model.ts`.
 */
export function TrajectoryDetailView({
  taskId,
  detail,
  initialStepIdx,
}: TrajectoryDetailViewProps) {
  if (!detail) {
    return <TrajectoryEmpty taskId={taskId} />;
  }

  return (
    <TrajectoryDetailBody detail={detail} initialStepIdx={initialStepIdx} />
  );
}

/* ------------------------------------------------------------------ */
/* Empty — taskId resolved but no trace for this version.              */
/* ------------------------------------------------------------------ */

function TrajectoryEmpty({ taskId }: { taskId: string }) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <MonoStyle />
      <Card
        className="items-center justify-center text-center"
        style={{ width: 420, minHeight: 340, gap: 18, padding: 32 }}
      >
        <EmptyState
          illustration="empty-board"
          title="No trace captured"
          description={
            <span className="mono" style={{ color: "var(--text-muted)" }}>
              This task hasn&apos;t been run on v6.
            </span>
          }
          action="Run task"
        />
        <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          {taskId}
        </span>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Body — the populated detail screen.                                 */
/* ------------------------------------------------------------------ */

function TrajectoryDetailBody({
  detail,
  initialStepIdx,
}: {
  detail: TrajectoryDetail;
  initialStepIdx: number | null;
}) {
  const model = useMemo(() => buildTrajectoryModel(detail), [detail]);

  // Default focus: the explicitly deep-linked actual step if it exists,
  // otherwise the first divergence (the inserted redundant call).
  const deepLinked = model.steps.find(
    (s) => s.actualIdx != null && s.actualIdx === initialStepIdx,
  );
  const [focusedKey, setFocusedKey] = useState<string>(
    (deepLinked ?? model.defaultStep).key,
  );

  const focused =
    model.steps.find((s) => s.key === focusedKey) ?? model.defaultStep;

  return (
    <div style={{ padding: 24 }}>
      <MonoStyle />
      <div
        className="mx-auto flex flex-col"
        style={{ maxWidth: 1320, gap: 18 }}
      >
        <DetailHeader model={model} />
        <SummaryStrip model={model} />

        <div
          className="grid items-start"
          style={{
            gridTemplateColumns: "minmax(0,1.32fr) minmax(0,0.82fr)",
            gap: 16,
          }}
        >
          <AlignedTimeline
            model={model}
            focusedKey={focused.key}
            onFocus={setFocusedKey}
          />
          <StepDrawer
            step={focused}
            otherActual={model.steps.filter(
              (s) => s.actualLabel != null && s.key !== focused.key,
            )}
            onFocus={(key: string) => setFocusedKey(key)}
          />
        </div>

        <FinalAnswerJudge model={model} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function DetailHeader({
  model,
}: {
  model: ReturnType<typeof buildTrajectoryModel>;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between" style={{ gap: 16 }}>
      <div className="flex flex-col" style={{ gap: 9 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <h2
            style={{
              font: "700 24px/1.1 var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--text-hi)",
              margin: 0,
            }}
          >
            {model.taskId}
            <span style={{ color: "var(--text-low)", fontWeight: 500 }}>
              {" · "}
              {model.suiteTitle}
            </span>
          </h2>
          <StatusBadge status={model.headlineStatus} style={{ height: 24 }} />
        </div>
        <span
          className="mono"
          style={{ fontSize: 13, color: "var(--text-muted)" }}
        >
          {model.versionLabel} · {model.actualCount} steps · budget{" "}
          {model.stepBudget} · {model.costLabel}
        </span>
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        <a
          href="#final-answer"
          className="mono"
          style={{
            fontSize: 13,
            color: "var(--cyan)",
            textDecoration: "none",
          }}
        >
          Open final answer ↘
        </a>
        <button type="button" className="rb-btn rb-btn-secondary">
          Re-run
        </button>
        <button
          type="button"
          className="rb-btn rb-btn-ghost"
          aria-label="More actions"
          style={{ width: 32, padding: 0, border: "1px solid var(--border)" }}
        >
          <Icon name="more-vertical" size={16} />
        </button>
      </div>
      <ButtonStyles />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Summary strip                                                       */
/* ------------------------------------------------------------------ */

function SummaryStrip({
  model,
}: {
  model: ReturnType<typeof buildTrajectoryModel>;
}) {
  return (
    <Card padding={false}>
      <div
        className="flex flex-wrap items-center"
        style={{ gap: 26, padding: "16px 18px" }}
      >
        <Stat>
          <SectionLabel>TOOL-ACCURACY</SectionLabel>
          <span
            className="mono"
            style={{ font: "600 30px/1 var(--font-mono)", color: "var(--violet)" }}
          >
            {model.toolAccuracyWhole}
            <span style={{ fontSize: 16, color: "var(--text-muted)" }}>
              .{model.toolAccuracyFraction}%
            </span>
          </span>
        </Stat>
        <Divider />
        <Stat>
          <SectionLabel>FIRST DIVERGENCE</SectionLabel>
          <span
            className="mono"
            style={{
              font: "600 18px/1.1 var(--font-mono)",
              color: "var(--amber)",
            }}
          >
            step {model.firstDivergenceStep}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            {model.firstDivergenceLabel}
          </span>
        </Stat>
        <Divider />
        <Stat>
          <SectionLabel>ALIGNMENT</SectionLabel>
          <span
            className="mono"
            style={{ fontSize: 13, color: "var(--text-hi)" }}
          >
            {model.counts.match} match ·{" "}
            <span style={{ color: "var(--amber)" }}>
              {model.counts.insert} insert
            </span>{" "}
            · {model.counts.delete} del
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--text-muted)" }}
          >
            {model.actualCount} actual / {model.expectedCount} expected
          </span>
        </Stat>
        <Divider />
        <Stat>
          <SectionLabel>FINAL ANSWER</SectionLabel>
          <span
            className="mono flex items-center"
            style={{
              font: "600 16px/1.1 var(--font-mono)",
              color: "var(--violet)",
              gap: 6,
            }}
          >
            <Dot color="var(--violet)" />
            {model.finalAnswerVerdict}{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              · judge {model.judgeScore}/{model.judgeMax}
            </span>
          </span>
        </Stat>
        <div style={{ flex: 1 }} />
        <div
          className="flex flex-col"
          style={{ gap: 5, minWidth: 160 }}
        >
          <div className="flex items-baseline justify-between">
            <SectionLabel>COST</SectionLabel>
            <span
              className="mono"
              style={{ fontSize: 11, color: model.cost.tone }}
            >
              {model.cost.verdict}
            </span>
          </div>
          <span className="mono" style={{ fontSize: 14, color: "var(--text-hi)" }}>
            {model.costLabel}{" "}
            <span style={{ color: "var(--text-low)" }}>
              / {model.budgetLabel}
            </span>
          </span>
          <BudgetBar fraction={model.cost.fraction} tone={model.cost.barColor} />
        </div>
      </div>
    </Card>
  );
}

function Stat({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ width: 1, height: 40, background: "var(--divider)" }} />
  );
}

function BudgetBar({ fraction, tone }: { fraction: number; tone: string }) {
  return (
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
          height: "100%",
          width: `${Math.min(100, fraction * 100)}%`,
          background: tone,
          boxShadow: "var(--glow-phosphor-sm)",
        }}
      />
    </div>
  );
}

/* Shared button styling — mirrors the .btn primitives in the handoff so the
   header actions match without raw hex (token vars only). */
function ButtonStyles() {
  return (
    <style href="rb-traj-detail-buttons" precedence="default">{`
      .rb-btn {
        display: inline-flex; align-items: center; justify-content: center;
        gap: 8px; height: 30px; padding: 0 11px; border-radius: var(--radius-control);
        font: 600 12px/1 var(--font-ui); border: 1px solid transparent;
        cursor: pointer; white-space: nowrap; background: transparent;
      }
      .rb-btn-secondary { color: var(--text-hi); border-color: var(--border-strong); }
      .rb-btn-ghost { color: var(--text-body); }
    `}</style>
  );
}

export type { TrajectoryStepView };
