"use client";

import { useMemo, useState } from "react";

import { VersionNode } from "@/components/prompts/version-node";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { Tag } from "@/components/ui/tag";
import { type RunStatus } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* View-model types — the page maps the query rows into these.          */
/* ------------------------------------------------------------------ */

export interface TimelineVersion {
  id: number;
  label: string;
  number: number;
  ref: string | null;
  /** ISO date string. */
  createdAt: string;
  branch: string | null;
  /** Display pass-rate fraction (0-1), null when the version has no run. */
  passRate: number | null;
  /** Pass-rate delta vs the previous version, in points. */
  passDelta: number | null;
  /** Cost delta vs the previous version, in USD. */
  costDelta: number | null;
  status: RunStatus | null;
  isLive: boolean;
  isRegressed: boolean;
  isImproved: boolean;
  isCostWin: boolean;
  isCostRegression: boolean;
}

export interface ScorecardData {
  liveLabel: string | null;
  livePassRate: number | null;
  liveSince: string | null;
  bestPassRate: number | null;
  bestLabel: string | null;
  bestDate: string | null;
  thisWeekCount: number;
  thisWeekLabels: string[];
}

export interface PromptTimelineViewProps {
  suiteSlug: string;
  suiteTitle: string;
  totalVersions: number;
  versions: TimelineVersion[];
  scorecards: ScorecardData;
  /** Pass-rate series oldest→newest, for the rail sparkline. */
  series: number[];
}

/** How many nodes the timeline lists before the "+N older" footer. */
const VISIBLE_NODES = 5;

/** "06-16" short date for the LIVE scorecard subline. */
function shortDate(iso: string | null): string {
  if (iso === null) return "—";
  return iso.slice(5, 10);
}

/* ------------------------------------------------------------------ */
/* Rail sparkline — a faithful render of the design's pass-rate trace.  */
/* The line is built from the real series; if the head regressed the    */
/* final segment drops red, mirroring the .dc.html.                     */
/* ------------------------------------------------------------------ */

function RailSparkline({
  series,
  headRegressed,
}: {
  series: number[];
  headRegressed: boolean;
}) {
  const W = 272;
  const H = 70;
  const padX = 4;
  const top = 18;
  const bottom = 52;

  const points = useMemo(() => {
    if (series.length === 0) return [] as [number, number][];
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const denom = Math.max(1, series.length - 1);
    return series.map((v, i): [number, number] => {
      const x = padX + (i / denom) * (W - padX * 2);
      const y = top + (1 - (v - min) / span) * (bottom - top);
      return [x, y];
    });
  }, [series]);

  if (points.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true" />
    );
  }

  // When the head regressed, the last point is rendered as a red dropped node
  // and the final segment is drawn red; the green line stops at the prior point.
  const greenPts = headRegressed && points.length > 1 ? points.slice(0, -1) : points;
  const greenLine = greenPts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const first = points[0];
  const lastGreen = greenPts[greenPts.length - 1];
  const last = points[points.length - 1];

  const area =
    first && lastGreen
      ? `${greenLine} L${lastGreen[0].toFixed(1)} ${H} L${first[0].toFixed(1)} ${H} Z`
      : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden="true">
      <defs>
        <linearGradient id="tl-rail-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--phosphor)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--phosphor)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill="url(#tl-rail-spark)" stroke="none" />}
      <path
        d={greenLine}
        fill="none"
        stroke="var(--phosphor)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {headRegressed && lastGreen && last && (
        <>
          <path
            d={`M${lastGreen[0].toFixed(1)} ${lastGreen[1].toFixed(1)} L${last[0].toFixed(1)} ${last[1].toFixed(1)}`}
            fill="none"
            stroke="var(--red)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx={last[0]} cy={last[1]} r="2.4" fill="var(--red)" />
        </>
      )}
      {!headRegressed && last && (
        <circle cx={last[0]} cy={last[1]} r="2.4" fill="var(--phosphor)" />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Right-rail scorecard tile — mono label + big mono value + subline.   */
/* ------------------------------------------------------------------ */

function RailCard({
  label,
  value,
  valueColor = "var(--text-hi)",
  suffix,
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  suffix?: string;
  sub: string;
}) {
  return (
    <Card>
      <SectionLabel style={{ marginBottom: 8 }}>{label}</SectionLabel>
      <div style={{ font: "600 24px/1.1 var(--font-mono)", color: valueColor }}>
        {value}
        {suffix && (
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{suffix}</span>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          marginTop: 6,
          color: "var(--text-muted)",
        }}
      >
        {sub}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main view.                                                           */
/* ------------------------------------------------------------------ */

export function PromptTimelineView({
  suiteSlug,
  totalVersions,
  versions,
  scorecards,
  series,
}: PromptTimelineViewProps) {
  const [branch, setBranch] = useState<"main" | "feat/stricter-schema">("main");
  const [checked, setChecked] = useState<number[]>(() =>
    versions.slice(0, 2).map((v) => v.id),
  );

  const liveLabel = scorecards.liveLabel ?? "—";
  const headRegressed = versions[0]?.isRegressed ?? false;

  const toggle = (id: number) => {
    setChecked((current) => {
      if (current.includes(id)) return current.filter((c) => c !== id);
      // Cap at 2: drop the oldest selection and append the new one.
      return [...current.slice(-1), id];
    });
  };

  const checkedVersions = checked
    .map((id) => versions.find((v) => v.id === id))
    .filter((v): v is TimelineVersion => v !== undefined)
    .sort((a, b) => b.number - a.number);

  const compareReady = checkedVersions.length === 2;
  const visible = versions.slice(0, VISIBLE_NODES);
  const olderCount = Math.max(0, totalVersions - visible.length);

  // EMPTY state — only one version means there is no comparison timeline yet.
  if (versions.length <= 1) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Header
            suiteSlug={suiteSlug}
            totalVersions={totalVersions}
            liveLabel={liveLabel}
            branch={branch}
            onBranch={setBranch}
          />
          <Card style={{ marginTop: 18 }}>
            <EmptyState
              illustration="empty-board"
              title="Only one version"
              description="Ship a prompt change and the comparison timeline fills in."
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Header
          suiteSlug={suiteSlug}
          totalVersions={totalVersions}
          liveLabel={liveLabel}
          branch={branch}
          onBranch={setBranch}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* TIMELINE */}
          <Card
            padding={false}
            header="VERSION HISTORY"
            actions={
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                newest first · check 2 to compare
              </span>
            }
          >
            <div style={{ padding: "18px 18px 8px" }}>
              {visible.map((version, index) => (
                <VersionNode
                  key={version.id}
                  version={version}
                  hasNext={index < visible.length - 1}
                  checked={checked.includes(version.id)}
                  onToggle={() => toggle(version.id)}
                  toggleDisabled={checked.length >= 2}
                />
              ))}
            </div>
            {olderCount > 0 && (
              <div style={{ padding: "8px 18px 16px", textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-low)",
                  }}
                >
                  + {olderCount} older version{olderCount === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </Card>

          {/* RIGHT RAIL */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "sticky",
              top: 0,
            }}
          >
            {/* compare bar */}
            {compareReady && (
              <Card glow style={{ borderColor: "var(--border-strong)" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-hi)",
                    }}
                  >
                    Comparing{" "}
                    <span
                      style={{
                        color: checkedVersions[1]?.isRegressed
                          ? "var(--red)"
                          : "var(--phosphor)",
                      }}
                    >
                      {checkedVersions[1]?.label}
                    </span>{" "}
                    ↔{" "}
                    <span
                      style={{
                        color: checkedVersions[0]?.isRegressed
                          ? "var(--red)"
                          : "var(--phosphor)",
                      }}
                    >
                      {checkedVersions[0]?.label}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="inline-flex w-full cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap transition hover:brightness-110 active:brightness-95"
                    style={{
                      height: 30,
                      padding: "0 11px",
                      font: "600 12px/1 var(--font-ui)",
                      color: "var(--bg-void)",
                      background: "var(--phosphor)",
                      border: "1px solid transparent",
                      borderRadius: "var(--radius-control)",
                      boxShadow: "var(--glow-phosphor)",
                    }}
                  >
                    <Icon name="git-compare" size={15} />
                    Open regression diff
                  </button>
                </div>
              </Card>
            )}

            {/* sparkline */}
            <Card>
              <SectionLabel style={{ marginBottom: 12 }}>
                PASS-RATE · {totalVersions} VERSION{totalVersions === 1 ? "" : "S"}
              </SectionLabel>
              <RailSparkline series={series} headRegressed={headRegressed} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-muted)",
                  }}
                >
                  v{versions[versions.length - 1]?.number ?? 1}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-muted)",
                  }}
                >
                  v{versions[0]?.number ?? totalVersions}
                </span>
              </div>
            </Card>

            {/* scorecards */}
            <RailCard
              label="LIVE VERSION"
              value={liveLabel}
              valueColor="var(--phosphor)"
              sub={
                scorecards.livePassRate !== null
                  ? `${(scorecards.livePassRate * 100).toFixed(1)}% · since ${shortDate(scorecards.liveSince)}`
                  : "—"
              }
            />
            <RailCard
              label="BEST EVER"
              value={
                scorecards.bestPassRate !== null
                  ? (scorecards.bestPassRate * 100).toFixed(1)
                  : "—"
              }
              suffix={scorecards.bestPassRate !== null ? "%" : undefined}
              sub={
                scorecards.bestLabel !== null
                  ? `${scorecards.bestLabel} · ${shortDate(scorecards.bestDate)}`
                  : "—"
              }
            />
            <RailCard
              label="VERSIONS THIS WEEK"
              value={String(scorecards.thisWeekCount)}
              sub={
                scorecards.thisWeekLabels.length > 0
                  ? scorecards.thisWeekLabels.join(" · ")
                  : "none"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header — title + suite tag + meta line, branch toggle + Compare CTA. */
/* ------------------------------------------------------------------ */

function Header({
  suiteSlug,
  totalVersions,
  liveLabel,
  branch,
  onBranch,
}: {
  suiteSlug: string;
  totalVersions: number;
  liveLabel: string;
  branch: "main" | "feat/stricter-schema";
  onBranch: (b: "main" | "feat/stricter-schema") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              font: "700 30px/1.1 var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--text-hi)",
              margin: 0,
            }}
          >
            Prompt Versions
          </h1>
          <Tag
            style={{
              height: 24,
              color: "var(--text-hi)",
              borderColor: "var(--border-strong)",
              letterSpacing: 0,
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            {suiteSlug}
          </Tag>
        </div>
        <SectionLabel>
          M3 · {totalVersions} VERSION{totalVersions === 1 ? "" : "S"} · LIVE{" "}
          {liveLabel}
        </SectionLabel>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* branch toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-control)",
            overflow: "hidden",
          }}
        >
          <BranchTab
            active={branch === "main"}
            onClick={() => onBranch("main")}
            label="main"
          />
          <span style={{ width: 1, alignSelf: "stretch", background: "var(--divider)" }} />
          <BranchTab
            active={branch === "feat/stricter-schema"}
            onClick={() => onBranch("feat/stricter-schema")}
            label="feat/stricter-schema"
          />
        </div>
        {/* compare CTA */}
        <button
          type="button"
          className="inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap transition hover:brightness-110 active:brightness-95"
          style={{
            height: 36,
            padding: "0 14px",
            font: "600 13px/1 var(--font-ui)",
            color: "var(--text-hi)",
            background: "transparent",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-control)",
          }}
        >
          <Icon name="git-compare" size={16} />
          Compare
        </button>
      </div>
    </div>
  );
}

function BranchTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer"
      style={{
        padding: "8px 12px",
        font: "500 13px/1 var(--font-ui)",
        color: active ? "var(--text-hi)" : "var(--text-body)",
        background: active ? "var(--phosphor-08)" : "transparent",
        border: "none",
      }}
    >
      {label}
    </button>
  );
}
