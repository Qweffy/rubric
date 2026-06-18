"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NAV_GROUPS,
  PINNED_NAV,
  activeNavKey,
  groupHasAlert,
  type ShellNavGroup,
  type ShellNavItem,
} from "@/components/shell/nav-items";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

import type * as React from "react";

const ROW_STYLE: React.CSSProperties = {
  gap: 10,
  height: 34,
  padding: "0 12px 0 11px",
  borderRadius: "var(--radius-control)",
  font: "var(--text-sm)",
  position: "relative",
  whiteSpace: "nowrap",
};

/** Red status dot painted on a regressed / blocked nav row (and its section). */
function StatusDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--red)",
        boxShadow: "0 0 6px var(--red)",
        flex: "none",
      }}
    />
  );
}

/** Cyan mono milestone tag, e.g. "M1". */
function MilestoneTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        font: "var(--mono-sm)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: "var(--cyan)",
      }}
    >
      {children}
    </span>
  );
}

function NavRow({ item, active }: { item: ShellNavItem; active: boolean }) {
  const alerting = item.status === "regressed" || item.status === "blocked";

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center no-underline hover:no-underline",
        "[transition:background_var(--dur-fast),color_var(--dur-fast)]",
        !active &&
          "hover:bg-[color-mix(in_srgb,var(--text-mid)_5%,transparent)]",
      )}
      style={{
        ...ROW_STYLE,
        color: active ? "var(--text-hi)" : "var(--text-body)",
        background: active ? "var(--phosphor-08)" : undefined,
      }}
    >
      {active ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 2,
            borderRadius: 1,
            background: "var(--phosphor)",
            boxShadow: "var(--glow-phosphor-sm)",
          }}
        />
      ) : null}
      <Icon
        name={item.icon}
        size={16}
        style={{ color: active ? "var(--phosphor)" : "var(--text-muted)" }}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {alerting ? <StatusDot /> : null}
      {alerting ? <span className="sr-only">{item.status}</span> : null}
    </Link>
  );
}

function NavSection({
  group,
  activeKey,
}: {
  group: ShellNavGroup;
  activeKey: string | null;
}) {
  const alerting = groupHasAlert(group);
  return (
    <div>
      <div
        className="flex items-center"
        style={{ gap: 7, padding: "0 11px", marginBottom: 6 }}
      >
        <SectionLabel>{group.label}</SectionLabel>
        <MilestoneTag>{group.milestone}</MilestoneTag>
        <span className="flex-1" />
        {alerting ? <StatusDot /> : null}
      </div>
      {group.items.map((item) => (
        <NavRow key={item.key} item={item} active={activeKey === item.key} />
      ))}
    </div>
  );
}

/**
 * Sidebar — the 248px MISSION CONTROL rail. Grouped mono section labels with
 * cyan milestone chips, an active-row phosphor bar + tint, red status dots on
 * regressed/blocked rows that bubble up to their section label, and a pinned
 * Settings row below the footer divider. Mirrors Rubric App Shell.dc.html.
 */
export function Sidebar() {
  const pathname = usePathname();
  const activeKey = activeNavKey(pathname);

  return (
    <aside
      className="flex h-full shrink-0 flex-col"
      style={{
        width: "var(--sidebar-w)",
        background: "var(--surface-panel)",
        borderRight: "1px solid var(--border)",
        padding: "16px 12px 12px",
      }}
    >
      <SectionLabel style={{ padding: "0 11px", marginBottom: 14 }}>
        MISSION CONTROL
      </SectionLabel>

      <nav
        aria-label="Primary"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        style={{ gap: 16 }}
      >
        {NAV_GROUPS.map((group) => (
          <NavSection key={group.key} group={group} activeKey={activeKey} />
        ))}
      </nav>

      <div
        style={{
          borderTop: "1px solid var(--divider)",
          paddingTop: 10,
          marginTop: 10,
        }}
      >
        <NavRow item={PINNED_NAV} active={activeKey === PINNED_NAV.key} />
      </div>
    </aside>
  );
}
