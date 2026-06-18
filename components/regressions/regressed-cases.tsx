"use client";

import { type KeyboardEvent } from "react";

import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";

export interface RegressedCaseModel {
  caseId: string;
  label: string;
  scorer: string;
  why: string;
  fromVerdict: "PASS";
  toVerdict: "FAIL";
}

export interface RegressedCasesProps {
  cases: RegressedCaseModel[];
  count: number;
  baseLabel: string;
  headLabel: string;
  selectedId: string | null;
  onSelect: (caseId: string) => void;
}

/** The shared 5-column track: CASE · SCORER · vBASE · vHEAD · WHY. */
const GRID = "minmax(150px,1.3fr) 110px 56px 56px minmax(0,1.1fr)";

const COL_HEADER: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "var(--text-low)",
};

/**
 * RegressedCases — the left "REGRESSED · N (PASS→FAIL)" card. A header row of
 * column labels over a list of selectable case rows; the selected row gets the
 * red wash + rail. Enter on a focused row "opens case detail" (the design's
 * affordance), surfaced here as the selection callback.
 */
export function RegressedCases({
  cases,
  count,
  baseLabel,
  headLabel,
  selectedId,
  onSelect,
}: RegressedCasesProps) {
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
      {/* card head */}
      <div
        className="flex items-center justify-between gap-3"
        style={{ padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel style={{ color: "var(--red)" }}>
          {`REGRESSED · ${String(count)} (PASS→FAIL)`}
        </SectionLabel>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          Enter → case detail
        </span>
      </div>

      {/* column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          gap: 10,
          padding: "8px 14px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <span style={COL_HEADER}>CASE</span>
        <span style={COL_HEADER}>SCORER</span>
        <span style={COL_HEADER}>{baseLabel}</span>
        <span style={COL_HEADER}>{headLabel}</span>
        <span style={COL_HEADER}>WHY</span>
      </div>

      {/* rows */}
      <div className="flex flex-col" style={{ gap: 6, padding: 8 }}>
        {cases.map((c) => (
          <CaseRow
            key={c.caseId}
            model={c}
            selected={c.caseId === selectedId}
            onSelect={() => onSelect(c.caseId)}
          />
        ))}
      </div>
    </div>
  );
}

interface CaseRowProps {
  model: RegressedCaseModel;
  selected: boolean;
  onSelect: () => void;
}

function CaseRow({ model, selected, onSelect }: CaseRowProps) {
  const handleKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={handleKey}
      className={cn(
        "cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--glow-phosphor-sm)]",
      )}
      style={{
        display: "grid",
        gridTemplateColumns: GRID,
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        position: "relative",
        background: selected ? "var(--red-14)" : "var(--bg-raised)",
        border: `1px solid ${selected ? "color-mix(in srgb, var(--red) 38%, transparent)" : "var(--border)"}`,
        borderRadius: "var(--radius-card)",
        boxShadow: selected ? "var(--glow-phosphor-sm)" : undefined,
        transition:
          "border-color var(--dur-fast), box-shadow var(--dur), background var(--dur-fast)",
      }}
    >
      {/* CASE — id + label */}
      <div className="flex min-w-0 flex-col" style={{ gap: 1 }}>
        <span
          className="mono truncate"
          style={{ fontSize: 12, color: "var(--text-hi)", fontFamily: "var(--font-mono)" }}
        >
          {model.caseId}
        </span>
        <span
          className="mono truncate"
          style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {model.label}
        </span>
      </div>

      {/* SCORER */}
      <span>
        <Tag tone="neutral" style={{ letterSpacing: 0 }}>
          {model.scorer}
        </Tag>
      </span>

      {/* vBASE verdict */}
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--phosphor)", fontFamily: "var(--font-mono)" }}
      >
        {model.fromVerdict}
      </span>

      {/* vHEAD verdict */}
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--red)", fontFamily: "var(--font-mono)" }}
      >
        {model.toVerdict}
      </span>

      {/* WHY */}
      <span
        className="mono truncate"
        style={{ fontSize: 11, color: "var(--text-mid)", fontFamily: "var(--font-mono)" }}
      >
        {model.why}
      </span>
    </div>
  );
}
