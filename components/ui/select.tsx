"use client";

import { type JSX, type SelectHTMLAttributes } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Styled native `<select>` on the `.rb-field` surface. Pass `<option>` children. */
export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  error?: boolean;
  /** @default 'md' */
  size?: "sm" | "md" | "lg";
}

const HEIGHTS: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "var(--control-h-sm)",
  md: "var(--control-h)",
  lg: "var(--control-h-lg)",
};

const SELECT_CSS = `
.rb-field-select {
  background: var(--surface-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.rb-field-select:focus-within {
  border-color: var(--border-strong);
  box-shadow: var(--glow-phosphor-sm);
}
.rb-field-select[data-error],
.rb-field-select[data-error]:focus-within {
  border-color: var(--danger);
  box-shadow: var(--glow-red);
}
.rb-field-select select { all: unset; flex: 1; min-width: 0; }
@media (prefers-reduced-motion: reduce) {
  .rb-field-select { transition: none; }
}
`;

export function Select({
  error = false,
  size = "md",
  disabled = false,
  className,
  style,
  children,
  ...rest
}: SelectProps): JSX.Element {
  return (
    <div
      className={cn(
        "rb-field-select relative inline-flex w-full items-center",
        className,
      )}
      data-error={error ? "" : undefined}
      style={{
        gap: 8,
        height: HEIGHTS[size],
        padding: "0 12px",
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      <style href="rb-field-select" precedence="default">
        {SELECT_CSS}
      </style>
      <select
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        style={{
          paddingRight: 22,
          color: "var(--text-hi)",
          font: "var(--text-base)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        strokeWidth={1.5}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ right: 10, color: "var(--text-label)" }}
      />
    </div>
  );
}
