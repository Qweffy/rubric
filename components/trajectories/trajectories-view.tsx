"use client";

import { useMemo, useState } from "react";

import { StatStrip } from "@/components/trajectories/stat-strip";
import { TaskList } from "@/components/trajectories/task-list";
import { ToolConfusion } from "@/components/trajectories/tool-confusion";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import  { type TrajectoryOutcome } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* View-model — the page maps lib/queries/trajectories into these.     */
/* ------------------------------------------------------------------ */

/** Sequence-match grade of the actual tool order vs. the golden reference. */
export type TrajectoryMatchKind = "EXACT" | "PARTIAL" | "DIVERGED";

/** Per-task status badge word. */
export type TrajectoryStatusKind = "PASSING" | "PARTIAL" | "REGRESSED";

export interface TrajectoryRow {
  id: number;
  taskId: string;
  suiteSlug: string;
  suiteTitle: string;
  expectedTools: string[];
  toolSelectionAccuracy: number;
  finalAnswerPass: boolean;
  outcome: TrajectoryOutcome;
  match: TrajectoryMatchKind;
  status: TrajectoryStatusKind;
  /** Amber/red drift line for non-EXACT rows; null for EXACT. */
  note: string | null;
}

export interface TrajectoryStats {
  total: number;
  goldenTarget: number;
  toolSelectionAccuracyPct: number;
  exactMatch: number;
  exactMatchPct: number;
  finalAnswerPass: number;
  finalAnswerPassPct: number;
  avgSteps: number;
  stepBudget: number;
}

export interface TrajectorySuiteHeader {
  slug: string;
  title: string;
  goldenTarget: number;
}

export interface TrajectoriesViewProps {
  rows: TrajectoryRow[];
  stats: TrajectoryStats;
  suite: TrajectorySuiteHeader;
}

/**
 * Overall PARTIAL/PASSING/REGRESSED chip beside the H1 — the worst outcome
 * across the set wins (a regression dominates a partial dominates a pass).
 */
function overallStatus(rows: TrajectoryRow[]): TrajectoryStatusKind | null {
  if (rows.length === 0) return null;
  if (rows.some((r) => r.status === "REGRESSED")) return "REGRESSED";
  if (rows.some((r) => r.status === "PARTIAL")) return "PARTIAL";
  return "PASSING";
}

/**
 * TrajectoriesView — the Agent Trajectories overview (M4). Header + suite tag +
 * overall status, a four-tile stat strip, then the tool-confusion heatmap beside
 * the golden-task list. Owns the All / Diverged segmented filter that scopes the
 * list. Mirrors "Rubric Agent Trajectories.dc.html".
 */
export function TrajectoriesView({ rows, stats, suite }: TrajectoriesViewProps) {
  const [scope, setScope] = useState<"all" | "diverged">("all");

  const overall = overallStatus(rows);
  const divergedRows = useMemo(
    () => rows.filter((r) => r.match !== "EXACT"),
    [rows],
  );
  const visibleRows = scope === "all" ? rows : divergedRows;

  return (
    <div
      className="min-h-full"
      style={{
        // void texture — radial violet dot-grid over the page surface
        backgroundColor: "var(--surface-page)",
        backgroundImage:
          "radial-gradient(rgba(167,139,250,0.045) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div style={{ padding: 24 }}>
        <div
          className="mx-auto flex flex-col"
          style={{ maxWidth: 1300, gap: 18 }}
        >
          {/* HEADER */}
          <header className="flex flex-wrap items-end justify-between" style={{ gap: 16 }}>
            <div className="flex flex-col" style={{ gap: 8 }}>
              <div className="flex items-center" style={{ gap: 12 }}>
                <h1
                  className="m-0"
                  style={{
                    font: "700 28px/1.05 var(--font-display)",
                    letterSpacing: "var(--tracking-display)",
                    color: "var(--text-hi)",
                  }}
                >
                  Agent Trajectories
                </h1>
                <Tag tone="violet" style={{ height: 24, letterSpacing: 0, fontSize: 11 }}>
                  {suite.slug}
                </Tag>
                {overall ? <StatusBadge status={overall} style={{ height: 24 }} /> : null}
              </div>
              <SectionLabel>
                M4 · {stats.goldenTarget} GOLDEN TASKS · v6
              </SectionLabel>
            </div>
            <div className="flex items-center" style={{ gap: 10 }}>
              <Tag
                tone="cyan"
                style={{ height: 36, padding: "0 12px", fontSize: 12 }}
              >
                main
              </Tag>
              <button
                type="button"
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
                <Icon name="play" size={16} strokeWidth={2} />
                Run trajectories
              </button>
            </div>
          </header>

          {/* STAT STRIP */}
          <StatStrip stats={stats} />

          {/* HEATMAP + TASKS */}
          <div
            className="grid items-start"
            style={{
              gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.25fr)",
              gap: 16,
            }}
          >
            <ToolConfusion />
            <TaskList
              rows={visibleRows}
              total={stats.total}
              divergedCount={divergedRows.length}
              stepBudget={stats.stepBudget}
              scope={scope}
              onScopeChange={setScope}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
