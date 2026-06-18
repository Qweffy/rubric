"use client";

import { type CSSProperties } from "react";

import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { type JudgeStatus } from "@/db/schema";
import { cn } from "@/lib/cn";
import { type JudgeComparisonRow } from "@/lib/queries/calibration";

import {
  formatAgreement,
  formatBias,
  formatCost,
  formatKappa,
  formatLatency,
} from "./lib";

// The 8-column grid template is shared by the header row and every data row so
// the columns stay aligned. Ported 1:1 from the .dc.html grid-template.
const GRID =
  "minmax(200px,1.3fr) 88px 96px 86px 84px 84px 96px minmax(0,1fr)";

/** The mono status word shown in the STATUS badge — exhaustive over JudgeStatus. */
function statusLabel(status: JudgeStatus): string {
  switch (status) {
    case "aligned":
      return "ALIGNED";
    case "under-calibrated":
      return "UNDER-CALIBRATED";
    case "biased":
      return "BIASED";
    case "drifted":
      return "DRIFTED";
  }
}

const COLUMNS = [
  "JUDGE",
  "κ",
  "AGREEMENT",
  "FALSE-PASS",
  "POS-BIAS",
  "COST/1K",
  "LAT p50",
  "STATUS",
] as const;

/** A small violet ring whose fill encodes κ (0-1), with the κ value beside it. */
function KappaRing({ kappa, flagged }: { kappa: number | null; flagged: boolean }) {
  const value = kappa ?? 0;
  const r = 12.5;
  const circ = 2 * Math.PI * r; // 78.5
  const offset = circ * (1 - Math.max(0, Math.min(1, value)));
  const ringColor = flagged ? "var(--amber)" : "var(--violet)";
  const trackColor = flagged ? "var(--amber-14)" : "var(--violet-16)";
  // The κ readout is phosphor when strong, amber when the judge is flagged,
  // hi-contrast for the mid pack — color is paired with the mono number.
  const valueColor = flagged
    ? "var(--amber)"
    : value >= 0.78
      ? "var(--phosphor)"
      : "var(--text-hi)";

  return (
    <div className="flex items-center" style={{ gap: 7 }}>
      <svg viewBox="0 0 32 32" width={30} height={30} aria-hidden="true">
        <circle cx={16} cy={16} r={r} fill="none" stroke={trackColor} strokeWidth={3} />
        <circle
          cx={16}
          cy={16}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 16 16)"
        />
      </svg>
      <span
        className="mono"
        style={{
          font: "600 14px/1 var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          color: valueColor,
        }}
      >
        {formatKappa(kappa)}
      </span>
    </div>
  );
}

function Cell({
  children,
  color = "var(--text-mid)",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="mono"
      style={{
        font: "500 13px/1.35 var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        color,
      }}
    >
      {children}
    </span>
  );
}

interface JudgeRowProps {
  judge: JudgeComparisonRow;
  selected: boolean;
  recommended: boolean;
  flagged: boolean;
  onSelect: () => void;
}

function JudgeRow({ judge, selected, recommended, flagged, onSelect }: JudgeRowProps) {
  const biasFlagged = (judge.posBias ?? 0) >= 0.3;
  const fpColor =
    (judge.falsePass ?? 0) >= 20
      ? "var(--red)"
      : (judge.falsePass ?? 0) >= 10
        ? "var(--text-mid)"
        : "var(--text-mid)";

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: GRID,
    gap: 12,
    alignItems: "center",
    padding: "11px 14px",
    background: selected ? "var(--phosphor-08)" : "var(--surface-card)",
    border: `1px solid ${
      selected
        ? "var(--border-strong)"
        : flagged
          ? "color-mix(in srgb, var(--amber) 30%, transparent)"
          : "var(--border)"
    }`,
    borderRadius: "var(--radius-card)",
    boxShadow: selected ? "var(--glow-phosphor-sm)" : undefined,
    cursor: "pointer",
    transition: "border-color var(--dur-fast), background var(--dur-fast)",
    textAlign: "left",
  };

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="rb-judge-row"
      style={rowStyle}
    >
      <span className="flex items-center" style={{ gap: 9 }}>
        <Icon name="bot" size={16} strokeWidth={1.5} style={{ color: "var(--violet)" }} />
        <span
          className="mono"
          style={{ font: "500 13px/1 var(--font-mono)", color: "var(--text-hi)" }}
        >
          {judge.judgeName}
        </span>
      </span>

      <KappaRing kappa={judge.kappa} flagged={flagged} />

      <Cell color="var(--text-hi)">{formatAgreement(judge.agreement)}</Cell>
      <Cell color={fpColor}>{judge.falsePass ?? "—"}</Cell>
      <Cell color={biasFlagged ? "var(--amber)" : "var(--text-mid)"}>
        {formatBias(judge.posBias)}
      </Cell>
      <Cell color="var(--text-hi)">{formatCost(judge.costPer1k)}</Cell>
      <Cell>{formatLatency(judge.latencyP50Ms)}</Cell>

      <span className="flex items-center" style={{ gap: 8 }}>
        <StatusBadge status={statusLabel(judge.status)} />
        {judge.isDefault ? <Tag tone="cyan">DEFAULT</Tag> : null}
        {recommended ? <Tag tone="phosphor">RECOMMENDED</Tag> : null}
        {flagged ? (
          <Tag tone="amber" style={{ letterSpacing: 0 }}>
            COST-FLAGGED · cheap but lenient
          </Tag>
        ) : null}
      </span>
    </button>
  );
}

export interface ComparisonTableProps {
  judges: JudgeComparisonRow[];
  selectedJudgeId: number | null;
  recommendedId: number | null;
  flaggedId: number | null;
  onSelect: (judgeId: number) => void;
}

/**
 * The 4-judge comparison table — one row per judge, κ ring + the calibration
 * columns (agreement, false-pass, pos-bias, cost, latency) + status. The
 * default judge carries a cyan DEFAULT tag, the value pick a phosphor
 * RECOMMENDED tag, and the cheap-but-lenient judge an amber COST-FLAGGED row.
 */
export function ComparisonTable({
  judges,
  selectedJudgeId,
  recommendedId,
  flaggedId,
  onSelect,
}: ComparisonTableProps) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          gap: 12,
          alignItems: "center",
          padding: "8px 16px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        {COLUMNS.map((label) => (
          <span
            key={label}
            className={cn("hr-label")}
            style={{
              font: "600 10px/1 var(--font-mono)",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--text-low)",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        className="flex flex-col"
        style={{ gap: 8, padding: 10 }}
      >
        {judges.map((judge) => (
          <JudgeRow
            key={judge.judgeId}
            judge={judge}
            selected={judge.judgeId === selectedJudgeId}
            recommended={judge.judgeId === recommendedId}
            flagged={judge.judgeId === flaggedId}
            onSelect={() => onSelect(judge.judgeId)}
          />
        ))}
      </div>

      <style href="rb-judge-row" precedence="default">{`
        .rb-judge-row:hover { border-color: var(--border-strong); }
        .rb-judge-row:focus-visible {
          outline: 2px solid var(--focus-ring);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
