"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

/**
 * Confirm dialog over a Modal. Restates the action + object and offers a single
 * affirmative + Cancel. Two intents:
 *  - `danger` (default): destructive, red accent (e.g. "Discard 2 cases?").
 *  - `promote`: affirmative phosphor accent (e.g. "Promote run to golden?").
 * The Cancel button is focused on open, so an accidental Enter is non-committal.
 */
export interface ConfirmModalProps {
  open: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  confirmIcon?: IconName;
  /** @default 'danger' */
  intent?: "danger" | "promote";
}

interface IntentSpec {
  accent: string;
  glyph: IconName;
  confirmVariant: "destructive" | "primary";
  defaultLabel: string;
}

const INTENTS: Record<NonNullable<ConfirmModalProps["intent"]>, IntentSpec> = {
  danger: {
    accent: "var(--danger)",
    glyph: "alert-triangle",
    confirmVariant: "destructive",
    defaultLabel: "Discard",
  },
  promote: {
    accent: "var(--accent)",
    glyph: "star",
    confirmVariant: "primary",
    defaultLabel: "Promote",
  },
};

export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title = "Confirm",
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmIcon,
  intent = "danger",
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  const spec = INTENTS[intent];
  const glyph = confirmIcon ?? spec.glyph;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      width={420}
      showClose={false}
      footer={
        <>
          <OverlayButton ref={cancelRef} variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </OverlayButton>
          <OverlayButton variant={spec.confirmVariant} icon={glyph} onClick={onConfirm}>
            {confirmLabel ?? spec.defaultLabel}
          </OverlayButton>
        </>
      }
    >
      <div className="flex" style={{ gap: 14 }}>
        <span
          className="inline-flex shrink-0"
          style={{ color: spec.accent, filter: `drop-shadow(0 0 8px ${spec.accent})` }}
        >
          <Icon name={spec.glyph} size={20} />
        </span>
        <div className="flex flex-col" style={{ gap: 6, minWidth: 0 }}>
          <h3
            style={{
              font: "var(--text-h3)",
              letterSpacing: "var(--tracking-display)",
              color: "var(--text-hi)",
            }}
          >
            {title}
          </h3>
          {message ? (
            <p className="m-0" style={{ font: "var(--text-sm)", color: "var(--text-body)" }}>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------------------
   OverlayButton — the design system's `.rb-btn` ghost / destructive / primary
   variants, ported inline (Rubric ships no shared Button primitive). Local to
   the overlay confirm flow; promote it to its own module if reused elsewhere.
---------------------------------------------------------------------------- */

type OverlayButtonVariant = "ghost" | "destructive" | "primary";

interface OverlayButtonProps {
  variant: OverlayButtonVariant;
  icon?: IconName;
  onClick?: () => void;
  children: ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

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

const VARIANTS: Record<OverlayButtonVariant, CSSProperties> = {
  ghost: { background: "transparent", color: "var(--text-body)" },
  destructive: {
    background: "transparent",
    color: "var(--danger)",
    borderColor: "color-mix(in srgb, var(--danger) 42%, transparent)",
  },
  primary: {
    background: "var(--phosphor)",
    color: "var(--bg-void)",
    boxShadow: "var(--glow-phosphor)",
  },
};

function OverlayButton({ variant, icon, onClick, children, ref }: OverlayButtonProps) {
  const [hover, setHover] = useState(false);
  const hoverStyle: CSSProperties =
    variant === "ghost"
      ? hover
        ? { background: "color-mix(in srgb, var(--text-mid) 9%, transparent)", color: "var(--text-hi)" }
        : {}
      : variant === "destructive"
        ? hover
          ? { background: "var(--red-14)", boxShadow: "var(--glow-red)" }
          : {}
        : hover
          ? { filter: "brightness(1.12)" }
          : {};

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn("cursor-pointer transition")}
      style={{ ...BASE, ...VARIANTS[variant], ...hoverStyle }}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}
