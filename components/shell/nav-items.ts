import { type IconName } from "@/components/ui/icon";

/**
 * Grouped nav model for the Rubric shell. Mirrors the design system's MISSION
 * CONTROL sidebar (Rubric App Shell.dc.html): six milestone sections plus a
 * pinned Settings row. There is deliberately NO flat "Runs" item — runs live
 * under a suite, reached via the breadcrumb / command palette, never the rail.
 */

export type NavKey =
  | "suites"
  | "calibration"
  | "compare"
  | "prompts"
  | "regressions"
  | "trajectories"
  | "errors"
  | "gating"
  | "settings";

/** The section a row belongs to — drives the mono SectionLabel + milestone chip. */
export type NavGroupKey =
  | "measure"
  | "judge"
  | "versions"
  | "agents"
  | "analyze"
  | "ship";

export interface ShellNavItem {
  key: NavKey;
  label: string;
  href: string;
  icon: IconName;
  /** Chord hint, e.g. "g s" — surfaced in the palette and key strip. */
  hint: string;
  /**
   * Status of the row. "regressed" / "blocked" paint a red status dot on the
   * row and bubble up to a red dot on the owning section label. "stale" is
   * tracked but renders no rail dot (the amber stale-chip lives in-content).
   */
  status?: "ok" | "regressed" | "blocked" | "stale";
}

export interface ShellNavGroup {
  key: NavGroupKey;
  /** Uppercase mono SectionLabel, e.g. "MEASURE". */
  label: string;
  /** Milestone chip rendered cyan beside the label, e.g. "M1/M3". */
  milestone: string;
  items: ShellNavItem[];
}

/** The six grouped sections, in rail order. */
export const NAV_GROUPS: ShellNavGroup[] = [
  {
    key: "measure",
    label: "MEASURE",
    milestone: "M1/M3",
    items: [
      {
        key: "suites",
        label: "Suites",
        href: "/suites",
        icon: "table",
        hint: "g s",
        status: "regressed",
      },
    ],
  },
  {
    key: "judge",
    label: "JUDGE",
    milestone: "M2",
    items: [
      {
        key: "calibration",
        label: "Judge Calibration",
        href: "/calibration",
        icon: "scale",
        hint: "g c",
      },
      {
        key: "compare",
        label: "Model Comparison",
        href: "/compare",
        icon: "columns",
        hint: "g m",
      },
    ],
  },
  {
    key: "versions",
    label: "VERSIONS",
    milestone: "M3",
    items: [
      {
        key: "prompts",
        label: "Prompt Timeline",
        href: "/prompts",
        icon: "git-commit",
        hint: "g p",
      },
      {
        key: "regressions",
        label: "Regression Diff",
        href: "/regressions",
        icon: "git-compare",
        hint: "g r",
      },
    ],
  },
  {
    key: "agents",
    label: "AGENTS",
    milestone: "M4",
    items: [
      {
        key: "trajectories",
        label: "Trajectories",
        href: "/trajectories",
        icon: "bot",
        hint: "g t",
      },
    ],
  },
  {
    key: "analyze",
    label: "ANALYZE",
    milestone: "M5",
    items: [
      {
        key: "errors",
        label: "Error Workbench",
        href: "/errors",
        icon: "scatter-chart",
        hint: "g e",
      },
    ],
  },
  {
    key: "ship",
    label: "SHIP",
    milestone: "M6",
    items: [
      {
        key: "gating",
        label: "CI / Gating",
        href: "/gating",
        icon: "shield-check",
        hint: "g g",
        status: "blocked",
      },
    ],
  },
];

/** Pinned to the rail footer, below the divider. */
export const PINNED_NAV: ShellNavItem = {
  key: "settings",
  label: "Settings",
  href: "/settings",
  icon: "settings",
  hint: "g ,",
};

/** Every nav item, flattened — grouped rows first, then the pinned row. */
export const ALL_NAV_ITEMS: ShellNavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  PINNED_NAV,
];

/**
 * Whether a section should paint a red status dot on its label — true when any
 * row in it is regressed or blocked.
 */
export function groupHasAlert(group: ShellNavGroup): boolean {
  return group.items.some(
    (item) => item.status === "regressed" || item.status === "blocked",
  );
}

/** Derive the active nav key from the current pathname. */
export function activeNavKey(pathname: string): NavKey | null {
  const match = ALL_NAV_ITEMS.find((item) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.key ?? null;
}
