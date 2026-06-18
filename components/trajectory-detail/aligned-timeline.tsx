"use client";

import {
  type TrajectoryModel,
  type TrajectoryStepView,
} from "@/components/trajectory-detail/model";
import { Dot, GlyphBadge } from "@/components/trajectory-detail/shared";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

interface AlignedTimelineProps {
  model: TrajectoryModel;
  focusedKey: string;
  onFocus: (key: string) => void;
}

const GRID = "1fr 150px 1fr";

const GLYPH = {
  match: { label: "✓ MATCH", tone: "phosphor" as const },
  insert: { label: "+ INSERT", tone: "amber" as const },
  substitute: { label: "⇄ SUB", tone: "red" as const },
  delete: { label: "− DEL", tone: "red" as const },
};

/**
 * AlignedTimeline — the EXPECTED↔ACTUAL step-aligned sequence diff. Three
 * columns: the expected plan (phosphor), the alignment glyph rail, and the
 * actual calls (violet). Each row is one aligned step; the divergent step
 * carries the amber DIVERGED-HERE anchor flag and is selectable to drive the
 * per-step drawer.
 */
export function AlignedTimeline({
  model,
  focusedKey,
  onFocus,
}: AlignedTimelineProps) {
  return (
    <Card padding={false} className="overflow-hidden">
      <div
        className="flex items-center justify-between"
        style={{ gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <div className="flex items-center" style={{ gap: 10 }}>
          <SectionLabel>EXPECTED ↔ ACTUAL</SectionLabel>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            step-aligned sequence diff
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 12 }}>
          <span
            className="mono flex items-center"
            style={{ fontSize: 10, color: "var(--phosphor)", gap: 5 }}
          >
            <Dot color="var(--phosphor)" />
            EXPECTED
          </span>
          <span
            className="mono flex items-center"
            style={{ fontSize: 10, color: "var(--violet)", gap: 5 }}
          >
            <Dot color="var(--violet)" />
            ACTUAL
          </span>
        </div>
      </div>

      {/* track captions */}
      <div
        className="grid"
        style={{ gridTemplateColumns: GRID, padding: "10px 18px 4px" }}
      >
        <SectionLabel tone="phosphor">EXPECTED PLAN</SectionLabel>
        <SectionLabel style={{ justifyContent: "center" }}>ALIGN</SectionLabel>
        <SectionLabel tone="violet" style={{ justifyContent: "flex-end" }}>
          ACTUAL CALLS
        </SectionLabel>
      </div>

      {/* rows */}
      <div
        className="grid"
        style={{ gridTemplateColumns: GRID, padding: "6px 18px 18px" }}
      >
        {model.steps.map((step, i) => (
          <TimelineRow
            key={step.key}
            step={step}
            first={i === 0}
            focused={step.key === focusedKey}
            onFocus={onFocus}
          />
        ))}
      </div>

      {/* legend */}
      <div
        className="flex flex-wrap items-center"
        style={{ gap: 14, padding: "12px 18px", borderTop: "1px solid var(--divider)" }}
      >
        <SectionLabel>GLYPHS</SectionLabel>
        <GlyphBadge tone="phosphor">✓ MATCH</GlyphBadge>
        <GlyphBadge tone="amber">+ INSERT</GlyphBadge>
        <GlyphBadge tone="red">⇄ SUB</GlyphBadge>
        <GlyphBadge tone="red">− DEL</GlyphBadge>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* One aligned row                                                     */
/* ------------------------------------------------------------------ */

function TimelineRow({
  step,
  first,
  focused,
  onFocus,
}: {
  step: TrajectoryStepView;
  first: boolean;
  focused: boolean;
  onFocus: (key: string) => void;
}) {
  const connectorTop = first ? 8 : 14;

  return (
    <>
      {/* EXPECTED cell */}
      <div className="flex flex-col">
        <Connector
          height={connectorTop}
          line={!first}
          color="var(--phosphor-dim)"
        />
        {step.expectedLabel != null ? (
          <ExpectedNode step={step} />
        ) : (
          <EmptyExpectedNode />
        )}
      </div>

      {/* ALIGN cell */}
      <AlignCell step={step} top={connectorTop} />

      {/* ACTUAL cell */}
      <div className="flex flex-col">
        <Connector
          height={connectorTop}
          line={!first}
          color="var(--violet-16)"
        />
        {step.actualLabel != null ? (
          <ActualNode step={step} focused={focused} onFocus={onFocus} />
        ) : (
          <SkippedActualNode />
        )}
      </div>
    </>
  );
}

function Connector({
  height,
  line,
  color,
}: {
  height: number;
  line: boolean;
  color: string;
}) {
  if (!line) return <div style={{ height }} />;
  return (
    <div
      style={{ height, width: 2, background: color, margin: "0 auto" }}
      aria-hidden="true"
    />
  );
}

/* --- EXPECTED column nodes --- */

function ExpectedNode({ step }: { step: TrajectoryStepView }) {
  return (
    <TNode borderColor="color-mix(in srgb, var(--phosphor) 28%, transparent)">
      <span className="tnode-sn">{step.expectedTag}</span>
      <span className="tnode-tn">{step.expectedLabel}</span>
      <Dot color="var(--phosphor)" />
    </TNode>
  );
}

function EmptyExpectedNode() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: 46,
        padding: "0 13px",
        borderRadius: "var(--radius-control)",
        border: "1px dashed var(--divider)",
        background: "transparent",
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--text-low)", letterSpacing: "0.04em" }}
      >
        — no expected step —
      </span>
    </div>
  );
}

/* --- ACTUAL column nodes --- */

function ActualNode({
  step,
  focused,
  onFocus,
}: {
  step: TrajectoryStepView;
  focused: boolean;
  onFocus: (key: string) => void;
}) {
  const divergent = step.kind !== "match";
  const amber = step.kind === "insert";
  const red = step.kind === "substitute";

  const borderColor = amber
    ? "color-mix(in srgb, var(--amber) 52%, transparent)"
    : red
      ? "color-mix(in srgb, var(--red) 50%, transparent)"
      : "color-mix(in srgb, var(--phosphor) 28%, transparent)";
  const bg = amber
    ? "color-mix(in srgb, var(--amber) 8%, transparent)"
    : red
      ? "color-mix(in srgb, var(--red) 8%, transparent)"
      : "var(--surface-card)";
  const accent = amber ? "var(--amber)" : red ? "var(--red)" : "var(--phosphor)";

  return (
    <button
      type="button"
      onClick={() => onFocus(step.key)}
      aria-pressed={focused}
      className={cn("tnode-actual")}
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 10,
        padding: "0 13px",
        height: 46,
        borderRadius: "var(--radius-control)",
        border: `1px solid ${borderColor}`,
        background: bg,
        boxShadow: amber
          ? "var(--glow-amber, 0 0 18px color-mix(in srgb, var(--amber) 26%, transparent))"
          : red
            ? "var(--glow-red)"
            : undefined,
        outline: focused && divergent
          ? `1px solid color-mix(in srgb, ${accent} 30%, transparent)`
          : undefined,
        outlineOffset: 2,
        cursor: "pointer",
        textAlign: "right",
        width: "100%",
        transition: "all 120ms var(--ease-out)",
      }}
    >
      <Dot color={accent} glow={divergent} />
      {step.redundant && (
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 18,
            padding: "0 6px",
            borderRadius: "var(--radius-sm)",
            font: "600 10px/1 var(--font-mono)",
            color: "var(--amber)",
            border: "1px solid color-mix(in srgb, var(--amber) 40%, transparent)",
          }}
        >
          redundant
        </span>
      )}
      <span className="tnode-tn" style={{ textAlign: "right" }}>
        {step.actualLabel}
      </span>
      <span
        className="tnode-sn"
        style={divergent ? { color: accent } : undefined}
      >
        {step.actualTag}
      </span>
    </button>
  );
}

function SkippedActualNode() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: 46,
        borderRadius: "var(--radius-control)",
        border: "1px dashed color-mix(in srgb, var(--red) 42%, transparent)",
      }}
    >
      <span className="mono" style={{ fontSize: 11, color: "var(--red)" }}>
        — step skipped —
      </span>
    </div>
  );
}

/* --- ALIGN (middle) column --- */

function AlignCell({ step, top }: { step: TrajectoryStepView; top: number }) {
  const glyph = GLYPH[step.kind];
  const insert = step.kind === "insert";

  return (
    <div className="flex flex-col" style={{ position: "relative" }}>
      <div style={{ height: top }} />
      <div
        className="flex flex-col items-center justify-center"
        style={{ flex: 1, position: "relative", gap: insert ? 7 : 0 }}
      >
        {insert ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              right: 8,
              top: "30%",
              height: 2,
              background:
                "repeating-linear-gradient(90deg, var(--amber) 0 5px, transparent 5px 10px)",
              opacity: 0.6,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              top: "50%",
              height: 2,
              background: "var(--phosphor-dim)",
            }}
          />
        )}
        <GlyphBadge tone={glyph.tone} filled>
          {glyph.label}
        </GlyphBadge>
        {insert && <AnchorFlag stepNumber={step.stepNumber} />}
      </div>
    </div>
  );
}

function AnchorFlag({ stepNumber }: { stepNumber: number }) {
  return (
    <>
      <span
        className="mono rb-anchor-flag"
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 22,
          padding: "0 9px",
          borderRadius: "var(--radius-sm)",
          font: "700 9.5px/1 var(--font-mono)",
          letterSpacing: "0.10em",
          color: "var(--amber)",
          background: "var(--amber-14)",
          border: "1px solid color-mix(in srgb, var(--amber) 46%, transparent)",
          whiteSpace: "nowrap",
        }}
      >
        ⚑ DIVERGED HERE · STEP {stepNumber}
      </span>
      <style href="rb-anchor-flag" precedence="default">{`
        @keyframes rb-anchor-pulse {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--amber) 34%, transparent); }
          50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--amber) 0%, transparent); }
        }
        .rb-anchor-flag { animation: rb-anchor-pulse 1.8s var(--ease-out) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rb-anchor-flag { animation: none; }
        }
      `}</style>
    </>
  );
}

/* --- shared tool-node shell --- */

function TNode({
  children,
  borderColor,
}: {
  children: React.ReactNode;
  borderColor: string;
}) {
  return (
    <>
      <div
        className="flex items-center"
        style={{
          gap: 10,
          padding: "0 13px",
          height: 46,
          borderRadius: "var(--radius-control)",
          border: `1px solid ${borderColor}`,
          background: "var(--surface-card)",
        }}
      >
        {children}
      </div>
      <TNodeStyles />
    </>
  );
}

function TNodeStyles() {
  return (
    <style href="rb-tnode" precedence="default">{`
      .tnode-sn { font: 600 10px/1 var(--font-mono); color: var(--text-low); flex: none; }
      .tnode-tn { font: 500 13px/1 var(--font-mono); color: var(--text-hi); flex: 1; }
    `}</style>
  );
}
