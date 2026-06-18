"use client";

import { type TrajectoryStepView } from "@/components/trajectory-detail/model";
import { Dot, GlyphBadge } from "@/components/trajectory-detail/shared";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

interface StepDrawerProps {
  /** The focused step rendered in full detail. */
  step: TrajectoryStepView;
  /** Other actual calls, surfaced as jump chips in the footer. */
  otherActual: TrajectoryStepView[];
  onFocus: (key: string) => void;
}

// `tone` colors the glyph badge (supports red); `labelTone` colors the mono
// SectionLabel, which has no red — red kinds fall back to amber there while the
// red accent still carries on the badge, dot, and card border.
const KIND_LABEL = {
  match: {
    label: "✓ MATCH",
    tone: "phosphor" as const,
    labelTone: "phosphor" as const,
    accent: "var(--phosphor)",
  },
  insert: {
    label: "+ INSERT",
    tone: "amber" as const,
    labelTone: "amber" as const,
    accent: "var(--amber)",
  },
  substitute: {
    label: "⇄ SUB",
    tone: "red" as const,
    labelTone: "amber" as const,
    accent: "var(--red)",
  },
  delete: {
    label: "− DEL",
    tone: "red" as const,
    labelTone: "amber" as const,
    accent: "var(--red)",
  },
};

/**
 * StepDrawer — the per-step inspector pinned beside the timeline. Shows the
 * focused call's tool, args, truncated result, and derived latency/cost/tokens,
 * plus a divergence note (e.g. the redundant-search warning) when the step is
 * not a clean match. The footer jumps to the other actual calls.
 */
export function StepDrawer({ step, otherActual, onFocus }: StepDrawerProps) {
  const meta = KIND_LABEL[step.kind];
  const divergent = step.kind !== "match";

  return (
    <Card
      padding={false}
      className="overflow-hidden self-start"
      style={{
        borderColor: divergent
          ? `color-mix(in srgb, ${meta.accent} 42%, transparent)`
          : undefined,
        boxShadow: divergent
          ? `0 0 18px ${
              step.kind === "insert"
                ? "rgba(255,200,87,0.26)"
                : "rgba(255,93,93,0.22)"
            }, var(--shadow-card)`
          : undefined,
      }}
    >
      {/* head */}
      <div
        className="flex items-center justify-between"
        style={{
          gap: 12,
          padding: "11px 16px",
          borderBottom: "1px solid var(--divider)",
          background: divergent
            ? `color-mix(in srgb, ${meta.accent} 8%, transparent)`
            : undefined,
        }}
      >
        <SectionLabel tone={divergent ? meta.labelTone : "low"}>
          STEP {step.stepNumber} · DETAIL
        </SectionLabel>
        <GlyphBadge tone={meta.tone}>{meta.label}</GlyphBadge>
      </div>

      <div className="flex flex-col" style={{ padding: "14px 16px", gap: 13 }}>
        {/* tool row */}
        <div className="flex items-center" style={{ gap: 10 }}>
          <Dot color={meta.accent} glow={divergent} />
          <SectionLabel>TOOL</SectionLabel>
          <span className="mono" style={{ fontSize: 14, color: "var(--text-hi)" }}>
            {step.actualLabel ?? step.expectedLabel}
          </span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            call #{step.stepNumber}
          </span>
        </div>

        {/* args */}
        <Field label="ARGS" note={step.redundant ? "identical to step 1" : undefined}>
          <CodeBlock
            text={step.argsText}
            comment={step.redundant ? "// identical to step 1" : undefined}
          />
        </Field>

        {/* result */}
        <Field label="RESULT" note="truncated">
          <CodeBlock text={step.resultText} />
        </Field>

        {/* metrics */}
        <div className="flex items-center" style={{ gap: 18, padding: "2px 0" }}>
          <Metric label="LATENCY" value={step.latencyLabel} />
          <MetricDivider />
          <Metric
            label="COST"
            value={step.costLabel}
            color={step.redundant ? "var(--amber)" : "var(--text-hi)"}
          />
          <MetricDivider />
          <Metric label="TOKENS" value={String(step.tokens)} />
        </div>

        {/* divergence note */}
        {step.note != null && (
          <div
            className="flex items-start"
            style={{
              gap: 9,
              padding: "10px 12px",
              background: "var(--amber-14)",
              border: "1px solid color-mix(in srgb, var(--amber) 36%, transparent)",
              borderRadius: "var(--radius-control)",
            }}
          >
            <Icon
              name="alert-triangle"
              size={15}
              strokeWidth={1.7}
              style={{ color: "var(--amber)", marginTop: 1 }}
            />
            <span
              className="mono"
              style={{ fontSize: 11.5, color: "var(--text-hi)", lineHeight: 1.6 }}
            >
              {step.note}
            </span>
          </div>
        )}
      </div>

      {/* footer: jump to other steps */}
      {otherActual.length > 0 && (
        <div
          className="flex items-center"
          style={{ gap: 8, padding: "10px 16px", borderTop: "1px solid var(--divider)" }}
        >
          <SectionLabel>OTHER STEPS</SectionLabel>
          <span style={{ flex: 1 }} />
          {otherActual.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onFocus(s.key)}
              className={cn("rb-step-chip")}
              aria-label={`Inspect step ${s.stepNumber}`}
            >
              {s.actualTag}
            </button>
          ))}
          <ChipStyles />
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <SectionLabel>
        {label}
        {note != null && (
          <span style={{ color: "var(--text-muted)" }}> · {note}</span>
        )}
      </SectionLabel>
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  color = "var(--text-hi)",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 3 }}>
      <SectionLabel>{label}</SectionLabel>
      <span className="mono" style={{ fontSize: 13, color }}>
        {value}
      </span>
    </div>
  );
}

function MetricDivider() {
  return <div style={{ width: 1, height: 26, background: "var(--divider)" }} />;
}

/**
 * Monospace code block matching the handoff's `.jcode`. The args/result text is
 * pre-formatted upstream; we keyword-tint it lightly (strings phosphor, numbers
 * amber, keys cyan) without a full tokenizer.
 */
function CodeBlock({ text, comment }: { text: string; comment?: string }) {
  return (
    <pre
      className="mono"
      style={{
        margin: 0,
        background: "var(--bg-void)",
        border: "1px solid var(--divider)",
        borderRadius: "var(--radius-control)",
        padding: "11px 13px",
        fontSize: 12,
        lineHeight: 1.65,
        color: "var(--text-mid)",
        overflow: "auto",
        whiteSpace: "pre",
      }}
    >
      {comment != null && (
        <span style={{ color: "var(--text-low)" }}>{comment}{"\n"}</span>
      )}
      {tint(text)}
    </pre>
  );
}

/** Lightweight syntax tint — keys cyan, string values phosphor, numbers amber. */
function tint(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Tokenize on quoted strings, numbers, and identifiers-before-colon.
  const regex = /("[^"]*")|(\b\d+\b)|([A-Za-z_]\w*)(?=\s*:)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] != null) {
      parts.push(
        <span key={i++} style={{ color: "var(--phosphor)" }}>
          {m[1]}
        </span>,
      );
    } else if (m[2] != null) {
      parts.push(
        <span key={i++} style={{ color: "var(--amber)" }}>
          {m[2]}
        </span>,
      );
    } else if (m[3] != null) {
      parts.push(
        <span key={i++} style={{ color: "var(--cyan)" }}>
          {m[3]}
        </span>,
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function ChipStyles() {
  return (
    <style href="rb-step-chip" precedence="default">{`
      .rb-step-chip {
        display: inline-flex; align-items: center; justify-content: center;
        height: 20px; padding: 0 8px; border-radius: var(--radius-sm);
        font: 500 12px/1 var(--font-mono); letter-spacing: 0.02em;
        color: var(--text-body); background: transparent;
        border: 1px solid var(--border); cursor: pointer;
        transition: border-color 120ms var(--ease-out), color 120ms var(--ease-out);
      }
      .rb-step-chip:hover { color: var(--text-hi); border-color: var(--border-strong); }
    `}</style>
  );
}
