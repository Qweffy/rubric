"use client";

import { Fragment, useState } from "react";

import { DiffCollapse, DiffLine } from "@/components/ui/diff-line";
import { SectionLabel } from "@/components/ui/section-label";
import { SegmentedControl } from "@/components/ui/segmented-control";

/** One side of a diff line: a numbered line of prompt text. */
export interface DiffSide {
  num: number;
  text: string;
}

/**
 * A modelled prompt-diff row. `kind` drives the rendering:
 * - context  unchanged on both sides
 * - cause    the added stricter rule (amber, the regression's root)
 * - annotation  the amber "← likely cause…" pointer under the cause line
 * - remove / add  a replaced line (red removal then phosphor addition)
 * - collapse  a run of hidden unchanged lines
 */
export interface DiffLineModel {
  kind: "context" | "cause" | "annotation" | "remove" | "add" | "collapse";
  base?: DiffSide;
  head?: DiffSide;
  annotation?: string;
  collapseCount?: number;
}

export interface PromptDiffProps {
  baseLabel: string;
  headLabel: string;
  baseRef: string;
  headRef: string;
  /** e.g. "+2 −1 · 1 stricter rule added". */
  summary: string;
  lines: DiffLineModel[];
}

const VIEW_OPTIONS = [
  { value: "side-by-side", label: "Side-by-side" },
  { value: "unified", label: "Unified" },
];

/** The amber inline annotation row that points at the cause line above it. */
function AnnotationRow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38px 20px 1fr 38px 20px 1fr",
        font: "500 12.5px/1.7 var(--font-mono)",
      }}
    >
      <div style={{ padding: "1px 6px", background: "rgba(0,0,0,0.22)" }}> </div>
      <div style={{ padding: "1px 6px", background: "rgba(0,0,0,0.22)" }}> </div>
      <div style={{ padding: "1px 6px", background: "rgba(0,0,0,0.22)" }}> </div>
      <div style={{ padding: "1px 6px", textAlign: "right", color: "var(--amber)" }}> </div>
      <div
        style={{
          padding: "1px 6px",
          textAlign: "center",
          color: "var(--amber)",
          fontWeight: 700,
        }}
      >
        ↑
      </div>
      <div
        style={{
          padding: "1px 6px",
          color: "var(--amber)",
          fontSize: 11,
          whiteSpace: "pre",
          overflow: "hidden",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** A single unified-view annotation row (4-col grid). */
function AnnotationRowUnified({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38px 38px 20px 1fr",
        font: "500 12.5px/1.7 var(--font-mono)",
      }}
    >
      <div style={{ padding: "1px 6px" }}> </div>
      <div style={{ padding: "1px 6px", textAlign: "right", color: "var(--amber)" }}> </div>
      <div style={{ padding: "1px 6px", textAlign: "center", color: "var(--amber)", fontWeight: 700 }}>↑</div>
      <div style={{ padding: "1px 6px", color: "var(--amber)", fontSize: 11, whiteSpace: "pre", overflow: "hidden" }}>
        {text}
      </div>
    </div>
  );
}

/**
 * PromptDiff — the v22 ↔ v23 prompt diff card. A segmented Side-by-side /
 * Unified toggle swaps the layout; side-by-side shows BASE | HEAD column
 * headers, unified collapses to a single column with paired line numbers. The
 * amber "cause" line + its annotation row flag the added stricter rule that
 * drove the regression.
 */
export function PromptDiff({
  baseLabel,
  headLabel,
  baseRef,
  headRef,
  summary,
  lines,
}: PromptDiffProps) {
  const [view, setView] = useState<"side-by-side" | "unified">("side-by-side");

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
        <div className="flex items-center" style={{ gap: 12 }}>
          <SectionLabel>{`PROMPT DIFF · ${baseLabel} ↔ ${headLabel}`}</SectionLabel>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {summary}
          </span>
        </div>
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={view}
          onChange={(v) => setView(v as "side-by-side" | "unified")}
          size="sm"
        />
      </div>

      {view === "side-by-side" ? (
        <SideBySide
          baseLabel={baseLabel}
          headLabel={headLabel}
          baseRef={baseRef}
          headRef={headRef}
          lines={lines}
        />
      ) : (
        <Unified lines={lines} />
      )}
    </div>
  );
}

interface SideBySideProps {
  baseLabel: string;
  headLabel: string;
  baseRef: string;
  headRef: string;
  lines: DiffLineModel[];
}

function SideBySide({ baseLabel, headLabel, baseRef, headRef, lines }: SideBySideProps) {
  return (
    <>
      {/* column headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <ColHeader label="BASE" version={baseLabel} ref={baseRef} refColor="var(--text-muted)" divider />
        <ColHeader label="HEAD" version={headLabel} ref={headRef} refColor="var(--amber)" />
      </div>

      <div className="diff" style={{ font: "500 12.5px/1.7 var(--font-mono)" }}>
        {lines.map((line, i) => {
          if (line.kind === "collapse") {
            return <DiffCollapse key={i} count={line.collapseCount ?? 0} />;
          }
          if (line.kind === "annotation") {
            return <AnnotationRow key={i} text={line.annotation ?? ""} />;
          }
          if (line.kind === "context") {
            return (
              <DiffLine
                key={i}
                variant="side-by-side"
                base={line.base ? { kind: "context", num: line.base.num, code: line.base.text } : undefined}
                head={line.head ? { kind: "context", num: line.head.num, code: line.head.text } : undefined}
              />
            );
          }
          if (line.kind === "cause") {
            return (
              <DiffLine
                key={i}
                variant="side-by-side"
                base={{ kind: "context", empty: true }}
                head={{ kind: "cause", num: line.head?.num, code: line.head?.text }}
              />
            );
          }
          if (line.kind === "remove") {
            return (
              <DiffLine
                key={i}
                variant="side-by-side"
                base={{ kind: "remove", num: line.base?.num, code: line.base?.text }}
                head={{ kind: "context", empty: true }}
              />
            );
          }
          // add
          return (
            <DiffLine
              key={i}
              variant="side-by-side"
              base={{ kind: "context", empty: true }}
              head={{ kind: "add", num: line.head?.num, code: line.head?.text }}
            />
          );
        })}
      </div>
    </>
  );
}

interface ColHeaderProps {
  label: string;
  version: string;
  ref: string;
  refColor: string;
  divider?: boolean;
}

function ColHeader({ label, version, ref, refColor, divider = false }: ColHeaderProps) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 8,
        padding: "8px 16px",
        borderRight: divider ? "1px solid var(--divider)" : undefined,
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      <span className="mono" style={{ fontSize: 12, color: "var(--text-hi)", fontFamily: "var(--font-mono)" }}>
        {version}
      </span>
      <span className="mono" style={{ fontSize: 11, color: refColor, fontFamily: "var(--font-mono)" }}>
        {ref}
      </span>
    </div>
  );
}

/** Map a modelled line to the unified-view kind + paired line numbers. */
function Unified({ lines }: { lines: DiffLineModel[] }) {
  return (
    <div className="diff" style={{ padding: "4px 0", font: "500 12.5px/1.7 var(--font-mono)" }}>
      {lines.map((line, i) => {
        if (line.kind === "collapse") {
          return <DiffCollapse key={i} count={line.collapseCount ?? 0} />;
        }
        if (line.kind === "annotation") {
          return <AnnotationRowUnified key={i} text={line.annotation ?? ""} />;
        }
        if (line.kind === "context") {
          return (
            <DiffLine
              key={i}
              variant="unified"
              kind="context"
              oldNum={line.base?.num}
              newNum={line.head?.num}
              code={line.base?.text ?? line.head?.text}
            />
          );
        }
        if (line.kind === "cause") {
          return (
            <DiffLine key={i} variant="unified" kind="cause" newNum={line.head?.num} code={line.head?.text} />
          );
        }
        if (line.kind === "remove") {
          return (
            <DiffLine key={i} variant="unified" kind="remove" oldNum={line.base?.num} code={line.base?.text} />
          );
        }
        return (
          <Fragment key={i}>
            <DiffLine variant="unified" kind="add" newNum={line.head?.num} code={line.head?.text} />
          </Fragment>
        );
      })}
    </div>
  );
}
