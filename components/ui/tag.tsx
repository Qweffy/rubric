"use client";

import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Tag tones — neutral outline plus the meaning-bearing accents. Rubric adds
 * `red` (regressions / removed) on top of the hiring-radar set.
 */
export type TagTone =
  | "neutral"
  | "phosphor"
  | "cyan"
  | "violet"
  | "amber"
  | "red";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  /** @default 'neutral' */
  tone?: TagTone;
  icon?: IconName;
  /** When provided, renders an x that calls this. Turns the tag into a filter chip. */
  onRemove?: () => void;
  selected?: boolean;
}

interface ToneStyle {
  color: string;
  border: string;
}

/**
 * Per the design system's `.rb-tag`, accent tags are outline-only: the accent
 * tints the text + border over a transparent fill (no badge-style wash).
 */
const TONES: Record<TagTone, ToneStyle> = {
  neutral: { color: "var(--text-body)", border: "var(--border)" },
  phosphor: {
    color: "var(--phosphor)",
    border: "color-mix(in srgb, var(--phosphor) 36%, transparent)",
  },
  cyan: {
    color: "var(--cyan)",
    border: "color-mix(in srgb, var(--cyan) 36%, transparent)",
  },
  violet: {
    color: "var(--violet)",
    border: "color-mix(in srgb, var(--violet) 40%, transparent)",
  },
  amber: {
    color: "var(--amber)",
    border: "color-mix(in srgb, var(--amber) 38%, transparent)",
  },
  red: {
    color: "var(--danger)",
    border: "color-mix(in srgb, var(--danger) 40%, transparent)",
  },
};

/** Mono outline chip — stack tags ("v0.4.2", "flaky") and removable filter chips. */
export function Tag({
  children,
  tone = "neutral",
  icon,
  onRemove,
  selected = false,
  className,
  style,
  ...rest
}: TagProps) {
  const t = TONES[tone];

  // A removable filter chip reads as "applied": the design system draws those
  // with high-contrast text + a strong phosphor border regardless of tone.
  // `selected` gets the same emphasis on the neutral tone.
  const emphasized = onRemove != null || (selected && tone === "neutral");

  const chipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 24,
    padding: "0 8px",
    font: "500 12px/1 var(--font-mono)",
    color: emphasized ? "var(--text-hi)" : t.color,
    background: "transparent",
    border: `1px solid ${emphasized ? "var(--border-strong)" : t.border}`,
    borderRadius: "var(--radius-sm)",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    ...style,
  };

  return (
    <span className={cn(className)} style={chipStyle} {...rest}>
      {icon && <Icon name={icon} size={13} strokeWidth={1.5} />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="inline-flex cursor-pointer opacity-60 transition-opacity hover:opacity-100"
          style={{
            marginRight: -3,
            padding: 1,
            background: "none",
            border: "none",
            color: "inherit",
          }}
        >
          <Icon name="x" size={12} strokeWidth={1.6} />
        </button>
      )}
    </span>
  );
}
