import { Kbd } from "@/components/ui/kbd";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import type * as React from "react";

interface KeyHint {
  /** One or more keycaps, e.g. ["⌘K"] or ["g", "s"]. */
  keys: string[];
  /** Mono label after the caps, e.g. "palette". */
  label: string;
}

const HINTS: KeyHint[] = [
  { keys: ["⌘K"], label: "palette" },
  { keys: ["j", "k"], label: "row nav" },
  { keys: ["↵"], label: "open" },
  { keys: ["esc"], label: "close" },
  { keys: ["g", "s"], label: "go suites" },
];

/**
 * KeyHintStrip — the persistent 38px keyboard-affordance strip pinned to the
 * bottom of the content column. Mirrors the design system's KEYS row: a mono
 * label then a handful of keycap + mono-caption pairs. Presentational only.
 */
export function KeyHintStrip({
  className,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex shrink-0 items-center", className)}
      style={{
        gap: 16,
        height: 38,
        padding: "0 20px",
        borderTop: "1px solid var(--divider)",
        background: "var(--surface-panel)",
        ...style,
      }}
      {...rest}
    >
      <SectionLabel>KEYS</SectionLabel>
      {HINTS.map((hint) => (
        <div key={hint.label} className="flex items-center" style={{ gap: 6 }}>
          {hint.keys.map((key) => (
            <Kbd
              key={key}
              style={{
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                font: "500 11px/1 var(--font-mono)",
                color: "var(--text-muted)",
                background: "var(--surface-panel)",
                boxShadow: "none",
              }}
            >
              {key}
            </Kbd>
          ))}
          <span
            className="mono"
            style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}
          >
            {hint.label}
          </span>
        </div>
      ))}
    </div>
  );
}
