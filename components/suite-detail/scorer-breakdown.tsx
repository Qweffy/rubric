"use client";

import { Card } from "@/components/ui/card";
import { Sparkline, type SparklineTone } from "@/components/ui/sparkline";

/** One scorer's head-run pass-rate plus its delta vs the baseline run. */
export interface ScorerBreakdownItem {
  name: string;
  /** Head-run pass-rate (0-1). */
  passRate: number;
  passCount: number;
  total: number;
  /** passRate(head) − passRate(baseline), null when no baseline. */
  delta: number | null;
  /** True when this scorer is the dominant regression driver. */
  culprit: boolean;
  /** Recent per-scorer pass-rate trend, oldest-first, for the inline spark. */
  trend: number[];
}

export interface ScorerBreakdownProps {
  scorers: ScorerBreakdownItem[];
  /** Mono caption in the header, e.g. "v23 · 142 cases". */
  caption: string;
}

type ScorerTone = "red" | "phosphor" | "violet" | "amber";

/** Judge is the only violet scorer; below-gate scorers go red; else phosphor. */
function toneFor(item: ScorerBreakdownItem): ScorerTone {
  if (item.name === "judge") return "violet";
  if (item.culprit) return "red";
  return "phosphor";
}

const BAR_COLOR: Record<ScorerTone, string> = {
  red: "var(--red)",
  phosphor: "var(--phosphor)",
  violet: "var(--violet)",
  amber: "var(--amber)",
};

const TEXT_COLOR: Record<ScorerTone, string> = {
  red: "var(--red)",
  phosphor: "var(--phosphor)",
  violet: "var(--violet)",
  amber: "var(--amber)",
};

const SPARK_TONE: Record<ScorerTone, SparklineTone> = {
  red: "red",
  phosphor: "phosphor",
  violet: "violet",
  amber: "amber",
};

function deltaChip(item: ScorerBreakdownItem, tone: ScorerTone) {
  if (item.delta === null) return null;
  const pts = item.delta * 100;
  const down = pts < 0;
  const magnitude = Math.abs(pts).toFixed(1);
  // A regressed scorer keeps its tone wash; a flat/up scorer reads neutral.
  const chipColor = down ? TEXT_COLOR[tone] : "var(--text-muted)";
  const emphasized = down && (tone === "red" || tone === "violet");
  return (
    <span
      className="mono"
      style={{
        font: "var(--mono-sm)",
        fontSize: 11,
        color: chipColor,
        background: emphasized
          ? tone === "violet"
            ? "var(--violet-16)"
            : "var(--red-14)"
          : "transparent",
        border: `1px solid ${
          emphasized
            ? `color-mix(in srgb, ${TEXT_COLOR[tone]} 40%, transparent)`
            : "var(--border)"
        }`,
        borderRadius: "var(--radius-sm)",
        padding: "1px 5px",
        whiteSpace: "nowrap",
      }}
    >
      {down ? "▼" : "▲"}
      {magnitude}
    </span>
  );
}

function ScorerCard({ item }: { item: ScorerBreakdownItem }) {
  const tone = toneFor(item);
  const pct = item.passRate * 100;
  return (
    <div
      style={{
        padding: 12,
        borderRadius: item.culprit ? "var(--radius-control)" : 0,
        background: item.culprit ? "var(--red-14)" : "transparent",
        marginBottom: item.culprit ? 6 : 0,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 8 }}
      >
        <span
          className="mono"
          style={{ font: "var(--mono-base)", fontSize: 13, color: "var(--text-hi)" }}
        >
          {item.name}
        </span>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span
            className="mono"
            style={{
              font: "var(--mono-base)",
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_COLOR[tone],
            }}
          >
            {pct.toFixed(1)}%
          </span>
          {deltaChip(item, tone)}
        </div>
      </div>

      {/* bar track */}
      <div
        style={{
          height: 7,
          borderRadius: "var(--radius-sm)",
          background: "var(--surface-panel)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: BAR_COLOR[tone],
            boxShadow:
              tone === "red"
                ? "0 0 8px var(--red)"
                : tone === "violet"
                  ? "0 0 8px color-mix(in srgb, var(--violet) 50%, transparent)"
                  : "none",
          }}
        />
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 7 }}
      >
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", fontSize: 10, color: "var(--text-muted)" }}
        >
          {item.passCount}/{item.total}
          {item.culprit ? " · culprit" : ""}
        </span>
        <Sparkline
          data={item.trend}
          width={72}
          height={18}
          tone={SPARK_TONE[tone]}
          animate={false}
        />
      </div>
    </div>
  );
}

/**
 * ScorerBreakdown — the BY SCORER panel. One card per scorer with its head-run
 * pass-rate, a ▼/▲ delta chip vs the baseline, a tone-keyed bar + glow, the
 * raw pass/total, a culprit flag, and an inline trend spark. Culprit scorers
 * (the regression drivers) get a red wash so the panel reads at a glance.
 */
export function ScorerBreakdown({ scorers, caption }: ScorerBreakdownProps) {
  return (
    <Card
      padding={false}
      header="BY SCORER"
      actions={
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}
        >
          {caption}
        </span>
      }
    >
      <div style={{ padding: 8 }}>
        {scorers.map((item) => (
          <ScorerCard key={item.name} item={item} />
        ))}
      </div>
    </Card>
  );
}
