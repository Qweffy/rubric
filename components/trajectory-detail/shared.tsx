import { type ReactNode } from "react";

/* Small presentational primitives shared across the trajectory-detail subtree.
   Kept in their own module so the feature components don't import back through
   the top-level view (which would form an import cycle). Token vars only. */

/** A 6px (configurable) status dot, optionally glowing. */
export function Dot({
  color,
  glow,
  size = 6,
}: {
  color: string;
  glow?: boolean;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: glow ? `0 0 6px ${color}` : undefined,
        flex: "none",
        display: "inline-block",
      }}
    />
  );
}

type GlyphTone = "phosphor" | "amber" | "red" | "low";

/** The pill alignment-glyph badge (✓ MATCH / + INSERT / ⇄ SUB / − DEL). */
export function GlyphBadge({
  children,
  tone,
  filled,
}: {
  children: ReactNode;
  tone: GlyphTone;
  filled?: boolean;
}) {
  const color =
    tone === "phosphor"
      ? "var(--phosphor)"
      : tone === "amber"
        ? "var(--amber)"
        : tone === "red"
          ? "var(--red)"
          : "var(--text-low)";
  const borderPct =
    tone === "phosphor" ? 38 : tone === "amber" ? 46 : tone === "red" ? 46 : 0;
  return (
    <span
      className="mono"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        padding: "0 9px",
        borderRadius: 999,
        font: "700 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color,
        background: filled ? "var(--surface-card)" : "transparent",
        border:
          tone === "low"
            ? "1px solid var(--divider)"
            : `1px solid color-mix(in srgb, ${color} ${borderPct}%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

/* The `.mono` helper from the handoff (`font-family: mono; tabular-nums`). The
   repo tokens expose the families but no `.mono` utility, so we scope one here
   for the trajectory-detail subtree. */
export function MonoStyle() {
  return (
    <style href="rb-mono-util" precedence="default">{`
      .mono {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
      }
    `}</style>
  );
}
