"use client";

import { type CSSProperties } from "react";

import { type GatePrMeta } from "@/components/gating/ci-gating-view";
import {
  metricColor,
  metricGlow,
  formatMetricValue,
  formatThreshold,
  overallMetricView,
  toMetricView,
  type MetricView,
} from "@/components/gating/gate-metric";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { sha as shortSha } from "@/lib/format";
import { type SuiteGate } from "@/lib/queries/gating";


/** A measured-vs-floor bar: the value fill plus a floor tick at the threshold. */
function FloorBar({ metric }: { metric: MetricView }) {
  const fill = `${Math.min(100, Math.max(0, metric.value * 100))}%`;
  const tick = `${Math.min(100, Math.max(0, metric.threshold * 100))}%`;
  return (
    <span
      style={{
        height: 9,
        borderRadius: 5,
        background: "var(--surface-panel)",
        position: "relative",
        overflow: "visible",
        display: "block",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: fill,
          background: metricColor(metric.tone),
          borderRadius: 5,
          boxShadow: metricGlow(metric.tone),
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: tick,
          top: -3,
          bottom: -3,
          width: 2,
          background: "var(--text-hi)",
          boxShadow: "0 0 0 1px rgba(0,0,0,.4)",
        }}
      />
    </span>
  );
}

const MROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "208px 92px 92px 1fr 120px",
  alignItems: "center",
  gap: 16,
  padding: "11px 16px",
  borderBottom: "1px solid var(--divider)",
};

const COLH: CSSProperties = {
  font: "600 10px/1 var(--font-mono)",
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "var(--text-low)",
};

function StatusBadge({ pass }: { pass: boolean }) {
  const color = pass ? "var(--phosphor)" : "var(--red)";
  const bg = pass ? "var(--phosphor-08)" : "var(--red-14)";
  const border = pass
    ? "color-mix(in srgb, var(--phosphor) 40%, transparent)"
    : "color-mix(in srgb, var(--red) 44%, transparent)";
  return (
    <span
      style={{
        justifySelf: "end",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 11px",
        font: "700 11px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
      }}
    >
      {pass ? "✓ PASS" : "✗ FAIL"}
    </span>
  );
}

function MetricRow({
  metric,
  rootCause,
  last,
}: {
  metric: MetricView;
  rootCause: boolean;
  last: boolean;
}) {
  return (
    <div
      className="mono"
      style={{
        ...MROW,
        background: rootCause ? "var(--red-08)" : undefined,
        borderBottom: last ? "none" : "1px solid var(--divider)",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, color: "var(--text-hi)" }}>
          {metric.label}
          {metric.labelNote ? (
            <span style={{ color: "var(--text-low)" }}> {metric.labelNote}</span>
          ) : null}
        </span>
        {rootCause ? (
          <span style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.04em" }}>
            ROOT CAUSE
          </span>
        ) : null}
      </span>
      <span style={{ fontSize: 14, color: metricColor(metric.tone) }}>
        {formatMetricValue(metric.value, metric.format)}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
        floor {formatThreshold(metric.threshold, metric.format)}
      </span>
      <FloorBar metric={metric} />
      <StatusBadge pass={metric.pass} />
    </div>
  );
}

export interface GateDetailPanelProps {
  gate: SuiteGate;
  meta: GatePrMeta;
  /** Baseline label for the header readout (design-canonical). */
  baselineLabel?: string;
  onOpenDiff?: () => void;
}

/**
 * The full gate-detail panel for a single PR: metric table (measured vs floor,
 * with a floor-tick bar and a PASS/FAIL badge per scorer), then either a
 * "WHY BLOCKED" rationale block (blocked) or an "ALL FLOORS MET" footer
 * (passing). Every number is read from the gate; only the labels and the
 * rationale copy are design chrome.
 */
export function GateDetailPanel({
  gate,
  meta,
  baselineLabel = "BASELINE: run #1462 · v22 · 94.4%",
  onOpenDiff,
}: GateDetailPanelProps) {
  const blocked = !gate.passing;
  const accent = blocked ? "var(--red)" : "var(--phosphor)";

  // Metric rows: query scorers (failing first, the query already sorts them),
  // with the synthetic overall pass-rate row spliced in after the failures so
  // the table reads schema → field-accuracy → overall → recall/judge.
  const scorerRows = gate.metrics.map(toMetricView);
  const overall = overallMetricView(gate.passRate);
  const failing = scorerRows.filter((m) => !m.pass);
  const passingRows = scorerRows.filter((m) => m.pass);
  const rows: MetricView[] = [...failing, overall, ...passingRows];

  const failCount = gate.metrics.filter((m) => m.status === "fail").length;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--bg-raised)",
        border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between gap-3"
        style={{
          padding: "11px 16px",
          background: blocked ? "var(--red-08)" : "var(--phosphor-08)",
          borderBottom: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
        }}
      >
        <div className="flex items-center" style={{ gap: 11 }}>
          <SectionLabel style={{ color: accent }}>
            GATE · PR #{meta.pr} · {blocked ? "BLOCKED" : "PASSING"}
          </SectionLabel>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {gate.suiteSlug} · {shortSha(gate.sha)}
          </span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          {baselineLabel}
        </span>
      </div>

      {/* metric table */}
      <div style={{ padding: "4px 0" }}>
        <div className="mono" style={{ ...MROW, background: "rgba(255,255,255,0.012)" }}>
          <span style={COLH}>METRIC</span>
          <span style={COLH}>MEASURED</span>
          <span style={COLH}>THRESHOLD</span>
          <span style={COLH}>MEASURED VS FLOOR</span>
          <span style={{ ...COLH, textAlign: "right" }}>STATUS</span>
        </div>
        {rows.map((metric, i) => (
          <MetricRow
            key={metric.key}
            metric={metric}
            rootCause={
              blocked &&
              !metric.pass &&
              metric.key === meta.rootCauseScorer
            }
            last={i === rows.length - 1}
          />
        ))}
      </div>

      {/* rationale */}
      {blocked ? (
        <div
          className="flex flex-col"
          style={{ gap: 14, padding: "16px 18px", borderTop: "1px solid var(--divider)" }}
        >
          <div
            className="flex items-start"
            style={{
              gap: 11,
              padding: "13px 15px",
              background: "var(--red-08)",
              border: "1px solid color-mix(in srgb, var(--red) 30%, transparent)",
              borderRadius: "var(--radius-control)",
            }}
          >
            <span style={{ color: "var(--red)", flex: "none", marginTop: 1 }}>
              <Icon name="alert-triangle" size={17} strokeWidth={1.8} />
            </span>
            <div className="flex flex-col" style={{ gap: 5 }}>
              <SectionLabel style={{ color: "var(--red)" }}>WHY BLOCKED</SectionLabel>
              <span style={{ font: "var(--text-sm)", color: "var(--text-hi)", lineHeight: 1.6 }}>
                <b>
                  {failCount} of {gate.metrics.length} gate metrics regressed below their floors.
                </b>{" "}
                Root cause: the new schema rejects split-tender outputs.
              </span>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: 9 }}>
            <span style={{ color: "var(--red)", flex: "none" }}>
              <Icon name="circle-x" size={15} strokeWidth={2} />
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
              <span style={{ color: "var(--red)" }}>rubric/{gate.suiteSlug}</span> — {failCount}{" "}
              metrics below threshold
            </span>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            <button
              type="button"
              onClick={onOpenDiff}
              className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap transition hover:brightness-110"
              style={{
                gap: 8,
                height: 30,
                padding: "0 11px",
                font: "600 12px/1 var(--font-ui)",
                color: "#1A0606",
                background: "var(--red)",
                border: "1px solid transparent",
                borderRadius: "var(--radius-control)",
                boxShadow: "var(--glow-red)",
              }}
            >
              <Icon name="git-branch" size={15} strokeWidth={1.8} />
              Open causing diff
            </button>
            <a
              href="#"
              className="mono inline-flex items-center"
              style={{ gap: 6, fontSize: 12.5, color: "var(--cyan)", textDecoration: "none" }}
            >
              View on GitHub ↗
            </a>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-between"
          style={{
            padding: "13px 18px",
            borderTop: "1px solid var(--divider)",
            background: "var(--phosphor-08)",
          }}
        >
          <SectionLabel style={{ color: "var(--phosphor)" }}>
            ALL FLOORS MET · SAFE TO MERGE
          </SectionLabel>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-mid)" }}>
            ✓ rubric/{gate.suiteSlug}
          </span>
        </div>
      )}
    </div>
  );
}
