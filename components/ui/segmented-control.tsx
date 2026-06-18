"use client";

import { type CSSProperties } from "react";

import { Icon, type IconName } from "@/components/ui/icon";

export interface SegmentOption {
  value: string;
  label: string;
  icon?: IconName;
}

/**
 * Mono segmented toggle (`.seg`) for 2-4 mutually-exclusive modes — e.g.
 * the diff view's ABSOLUTE / DIFF value mode, or SIDE-BY-SIDE / UNIFIED layout.
 */
export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  /** @default 'md' */
  size?: "sm" | "md";
  /** Stretch each segment to fill the track equally. @default false */
  fill?: boolean;
  style?: CSSProperties;
}

/**
 * SegmentedControl — a mono toggle between 2-4 modes. The active segment fills
 * with phosphor-12 and a strong border; labels are uppercase mono with tracking.
 * Sharp 4px corners (no pills), dark-only.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
  fill = false,
  style,
}: SegmentedControlProps) {
  const height = size === "sm" ? 30 : 36;

  return (
    <div
      role="tablist"
      style={{
        display: fill ? "flex" : "inline-flex",
        padding: 3,
        gap: 2,
        height,
        background: "var(--surface-panel)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-control)",
        ...style,
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(opt.value)}
            style={{
              display: "inline-flex",
              flex: fill ? 1 : undefined,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "0 12px",
              background: selected ? "var(--phosphor-12)" : "transparent",
              color: selected ? "var(--phosphor)" : "var(--text-body)",
              border: selected
                ? "1px solid var(--border-strong)"
                : "1px solid transparent",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              font: "600 11px/1 var(--font-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              transition: "background var(--dur-fast), color var(--dur-fast)",
            }}
          >
            {opt.icon && <Icon name={opt.icon} size={14} strokeWidth={1.5} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
