"use client";

import { type CSSProperties, type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Sparkline, type SparklineTone } from "@/components/ui/sparkline";
import  { type SuiteKpis, type SuiteRow } from "@/lib/queries/suites";

import { formatCost, formatPct } from "./format";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Mono tone for the big number. */
  tone: string;
  /** Sub-line under the value. */
  foot: ReactNode;
  footTone?: string;
  /** Optional trailing sparkline (the pass-rate card). */
  spark?: { data: number[]; tone: SparklineTone };
}

const VALUE_STYLE: CSSProperties = {
  font: "600 32px/1.1 var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
};

function KpiCard({ label, value, tone, foot, footTone, spark }: KpiCardProps) {
  return (
    <Card style={{ padding: 16, minWidth: 240 }}>
      <SectionLabel style={{ marginBottom: 10 }}>{label}</SectionLabel>
      <div className="flex items-end justify-between" style={{ gap: 8 }}>
        <div className="mono" style={{ ...VALUE_STYLE, color: tone }}>
          {value}
        </div>
        {spark && (
          <Sparkline data={spark.data} tone={spark.tone} width={72} height={24} />
        )}
      </div>
      <div
        className="mono"
        style={{
          font: "var(--mono-sm)",
          fontSize: 12,
          marginTop: 8,
          color: footTone ?? "var(--text-muted)",
        }}
      >
        {foot}
      </div>
    </Card>
  );
}

export interface SuitesKpiStripProps {
  kpis: SuiteKpis;
  suites: SuiteRow[];
}

/**
 * The four-up KPI strip over the suite table. Pass-rate and regressed-count map
 * straight from the overview query; cost and passing-count fill the remaining
 * two slots (the query is the data contract — nothing here is hardcoded). The
 * pass-rate card carries a phosphor sparkline built from the suite pass-rates.
 */
export function SuitesKpiStrip({ kpis, suites }: SuitesKpiStripProps) {
  const meanPct = formatPct(kpis.meanPassRate);
  const [whole, frac] = meanPct.replace("%", "").split(".");

  // Pass-rate sparkline: each suite's latest pass-rate, lowest-first so the
  // line climbs to the strongest suite — a data-driven decorative trend.
  const sparkData = suites
    .map((s) => s.passRate)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  const regressedName = suites.find((s) => s.status === "regressed")?.slug;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 24,
      }}
    >
      <KpiCard
        label="OVERALL PASS-RATE"
        tone="var(--phosphor)"
        value={
          kpis.meanPassRate === null ? (
            "—"
          ) : (
            <>
              {whole}
              <span style={{ fontSize: 18, color: "var(--text-muted)" }}>
                .{frac ?? "0"}%
              </span>
            </>
          )
        }
        foot={
          <>
            {kpis.ranSuiteCount} of {kpis.suiteCount} suites ·{" "}
            <span style={{ color: "var(--text-muted)" }}>mean latest run</span>
          </>
        }
        spark={
          sparkData.length > 1
            ? { data: sparkData, tone: "phosphor" }
            : undefined
        }
      />

      <KpiCard
        label="SUITES REGRESSED"
        tone={kpis.regressedCount > 0 ? "var(--red)" : "var(--phosphor)"}
        value={kpis.regressedCount}
        foot={regressedName ?? "none"}
      />

      <KpiCard
        label="TOTAL COST"
        tone="var(--violet)"
        value={formatCost(kpis.totalCostUsd)}
        foot={
          <>
            across {kpis.ranSuiteCount}{" "}
            <span style={{ color: "var(--text-muted)" }}>latest runs</span>
          </>
        }
      />

      <KpiCard
        label="SUITES PASSING"
        tone={kpis.passingCount > 0 ? "var(--phosphor)" : "var(--amber)"}
        value={kpis.passingCount}
        foot={
          <>
            {kpis.flakyCount} flaky · {kpis.staleCount} stale
          </>
        }
      />
    </div>
  );
}
