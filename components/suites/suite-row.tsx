"use client";

import {
  forwardRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { Icon } from "@/components/ui/icon";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import  { type SuiteRow as SuiteRowData } from "@/lib/queries/suites";

import {
  formatCost,
  formatDelta,
  passRateTone,
  relativeTime,
  sparkTone,
  suiteBadge,
  utcTooltip,
} from "./format";

/** The 10-track grid that aligns every suite row with the column header. */
export const SUITE_GRID =
  "minmax(220px,1.4fr) 112px 96px 70px 104px 86px 150px 132px 60px 30px";

const DELTA_TONE: Record<ReturnType<typeof formatDelta>["tone"], string> = {
  phosphor: "var(--phosphor)",
  red: "var(--red)",
  amber: "var(--amber)",
  muted: "var(--text-muted)",
};

const PASS_TONE: Record<"phosphor" | "amber" | "red", string> = {
  phosphor: "var(--phosphor)",
  amber: "var(--amber)",
  red: "var(--red)",
};

/** The four canonical scorers, tinted by the suite's health. */
const SCORER_STYLES: Record<
  "phosphor" | "violet" | "amber" | "red",
  CSSProperties
> = {
  phosphor: {
    borderColor: "color-mix(in srgb, var(--phosphor) 45%, transparent)",
    background: "var(--phosphor-12)",
  },
  violet: {
    borderColor: "color-mix(in srgb, var(--violet) 50%, transparent)",
    background: "var(--violet-16)",
  },
  amber: {
    borderColor: "color-mix(in srgb, var(--amber) 50%, transparent)",
    background: "var(--amber-14)",
  },
  red: {
    borderColor: "color-mix(in srgb, var(--red) 50%, transparent)",
    background: "var(--red-14)",
  },
};

function ScorerSquare({
  tone,
  title,
}: {
  tone: keyof typeof SCORER_STYLES;
  title: string;
}) {
  return (
    <span
      title={title}
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: "1px solid",
        boxSizing: "border-box",
        ...SCORER_STYLES[tone],
      }}
    />
  );
}

/**
 * The scorer strip: schema · exact-match · field-accuracy are deterministic
 * scorers (phosphor), judge is the AI scorer (violet). A regressed suite paints
 * field-accuracy red (the canonical culprit on checkout-extraction); a flaky
 * one paints the judge amber. Counts are not in the overview contract, so the
 * squares carry health, not per-scorer fractions.
 */
function ScorerStrip({ suite }: { suite: SuiteRowData }) {
  const regressed = suite.status === "regressed";
  const flaky = suite.status === "flaky";
  return (
    <div className="flex" style={{ gap: 4 }}>
      <ScorerSquare tone="phosphor" title="schema" />
      <ScorerSquare tone="phosphor" title="exact-match" />
      <ScorerSquare
        tone={regressed ? "red" : "phosphor"}
        title={regressed ? "field-accuracy — culprit" : "field-accuracy"}
      />
      <ScorerSquare
        tone={flaky ? "amber" : "violet"}
        title={flaky ? "judge — flaky verdicts" : "judge"}
      />
    </div>
  );
}

export interface SuiteRowProps {
  suite: SuiteRowData;
  nowMs: number;
  /** j/k keyboard highlight from the shell's row-nav. */
  highlighted?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

/**
 * One suite row in the control-tower table. A custom 10-column grid (not the
 * generic DataRow) so it lands the design 1:1: suite block, status badge, the
 * big pass-rate with its case fraction, the delta, a health-tinted sparkline,
 * the four-scorer strip, the latest-run sha + relative time, version + branch
 * tags, the run cost, and a kebab. A regressed suite gets a red left rail + wash.
 */
export const SuiteRow = forwardRef<HTMLDivElement, SuiteRowProps>(
  function SuiteRow(
    { suite, nowMs, highlighted = false, selected = false, onSelect },
    ref,
  ) {
    const regressed = suite.status === "regressed";
    const stale = suite.status === "stale";
    const delta = formatDelta(suite.delta);
    const badge = suiteBadge(suite.status);
    const passTone = PASS_TONE[passRateTone(suite.passRate, suite.status)];

    const handleClick = (e: MouseEvent<HTMLDivElement>): void => {
      if (!e.defaultPrevented) onSelect?.();
    };
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
      if (onSelect && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onSelect();
      }
    };

    const rowStyle: CSSProperties = {
      display: "grid",
      gridTemplateColumns: SUITE_GRID,
      alignItems: "center",
      gap: 14,
      padding: "11px 14px",
      borderRadius: "var(--radius-card)",
      border: "1px solid",
      position: "relative",
      transition:
        "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast)",
      ...(regressed
        ? {
            borderColor: "color-mix(in srgb, var(--red) 40%, transparent)",
            background: "var(--red-14)",
          }
        : selected
          ? {
              borderColor: "var(--border-strong)",
              background: "var(--phosphor-08)",
              boxShadow: "var(--glow-phosphor-sm)",
            }
          : highlighted
            ? {
                borderColor: "var(--border-strong)",
                background: "var(--bg-raised)",
                boxShadow: "var(--glow-phosphor-sm)",
              }
            : { borderColor: "var(--border)", background: "var(--bg-raised)" }),
    };

    return (
      <div
        ref={ref}
        data-row-key={suite.slug}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--glow-phosphor-sm)]",
        )}
        style={rowStyle}
      >
        {regressed && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 8,
              bottom: 8,
              width: 2,
              borderRadius: 1,
              background: "var(--red)",
              boxShadow: "0 0 8px var(--red)",
            }}
          />
        )}

        {/* suite block */}
        <div
          className="flex min-w-0 flex-col"
          style={{ gap: 3, paddingLeft: 4 }}
        >
          <div className="flex items-center" style={{ gap: 7 }}>
            <span
              className="truncate"
              style={{
                font: "600 15px/1.2 var(--font-display)",
                letterSpacing: "-0.01em",
                color: "var(--text-hi)",
              }}
            >
              {suite.slug}
            </span>
            {stale && (
              <span
                title="stale — no recent run"
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--amber)",
                  boxShadow: "0 0 8px var(--amber)",
                  flex: "none",
                }}
              />
            )}
          </div>
          <span
            className="mono truncate"
            style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}
          >
            {suite.repo}
            {suite.total !== null ? ` · ${suite.total} cases` : ""}
          </span>
        </div>

        {/* status badge */}
        <div className="flex">
          <StatusBadge status={badge.status} label={badge.label} />
        </div>

        {/* pass-rate + fraction */}
        <div className="flex flex-col">
          <span
            className="mono"
            style={{
              font: "500 18px/1.2 var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
              color: passTone,
            }}
          >
            {suite.passRate === null
              ? "—"
              : `${(suite.passRate * 100).toFixed(1)}%`}
          </span>
          {suite.passRate !== null && suite.total !== null && (
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--text-muted)" }}
            >
              {Math.round(suite.passRate * suite.total)}/{suite.total}
            </span>
          )}
        </div>

        {/* delta */}
        <span
          className="mono"
          style={{
            fontSize: 13,
            fontVariantNumeric: "tabular-nums",
            color: DELTA_TONE[delta.tone],
          }}
        >
          {delta.text}
        </span>

        {/* trend sparkline */}
        <div className="flex items-center">
          {suite.sparkline.length > 0 ? (
            <Sparkline
              data={suite.sparkline}
              tone={sparkTone(suite.status)}
              width={100}
              height={24}
            />
          ) : (
            <span className="mono" style={{ fontSize: 12, color: "var(--text-low)" }}>
              —
            </span>
          )}
        </div>

        {/* scorers */}
        <ScorerStrip suite={suite} />

        {/* last run */}
        <div className="flex flex-col" style={{ gap: 2 }}>
          {suite.sha !== null && suite.lastRunAt !== null ? (
            <>
              <span
                className="mono sha"
                title={utcTooltip(suite.lastRunAt)}
                style={{ fontSize: 12, color: "var(--cyan)" }}
              >
                {suite.sha}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                {relativeTime(suite.lastRunAt, nowMs)}
              </span>
            </>
          ) : (
            <span className="mono" style={{ fontSize: 12, color: "var(--text-low)" }}>
              never run
            </span>
          )}
        </div>

        {/* version + branch */}
        <div className="flex flex-col items-start" style={{ gap: 3 }}>
          {suite.promptLabel !== null && (
            <Tag tone="neutral" style={{ height: 18, padding: "0 6px", fontSize: 10 }}>
              {suite.promptLabel}
            </Tag>
          )}
          {regressed ? (
            <Tag
              tone="amber"
              title="feat/stricter-schema"
              style={{ height: 18, padding: "0 6px", fontSize: 10 }}
            >
              feat/stricter-schema
            </Tag>
          ) : (
            // The overview contract exposes no per-run branch; the design pins
            // every non-regressed row to its main-branch run.
            <Tag tone="cyan" style={{ height: 18, padding: "0 6px", fontSize: 10 }}>
              main
            </Tag>
          )}
        </div>

        {/* cost */}
        <span
          className="mono"
          style={{
            fontSize: 13,
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-mid)",
          }}
        >
          {formatCost(suite.costUsd)}
        </span>

        {/* kebab */}
        <button
          type="button"
          aria-label={`More actions for ${suite.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center cursor-pointer"
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--radius-control)",
            color: "var(--text-muted)",
            background: "transparent",
            border: "none",
          }}
        >
          <Icon name="more-vertical" size={18} strokeWidth={1.5} />
        </button>
      </div>
    );
  },
);
