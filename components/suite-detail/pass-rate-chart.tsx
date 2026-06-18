"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Toggle } from "@/components/ui/toggle";

/** A single run plotted on the time-series, oldest-first. */
export interface ChartRun {
  id: number;
  sha: string;
  promptLabel: string;
  passRate: number;
  passCount: number;
  total: number;
  status: string;
  startedAt: string;
  /** Prompt-version change at this run vs. the prior one (e.g. "v22→v23"). */
  versionChange: string | null;
  /** This run is the regression head — the red drop terminus. */
  isRegression: boolean;
}

export interface PassRateChartProps {
  runs: ChartRun[];
  /** Gate floor as a fraction (0-1). @default 0.9 */
  gate?: number;
  overlayScorers: boolean;
  onToggleOverlay: (next: boolean) => void;
}

const VIEW_W = 760;
const VIEW_H = 300;
const PLOT_LEFT = 56;
const PLOT_RIGHT = 720;
const PLOT_TOP = 30;
const PLOT_BOTTOM = 270;
// y-domain is 70-100% — matches the design's axis labels.
const Y_MIN = 0.7;
const Y_MAX = 1.0;

function yFor(rate: number): number {
  const clamped = Math.max(Y_MIN, Math.min(Y_MAX, rate));
  const t = (clamped - Y_MIN) / (Y_MAX - Y_MIN);
  return PLOT_BOTTOM - t * (PLOT_BOTTOM - PLOT_TOP);
}

function xFor(index: number, count: number): number {
  if (count <= 1) return PLOT_LEFT;
  return PLOT_LEFT + (index / (count - 1)) * (PLOT_RIGHT - PLOT_LEFT);
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} UTC`;
}

/**
 * PassRateChart — the annotated pass-rate time-series. A phosphor line over the
 * last N runs, a below-gate red shaded band + dashed gate floor, dashed violet
 * version-change markers, and a glowing red drop segment + pulsing dot when the
 * head run regresses below gate. A glass tooltip pins the head run's readout.
 * The y-axis spans 70-100%; reduced-motion settles the pulse statically.
 */
export function PassRateChart({
  runs,
  gate = 0.9,
  overlayScorers,
  onToggleOverlay,
}: PassRateChartProps) {
  const count = runs.length;

  const geometry = useMemo(() => {
    const gateY = yFor(gate);
    const points = runs.map((r, i) => ({
      run: r,
      x: xFor(i, count),
      y: yFor(r.passRate),
    }));

    // The line stops at the last non-regression run; the regression head is
    // drawn as a separate red drop segment so its descent reads as the story.
    const regressionIndex = points.findIndex((p) => p.run.isRegression);
    const lineEnd =
      regressionIndex > 0 ? regressionIndex - 1 : points.length - 1;
    const linePoints = points.slice(0, lineEnd + 1);

    const linePath = linePoints
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
      .join(" ");

    const last = linePoints[linePoints.length - 1];
    const first = linePoints[0];
    const areaPath =
      first && last
        ? `${linePath} L${last.x} ${PLOT_BOTTOM} L${first.x} ${PLOT_BOTTOM} Z`
        : "";

    const dropFrom = lineEnd >= 0 ? points[lineEnd] : null;
    const dropTo =
      regressionIndex >= 0 ? points[regressionIndex] : null;

    const versionMarkers = points.filter((p) => p.run.versionChange !== null);

    return { gateY, points, linePath, areaPath, dropFrom, dropTo, versionMarkers };
  }, [runs, count, gate]);

  const head = runs[runs.length - 1] ?? null;
  const headPoint = geometry.points[geometry.points.length - 1] ?? null;
  const headBelowGate = head !== null && head.passRate < gate;

  // x-axis: first / last run ids, plus up to two interior ticks.
  const xTicks = useMemo(() => {
    if (count === 0) return [] as { x: number; label: string }[];
    const idxs = new Set<number>([0, count - 1]);
    if (count >= 3) idxs.add(Math.floor((count - 1) / 3));
    if (count >= 4) idxs.add(Math.floor((2 * (count - 1)) / 3));
    return [...idxs]
      .sort((a, b) => a - b)
      .map((i) => {
        const run = runs[i];
        return run ? { x: xFor(i, count), label: `#${run.id}` } : null;
      })
      .filter((t): t is { x: number; label: string } => t !== null);
  }, [runs, count]);

  return (
    <Card padding={false}>
      <div
        className="flex items-center justify-between gap-3"
        style={{ padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel>
          PASS-RATE · LAST {count} RUN{count === 1 ? "" : "S"}
        </SectionLabel>
        <div className="flex items-center" style={{ gap: 10 }}>
          <SectionLabel>OVERLAY PER-SCORER</SectionLabel>
          <Toggle checked={overlayScorers} onChange={onToggleOverlay} />
        </div>
      </div>

      <div style={{ position: "relative", padding: 16 }}>
        <style>{`
@keyframes rb-suite-pulse { 0%, 100% { r: 4px; opacity: 1; } 50% { r: 7px; opacity: 0.55; } }
@keyframes rb-suite-ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }
.rb-suite-pulse { animation: rb-suite-pulse 1.8s var(--ease-out) infinite; }
.rb-suite-ping { animation: rb-suite-ping 1.8s var(--ease-out) infinite; transform-origin: center; transform-box: fill-box; }
@media (prefers-reduced-motion: reduce) { .rb-suite-pulse, .rb-suite-ping { animation: none; } .rb-suite-ping { opacity: 0; } }
`}</style>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          height={300}
          style={{ display: "block" }}
          role="img"
          aria-label={`Pass-rate over the last ${count} runs`}
        >
          <defs>
            <filter id="suiteDropGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="suitePassArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--phosphor)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--phosphor)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* below-gate shaded band */}
          <rect
            x={PLOT_LEFT}
            y={geometry.gateY}
            width={PLOT_RIGHT - PLOT_LEFT}
            height={PLOT_BOTTOM - geometry.gateY}
            fill="var(--red)"
            fillOpacity="0.05"
          />

          {/* grid */}
          <g stroke="var(--phosphor)" strokeOpacity="0.09" strokeWidth="1">
            <line x1={PLOT_LEFT} y1={30} x2={PLOT_RIGHT} y2={30} />
            <line x1={PLOT_LEFT} y1={78} x2={PLOT_RIGHT} y2={78} />
            <line x1={PLOT_LEFT} y1={190} x2={PLOT_RIGHT} y2={190} />
            <line x1={PLOT_LEFT} y1={270} x2={PLOT_RIGHT} y2={270} />
          </g>

          {/* y axis labels */}
          <g
            fill="var(--text-low-content)"
            fontFamily="var(--font-mono)"
            fontSize="10"
            textAnchor="end"
          >
            <text x="48" y="34">100</text>
            <text x="48" y="114">90</text>
            <text x="48" y="194">80</text>
            <text x="48" y="273">70</text>
          </g>

          {/* gate threshold */}
          <line
            x1={PLOT_LEFT}
            y1={geometry.gateY}
            x2={PLOT_RIGHT}
            y2={geometry.gateY}
            stroke="var(--red)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeOpacity="0.7"
          />
          <text
            x={PLOT_RIGHT - 4}
            y={geometry.gateY - 6}
            fill="var(--red)"
            fontFamily="var(--font-mono)"
            fontSize="9"
            textAnchor="end"
            opacity="0.85"
          >
            GATE {Math.round(gate * 100)}%
          </text>

          {/* version-change markers */}
          {geometry.versionMarkers.map((m, i) => {
            const isRegressionMarker = m.run.isRegression;
            const color = isRegressionMarker ? "var(--red)" : "var(--violet)";
            return (
              <g key={`vm-${m.run.id}-${i}`}>
                <line
                  x1={m.x}
                  y1={PLOT_TOP - 4}
                  x2={m.x}
                  y2={PLOT_BOTTOM}
                  stroke={color}
                  strokeWidth={isRegressionMarker ? 1.4 : 1.2}
                  strokeDasharray={isRegressionMarker ? undefined : "3 3"}
                  strokeOpacity={isRegressionMarker ? 0.7 : 0.55}
                />
                <text
                  x={m.x}
                  y={PLOT_TOP - 10}
                  fill={color}
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                  textAnchor="middle"
                  fontWeight={isRegressionMarker ? 600 : 400}
                >
                  {m.run.versionChange}
                </text>
              </g>
            );
          })}

          {/* area + phosphor line */}
          {geometry.areaPath ? (
            <path d={geometry.areaPath} fill="url(#suitePassArea)" />
          ) : null}
          {geometry.linePath ? (
            <path
              d={geometry.linePath}
              fill="none"
              stroke="var(--phosphor)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* red drop segment to the regression head */}
          {geometry.dropFrom && geometry.dropTo ? (
            <>
              <path
                d={`M${geometry.dropFrom.x} ${geometry.dropFrom.y} L${geometry.dropTo.x} ${geometry.dropTo.y}`}
                fill="none"
                stroke="var(--red)"
                strokeWidth="2.4"
                strokeLinecap="round"
                filter="url(#suiteDropGlow)"
              />
              <circle
                className="rb-suite-ping"
                cx={geometry.dropTo.x}
                cy={geometry.dropTo.y}
                r="4"
                fill="none"
                stroke="var(--red)"
                strokeWidth="1.5"
                style={{ transformOrigin: "center", transformBox: "fill-box" }}
              />
              <circle
                className="rb-suite-pulse"
                cx={geometry.dropTo.x}
                cy={geometry.dropTo.y}
                r="4"
                fill="var(--red)"
                filter="url(#suiteDropGlow)"
              />
            </>
          ) : headPoint ? (
            <circle cx={headPoint.x} cy={headPoint.y} r="3" fill="var(--phosphor)" />
          ) : null}

          {/* x axis run labels */}
          <g
            fill="var(--text-low-content)"
            fontFamily="var(--font-mono)"
            fontSize="10"
            textAnchor="middle"
          >
            {xTicks.map((t, i) => (
              <text key={`xt-${i}`} x={t.x} y="288">
                {t.label}
              </text>
            ))}
          </g>
        </svg>

        {/* glass tooltip pinned to the head run */}
        {head ? (
          <div
            style={{
              position: "absolute",
              top: 54,
              right: 30,
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-control)",
              background: "var(--glass)",
              backdropFilter: "blur(var(--blur-glass))",
              WebkitBackdropFilter: "blur(var(--blur-glass))",
              boxShadow: "var(--shadow-card)",
              padding: "9px 11px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <span
              className="mono"
              style={{ font: "var(--mono-sm)", fontSize: 12, color: "var(--text-hi)" }}
            >
              run #{head.id} ·{" "}
              <span style={{ color: "var(--text-muted)" }}>{head.promptLabel}</span>
            </span>
            <span
              className="mono"
              style={{
                font: "var(--mono-sm)",
                fontSize: 12,
                color: headBelowGate ? "var(--red)" : "var(--phosphor)",
              }}
            >
              {(head.passRate * 100).toFixed(1)}% · {head.passCount}/{head.total}
            </span>
            <span
              className="mono"
              style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}
            >
              <span style={{ color: "var(--cyan)" }}>{head.sha}</span> ·{" "}
              {timeLabel(head.startedAt)}
            </span>
          </div>
        ) : null}
      </div>

      {/* legend */}
      <div
        className="flex items-center"
        style={{ gap: 18, padding: "10px 16px", borderTop: "1px solid var(--divider)" }}
      >
        <LegendItem swatch={<span style={swatchLine("var(--phosphor)")} />} label="pass-rate" />
        <LegendItem
          swatch={<span style={{ width: 2, height: 14, background: "var(--violet)" }} />}
          label="version change"
        />
        <LegendItem
          swatch={
            <span
              style={{
                width: 16,
                height: 2,
                background:
                  "repeating-linear-gradient(90deg,var(--red) 0 4px,transparent 4px 7px)",
              }}
            />
          }
          label="gate floor"
        />
      </div>
    </Card>
  );
}

function swatchLine(color: string): React.CSSProperties {
  return { width: 16, height: 2, background: color, borderRadius: 1 };
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center" style={{ gap: 7 }}>
      {swatch}
      <span className="mono" style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
