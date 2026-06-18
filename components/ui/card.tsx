import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import type * as React from "react";

type CardVariant = "raised" | "glass" | "flush";

/** Base surface/panel. raised (card) | glass (overlay) | flush (panel). */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 'raised' */
  variant?: CardVariant;
  /** Mono section label rendered in a header bar (wrapped in <SectionLabel>). */
  header?: React.ReactNode;
  /** Header-right action node(s). */
  actions?: React.ReactNode;
  /** Phosphor glow halo. @default false */
  glow?: boolean;
  /** Apply default panel padding to the body. @default true */
  padding?: boolean;
}

const SURFACES: Record<CardVariant, React.CSSProperties> = {
  raised: { background: "var(--bg-raised)", border: "1px solid var(--border)" },
  glass: {
    background: "var(--glass)",
    border: "1px solid var(--border)",
    backdropFilter: "blur(var(--blur-glass))",
    WebkitBackdropFilter: "blur(var(--blur-glass))",
  },
  flush: { background: "var(--bg-surface)", border: "1px solid var(--border)" },
};

/**
 * Card — base surface/panel. variant: raised (default) | glass | flush.
 * Optional header bar (SectionLabel + right-aligned actions) and a padding
 * toggle for flush content like tables or charts that own their own insets.
 */
export function Card({
  variant = "raised",
  header,
  actions,
  glow = false,
  padding = true,
  children,
  className,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn("flex flex-col overflow-hidden", className)}
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: glow
          ? "var(--glow-phosphor-sm), var(--shadow-card)"
          : "var(--shadow-card)",
        ...SURFACES[variant],
        ...style,
      }}
      {...rest}
    >
      {header && (
        <div
          className="flex items-center justify-between gap-3"
          style={{
            padding: "11px 16px",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <SectionLabel>{header}</SectionLabel>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className="flex-1" style={{ padding: padding ? "var(--pad-panel)" : 0 }}>
        {children}
      </div>
    </div>
  );
}
