import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SkeletonVariant = "text" | "row" | "card" | "gauge";

/**
 * Phosphor-tinted shimmer placeholder. Uses the global `.hr-skeleton`
 * class, which degrades to a static fill under `prefers-reduced-motion`
 * (see app/globals.css). Geometry mirrors the design-system spec's
 * `.rb-skel` rows (14px bars at 60% / 90% / 45% widths).
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** @default 'text' */
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Line count for variant="text". @default 3 */
  lines?: number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  lines = 3,
  className,
  style,
  ...rest
}: SkeletonProps) {
  if (variant === "text") {
    // Spec rows taper 60% → 90% → 45%; repeat the cycle for extra lines.
    const widths = ["60%", "90%", "45%"];
    return (
      <div
        className={cn("flex flex-col", className)}
        style={{ gap: 10, width: width ?? "100%", ...style }}
        {...rest}
      >
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="hr-skeleton"
            style={{ height: 14, width: widths[i % widths.length] }}
          />
        ))}
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div
        className={cn("flex items-center", className)}
        style={{
          gap: 16,
          padding: "12px 14px",
          border: "var(--border-1)",
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card)",
          ...style,
        }}
        {...rest}
      >
        <div className="flex flex-1 flex-col" style={{ gap: 9 }}>
          <div className="hr-skeleton" style={{ height: 13, width: "45%" }} />
          <div className="hr-skeleton" style={{ height: 10, width: "70%" }} />
        </div>
        <div
          className="hr-skeleton shrink-0"
          style={{ width: 72, height: 22, borderRadius: "var(--radius-sm)" }}
        />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn("flex flex-col", className)}
        style={{
          gap: 12,
          padding: 16,
          border: "var(--border-1)",
          borderRadius: "var(--radius-card)",
          background: "var(--surface-card)",
          minWidth: 150,
          ...style,
        }}
        {...rest}
      >
        <div className="hr-skeleton" style={{ height: 9, width: "40%" }} />
        <div className="hr-skeleton" style={{ height: 30, width: "70%" }} />
        <div className="hr-skeleton" style={{ height: 9, width: "55%" }} />
      </div>
    );
  }

  // gauge — circular dial placeholder (score-gauge / kappa-gauge loading)
  return (
    <div className={cn("inline-flex", className)} style={style} {...rest}>
      <div
        className="hr-skeleton"
        style={{ width: width ?? 120, height: height ?? 120, borderRadius: "50%" }}
      />
    </div>
  );
}

export interface LoadingSweepProps extends HTMLAttributes<HTMLDivElement> {
  /** Children rendered beneath the sweep (usually skeletons or a chart). */
  children?: ReactNode;
  /**
   * Sweep travel distance in px. The phosphor scanline crosses the host
   * from x=0 to this value. @default 320
   */
  distance?: number;
  /** Sweep cycle duration. @default '4s' */
  duration?: string;
  /** Hue of the travelling line. @default 'phosphor' */
  tone?: "phosphor" | "violet" | "cyan";
}

const SWEEP_COLOR: Record<NonNullable<LoadingSweepProps["tone"]>, string> = {
  phosphor: "var(--phosphor)",
  violet: "var(--violet)",
  cyan: "var(--cyan)",
};

/**
 * Host that overlays a travelling phosphor scanline (`.rb-sweep-line`)
 * on top of `children` — the "first sweep populating the panel" motif
 * from the spec hero. The line's animation is killed under
 * `prefers-reduced-motion` by the global guard, leaving a static panel.
 */
export function LoadingSweep({
  children,
  distance = 320,
  duration = "4s",
  tone = "phosphor",
  className,
  style,
  ...rest
}: LoadingSweepProps) {
  const color = SWEEP_COLOR[tone];
  // Cast keeps the CSS custom prop `--sw` typed without `any`.
  const sweepStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 2,
    height: "100%",
    pointerEvents: "none",
    background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
    boxShadow: `0 0 12px ${color}`,
    "--sw": `${distance}px`,
    animation: `rb-sweep ${duration} linear infinite`,
  } as CSSProperties;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ borderRadius: "var(--radius-card)", ...style }}
      aria-busy="true"
      {...rest}
    >
      {children}
      <div className="rb-sweep-line" style={sweepStyle} aria-hidden="true" />
    </div>
  );
}
