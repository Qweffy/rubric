/**
 * A deterministic scatter cloud + fitted trend line for a single bias signal.
 *
 * The dots are jittered around the regression line so the cloud *reads* as the
 * sign/magnitude of the bias without being derived from per-point data we don't
 * have — the only load-bearing number is `slope` (the bias coefficient from the
 * query), which sets the slope of the fit line and is also printed in the card
 * header by the caller. A flat line (slope≈0) = negligible; a tilted line =
 * the judge skews with that axis.
 */
export interface BiasScatterProps {
  /** Bias coefficient, e.g. +0.03 (position) or +0.11 (length). Drives the tilt. */
  slope: number;
  /** Trend-line color. @default 'var(--violet)' */
  lineColor?: string;
  /** Dash the trend line (used for the length-bias fit). @default false */
  dashed?: boolean;
  /** Axis caption rendered bottom-left, e.g. "position →". */
  axisLabel: string;
}

// Geometry ported 1:1 from the design (Rubric Judge Calibration.dc.html → BIAS
// SCATTERS): a 560×150 viewBox, gridlines at y=30/75/120 and x=160/290/420, a
// 14-point violet cloud, and a thin trend line spanning x=34→548.
const VB_W = 560;
const VB_H = 150;
const X0 = 34;
const X1 = 548;
const Y_MID = 75;

// The 14 sample x positions, evenly spread + a few off-row jitter points, taken
// from the design's circle layout so the cloud silhouette matches the handoff.
const SAMPLE_XS = [
  70, 110, 150, 200, 250, 300, 350, 400, 450, 500, 120, 270, 380, 470,
];

// Vertical jitter (in viewBox units) layered on top of the trend line so the
// cloud has texture without implying real per-point values. Index-aligned to
// SAMPLE_XS; deterministic so SSR and client render identically.
const JITTER = [-5, 7, -7, 3, -3, 5, -5, 1, -4, -1, -15, 13, -11, 8];

/**
 * Map a bias slope to a vertical rise across the plot. The design draws a
 * near-flat line for the negligible +0.03 case and a clear downward sweep
 * (lower-left → upper-right, i.e. "favors longer/higher") for +0.11. We mirror
 * that: positive slope tilts the right edge UP (smaller y). Clamped so extreme
 * coefficients stay on-canvas.
 */
function riseForSlope(slope: number): number {
  const MAX_RISE = 52;
  return Math.max(-MAX_RISE, Math.min(MAX_RISE, slope * 4.6 * 100));
}

export function BiasScatter({
  slope,
  lineColor = "var(--violet)",
  dashed = false,
  axisLabel,
}: BiasScatterProps) {
  const rise = riseForSlope(slope);
  // The fit line pivots about the mid-height: left end drops by `rise/2`,
  // right end lifts by `rise/2`, so a positive slope reads as upward-to-right.
  const lineY0 = Y_MID + rise / 2;
  const lineY1 = Y_MID - rise / 2;

  const yAtX = (x: number): number => {
    const t = (x - X0) / (X1 - X0);
    return lineY0 + (lineY1 - lineY0) * t;
  };

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height={150}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Bias scatter, slope ${slope >= 0 ? "+" : ""}${slope.toFixed(2)}`}
    >
      {/* grid */}
      <g stroke="var(--phosphor)" strokeOpacity={0.09} strokeWidth={1}>
        <line x1={X0} y1={30} x2={X1} y2={30} />
        <line x1={X0} y1={75} x2={X1} y2={75} />
        <line x1={X0} y1={120} x2={X1} y2={120} />
        <line x1={160} y1={12} x2={160} y2={130} />
        <line x1={290} y1={12} x2={290} y2={130} />
        <line x1={420} y1={12} x2={420} y2={130} />
      </g>

      {/* fitted trend line */}
      <line
        x1={X0}
        y1={lineY0}
        x2={X1}
        y2={lineY1}
        stroke={lineColor}
        strokeWidth={1.6}
        strokeOpacity={dashed ? 0.75 : 0.7}
        strokeDasharray={dashed ? "5 4" : undefined}
      />

      {/* the cloud — violet dots scattered around the fit */}
      <g fill="var(--violet)" fillOpacity={0.7}>
        {SAMPLE_XS.map((x, i) => (
          <circle key={x} cx={x} cy={yAtX(x) + (JITTER[i] ?? 0)} r={2.5} />
        ))}
      </g>

      <text
        x={40}
        y={144}
        fill="var(--text-low-content)"
        fontFamily="var(--font-mono)"
        fontSize={9}
      >
        {axisLabel}
      </text>
    </svg>
  );
}
