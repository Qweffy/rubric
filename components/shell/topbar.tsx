"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import type * as React from "react";

/** One breadcrumb segment. A leaf (last) renders phosphor; links render cyan. */
export interface BreadcrumbSegment {
  label: string;
  /** Omit on the active leaf — it renders as static phosphor text. */
  href?: string;
}

/**
 * Static route → breadcrumb trail. The single source of truth for the topbar
 * trail on every non-parameterized route, so no page wires its own breadcrumb.
 * Parameterized routes (suites/<slug>, trajectories/<taskId>) are derived from
 * the pathname in {@link breadcrumbForPath}.
 */
const STATIC_TRAILS: Record<string, BreadcrumbSegment[]> = {
  "/suites": [{ label: "Suites" }],
  "/judges": [{ label: "Judge Calibration" }],
  "/judges/compare": [{ label: "Judges", href: "/judges" }, { label: "Compare" }],
  "/prompts": [{ label: "Prompt Timeline" }],
  "/regressions": [{ label: "Regression Diff" }],
  "/trajectories": [{ label: "Trajectories" }],
  "/errors": [{ label: "Error Workbench" }],
  "/gating": [{ label: "CI / Gating" }],
  "/settings": [{ label: "Settings" }],
};

/**
 * Derive the topbar breadcrumb trail from the current pathname. Earlier segments
 * are cyan links to their route; the last is the active phosphor leaf (no href).
 * Dynamic suite / run / case / task ids are read straight off the path so every
 * route gets a consistent trail with no per-page wiring.
 */
export function breadcrumbForPath(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter((s) => s.length > 0);

  // /suites/<slug>[/runs/<runId>[/cases/<caseId>]]
  const [root, slug, , runId, , caseId] = segments;
  if (root === "suites" && slug !== undefined) {
    const trail: BreadcrumbSegment[] = [{ label: "Suites", href: "/suites" }];
    const suiteHref = `/suites/${slug}`;
    trail.push({ label: slug, href: runId !== undefined ? suiteHref : undefined });
    if (runId !== undefined) {
      const runHref = `${suiteHref}/runs/${runId}`;
      trail.push({
        label: `run ${runId}`,
        href: caseId !== undefined ? runHref : undefined,
      });
    }
    if (caseId !== undefined) {
      trail.push({ label: caseId });
    }
    return trail;
  }

  // /trajectories/<taskId>
  if (root === "trajectories" && slug !== undefined) {
    return [
      { label: "Trajectories", href: "/trajectories" },
      { label: slug },
    ];
  }

  return STATIC_TRAILS[pathname] ?? [];
}

export type SyncTone = "synced" | "syncing" | "failed";

export interface SyncStatus {
  tone: SyncTone;
  /** Mono readout after "SYNC", e.g. "09:12 UTC" or "syncing…". */
  label: string;
}

const SYNC_COLOR: Record<SyncTone, string> = {
  synced: "var(--phosphor)",
  syncing: "var(--amber)",
  failed: "var(--red)",
};

export interface TopbarProps {
  /** SYNC dot + label state. @default { tone: "synced", label: "—" } */
  syncStatus?: SyncStatus;
  /** Open the ⌘K command palette. */
  onOpenPalette: () => void;
  /** Current branch shown in the branch selector. @default "main" */
  branch?: string;
  /** Two-letter avatar monogram. @default "AR" */
  avatar?: string;
}

function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mono flex shrink-0 items-center"
      style={{ font: "var(--mono-base)", fontSize: 13, gap: 8 }}
    >
      {segments.map((segment, index) => {
        const isLeaf = index === segments.length - 1;
        return (
          <span key={`${segment.label}-${index}`} className="flex items-center" style={{ gap: 8 }}>
            {index > 0 ? <span style={{ color: "var(--text-low)" }}>/</span> : null}
            {segment.href !== undefined && !isLeaf ? (
              <Link href={segment.href} style={{ color: "var(--cyan)" }}>
                {segment.label}
              </Link>
            ) : (
              <span
                aria-current={isLeaf ? "page" : undefined}
                style={{ color: isLeaf ? "var(--phosphor)" : "var(--text-mid)" }}
              >
                {segment.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/**
 * Topbar — the 56px glass header. Wordmark lockup, mono breadcrumb (cyan link
 * segments + a phosphor active leaf), a ⌘K palette trigger, a SYNC dot+label,
 * a branch selector, and the avatar monogram. Mirrors Rubric App Shell.dc.html.
 *
 * The breadcrumb is derived from the current route ({@link breadcrumbForPath}),
 * so the topbar is the single source of truth — pages never wire their own.
 */
export function Topbar({
  syncStatus = { tone: "synced", label: "—" },
  onOpenPalette,
  branch = "main",
  avatar = "AR",
}: TopbarProps) {
  const pathname = usePathname();
  const breadcrumb = breadcrumbForPath(pathname);

  return (
    <header
      className="relative flex shrink-0 items-center"
      style={{
        gap: 18,
        height: "var(--topbar-h)",
        padding: "0 16px 0 18px",
        background: "var(--glass)",
        backdropFilter: "blur(var(--blur-glass))",
        WebkitBackdropFilter: "blur(var(--blur-glass))",
        borderBottom: "1px solid var(--border)",
        zIndex: "var(--z-sticky)",
      }}
    >
      <Link
        href="/suites"
        aria-label="rubric — home"
        className="flex shrink-0 items-center no-underline hover:no-underline"
        style={{ gap: 9, color: "var(--text-hi)" }}
      >
        <RubricIllustration name="mark" size={26} />
        <span
          style={{
            font: "600 18px/1 var(--font-display)",
            letterSpacing: "-0.02em",
            color: "var(--text-hi)",
          }}
        >
          rubric
        </span>
      </Link>

      <div style={{ width: 1, height: 24, background: "var(--divider)", flex: "none" }} />

      {breadcrumb.length > 0 ? <Breadcrumb segments={breadcrumb} /> : null}

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Jump to suite, run, case — open command palette (Cmd+K)"
        aria-haspopup="dialog"
        className={cn(
          "mono group flex shrink-0 cursor-text items-center",
          "[transition:border-color_var(--dur-fast)]",
          "hover:border-[var(--border-strong)]",
        )}
        style={{
          marginLeft: 8,
          gap: 10,
          width: 300,
          height: 34,
          padding: "0 8px 0 12px",
          background: "var(--surface-panel)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-control)",
          color: "var(--text-muted)",
          font: "var(--mono-base)",
          fontSize: 13,
        }}
      >
        <Icon name="search" size={15} style={{ color: "var(--text-label)" }} />
        <span className="flex-1 text-left">Jump to suite, run, case…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="flex-1" />

      <div className="flex shrink-0 items-center" style={{ gap: 7 }}>
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: SYNC_COLOR[syncStatus.tone],
            boxShadow: `0 0 8px ${SYNC_COLOR[syncStatus.tone]}`,
            flex: "none",
          }}
        />
        <SectionLabel>SYNC {syncStatus.label}</SectionLabel>
        <span className="sr-only">{`Sync status: ${syncStatus.tone}`}</span>
      </div>

      <button
        type="button"
        aria-haspopup="menu"
        aria-label={`Branch: ${branch}`}
        className={cn(
          "mono flex shrink-0 cursor-pointer items-center justify-center",
          "[transition:border-color_var(--dur-fast)]",
          "hover:border-[var(--border-strong)] hover:text-[var(--text-hi)]",
        )}
        style={{
          gap: 7,
          height: 30,
          padding: "0 11px",
          background: "transparent",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-control)",
          color: "var(--text-hi)",
          font: "500 12px/1 var(--font-mono)",
        }}
      >
        branch: {branch}
        <Icon name="chevron-down" size={13} strokeWidth={1.6} />
      </button>

      <button
        type="button"
        title="Account"
        aria-label="Account"
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center",
          "[transition:border-color_var(--dur-fast)]",
          "hover:border-[var(--border-strong)]",
        )}
        style={{
          width: 30,
          height: 30,
          background: "var(--surface-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-control)",
        }}
      >
        <span
          style={{
            font: "600 11px/1 var(--font-mono)",
            color: "var(--text-mid)",
            letterSpacing: "0.04em",
          }}
        >
          {avatar}
        </span>
      </button>
    </header>
  );
}
