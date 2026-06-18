"use client";

import { useState } from "react";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";
import { type JudgeComparisonRow } from "@/lib/queries/calibration";

import { ComparisonTable } from "./comparison-table";
import { CostAccuracyScatter } from "./cost-accuracy-scatter";
import { InterJudgeMatrix } from "./inter-judge-matrix";
import {
  costFlaggedJudge,
  defaultJudge,
  formatCost,
  formatKappa,
  recommendedJudge,
} from "./lib";

/** The phosphor "Set default judge" / "Set as default" pill. */
function PrimaryButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap transition hover:brightness-110 active:brightness-95"
      style={{
        gap: 8,
        height: 36,
        padding: "0 14px",
        font: "600 13px/1 var(--font-ui)",
        color: "var(--bg-void)",
        background: "var(--phosphor)",
        border: "1px solid transparent",
        borderRadius: "var(--radius-control)",
        boxShadow: "var(--glow-phosphor)",
      }}
    >
      {icon ? <Icon name="check" size={16} /> : null}
      {children}
    </button>
  );
}

/** The outlined "Set as default" secondary pill. */
function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap transition hover:border-[var(--border-strong)]"
      style={{
        gap: 8,
        height: 36,
        padding: "0 14px",
        font: "600 13px/1 var(--font-ui)",
        color: "var(--text-hi)",
        background: "transparent",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-control)",
      }}
    >
      {children}
    </button>
  );
}

/** The phosphor RECOMMENDED banner with the value pitch derived from the rows. */
function RecommendationBanner({
  recommended,
  base,
  onSetDefault,
}: {
  recommended: JudgeComparisonRow;
  base: JudgeComparisonRow | null;
  onSetDefault: () => void;
}) {
  // The pitch contrasts the value pick against the current default: cost ratio
  // and the κ it trades away — all from the seeded numbers, none hardcoded.
  const costRatio =
    base?.costPer1k != null &&
    recommended.costPer1k != null &&
    recommended.costPer1k > 0
      ? base.costPer1k / recommended.costPer1k
      : null;
  const kappaDelta =
    base?.kappa != null && recommended.kappa != null
      ? recommended.kappa - base.kappa
      : null;

  return (
    <Card
      glow
      padding={false}
      className="flex items-center"
      style={{
        borderColor: "var(--border-strong)",
        gap: 16,
        padding: "16px 18px",
        flexDirection: "row",
      }}
    >
      <RubricIllustration name="judge-orb-active" size={48} style={{ flex: "none" }} />
      <div className="flex flex-1 flex-col" style={{ gap: 5 }}>
        <SectionLabel tone="phosphor">RECOMMENDED</SectionLabel>
        <span style={{ font: "var(--text-base)", color: "var(--text-hi)" }}>
          <span className="mono" style={{ color: "var(--violet)" }}>
            {recommended.judgeName}
          </span>{" "}
          — best κ-per-dollar: κ {formatKappa(recommended.kappa)} at{" "}
          {formatCost(recommended.costPer1k)}/1k
          {costRatio != null && kappaDelta != null && base != null ? (
            <>
              , ~{costRatio >= 1.9 && costRatio <= 2.1 ? "half" : `1/${costRatio.toFixed(1)}`}{" "}
              the cost of {base.judgeName} for{" "}
              {kappaDelta < 0 ? "−" : "+"}
              {Math.abs(kappaDelta).toFixed(2)} κ.
            </>
          ) : (
            <>.</>
          )}
        </span>
      </div>
      <SecondaryButton onClick={onSetDefault}>Set as default</SecondaryButton>
    </Card>
  );
}

export interface ModelComparisonViewProps {
  judges: JudgeComparisonRow[];
  /** Shared labeled-pair count from calibration (the "420 LABELED PAIRS" anchor). */
  labeledPairs: number | null;
}

/**
 * Model Comparison — the accuracy-per-cost bench (M2). Renders the judge
 * comparison table, the inter-judge agreement matrix, and the cost-vs-accuracy
 * scatter, with a loud RECOMMENDED banner pinning the value pick. The default
 * judge is highlighted; the cheap-but-lenient judge is cost-flagged. All numbers
 * come from the seeded query rows; the matrix and scatter are derived in lib.ts.
 *
 * Below two labeled judges the board can't compare anything, so it falls back to
 * the "need at least two judges" empty state.
 */
export function ModelComparisonView({
  judges,
  labeledPairs,
}: ModelComparisonViewProps) {
  const recommended = recommendedJudge(judges);
  const fallbackDefault = defaultJudge(judges);
  const flagged = costFlaggedJudge(judges);

  // Selection drives the row highlight + the matrix row/column emphasis. Seed it
  // to the recommended judge (the screen's hero) when present.
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(
    recommended?.judgeId ?? fallbackDefault?.judgeId ?? null,
  );

  const labeled = judges.filter((j) => j.kappa != null);
  const hasComparison = labeled.length >= 2;

  return (
    <div style={{ padding: 24 }}>
      <div className="mx-auto flex flex-col" style={{ maxWidth: 1280, gap: 18 }}>
        {/* HEADER */}
        <div className="flex items-end justify-between" style={{ gap: 16 }}>
          <div>
            <h1
              style={{
                font: "var(--text-h1)",
                letterSpacing: "var(--tracking-display)",
                color: "var(--text-hi)",
                margin: "0 0 8px",
              }}
            >
              Judge Comparison
            </h1>
            <SectionLabel>
              M2
              {labeledPairs != null ? ` · ${labeledPairs} LABELED PAIRS` : ""} ·{" "}
              {judges.length} JUDGES · CHECKOUT-EXTRACTION
            </SectionLabel>
          </div>
          <PrimaryButton icon>Set default judge</PrimaryButton>
        </div>

        {!hasComparison ? (
          <Card padding={false}>
            <EmptyState
              illustration="judge-orb-idle"
              title="Need at least two judges"
              description="Run a second judge over the same labeled set to compare."
              action="Add a judge"
              actionIcon="play"
            />
          </Card>
        ) : (
          <>
            {/* RECOMMENDATION BANNER */}
            {recommended ? (
              <RecommendationBanner
                recommended={recommended}
                base={fallbackDefault}
                onSetDefault={() => setSelectedJudgeId(recommended.judgeId)}
              />
            ) : null}

            {/* COMPARISON TABLE */}
            <Card
              padding={false}
              header="JUDGES"
              actions={
                <span
                  className="mono"
                  style={{ font: "500 11px/1 var(--font-mono)", color: "var(--text-muted)" }}
                >
                  {judges.length} judges · same{" "}
                  {labeledPairs != null ? `${labeledPairs}-pair` : "labeled"} set
                </span>
              }
            >
              <ComparisonTable
                judges={judges}
                selectedJudgeId={selectedJudgeId}
                recommendedId={recommended?.judgeId ?? null}
                flaggedId={flagged?.judgeId ?? null}
                onSelect={setSelectedJudgeId}
              />
            </Card>

            {/* MATRIX + SCATTER */}
            <div
              className={cn("grid items-start")}
              style={{
                gridTemplateColumns: "minmax(0,0.82fr) minmax(0,1fr)",
                gap: 16,
              }}
            >
              <Card
                padding={false}
                header="INTER-JUDGE AGREEMENT"
                actions={
                  <span
                    className="mono"
                    style={{
                      font: "500 11px/1 var(--font-mono)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {judges.length} × {judges.length}
                  </span>
                }
              >
                <InterJudgeMatrix
                  judges={judges}
                  selectedJudgeId={selectedJudgeId}
                />
              </Card>

              <Card
                padding={false}
                header="COST vs ACCURACY"
                actions={
                  <span
                    className="mono"
                    style={{
                      font: "500 11px/1 var(--font-mono)",
                      color: "var(--text-muted)",
                    }}
                  >
                    κ per $/1k
                  </span>
                }
              >
                <CostAccuracyScatter
                  judges={judges}
                  recommendedId={recommended?.judgeId ?? null}
                  defaultId={fallbackDefault?.judgeId ?? null}
                  flaggedId={flagged?.judgeId ?? null}
                />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
