"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Icon, type IconName } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { useMounted } from "@/components/ui/use-mounted";

export interface CommandItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Mono keyword/secondary text shown muted after the label. */
  meta?: string;
  /** Mono shortcut/hint shown at the right edge of the row. */
  hint?: string;
}

export interface CommandGroup {
  label: string;
  items: CommandItem[];
}

/**
 * Generic ⌘K command palette: glass panel on a blurred scrim, mono search input,
 * grouped + filterable results, full keyboard nav (↑/↓ move, ↵ selects, esc
 * closes), and a footer hint row. Portalled to <body>; pop animation honors
 * reduced-motion. Mount-on-open resets query + active row each time it opens.
 */
export interface CommandPaletteProps {
  open: boolean;
  onClose?: () => void;
  groups: CommandGroup[];
  placeholder?: string;
  onSelect?: (item: CommandItem) => void;
  /** Called on Enter when the query matches nothing. */
  onSearchFallback?: (query: string) => void;
}

interface IndexedGroup {
  label: string;
  items: { item: CommandItem; index: number }[];
}

export function CommandPalette(props: CommandPaletteProps) {
  // Mount the panel only while open so query/active state resets on every open.
  if (!props.open) return null;
  return <CommandPalettePanel {...props} />;
}

function CommandPalettePanel({
  onClose,
  groups,
  placeholder = "Type a command or search…",
  onSelect,
  onSearchFallback,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const mounted = useMounted();
  const listRef = useRef<HTMLDivElement>(null);

  const { visible, flat } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexed: IndexedGroup[] = [];
    const all: CommandItem[] = [];
    for (const group of groups) {
      const matches = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || (item.meta?.toLowerCase().includes(q) ?? false),
      );
      if (matches.length === 0) continue;
      indexed.push({
        label: group.label,
        items: matches.map((item) => ({ item, index: all.push(item) - 1 })),
      });
    }
    return { visible: indexed, flat: all };
  }, [groups, query]);

  const activeIndex = Math.min(active, Math.max(0, flat.length - 1));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((current) => Math.min(flat.length - 1, current + 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => Math.max(0, current - 1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = flat[Math.min(activeIndex, flat.length - 1)];
        if (item) onSelect?.(item);
        else onSearchFallback?.(query);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flat, activeIndex, query, onClose, onSelect, onSearchFallback]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!mounted) return null;

  return createPortal(
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      className="fixed inset-0 flex items-start justify-center"
      style={{
        zIndex: "var(--z-palette)",
        paddingTop: "14vh",
        background: "color-mix(in srgb, var(--bg-void) 56%, transparent)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="rb-palette-panel flex flex-col overflow-hidden"
        style={{
          width: 560,
          maxWidth: "92vw",
          maxHeight: "64vh",
          background: "var(--surface-glass)",
          backdropFilter: "blur(var(--blur-glass))",
          WebkitBackdropFilter: "blur(var(--blur-glass))",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-panel), var(--glow-phosphor-sm)",
          animation: "rb-palette-pop var(--dur) var(--ease-out)",
        }}
      >
        <div
          className="flex shrink-0 items-center"
          style={{ gap: 10, padding: "13px 16px", borderBottom: "1px solid var(--divider)" }}
        >
          <Icon name="search" size={18} style={{ color: "var(--accent)" }} />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={placeholder}
            aria-label="Command palette search"
            className="flex-1 border-none bg-transparent outline-none"
            style={{ color: "var(--text-hi)", font: "var(--mono-base)" }}
          />
          <Kbd>ESC</Kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto" style={{ padding: 6 }}>
          {flat.length === 0 ? (
            <div className="text-center" style={{ padding: "28px 16px" }}>
              <p className="m-0" style={{ font: "var(--text-sm)", color: "var(--text-body)" }}>
                No matches for{" "}
                <span style={{ font: "var(--mono-sm)", color: "var(--text-hi)" }}>
                  &quot;{query}&quot;
                </span>
              </p>
              {onSearchFallback ? (
                <p
                  style={{ margin: "6px 0 0", font: "var(--mono-sm)", color: "var(--text-muted)" }}
                >
                  Press <Kbd style={{ color: "var(--accent)" }}>↵</Kbd> to search instead
                </p>
              ) : null}
            </div>
          ) : (
            visible.map((group) => (
              <div key={group.label} style={{ marginBottom: 4 }}>
                <div
                  className="uppercase"
                  style={{
                    padding: "8px 10px 4px",
                    font: "var(--label-mono)",
                    letterSpacing: "var(--label-tracking)",
                    color: "var(--text-label)",
                  }}
                >
                  {group.label}
                </div>
                {group.items.map(({ item, index }) => {
                  const current = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-index={index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => onSelect?.(item)}
                      className="flex w-full cursor-pointer items-center border-none text-left"
                      style={{
                        gap: 10,
                        padding: "8px 10px",
                        background: current ? "var(--phosphor-12)" : "transparent",
                        borderRadius: "var(--radius-sm)",
                        color: current ? "var(--text-hi)" : "var(--text-body)",
                        font: "var(--text-sm)",
                      }}
                    >
                      {item.icon ? (
                        <Icon
                          name={item.icon}
                          size={16}
                          style={{ color: current ? "var(--accent)" : "var(--text-muted)" }}
                        />
                      ) : null}
                      <span className="truncate">{item.label}</span>
                      {item.meta ? (
                        <span
                          className="truncate"
                          style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}
                        >
                          {item.meta}
                        </span>
                      ) : null}
                      <span className="flex-1" />
                      {item.hint ? (
                        <kbd
                          style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}
                        >
                          {item.hint}
                        </kbd>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="flex shrink-0 items-center"
          style={{
            gap: 14,
            padding: "9px 14px",
            borderTop: "1px solid var(--divider)",
            font: "var(--mono-sm)",
            color: "var(--text-muted)",
          }}
        >
          <FooterHint keys={["↑", "↓"]} label="Navigate" />
          <FooterHint keys={["↵"]} label="Select" />
          <FooterHint keys={["esc"]} label="Close" />
          <span className="flex-1" />
          <span style={{ font: "var(--mono-sm)", color: "var(--text-label)" }}>
            {flat.length} {flat.length === 1 ? "result" : "results"}
          </span>
        </div>

        <style>{`@keyframes rb-palette-pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.rb-palette-panel{animation:none!important}}`}</style>
      </div>
    </div>,
    document.body,
  );
}

function FooterHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 6 }}>
      <span className="inline-flex items-center" style={{ gap: 3 }}>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
