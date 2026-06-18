"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { type CaseDetail } from "@/lib/queries/cases";

import { CaseActualDiff } from "./case-actual-diff";
import { CaseBlobCode } from "./case-blob-code";
import { type HumanLabelState } from "./judge-panel";
import { ScorersPanel } from "./scorers-panel";

export interface CaseDetailViewProps {
  detail: CaseDetail;
  /** Route params for breadcrumb links (the suite + run the case lives under). */
  suiteId: string;
  runId: string;
  /**
   * The case's canonical human gold label, when one exists. Drives the
   * judge-disagrees (diverged) and awaiting-human states. Absent means the
   * default agreed/quiet judge panel.
   */
  humanLabel?: "pass" | "fail" | null;
  /** True when no human label has been recorded yet (awaiting review). */
  awaitingHuman?: boolean;
}

/** A variable line `key=value` extracted from the input blob, if present. */
interface InputVariable {
  key: string;
  value: string;
}

/** Pull a flat record of string/number/boolean entries off an opaque blob. */
function readVariables(input: unknown): InputVariable[] {
  if (input == null || typeof input !== "object" || Array.isArray(input)) return [];
  const record = input as Record<string, unknown>;
  const vars: InputVariable[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      vars.push({ key, value: String(value) });
    }
  }
  return vars;
}

/** The phosphor-spotlit line in EXPECTED — the required field the case hinges on. */
function expectedHighlightLines(expected: unknown): number[] {
  if (expected == null || typeof expected !== "object" || Array.isArray(expected)) return [];
  const requires = (expected as Record<string, unknown>).requires;
  if (typeof requires !== "string") return [];
  const text = JSON.stringify(expected, null, 2);
  const lines = text.split("\n");
  const out: number[] = [];
  lines.forEach((line, i) => {
    if (line.includes(`"requires"`) || line.includes(requires)) out.push(i + 1);
  });
  return out;
}

/** Pane shell — the flush card with a mono header label and optional right slot. */
function Pane({
  label,
  right,
  children,
}: {
  label: string;
  right?: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel>{label}</SectionLabel>
        {right}
      </div>
      {children}
    </div>
  );
}

export function CaseDetailView({
  detail,
  suiteId,
  runId,
  humanLabel = null,
  awaitingHuman = false,
}: CaseDetailViewProps): ReactNode {
  const [diffMode, setDiffMode] = useState<"expected" | "prior">("expected");

  const failed = detail.verdict === "fail";
  const skipped = detail.verdict === "skipped";
  const hasActual = detail.actual != null;

  const variables = useMemo(() => readVariables(detail.input), [detail.input]);
  const highlight = useMemo(() => expectedHighlightLines(detail.expected), [detail.expected]);

  // The case regressed when a scorer flipped pass→fail vs the prior run. The
  // flipped scorer's prior side is the "was PASS" story the header surfaces.
  const flippedScorer = detail.scorers.find((s) => s.flippedFrom === "pass");

  // Judge-vs-human divergence: when a human gold label exists and contradicts
  // the judge's binary verdict, the judge panel goes amber (judge-disagrees).
  const judge = detail.judgeVerdicts[0];
  const human: HumanLabelState = useMemo(() => {
    if (awaitingHuman) return { kind: "pending" };
    if (humanLabel == null) return { kind: "none" };
    if (judge == null) return { kind: "agreed", label: humanLabel };
    const judgeLabel: "pass" | "fail" = judge.pass ? "pass" : "fail";
    return judgeLabel === humanLabel
      ? { kind: "agreed", label: humanLabel }
      : { kind: "diverged", label: humanLabel };
  }, [awaitingHuman, humanLabel, judge]);

  const runLabel = `run #${runId}`;

  return (
    <div className="hr-void" style={{ minHeight: "100%" }}>
      {/* header */}
      <div
        className="flex items-center"
        style={{
          gap: 14,
          minHeight: 56,
          padding: "0 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--glass)",
          backdropFilter: "blur(var(--blur-glass))",
          WebkitBackdropFilter: "blur(var(--blur-glass))",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div
          className="flex items-center"
          style={{ gap: 8, font: "var(--mono-sm)", fontSize: 13 }}
        >
          <Link
            href={`/suites/${suiteId}/runs/${runId}`}
            style={{ color: "var(--cyan)", textDecoration: "none" }}
          >
            {runLabel}
          </Link>
          <span style={{ color: "var(--text-low)" }}>/</span>
          <span style={{ color: "var(--phosphor)" }}>{detail.caseId}</span>
        </div>
        <StatusBadge
          status={skipped ? "SKIPPED" : failed ? "FAIL" : "PASS"}
          label={skipped ? "SKIPPED" : failed ? "FAIL" : "PASS"}
        />
        {detail.label != null && (
          <span style={{ font: "var(--text-base)", color: "var(--text-body)" }}>
            {detail.label}
          </span>
        )}
        {flippedScorer != null && (
          <Tag tone="red">was PASS on prior version</Tag>
        )}
        <span className="flex-1" />
        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap"
          style={{
            height: 30,
            gap: 8,
            padding: "0 11px",
            font: "600 12px/1 var(--font-ui)",
            color: "var(--bg-void)",
            background: "var(--phosphor)",
            border: "1px solid transparent",
            borderRadius: "var(--radius-control)",
            boxShadow: "var(--glow-phosphor)",
          }}
        >
          <Icon name="star" size={16} style={{ color: "var(--bg-void)" }} />
          Promote to golden
        </button>
      </div>

      {/* body */}
      <div style={{ padding: 24 }}>
        <div
          className="flex flex-col"
          style={{ gap: 16, maxWidth: 1280, margin: "0 auto" }}
        >
          <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
            {detail.suiteTitle} / {runLabel} · {detail.promptLabel} · {detail.sha.slice(0, 7)}
          </span>

          {/* 3-pane I/O */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Pane label="INPUT">
              <CaseBlobCode value={detail.input} />
              {variables.length > 0 && (
                <div style={{ borderTop: "1px solid var(--divider)", padding: "10px 12px" }}>
                  <SectionLabel style={{ marginBottom: 8 }}>VARIABLES</SectionLabel>
                  <div className="flex flex-col" style={{ gap: 4 }}>
                    {variables.map((v) => (
                      <span
                        key={v.key}
                        style={{ font: "500 12px/1.4 var(--font-mono)", color: "var(--text-body)" }}
                      >
                        <span style={{ color: "var(--cyan)" }}>{v.key}</span>={v.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Pane>

            <Pane
              label="EXPECTED"
              right={
                <span style={{ font: "var(--mono-sm)", color: "var(--text-muted)", fontSize: 11 }}>
                  golden
                </span>
              }
            >
              <CaseBlobCode value={detail.expected} highlightLines={highlight} />
            </Pane>

            <Pane
              label={`ACTUAL (${detail.promptLabel})`}
              right={
                hasActual ? (
                  <SegmentedControl
                    size="sm"
                    value={diffMode}
                    onChange={(v) => setDiffMode(v === "prior" ? "prior" : "expected")}
                    options={[
                      { value: "expected", label: "Diff vs expected" },
                      { value: "prior", label: "Diff vs prior actual" },
                    ]}
                  />
                ) : undefined
              }
            >
              {hasActual ? (
                <CaseActualDiff
                  actual={detail.actual}
                  compare={diffMode === "expected" ? detail.expected : detail.input}
                />
              ) : (
                <EmptyState
                  illustration="empty-board"
                  title="No output captured"
                  description={`This case hasn't been run on ${detail.promptLabel} yet.`}
                  action="Run this case"
                  actionIcon="play"
                />
              )}
            </Pane>
          </div>

          {/* regression callout — the struck line is the story */}
          {flippedScorer != null && (
            <div
              className="flex items-center"
              style={{
                gap: 8,
                padding: "9px 12px",
                background: "var(--red-14)",
                border: "1px solid color-mix(in srgb, var(--red) 36%, transparent)",
                borderRadius: "var(--radius-control)",
              }}
            >
              <span
                style={{ font: "600 13px/1 var(--font-mono)", color: "var(--red)" }}
                aria-hidden="true"
              >
                −
              </span>
              <span style={{ font: "var(--mono-sm)", color: "var(--text-hi)" }}>
                {flippedScorer.scorerName} {flippedScorer.pass ? "PASS" : "FAIL"} · the removed line is the regression
              </span>
            </div>
          )}

          {/* scorers + judge */}
          {!skipped && (
            <ScorersPanel
              scorers={detail.scorers}
              judgeVerdicts={detail.judgeVerdicts}
              human={human}
            />
          )}
        </div>
      </div>
    </div>
  );
}
