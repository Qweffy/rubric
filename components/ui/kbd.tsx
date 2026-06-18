import { cn } from "@/lib/cn";

import type * as React from "react";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/** Kbd — a single mono keycap. Combine for chords: <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ children, className, style, ...rest }: KbdProps) {
  return (
    <kbd
      className={cn("hr-kbd inline-flex items-center justify-center", className)}
      style={{
        minWidth: 20,
        height: 20,
        padding: "0 6px",
        font: "600 11px/1 var(--font-mono)",
        color: "var(--text-mid)",
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.4)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </kbd>
  );
}
