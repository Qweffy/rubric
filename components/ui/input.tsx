"use client";

import { type InputHTMLAttributes, type JSX } from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Text input (`.rb-field`) with optional leading icon, mono mode, error state. */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Leading glyph from the Rubric icon set. */
  icon?: IconName;
  /** Error message (string) renders red border + glow + message; `true` = border only. */
  error?: string | boolean;
  /** Render value in JetBrains Mono with tabular-nums (for data entry). @default false */
  mono?: boolean;
  /** @default 'md' */
  size?: "sm" | "md" | "lg";
}

const HEIGHTS: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "var(--control-h-sm)",
  md: "var(--control-h)",
  lg: "var(--control-h-lg)",
};

const INPUT_CSS = `
.rb-field {
  background: var(--surface-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.rb-field:focus-within {
  border-color: var(--border-strong);
  box-shadow: var(--glow-phosphor-sm);
}
.rb-field[data-error] {
  border-color: var(--danger);
  box-shadow: var(--glow-red);
}
.rb-field input { all: unset; flex: 1; min-width: 0; }
.rb-field input::placeholder { color: var(--text-muted); }
@media (prefers-reduced-motion: reduce) {
  .rb-field { transition: none; }
}
`;

export function Input({
  icon,
  error,
  mono = false,
  size = "md",
  disabled = false,
  className,
  style,
  ...rest
}: InputProps): JSX.Element {
  const hasError = error === true || (typeof error === "string" && error.length > 0);

  return (
    <div
      className={cn("flex w-full flex-col", className)}
      style={{ gap: 6, ...style }}
    >
      <style href="rb-field" precedence="default">
        {INPUT_CSS}
      </style>
      <div
        className={cn("rb-field", mono && "mono")}
        data-error={hasError ? "" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: HEIGHTS[size],
          padding: "0 12px",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {icon && (
          <Icon
            name={icon}
            size={16}
            strokeWidth={1.5}
            style={{ color: "var(--text-label)" }}
          />
        )}
        <input
          disabled={disabled}
          aria-invalid={hasError ? true : undefined}
          style={{
            color: "var(--text-hi)",
            font: mono ? "var(--mono-base)" : "var(--text-base)",
            fontVariantNumeric: mono ? "tabular-nums" : undefined,
          }}
          {...rest}
        />
        {hasError && (
          <Icon
            name="alert-triangle"
            size={16}
            strokeWidth={1.5}
            style={{ color: "var(--danger)", flex: "none" }}
          />
        )}
      </div>
      {typeof error === "string" && error.length > 0 && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            font: "var(--text-xs)",
            color: "var(--danger)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
