"use client";

import { useState, type ReactNode } from "react";

import { DesktopGate } from "@/components/shell/desktop-gate";
import { KeyHintStrip } from "@/components/shell/key-hint-strip";
import {
  RowNavProvider,
  useKeyboardNav,
  useRowNavController,
} from "@/components/shell/keyboard-nav";
import { ShellCommandPalette } from "@/components/shell/shell-command-palette";
import { Sidebar } from "@/components/shell/sidebar";
import {
  Topbar,
  type BreadcrumbSegment,
  type SyncStatus,
} from "@/components/shell/topbar";

export interface RubricShellProps {
  children: ReactNode;
  /** Mono breadcrumb segments, root → leaf, for the topbar. */
  breadcrumb?: BreadcrumbSegment[];
  /** SYNC dot + label state for the topbar. */
  syncStatus?: SyncStatus;
  /** Reserved for per-group nav badges (e.g. counts) the sidebar may surface. */
  navBadges?: Record<string, string>;
}

/**
 * Inner shell — assumes a desktop viewport (it is rendered only inside the
 * DesktopGate). Lays out the sidebar, glass topbar, scrolling content slot and
 * the bottom key-hint strip; owns the ⌘K palette state; and wires the global
 * key handler against the RowNav controller it provides to the content subtree.
 */
function ShellInner({ children, breadcrumb, syncStatus }: RubricShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const rowNav = useRowNavController();

  useKeyboardNav({
    onTogglePalette: () => setPaletteOpen((open) => !open),
    paletteOpen,
    onClosePalette: () => setPaletteOpen(false),
    rowNav,
  });

  return (
    <RowNavProvider value={rowNav}>
      <div
        className="flex h-dvh w-full overflow-hidden"
        style={{
          background: "var(--surface-panel)",
          color: "var(--text-body)",
          fontFamily: "var(--font-ui)",
        }}
      >
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Topbar
            breadcrumb={breadcrumb}
            syncStatus={syncStatus}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <main
            className="hr-void relative min-h-0 flex-1 overflow-auto"
            style={{ background: "var(--surface-page)" }}
          >
            {children}
          </main>
          <KeyHintStrip />
        </div>
        <ShellCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </RowNavProvider>
  );
}

/**
 * RubricShell — the persistent app chrome. Below 1024px the DesktopGate swaps
 * the whole console for the SmallViewportNotice (the heavy subtree never
 * mounts); at ≥1024px it renders the full shell: sidebar + topbar + content
 * slot + key-hint strip + ⌘K palette, with global keyboard nav mounted.
 */
export function RubricShell(props: RubricShellProps) {
  return (
    <DesktopGate>
      <ShellInner {...props} />
    </DesktopGate>
  );
}
