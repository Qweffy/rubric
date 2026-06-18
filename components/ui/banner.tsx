"use client";

import { type HTMLAttributes, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Banner tones. Rubric adds `cyan` (info / ingest notices) on top of the
 * hiring-radar amber|violet|red set. Tone is never the sole signal: every
 * banner pairs its hue with a glyph and the mono-readable message text.
 */
export type BannerTone = "amber" | "violet" | "red" | "cyan";

interface ToneSpec {
  /** Foreground (icon + action) color. */
  color: string;
  /** Low-alpha tint fill. */
  bg: string;
  /** Top + bottom 1px border color. */
  border: string;
  /** Tone glyph drawn through the canonical Icon set, where one exists. */
  icon: IconName | null;
}

const TONES: Record<BannerTone, ToneSpec> = {
  amber: {
    color: "var(--amber)",
    bg: "var(--amber-14)",
    border: "color-mix(in srgb, var(--amber) 38%, transparent)",
    icon: "alert-triangle",
  },
  violet: {
    color: "var(--violet)",
    bg: "var(--violet-12)",
    border: "color-mix(in srgb, var(--violet) 38%, transparent)",
    icon: "bot",
  },
  red: {
    color: "var(--red)",
    bg: "var(--red-14)",
    border: "color-mix(in srgb, var(--red) 40%, transparent)",
    icon: "circle-x",
  },
  cyan: {
    color: "var(--cyan)",
    bg: "var(--cyan-12)",
    border: "color-mix(in srgb, var(--cyan) 38%, transparent)",
    // `info` is not part of the curated Icon set; rendered inline below.
    icon: null,
  },
};

/** Inline info glyph for the cyan tone — same 24×24 / 1.5-stroke geometry as Icon. */
function InfoGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * Full-width strip mounted under the topbar, bounded by top + bottom 1px
 * borders. amber = warning/stale, violet = AI degraded, red = gate failure,
 * cyan = info/ingest. Optional inline action button + dismiss x.
 */
export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  /** @default 'amber' */
  tone?: BannerTone;
  children: ReactNode;
  /** Truthy renders an action button. */
  action?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export function Banner({
  tone = "amber",
  children,
  action,
  actionLabel,
  onAction,
  onClose,
  className,
  style,
  ...rest
}: BannerProps) {
  const t = TONES[tone];
  return (
    <div
      role="alert"
      className={cn("flex w-full items-center", className)}
      style={{
        gap: 12,
        padding: "12px 16px",
        background: t.bg,
        borderTop: `1px solid ${t.border}`,
        borderBottom: `1px solid ${t.border}`,
        ...style,
      }}
      {...rest}
    >
      <span className="inline-flex shrink-0" style={{ color: t.color }}>
        {t.icon ? (
          <Icon name={t.icon} size={16} strokeWidth={1.5} />
        ) : (
          <InfoGlyph />
        )}
      </span>
      <span
        className="flex-1"
        style={{ font: "var(--text-sm)", color: "var(--text-hi)" }}
      >
        {children}
      </span>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex cursor-pointer items-center bg-transparent whitespace-nowrap"
          style={{
            gap: 5,
            border: `1px solid ${t.border}`,
            borderRadius: "var(--radius-sm)",
            padding: "5px 10px",
            font: "600 12px/1 var(--font-ui)",
            color: t.color,
          }}
        >
          {actionLabel ?? "Resolve"}
        </button>
      ) : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="inline-flex cursor-pointer border-none bg-transparent opacity-70 hover:opacity-100"
          style={{ padding: 2, color: "var(--text-muted)" }}
        >
          <Icon name="x" size={16} strokeWidth={1.6} />
        </button>
      ) : null}
    </div>
  );
}
