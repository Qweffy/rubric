"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/icon";
import { useMounted } from "@/components/ui/use-mounted";
import { cn } from "@/lib/cn";

/**
 * Centered dialog on a blurred scrim — session-expired notices, promote-to-golden
 * confirms, and the like. Portalled to <body>; esc closes, backdrop click closes,
 * focus is trapped and returns to the trigger on close. Pop animation honors
 * reduced-motion.
 */
export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  /** Footer node — usually right-aligned buttons. */
  footer?: ReactNode;
  /** Panel width in px. @default 460 */
  width?: number;
  /** Render the header close affordance. @default true */
  showClose?: boolean;
}

const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 460,
  showClose = true,
  className,
  style,
  ...rest
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusables = (): HTMLElement[] =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    const first = focusables()[0];
    if (first) first.focus();
    else panel?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key === "Tab") {
        const items = focusables();
        const head = items[0];
        const tail = items[items.length - 1];
        if (head === undefined || tail === undefined) return;
        if (event.shiftKey && document.activeElement === head) {
          event.preventDefault();
          tail.focus();
        } else if (!event.shiftKey && document.activeElement === tail) {
          event.preventDefault();
          head.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      className="rb-modal-scrim fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: "var(--z-modal)",
        padding: 24,
        background: "color-mix(in srgb, var(--bg-void) 64%, transparent)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "rb-modal-fade var(--dur) var(--ease-out)",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={cn("rb-modal-panel flex max-w-full flex-col overflow-hidden outline-none", className)}
        style={{
          width,
          maxHeight: "88vh",
          background: "var(--surface-card)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-panel)",
          animation: "rb-modal-pop var(--dur) var(--ease-out)",
          ...style,
        }}
        {...rest}
      >
        {title ? (
          <div
            className="flex shrink-0 items-center justify-between"
            style={{ gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--divider)" }}
          >
            <h3
              style={{
                font: "var(--text-h3)",
                letterSpacing: "var(--tracking-display)",
                color: "var(--text-hi)",
              }}
            >
              {title}
            </h3>
            {showClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex shrink-0 cursor-pointer border-none bg-transparent opacity-70 transition hover:opacity-100"
                style={{ padding: 4, color: "var(--text-muted)" }}
              >
                <Icon name="x" size={16} strokeWidth={1.6} />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="overflow-auto" style={{ padding: 18 }}>
          {children}
        </div>
        {footer ? (
          <div
            className="flex shrink-0 items-center justify-end"
            style={{ gap: 10, padding: "14px 18px", borderTop: "1px solid var(--divider)" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
      <style>{`@keyframes rb-modal-fade{from{opacity:0}to{opacity:1}}
@keyframes rb-modal-pop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.rb-modal-scrim,.rb-modal-panel{animation:none!important}}`}</style>
    </div>,
    document.body,
  );
}
