"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/ui/icon";
import { useMounted } from "@/components/ui/use-mounted";
import { cn } from "@/lib/cn";

/**
 * Right-rail drawer for case / step detail. Slides in over a blurred scrim,
 * portalled to <body> so it escapes any transformed/overflow-clipped ancestor.
 * Esc closes, backdrop click closes, focus is trapped inside the panel and
 * returns to the trigger on close. Slide animation honors reduced-motion.
 */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  /** Mono sub-line under the title (e.g. a case id). */
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** @default 'right' */
  side?: "right" | "left";
  /** Panel width in px. @default 460 */
  width?: number;
}

const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = "right",
  width = 460,
  className,
  style,
  ...rest
}: DrawerProps) {
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
      className={cn("fixed inset-0 flex", side === "right" ? "justify-end" : "justify-start")}
      style={{
        zIndex: "var(--z-drawer)",
        background: "color-mix(in srgb, var(--bg-void) 52%, transparent)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        className={cn("rb-drawer-panel flex h-full flex-col outline-none", className)}
        style={{
          width,
          maxWidth: "94vw",
          background: "var(--surface-panel)",
          borderLeft: side === "right" ? "1px solid var(--border-strong)" : "none",
          borderRight: side === "left" ? "1px solid var(--border-strong)" : "none",
          boxShadow: "var(--shadow-panel)",
          animation: `rb-drawer-slide-${side} var(--dur-slow) var(--ease-out)`,
          ...style,
        }}
        {...rest}
      >
        <div
          className="flex shrink-0 items-start justify-between"
          style={{ gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--divider)" }}
        >
          <div className="flex flex-col" style={{ gap: 3, minWidth: 0 }}>
            {title ? (
              <h3
                className="truncate"
                style={{
                  font: "var(--text-h3)",
                  letterSpacing: "var(--tracking-display)",
                  color: "var(--text-hi)",
                }}
              >
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <span className="truncate" style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}>
                {subtitle}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex shrink-0 cursor-pointer border-none bg-transparent opacity-70 transition hover:opacity-100"
            style={{ padding: 4, color: "var(--text-muted)" }}
          >
            <Icon name="x" size={16} strokeWidth={1.6} />
          </button>
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: 18 }}>
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
      <style>{`@keyframes rb-drawer-slide-right{from{transform:translateX(100%)}to{transform:none}}
@keyframes rb-drawer-slide-left{from{transform:translateX(-100%)}to{transform:none}}
@keyframes rb-drawer-slide-up{from{transform:translateY(100%)}to{transform:none}}
@media (max-width:768px){.rb-drawer-panel{width:100%!important;max-width:100%!important;border-left:none!important;border-right:none!important;animation:rb-drawer-slide-up var(--dur-slow) var(--ease-out)!important}}
@media (prefers-reduced-motion: reduce){.rb-drawer-panel{animation:none!important}}`}</style>
    </div>,
    document.body,
  );
}
