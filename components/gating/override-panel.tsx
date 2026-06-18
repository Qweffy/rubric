"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { SectionLabel } from "@/components/ui/section-label";

/** The "override gate" control trigger (reset/power glyph, danger outline). */
function PowerGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
      <line x1="12" x2="12" y1="2" y2="12" />
    </svg>
  );
}

export interface OverridePanelProps {
  /** PR number the override targets — null when nothing is blocked. */
  pr: number | null;
  onConfirm?: (reason: string) => void;
}

/**
 * Manual-override card + its guarded confirm dialog. Override is high-friction
 * by design: it requires a written reason (the affirmative button stays
 * disabled until one is typed) and the dialog states the action is logged with
 * the user's name. Disabled outright when nothing is blocked.
 */
export function OverridePanel({ pr, onConfirm }: OverridePanelProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const reasonId = useId();
  const disabled = pr === null;
  const canConfirm = reason.trim().length > 0;

  useEffect(() => {
    if (!open) return undefined;
    // Defer focus until after the modal's own focus-trap settles.
    const t = window.setTimeout(() => reasonRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const openDialog = (): void => {
    setReason("");
    setOpen(true);
  };

  const closeDialog = (): void => setOpen(false);

  return (
    <div
      className="flex flex-col"
      style={{
        gap: 12,
        padding: "16px 17px",
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <SectionLabel>MANUAL OVERRIDE</SectionLabel>
      <span style={{ font: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.55 }}>
        Override requires a written reason and is logged to history. High-friction by design.
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={openDialog}
        className="inline-flex cursor-pointer items-center justify-center self-start whitespace-nowrap transition hover:bg-[var(--red-14)]"
        style={{
          gap: 8,
          height: 30,
          padding: "0 11px",
          font: "600 12px/1 var(--font-ui)",
          color: "var(--red)",
          background: "transparent",
          border: "1px solid color-mix(in srgb, var(--red) 46%, transparent)",
          borderRadius: "var(--radius-control)",
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <PowerGlyph />
        Override gate
      </button>

      <Modal
        open={open}
        onClose={closeDialog}
        width={380}
        showClose={false}
        footer={
          <>
            <OverlayBtn variant="ghost" onClick={closeDialog}>
              Cancel
            </OverlayBtn>
            <OverlayBtn
              variant="danger"
              disabled={!canConfirm}
              onClick={() => {
                if (!canConfirm) return;
                onConfirm?.(reason.trim());
                closeDialog();
              }}
            >
              Override &amp; merge
            </OverlayBtn>
          </>
        }
      >
        <div className="flex flex-col" style={{ gap: 13 }}>
          <div className="flex flex-col" style={{ gap: 7 }}>
            <div className="flex items-center" style={{ gap: 9 }}>
              <span style={{ color: "var(--red)", flex: "none" }}>
                <Icon name="alert-triangle" size={18} strokeWidth={1.8} />
              </span>
              <h3
                style={{
                  font: "var(--text-h3)",
                  letterSpacing: "var(--tracking-display)",
                  color: "var(--text-hi)",
                }}
              >
                Override gate on PR #{pr ?? "—"}?
              </h3>
            </div>
            <span style={{ font: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.55 }}>
              This merges past a red gate. The action is logged with your name.
            </span>
          </div>
          <div className="flex flex-col" style={{ gap: 9 }}>
            <label htmlFor={reasonId}>
              <SectionLabel>
                REASON <span style={{ color: "var(--red)" }}>· required</span>
              </SectionLabel>
            </label>
            <textarea
              id={reasonId}
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. hotfix — schema fix lands in #215"
              rows={2}
              className="mono"
              style={{
                resize: "none",
                minHeight: 62,
                borderRadius: "var(--radius-control)",
                border: "1px solid var(--border)",
                background: "var(--surface-panel)",
                padding: "9px 11px",
                font: "var(--mono-base)",
                fontSize: 12,
                color: "var(--text-hi)",
                outline: "none",
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* Inline overlay buttons mirroring the design-system `.rb-btn` ghost/danger. */

type OverlayVariant = "ghost" | "danger";

const BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: "var(--control-h)",
  padding: "0 14px",
  font: "600 13px/1 var(--font-ui)",
  border: "1px solid transparent",
  borderRadius: "var(--radius-control)",
  whiteSpace: "nowrap",
};

function OverlayBtn({
  variant,
  disabled = false,
  onClick,
  children,
}: {
  variant: OverlayVariant;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const variantStyle: CSSProperties =
    variant === "ghost"
      ? { background: "transparent", color: "var(--text-body)", borderColor: "var(--border)" }
      : {
          background: "var(--red)",
          color: "#1A0606",
          boxShadow: disabled ? undefined : "var(--glow-red)",
        };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="transition"
      style={{
        ...BASE,
        ...variantStyle,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
