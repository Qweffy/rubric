"use client";

import { type CSSProperties, type ReactNode, useId } from "react";

/** On/off switch (`.toggle` / `.toggle.off`). Phosphor track + glowing knob when on. */
export interface ToggleProps {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Optional trailing label. */
  label?: ReactNode;
  id?: string;
  style?: CSSProperties;
}

const TOGGLE_CSS = `
.rb-toggle-track {
  transition: background var(--dur) var(--ease-out), border-color var(--dur) var(--ease-out);
}
.rb-toggle-knob {
  transition: left var(--dur) var(--ease-out), background var(--dur) var(--ease-out);
}
@media (prefers-reduced-motion: reduce) {
  .rb-toggle-track, .rb-toggle-knob { transition: none; }
}
`;

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  style,
}: ToggleProps) {
  const reactId = useId();
  const sid = id ?? reactId;

  return (
    <label
      htmlFor={sid}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <style href="rb-toggle" precedence="default">
        {TOGGLE_CSS}
      </style>
      <button
        id={sid}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onChange?.(!checked);
        }}
        className="rb-toggle-track"
        style={{
          position: "relative",
          flexShrink: 0,
          width: 38,
          height: 22,
          padding: 0,
          background: checked
            ? "var(--phosphor-12)"
            : "color-mix(in srgb, var(--text-mid) 12%, transparent)",
          border: `1px solid ${checked ? "var(--border-strong)" : "var(--border)"}`,
          borderRadius: "var(--radius-card)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span
          className="rb-toggle-knob"
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: checked ? "var(--phosphor)" : "var(--text-label)",
            boxShadow: checked ? "var(--glow-phosphor-sm)" : "none",
          }}
        />
      </button>
      {label != null && (
        <span style={{ font: "var(--text-base)", color: "var(--text-body)" }}>
          {label}
        </span>
      )}
    </label>
  );
}
