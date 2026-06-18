"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { Sparkline, type SparklineTone } from "@/components/ui/sparkline";
import { StatusBadge, type StatusValue } from "@/components/ui/status-badge";
import { Tag, type TagTone } from "@/components/ui/tag";
import { cn } from "@/lib/cn";

/** A trailing column slot: either arbitrary content or one of the canned cells. */
export type DataRowColumn =
  | { kind: "node"; node: ReactNode; align?: "start" | "center" | "end" }
  | {
      kind: "mono";
      value: ReactNode;
      tone?: "default" | "phosphor" | "red" | "amber" | "violet" | "cyan" | "muted";
      align?: "start" | "center" | "end";
    }
  | { kind: "gauge"; value: number; mode?: "score" | "kappa"; size?: number }
  | { kind: "spark"; data: number[]; tone?: SparklineTone };

const MONO_TONE: Record<
  NonNullable<Extract<DataRowColumn, { kind: "mono" }>["tone"]>,
  string
> = {
  default: "var(--text-mid)",
  phosphor: "var(--phosphor)",
  red: "var(--red)",
  amber: "var(--amber)",
  violet: "var(--violet)",
  cyan: "var(--cyan)",
  muted: "var(--text-muted)",
};

const ALIGN_JUSTIFY: Record<"start" | "center" | "end", CSSProperties["justifyContent"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
};

export interface DataRowTag {
  label: ReactNode;
  tone?: TagTone;
  icon?: IconName;
}

export interface DataRowAction {
  icon: IconName;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface DataRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Primary mono identifier — case_071, run #1487, v23, judge-gpt-4o. */
  primary: ReactNode;
  /** Secondary line under the primary (a title / description). */
  secondary?: ReactNode;
  /** Leading status accent — phosphor/red/amber/cyan/violet keyed off the value. */
  leadingStatus?: StatusValue | (string & {});
  /**
   * A 2px inset rail on the left edge in this color. Use it to flag a row
   * (regressed = red, judge-disagrees = amber) redundantly with its cells.
   */
  railColor?: string;
  /** Amber dot before the primary — edited/stale since last sweep. */
  stale?: boolean;
  /** Status badges rendered after the primary block (NEW, REGRESSED, JUDGE…). */
  badges?: (StatusValue | (string & {}))[];
  /** Outline chips (scorer names, versions, flags). */
  tags?: DataRowTag[];
  /**
   * The trailing column grid. The `columns` template sizes them; each entry in
   * `cells` fills one track. Together with the auto-sized primary block these
   * make the row a configurable table row for suites/runs/cases/versions/judges.
   */
  columns?: string;
  cells?: DataRowColumn[];
  /** Trailing icon actions (kebab, bookmark…). Click does not select the row. */
  actions?: DataRowAction[];
  selected?: boolean;
  onSelect?: () => void;
}

const MAX_VISIBLE_TAGS = 5;

interface RowActionButtonProps {
  action: DataRowAction;
}

// Inline ghost icon-button so the row group has no dependency on a core
// IconButton component.
function RowActionButton({ action }: RowActionButtonProps) {
  const { icon, label, active = false, onClick } = action;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      onClick={onClick}
      className="inline-flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center border border-transparent p-0 hover:bg-[color-mix(in_srgb,var(--text-mid)_8%,transparent)]"
      style={{
        color: active ? "var(--phosphor)" : "var(--text-body)",
        background: active ? "var(--phosphor-12)" : undefined,
        borderColor: active ? "var(--border-strong)" : undefined,
        borderRadius: "var(--radius-control)",
        transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast)",
      }}
    >
      <Icon name={icon} size={16} strokeWidth={1.5} />
    </button>
  );
}

function Cell({ col }: { col: DataRowColumn }) {
  if (col.kind === "gauge") {
    return <ScoreGauge value={col.value} mode={col.mode ?? "score"} size={col.size ?? 44} />;
  }
  if (col.kind === "spark") {
    return <Sparkline data={col.data} tone={col.tone ?? "phosphor"} />;
  }
  if (col.kind === "mono") {
    const align = col.align ?? "end";
    return (
      <div className="flex items-center" style={{ justifyContent: ALIGN_JUSTIFY[align] }}>
        <span
          style={{
            font: "var(--mono-sm)",
            color: MONO_TONE[col.tone ?? "default"],
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {col.value}
        </span>
      </div>
    );
  }
  const align = col.align ?? "center";
  return (
    <div className="flex min-w-0 items-center" style={{ justifyContent: ALIGN_JUSTIFY[align] }}>
      {col.node}
    </div>
  );
}

/**
 * DataRow — the workhorse selectable grid row behind every Rubric table
 * (suites, runs, cases, versions, judges, PRs). A primary mono identifier with
 * an optional secondary line, status badges, outline tags, and a configurable
 * set of trailing column slots (mono values, a score/κ gauge, a sparkline, or
 * arbitrary nodes), plus trailing icon actions.
 *
 * Hover lifts the border to `--border-strong` + a phosphor glow; `selected`
 * washes the row `--phosphor-08` and keeps the glow. A `railColor` paints a
 * 2px left rail so a flagged row (regressed/judge-disagrees) reads without
 * relying on the cell hues alone.
 */
export function DataRow({
  primary,
  secondary,
  leadingStatus,
  railColor,
  stale = false,
  badges = [],
  tags = [],
  columns,
  cells = [],
  actions = [],
  selected = false,
  onSelect,
  className,
  style,
  onClick,
  onKeyDown,
  ...rest
}: DataRowProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>): void => {
    onClick?.(e);
    if (!e.defaultPrevented) onSelect?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (onSelect && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect();
    }
  };

  // primary block · trailing columns · actions. The columns template is
  // injected verbatim; the leading `1fr` is the auto-sizing primary block.
  const gridTemplate = [
    "minmax(0,1fr)",
    columns,
    actions.length > 0 ? "auto" : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: gridTemplate,
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: selected ? "var(--phosphor-08)" : "var(--bg-raised)",
    border: "1px solid var(--border)",
    borderColor: selected ? "var(--border-strong)" : "var(--border)",
    borderRadius: "var(--radius-card)",
    boxShadow: selected ? "var(--glow-phosphor-sm)" : undefined,
    position: railColor ? "relative" : undefined,
    transition:
      "border-color var(--dur-fast), box-shadow var(--dur), background var(--dur-fast)",
    ...style,
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      className={cn(
        "cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--glow-phosphor-sm)]",
        className,
      )}
      style={rowStyle}
      {...rest}
    >
      {railColor && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 2,
            borderRadius: 1,
            background: railColor,
            boxShadow: `0 0 6px color-mix(in srgb, ${railColor} 60%, transparent)`,
          }}
        />
      )}

      {/* primary block */}
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {stale && (
            <span
              title="Edited since last sweep"
              aria-label="stale"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--amber)",
                boxShadow: "0 0 8px color-mix(in srgb, var(--amber) 60%, transparent)",
                flexShrink: 0,
              }}
            />
          )}
          <span
            className="truncate"
            style={{
              font: "var(--mono-base)",
              color: "var(--text-hi)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {primary}
          </span>
          {leadingStatus && <StatusBadge status={leadingStatus} />}
          {badges.map((b) => (
            <StatusBadge key={b} status={b} />
          ))}
        </div>
        {(secondary != null || tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {secondary != null && (
              <span
                className="truncate"
                style={{ font: "var(--text-sm)", color: "var(--text-body)" }}
              >
                {secondary}
              </span>
            )}
            {tags.slice(0, MAX_VISIBLE_TAGS).map((t, i) => (
              <Tag key={i} tone={t.tone ?? "neutral"} icon={t.icon}>
                {t.label}
              </Tag>
            ))}
            {tags.length > MAX_VISIBLE_TAGS && (
              <span style={{ font: "var(--mono-sm)", color: "var(--text-low-content)" }}>
                +{tags.length - MAX_VISIBLE_TAGS}
              </span>
            )}
          </div>
        )}
      </div>

      {/* trailing columns */}
      {cells.map((col, i) => (
        <Cell key={i} col={col} />
      ))}

      {/* actions */}
      {actions.length > 0 && (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions.map((a, i) => (
            <RowActionButton key={i} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}
