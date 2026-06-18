import { type CSSProperties, type SVGProps } from "react";

export type SparklineTone = "phosphor" | "violet" | "cyan" | "red" | "amber";

export interface SparklineProps extends SVGProps<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  /** @default 'phosphor' */
  tone?: SparklineTone;
  /**
   * Play the draw-on stroke animation (`rb-spark`). Always disabled under
   * `prefers-reduced-motion` by the global `.rb-spark-path` guard. @default true
   */
  animate?: boolean;
}

const TONE_COLOR: Record<SparklineTone, string> = {
  phosphor: "var(--phosphor)",
  violet: "var(--violet)",
  cyan: "var(--cyan)",
  red: "var(--red)",
  amber: "var(--amber)",
};

/** Tiny inline trend line for scorecards and data rows. 72×22, 1.5px stroke. */
export function Sparkline({
  data,
  width = 72,
  height = 22,
  tone = "phosphor",
  animate = true,
  style,
  ...rest
}: SparklineProps) {
  const color = TONE_COLOR[tone];

  if (data.length === 0) {
    return <svg width={width} height={height} style={style} aria-hidden="true" {...rest} />;
  }

  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const denom = Math.max(1, data.length - 1);
  const points = data.map((v, i): [number, number] => {
    const x = pad + (i / denom) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y];
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) {
    return <svg width={width} height={height} style={style} aria-hidden="true" {...rest} />;
  }
  const area = `${line} L${last[0]},${height - pad} L${first[0]},${height - pad} Z`;

  // Path length drives the draw-on dash sweep (sum of segment distances).
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    if (prev === undefined || cur === undefined) continue;
    len += Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
  }

  // Deterministic (SSR-safe) gradient id: the gradient only depends on the
  // tone, so same-tone sparklines share an identical definition.
  const gradientId = `rb-spark-grad-${tone}`;

  // Cast keeps the CSS custom prop `--len` typed without `any`.
  const drawStyle = animate
    ? ({
        "--len": len.toFixed(0),
        strokeDasharray: len.toFixed(0),
        animation: "rb-spark 1.4s var(--ease-out) forwards",
      } as CSSProperties)
    : undefined;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path
        className={animate ? "rb-spark-path" : undefined}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={drawStyle}
      />
      <circle cx={last[0]} cy={last[1]} r="1.8" fill={color} />
    </svg>
  );
}
