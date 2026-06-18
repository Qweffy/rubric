"use client";

import { useId } from "react";

import { type JudgeComparisonRow } from "@/lib/queries/calibration";

import {
  type ScatterPoint,
  formatCost,
  scatterModel,
} from "./lib";

// Plot geometry in the 560×300 viewBox (ported from the .dc.html scatter).
const VB_W = 560;
const VB_H = 300;
const PLOT = { x0: 70, x1: 470, y0: 210, y1: 64 };
const GRID_Y = [50, 120, 190, 240];
const GRID_X = [180, 330, 470];

function Dot({ point }: { point: ScatterPoint }) {
  const color = point.isFlagged ? "var(--amber)" : "var(--violet)";
  // Keep the dot label clear of the frame edges.
  const labelAbove = point.y > 90;
  const labelY = labelAbove ? point.y - 16 : point.y + 22;
  return (
    <g>
      <circle cx={point.x} cy={point.y} r={6} fill={color} />
      <text
        x={point.x}
        y={labelY}
        fill={color}
        fontFamily="var(--font-mono)"
        fontSize={9}
        textAnchor="middle"
      >
        {point.label}
      </text>
    </g>
  );
}

export interface CostAccuracyScatterProps {
  judges: JudgeComparisonRow[];
  recommendedId: number | null;
  defaultId: number | null;
  flaggedId: number | null;
}

/**
 * Cost-vs-accuracy scatter — κ (up = more accurate) against $/1k (left =
 * cheaper). The dashed pareto frontier links the judges in ascending cost; the
 * recommended judge is ringed phosphor as the "value knee". Every coordinate is
 * projected from the seeded κ / cost, so the plot reframes if the data changes.
 */
export function CostAccuracyScatter({
  judges,
  recommendedId,
  defaultId,
  flaggedId,
}: CostAccuracyScatterProps) {
  const rawId = useId();
  const glowId = `knee-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const model = scatterModel(judges, PLOT, recommendedId, defaultId, flaggedId);
  const knee = model.points.find((p) => p.isRecommended) ?? null;

  // κ gridline labels: top of the strong band and a mid tick, mapped through the
  // same projection the points use (derive the κ at the top/3rd gridline).
  const kAtY = (y: number): number => {
    const span = PLOT.y0 - PLOT.y1;
    const frac = (PLOT.y0 - y) / span;
    const kPad = Math.max(0.04, (model.maxKappa - model.minKappa) * 0.18);
    const kLo = model.minKappa - kPad;
    const kHi = model.maxKappa + kPad;
    return kLo + frac * (kHi - kLo);
  };

  return (
    <div style={{ padding: 16 }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height={300}
        role="img"
        aria-label="Cost versus accuracy: kappa against dollars per 1k judge calls"
      >
        <defs>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid */}
        <g stroke="var(--phosphor)" strokeOpacity={0.09} strokeWidth={1}>
          {GRID_Y.map((y) => (
            <line key={`gy-${y}`} x1={50} y1={y} x2={540} y2={y} />
          ))}
          {GRID_X.map((x) => (
            <line key={`gx-${x}`} x1={x} y1={30} x2={x} y2={240} />
          ))}
        </g>

        {/* κ axis labels */}
        <g
          fill="var(--text-low)"
          fontFamily="var(--font-mono)"
          fontSize={9}
          textAnchor="end"
        >
          <text x={44} y={54}>
            {kAtY(50).toFixed(2).replace(/^0/, "")}
          </text>
          <text x={44} y={194}>
            {kAtY(190).toFixed(2).replace(/^0/, "")}
          </text>
        </g>

        {/* pareto frontier */}
        <path
          d={model.frontier}
          fill="none"
          stroke="var(--phosphor)"
          strokeWidth={1.6}
          strokeOpacity={0.55}
          strokeDasharray="5 4"
        />

        {/* dots + labels */}
        {model.points.map((point) => (
          <Dot key={point.judgeId} point={point} />
        ))}

        {/* recommended knee ring */}
        {knee ? (
          <>
            <circle
              cx={knee.x}
              cy={knee.y}
              r={11}
              fill="none"
              stroke="var(--phosphor)"
              strokeWidth={1.8}
              filter={`url(#${glowId})`}
            />
            <circle cx={knee.x} cy={knee.y} r={6} fill="var(--violet)" />
            <text
              x={knee.x}
              y={knee.y - 18}
              fill="var(--phosphor)"
              fontFamily="var(--font-mono)"
              fontSize={9}
              textAnchor="middle"
              fontWeight={600}
            >
              {knee.label} ◆ value
            </text>
          </>
        ) : null}

        {/* cost axis ticks */}
        <g fill="var(--text-low)" fontFamily="var(--font-mono)" fontSize={9}>
          {model.points.map((point) => (
            <text key={`ct-${point.judgeId}`} x={point.x} y={262} textAnchor="middle">
              {formatCost(point.cost)}
            </text>
          ))}
        </g>

        <text
          x={50}
          y={288}
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
          fontSize={10}
        >
          cheaper ↙ · more accurate ↗
        </text>
      </svg>
    </div>
  );
}
