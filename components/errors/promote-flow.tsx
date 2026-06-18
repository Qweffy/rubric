"use client";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";

interface PromoteFlowProps {
  selectedCaseIds: string[];
  suiteSlug: string;
}

type StepState = "done" | "active" | "todo";

interface Step {
  label: string;
  state: StepState;
  /** Number shown in the dot for active/todo steps (done shows ✓). */
  index: number;
}

/** A synthetic golden expected-output line for a case, derived from its id. */
const PAYMENT_SETS = [
  { payments: ["card", "gift_card"], total: "$148.00" },
  { payments: ["gift_card", "card"], total: "$63.50" },
  { payments: ["store_credit", "card"], total: "$209.99" },
  { payments: ["loyalty", "card"], total: "$92.40" },
  { payments: ["card", "card"], total: "$311.00" },
  { payments: ["gift_card", "store_credit"], total: "$54.25" },
] as const;

function expectedFor(index: number): { payments: readonly string[]; total: string } {
  return PAYMENT_SETS[index % PAYMENT_SETS.length] ?? PAYMENT_SETS[0];
}

/** A single stepper dot + label. */
function StepperDot({ step }: { step: Step }) {
  const isDone = step.state === "done";
  const isActive = step.state === "active";
  return (
    <div
      className="flex items-center"
      style={{
        gap: 7,
        font: "600 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: isDone || isActive ? "var(--phosphor)" : "var(--text-low)",
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          flex: "none",
          font: "10px/1 var(--font-mono)",
          background: isActive
            ? "var(--phosphor)"
            : isDone
              ? "var(--phosphor-12)"
              : "var(--surface-panel)",
          color: isActive ? "var(--bg-void)" : isDone ? "var(--phosphor)" : "var(--text-low)",
          border: isDone
            ? "1px solid var(--border-strong)"
            : isActive
              ? "none"
              : "1px solid var(--divider)",
        }}
      >
        {isDone ? "✓" : step.index}
      </span>
      {step.label}
    </div>
  );
}

/**
 * PromoteFlow — the three-step (SELECT → PREVIEW → CONFIRM) promote-to-golden
 * panel. It previews each selected case as a golden expected-output line, lets
 * you pick the target suite, and reminds that promoted cases run on every
 * future eval. The committing action lives in the sticky promote bar.
 */
export function PromoteFlow({ selectedCaseIds, suiteSlug }: PromoteFlowProps) {
  const count = selectedCaseIds.length;
  const steps: Step[] = [
    { label: "SELECT", state: count > 0 ? "done" : "active", index: 1 },
    { label: "PREVIEW", state: count > 0 ? "active" : "todo", index: 2 },
    { label: "CONFIRM", state: "todo", index: 3 },
  ];

  return (
    <Card glow style={{ border: "1px solid var(--border-strong)" }}>
      {/* header — overrides Card's default header to hold the stepper */}
      <div
        className="flex items-center justify-between"
        style={{
          gap: 12,
          padding: "11px 16px",
          margin: "calc(-1 * var(--pad-panel))",
          marginBottom: "var(--pad-panel)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center" style={{ gap: 14 }}>
          <SectionLabel tone="phosphor">PROMOTE TO GOLDEN</SectionLabel>
          <div className="flex items-center" style={{ gap: 9 }}>
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center" style={{ gap: 9 }}>
                {i > 0 ? (
                  <Icon name="chevron-right" size={12} strokeWidth={2} style={{ color: "var(--text-low)" }} />
                ) : null}
                <StepperDot step={step} />
              </div>
            ))}
          </div>
        </div>
        <span style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}>
          review before committing
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 13 }}>
        <SectionLabel style={{ color: "var(--text-mid)" }}>
          {count} CASES → GOLDEN EXPECTED OUTPUT
        </SectionLabel>

        <div className="flex flex-col" style={{ gap: 8 }}>
          {selectedCaseIds.map((caseId, i) => {
            const expected = expectedFor(i);
            return (
              <div
                key={caseId}
                className="flex items-center"
                style={{
                  gap: 13,
                  padding: "11px 13px",
                  background: "var(--surface-panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-control)",
                }}
              >
                <span
                  style={{
                    font: "600 13px/1 var(--font-mono)",
                    color: "var(--text-hi)",
                    width: 78,
                    flex: "none",
                  }}
                >
                  {caseId}
                </span>
                <span
                  className="flex-1"
                  style={{ font: "var(--mono-sm)", fontSize: 12, color: "var(--text-mid)" }}
                >
                  <span style={{ color: "var(--cyan)" }}>payments</span>:{" "}
                  [
                  {expected.payments.map((p, pi) => (
                    <span key={`${p}-${String(pi)}`}>
                      <span style={{ color: "var(--phosphor)" }}>&quot;{p}&quot;</span>
                      {pi < expected.payments.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  ] <span style={{ color: "var(--text-low)" }}>· total {expected.total}</span>
                </span>
                {i === 0 ? <Tag tone="phosphor">canonical</Tag> : null}
              </div>
            );
          })}
        </div>

        <div className="flex items-center" style={{ gap: 14, paddingTop: 4 }}>
          <SectionLabel>TARGET SUITE</SectionLabel>
          <button
            type="button"
            aria-haspopup="menu"
            className="inline-flex cursor-pointer items-center"
            style={{
              gap: 9,
              height: 32,
              padding: "0 12px",
              background: "var(--surface-panel)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-control)",
              color: "var(--text-hi)",
              font: "var(--mono-sm)",
              fontSize: 13,
            }}
          >
            {suiteSlug}
            <Icon name="chevron-down" size={13} strokeWidth={1.6} />
          </button>
          <span
            style={{
              font: "var(--mono-sm)",
              fontSize: 11,
              color: "var(--text-low)",
              marginLeft: "auto",
            }}
          >
            they&apos;ll run in every future eval
          </span>
        </div>
      </div>
    </Card>
  );
}
