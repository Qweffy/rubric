"use client";

import { type CSSProperties } from "react";

export interface TabItem {
  value: string;
  label: string;
  /** Optional mono count chip (`.rb-chip`). */
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
}

/**
 * Tabs (`.rb-tab`) — filter tabs with mono count chips. Phosphor underline
 * indicator on the active tab; the active chip flips to phosphor-12 / phosphor.
 * Geometry is ported 1:1 from the design system's `.rb-tab` / `.rb-chip`.
 */
export function Tabs({ tabs, value, onChange, style }: TabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 4,
        borderBottom: "1px solid var(--divider)",
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange?.(tab.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${selected ? "var(--phosphor)" : "transparent"}`,
              marginBottom: -1,
              cursor: "pointer",
              color: selected ? "var(--text-hi)" : "var(--text-body)",
              font: "500 13px/1 var(--font-ui)",
              transition: "color var(--dur-fast)",
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-sm)",
                  background: selected ? "var(--phosphor-12)" : "var(--divider)",
                  color: selected ? "var(--phosphor)" : "var(--text-muted)",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
