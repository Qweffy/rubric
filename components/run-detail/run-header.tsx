"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBadge, type StatusValue } from "@/components/ui/status-badge";
import { type RunSummary } from "@/lib/queries/runs";

/** Map a run status to the header badge. A failed run shows the red FAIL badge. */
const STATUS_BADGE: Record<RunSummary["status"], StatusValue> = {
  running: "RUNNING",
  completed: "PASS",
  failed: "FAIL",
};

/** Format a wall-clock duration in ms as a compact "38s" / "1m 04s". */
function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/** UTC HH:MM readout, matching the design's "09:12 UTC". */
function formatUtc(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

export interface RunHeaderProps {
  summary: RunSummary;
  /** The prior run this run diffs against — shown in the DIFF toggle + Open-gate. */
  baselineRunId: number;
  mode: "absolute" | "diff";
  onModeChange: (mode: "absolute" | "diff") => void;
}

/**
 * RunHeader — the sticky glass sub-bar atop the run inspector. Title + status
 * badge + a mono provenance line (sha · version · branch · time · duration ·
 * cost), with the ABSOLUTE / DIFF value-mode toggle, an Open-gate link and a
 * Re-run action on the right.
 */
export function RunHeader({ summary, baselineRunId, mode, onModeChange }: RunHeaderProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--glass)",
        backdropFilter: "blur(var(--blur-glass))",
        WebkitBackdropFilter: "blur(var(--blur-glass))",
        borderBottom: "1px solid var(--border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <h2
          style={{
            font: "600 22px/1.1 var(--font-display)",
            letterSpacing: "var(--tracking-display)",
            color: "var(--text-hi)",
            margin: 0,
          }}
        >
          Run #{summary.id}
        </h2>
        <StatusBadge status={STATUS_BADGE[summary.status]} style={{ height: 22 }} />
        <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
          <Link href="#" style={{ color: "var(--cyan)", textDecoration: "none" }}>
            {summary.sha}
          </Link>{" "}
          · {summary.promptLabel} · {summary.branch} · {formatUtc(summary.startedAt)} ·{" "}
          {formatDuration(summary.wallMs)} · ${summary.costUsd.toFixed(2)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SegmentedControl
          options={[
            { value: "absolute", label: "Absolute" },
            { value: "diff", label: `Diff vs #${baselineRunId}` },
          ]}
          value={mode}
          onChange={(v) => onModeChange(v as "absolute" | "diff")}
        />
        <Link
          href="#"
          style={{ font: "var(--mono-sm)", fontSize: 13, color: "var(--cyan)", textDecoration: "none" }}
        >
          Open gate
        </Link>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center"
          style={{
            gap: 8,
            height: 30,
            padding: "0 11px",
            background: "transparent",
            border: "none",
            borderRadius: "var(--radius-control)",
            color: "var(--text-body)",
            font: "600 12px/1 var(--font-ui)",
          }}
        >
          <Icon name="refresh-cw" size={16} strokeWidth={1.5} />
          Re-run
        </button>
      </div>
    </div>
  );
}
