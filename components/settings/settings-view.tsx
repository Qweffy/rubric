"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { KappaRing } from "@/components/settings/kappa-ring";
import { Banner } from "@/components/ui/banner";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { SectionLabel } from "@/components/ui/section-label";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { Toggle } from "@/components/ui/toggle";

/* ------------------------------------------------------------------ */
/* View types — the page shapes these from the query layer.            */
/* ------------------------------------------------------------------ */

/** The run store the dashboard reads from (derived from store stats). */
export interface RunStoreInfo {
  /** Backend label, e.g. "S3 + DuckDB". */
  backend: string;
  /** Store URI, e.g. "s3://acme-rubric-runs". */
  uri: string;
  /** Total runs in the store. */
  runCount: number;
  /** Total suites in the store. */
  suiteCount: number;
  /** UTC "HH:mm UTC" of the last sync. */
  lastSyncUtc: string;
  /** ISO-ish date of the last sync, e.g. "2026-06-17". */
  lastSyncDate: string;
  /** Recent sync-cadence trend (one point per recent day). */
  cadence: number[];
}

/** One registered project row in the table. */
export interface ProjectRow {
  /** Repo path, e.g. "github.com/acme/checkout". */
  repo: string;
  branch: string;
  /** Suites registered against the repo. */
  suiteCount: number;
  /** YAML config path, e.g. ".rubric/checkout.yaml". */
  configPath: string;
  /** Short sha of the latest run, "—" until a run lands. */
  sha: string;
  /** Connection health derived from the suite's run freshness. */
  state: "connected" | "stale";
  /** Days since the last run, for the STALE annotation. */
  staleDays: number | null;
}

/** One judge row in the JUDGE CONFIG table. */
export interface JudgeRow {
  id: number;
  /** Model id, e.g. "claude-opus-4". */
  model: string;
  /** Raw agreement (0–1), null when uncalibrated. */
  agreement: number | null;
  /** Cohen κ (0–1), null when uncalibrated. */
  kappa: number | null;
  /** Cost per 1k judge calls in USD, null when unknown. */
  costPer1k: number | null;
  /** Marks the default judge (radio filled). */
  isDefault: boolean;
  /** Whether the judge is enabled in the pool (toggle state). */
  enabled: boolean;
  /** "aligned" → ALIGNED badge; "under-calibrated" → COST-FLAGGED amber. */
  status: "aligned" | "under-calibrated" | "biased" | "drifted";
  /** Sub-note under the model id (e.g. "agreement 98.6% · DEFAULT"). */
  flagged: boolean;
}

/** A read-only gate-threshold row. */
export interface ThresholdRow {
  metric: string;
  /** Trailing mono hint, e.g. "(0–1 score)" or "(k=3)". */
  hint?: string;
  /** Comparison operator glyph. */
  op: "≥" | "≤";
  /** Pre-formatted floor value, e.g. "85.0%", "0.95", "$2.00". */
  floor: string;
  /** Scope label, e.g. "all projects" / "checkout". */
  scope: string;
}

/** A versions/diagnostics key-value pair. */
export interface VersionItem {
  label: string;
  value: string;
}

export interface SettingsViewProps {
  store: RunStoreInfo;
  projects: ProjectRow[];
  judges: JudgeRow[];
  thresholds: ThresholdRow[];
  /** File the gate thresholds are version-controlled in. */
  gateFile: string;
  versions: VersionItem[];
  /** Number of synced sources for the header status pill. */
  syncedSources: number;
  /** "All sources synced" relative time, e.g. "2m ago". */
  syncedAgo: string;
  /** rubric CLI version + store schema, for the RUN STORE head. */
  cliVersion: string;
  storeSchema: string;
}

/* ------------------------------------------------------------------ */
/* Section sub-nav — inert demo affordance (active state only).         */
/* ------------------------------------------------------------------ */

interface SectionDef {
  id: string;
  label: string;
  icon: IconName;
}

const SECTIONS: SectionDef[] = [
  { id: "store", label: "Run Store", icon: "server" },
  { id: "projects", label: "Projects", icon: "git-commit" },
  { id: "judges", label: "Judges", icon: "bot" },
  { id: "gating", label: "Gating", icon: "shield-check" },
  { id: "about", label: "About", icon: "target" },
];

/* ------------------------------------------------------------------ */
/* Shared button styles mirroring the design's .btn variants.           */
/* ------------------------------------------------------------------ */

const BTN_BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 36,
  padding: "0 14px",
  borderRadius: "var(--radius-control)",
  font: "600 13px/1 var(--font-ui)",
  border: "1px solid transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const BTN_SM: CSSProperties = { height: 30, padding: "0 11px", fontSize: 12 };

function SecondaryButton({
  children,
  sm = false,
  style,
}: {
  children: ReactNode;
  sm?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      style={{
        ...BTN_BASE,
        ...(sm ? BTN_SM : {}),
        background: "transparent",
        color: "var(--text-hi)",
        borderColor: "var(--border-strong)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      style={{
        ...BTN_BASE,
        ...BTN_SM,
        background: "transparent",
        color: "var(--text-body)",
        border: "1px solid var(--border)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Settings · Connections — the provenance / source-of-truth panel. Renders the
 * sticky SECTIONS sub-nav, the synced-status header, the RUN STORE connection
 * card with its sync-history sparkline, the REGISTERED PROJECTS table, the
 * JUDGE CONFIG rows (radio default + κ ring + cost + enable toggle), the
 * read-only GATE THRESHOLDS with the cyan version-control banner, and the
 * VERSIONS / diagnostics grid.
 *
 * Every number comes from the props the page derived off the seeded store; the
 * toggles, radios, and selects are inert demo affordances (local state only —
 * Settings is read-mostly, edits live in the repo YAML).
 */
export function SettingsView({
  store,
  projects,
  judges,
  thresholds,
  gateFile,
  versions,
  syncedSources,
  syncedAgo,
  cliVersion,
  storeSchema,
}: SettingsViewProps) {
  return (
    <div style={{ padding: 24 }}>
      <div
        className="mx-auto flex items-start"
        style={{ maxWidth: 1180, gap: 24 }}
      >
        <SectionsNav />

        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{ gap: 18 }}
        >
          <Header syncedSources={syncedSources} syncedAgo={syncedAgo} />
          <RunStoreCard store={store} cliVersion={cliVersion} storeSchema={storeSchema} />
          <RegisteredProjects projects={projects} />
          <JudgeConfig judges={judges} />
          <GateThresholds thresholds={thresholds} gateFile={gateFile} />
          <Versions versions={versions} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Left SECTIONS sub-nav.                                               */
/* ------------------------------------------------------------------ */

function SectionsNav() {
  const [active, setActive] = useState<string>(SECTIONS[0]?.id ?? "store");

  return (
    <div style={{ width: 188, flex: "none", position: "sticky", top: 0 }}>
      <SectionLabel style={{ padding: "0 11px", marginBottom: 10 }}>
        SECTIONS
      </SectionLabel>
      <div className="flex flex-col" style={{ gap: 2 }}>
        {SECTIONS.map((s) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className="relative flex items-center text-left"
              style={{
                gap: 9,
                height: 32,
                padding: "0 11px",
                borderRadius: "var(--radius-control)",
                border: "none",
                cursor: "pointer",
                font: "var(--text-sm)",
                color: on ? "var(--text-hi)" : "var(--text-mid)",
                background: on ? "var(--phosphor-08)" : "transparent",
              }}
            >
              {on && (
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
                  }}
                />
              )}
              <Icon
                name={s.icon}
                size={15}
                strokeWidth={1.6}
                style={{ opacity: 0.8 }}
              />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header — title + synced-status pill.                                 */
/* ------------------------------------------------------------------ */

function Dot({ color, size = 6, glow }: { color: string; size?: number; glow?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        flex: "none",
        boxShadow: glow ? `0 0 ${glow}px ${color}` : undefined,
      }}
    />
  );
}

function Header({
  syncedSources,
  syncedAgo,
}: {
  syncedSources: number;
  syncedAgo: string;
}) {
  // The source dots: each synced source phosphor, the last (stale) source amber,
  // mirroring the design's two-green-one-amber trio. Derived from the count.
  const dots = Array.from({ length: syncedSources + 1 }, (_, i) =>
    i < syncedSources ? "var(--phosphor)" : "var(--amber)",
  );

  return (
    <div className="flex items-start justify-between" style={{ gap: 16 }}>
      <div className="flex flex-col" style={{ gap: 9 }}>
        <h1
          style={{
            font: "700 28px/1.05 var(--font-display)",
            letterSpacing: "-0.02em",
            color: "var(--text-hi)",
            margin: 0,
          }}
        >
          Settings
        </h1>
        <SectionLabel>PROVENANCE · SOURCE OF TRUTH</SectionLabel>
      </div>
      <div
        className="flex items-center"
        style={{
          gap: 10,
          padding: "8px 13px",
          background: "var(--phosphor-08)",
          border: "1px solid color-mix(in srgb, var(--phosphor) 30%, transparent)",
          borderRadius: "var(--radius-control)",
        }}
      >
        <Dot color="var(--phosphor)" glow={7} />
        <span className="mono" style={{ fontSize: 12, color: "var(--text-hi)" }}>
          All sources synced
        </span>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-low-content)" }}>
          · {syncedAgo}
        </span>
        <span style={{ width: 1, height: 14, background: "var(--divider)" }} />
        <span className="flex" style={{ gap: 4 }}>
          {dots.map((c, i) => (
            <Dot key={i} color={c} size={6} glow={5} />
          ))}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RUN STORE card.                                                      */
/* ------------------------------------------------------------------ */

function RunStoreCard({
  store,
  cliVersion,
  storeSchema,
}: {
  store: RunStoreInfo;
  cliVersion: string;
  storeSchema: string;
}) {
  return (
    <Card
      padding={false}
      header="RUN STORE"
      actions={
        <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          rubric CLI {cliVersion} · store schema {storeSchema}
        </span>
      }
    >
      <div
        className="flex items-start"
        style={{ padding: "18px 16px", gap: 20 }}
      >
        <div className="flex flex-1 flex-col" style={{ gap: 13 }}>
          <div className="flex items-center" style={{ gap: 11 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                flex: "none",
                borderRadius: "var(--radius-control)",
                border: "1px solid var(--border)",
                background: "var(--surface-panel)",
                color: "var(--phosphor)",
              }}
            >
              <Icon name="server" size={19} strokeWidth={1.6} />
            </div>
            <div className="flex flex-col" style={{ gap: 3 }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <span style={{ font: "600 15px/1 var(--font-ui)", color: "var(--text-hi)" }}>
                  {store.backend}
                </span>
                <StatusBadge status="CONNECTED" />
              </div>
              <span className="mono" style={{ fontSize: 12, color: "var(--cyan)" }}>
                {store.uri}
              </span>
            </div>
          </div>
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--text-low-content)", lineHeight: 1.7 }}
          >
            last sync {store.lastSyncDate} {store.lastSyncUtc} ·{" "}
            {store.runCount.toLocaleString()} runs · {store.suiteCount} suites
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            <SecondaryButton sm>
              <Icon name="refresh-cw" size={16} strokeWidth={1.6} />
              Sync now
            </SecondaryButton>
            <GhostButton>Test connection</GhostButton>
          </div>
        </div>
        <div
          className="flex flex-col items-end"
          style={{ width: 200, flex: "none", gap: 7 }}
        >
          <SectionLabel>SYNC HISTORY</SectionLabel>
          <Sparkline
            data={store.cadence}
            width={200}
            height={44}
            tone="phosphor"
          />
          <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
            14-day sync cadence
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* REGISTERED PROJECTS table.                                           */
/* ------------------------------------------------------------------ */

const PROW_GRID = "1fr 86px 70px 1fr 96px 118px";

function ProjectsHeaderRow() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: PROW_GRID,
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        borderBottom: "1px solid var(--divider)",
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <ColHead>REPOSITORY</ColHead>
      <ColHead>BRANCH</ColHead>
      <ColHead>SUITES</ColHead>
      <ColHead>CONFIG PATH</ColHead>
      <ColHead>COMMIT</ColHead>
      <ColHead style={{ textAlign: "right" }}>STATUS</ColHead>
    </div>
  );
}

function ColHead({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      className="mono"
      style={{
        font: "600 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--text-low)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function RegisteredProjects({ projects }: { projects: ProjectRow[] }) {
  return (
    <Card
      padding={false}
      header="REGISTERED PROJECTS"
      actions={
        <GhostButton style={{ height: 28 }}>
          <PlusGlyph />
          Add project
        </GhostButton>
      }
    >
      <ProjectsHeaderRow />
      {projects.map((p, i) => {
        const last = i === projects.length - 1;
        const stale = p.state === "stale";
        return (
          <div
            key={p.repo}
            style={{
              display: "grid",
              gridTemplateColumns: PROW_GRID,
              alignItems: "center",
              gap: 14,
              padding: "13px 16px",
              borderBottom: last ? "none" : "1px solid var(--divider)",
              background: stale ? "var(--amber-08)" : undefined,
            }}
          >
            <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)" }}>
              {p.repo}
            </span>
            <span>
              <Tag tone="cyan" style={{ height: 22 }}>
                {p.branch}
              </Tag>
            </span>
            <span className="mono" style={{ fontSize: 13, color: "var(--text-mid)" }}>
              {p.suiteCount}
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-low-content)" }}>
              {p.configPath}
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--cyan)" }}>
              {p.sha}
            </span>
            <span
              className="flex flex-col items-end"
              style={{ justifySelf: "end", gap: 3 }}
            >
              <StatusBadge status={stale ? "STALE" : "CONNECTED"} />
              {stale && p.staleDays !== null && (
                <span className="mono" style={{ fontSize: 10, color: "var(--amber)" }}>
                  no run in {p.staleDays} days
                </span>
              )}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

function PlusGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* JUDGE CONFIG table.                                                  */
/* ------------------------------------------------------------------ */

const JROW_GRID = "24px 1fr 96px 86px 56px 118px";

function JudgeConfig({ judges }: { judges: JudgeRow[] }) {
  // Local enable state — inert demo affordance; Settings is read-mostly.
  const [enabled, setEnabled] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(judges.map((j) => [j.id, j.enabled])),
  );
  const [defaultId, setDefaultId] = useState<number | null>(
    judges.find((j) => j.isDefault)?.id ?? null,
  );

  return (
    <Card
      padding={false}
      header="JUDGE CONFIG"
      actions={
        <a
          href="#"
          className="mono"
          style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none" }}
        >
          Open calibration ↗
        </a>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: JROW_GRID,
          alignItems: "center",
          gap: 14,
          padding: "13px 16px",
          borderBottom: "1px solid var(--divider)",
          background: "rgba(255,255,255,0.012)",
        }}
      >
        <ColHead style={{ textAlign: "center" }}>DEF</ColHead>
        <ColHead>MODEL</ColHead>
        <ColHead>COHEN κ</ColHead>
        <ColHead>COST/1K</ColHead>
        <ColHead>ON</ColHead>
        <ColHead style={{ textAlign: "right" }}>STATUS</ColHead>
      </div>

      {judges.map((j, i) => {
        const last = i === judges.length - 1;
        const flagged = j.status === "under-calibrated";
        const isDefault = defaultId === j.id;
        const on = enabled[j.id] ?? j.enabled;
        return (
          <div
            key={j.id}
            style={{
              display: "grid",
              gridTemplateColumns: JROW_GRID,
              alignItems: "center",
              gap: 14,
              padding: "13px 16px",
              borderBottom: last ? "none" : "1px solid var(--divider)",
              background: flagged ? "var(--amber-08)" : undefined,
            }}
          >
            <span style={{ justifySelf: "center" }}>
              <Radio
                checked={isDefault}
                onChange={() => setDefaultId(j.id)}
                label={`Make ${j.model} the default judge`}
              />
            </span>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)" }}>
                {j.model}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: flagged ? "var(--amber)" : "var(--text-low)",
                }}
              >
                {flagged
                  ? "cheap but lenient"
                  : `agreement ${formatPct(j.agreement)}${isDefault ? " · DEFAULT" : ""}`}
              </span>
            </div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <KappaRing kappa={j.kappa} />
              <span className="mono" style={{ fontSize: 13, color: "var(--violet)" }}>
                {formatKappa(j.kappa)}
              </span>
            </div>
            <span className="mono" style={{ fontSize: 13, color: "var(--text-mid)" }}>
              {formatCost(j.costPer1k)}
            </span>
            <span>
              <Toggle
                checked={on}
                onChange={(next) => setEnabled((prev) => ({ ...prev, [j.id]: next }))}
                style={{ transform: "scale(0.86)", transformOrigin: "left center" }}
              />
            </span>
            <span
              className="flex items-center"
              style={{ justifySelf: "end", gap: 8 }}
            >
              {!isDefault && !flagged && (
                <button
                  type="button"
                  onClick={() => setDefaultId(j.id)}
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--cyan)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Set default
                </button>
              )}
              <StatusBadge
                status={flagged ? "PARTIAL" : "ALIGNED"}
                label={flagged ? "COST-FLAGGED" : "ALIGNED"}
              />
            </span>
          </div>
        );
      })}
    </Card>
  );
}

/** Phosphor radio (`.radio` / `.radio.on`) — inert demo affordance. */
function Radio({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="inline-flex items-center justify-center"
      style={{
        width: 16,
        height: 16,
        flex: "none",
        padding: 0,
        borderRadius: "50%",
        border: `1.5px solid ${checked ? "var(--phosphor)" : "var(--border-strong)"}`,
        background: "transparent",
        cursor: "pointer",
        boxShadow: checked ? "var(--glow-phosphor-sm)" : "none",
      }}
    >
      {checked && (
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--phosphor)",
          }}
        />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* GATE THRESHOLDS — read-only with cyan version-control banner.        */
/* ------------------------------------------------------------------ */

const TROW_GRID = "1fr 60px 132px 110px";

function GateThresholds({
  thresholds,
  gateFile,
}: {
  thresholds: ThresholdRow[];
  gateFile: string;
}) {
  return (
    <Card
      padding={false}
      header="GATE THRESHOLDS · READ-MOSTLY"
      actions={
        <SecondaryButton sm style={{ height: 28 }}>
          <EditGlyph />
          Edit thresholds
        </SecondaryButton>
      }
    >
      <div style={{ margin: "14px 16px 4px" }}>
        <Banner
          tone="cyan"
          style={{
            alignItems: "flex-start",
            padding: "11px 13px",
            border: "1px solid color-mix(in srgb, var(--cyan) 30%, transparent)",
            borderRadius: "var(--radius-control)",
            background: "var(--cyan-08)",
          }}
        >
          <span style={{ lineHeight: 1.55 }}>
            Thresholds are defined in{" "}
            <span className="mono" style={{ color: "var(--cyan)", fontSize: 12.5 }}>
              {gateFile}
            </span>{" "}
            and synced from the repo — edit there to keep them in version control.
          </span>
        </Banner>
      </div>

      <div style={{ padding: "8px 16px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: TROW_GRID,
            alignItems: "center",
            gap: 14,
            padding: "6px 0 11px",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <ColHead>METRIC</ColHead>
          <ColHead style={{ textAlign: "center" }}>OP</ColHead>
          <ColHead>FLOOR</ColHead>
          <ColHead style={{ textAlign: "right" }}>PROJECT</ColHead>
        </div>

        {thresholds.map((t, i) => {
          const last = i === thresholds.length - 1;
          return (
            <div
              key={`${t.metric}-${t.scope}`}
              style={{
                display: "grid",
                gridTemplateColumns: TROW_GRID,
                alignItems: "center",
                gap: 14,
                padding: "11px 0",
                borderBottom: last ? "none" : "1px solid var(--divider)",
              }}
            >
              <span style={{ font: "var(--text-sm)", color: "var(--text-hi)" }}>
                {t.metric}
                {t.hint && (
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
                    {" "}
                    {t.hint}
                  </span>
                )}
              </span>
              <span
                className="mono"
                style={{ fontSize: 13, color: "var(--text-low-content)", textAlign: "center" }}
              >
                {t.op}
              </span>
              <LockedField>{t.floor}</LockedField>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--text-low)", textAlign: "right" }}
              >
                {t.scope}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Locked dashed read-only field (`.field.locked`). */
function LockedField({ children }: { children: ReactNode }) {
  return (
    <span
      className="mono flex items-center"
      style={{
        height: 32,
        borderRadius: "var(--radius-control)",
        border: "1px dashed var(--border)",
        background: "var(--surface-panel)",
        padding: "0 11px",
        fontSize: 13,
        color: "var(--text-low-content)",
        fontVariantNumeric: "tabular-nums",
        width: "max-content",
      }}
    >
      {children}
    </span>
  );
}

function EditGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* VERSIONS / diagnostics grid.                                         */
/* ------------------------------------------------------------------ */

function Versions({ versions }: { versions: VersionItem[] }) {
  return (
    <Card
      padding={false}
      header="VERSIONS"
      actions={
        <GhostButton style={{ height: 28 }}>
          <Icon name="copy" size={16} strokeWidth={1.6} />
          Copy diagnostics
        </GhostButton>
      }
    >
      <div
        style={{
          padding: "14px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "11px 28px",
        }}
      >
        {versions.map((v) => (
          <div
            key={v.label}
            className="flex items-center justify-between"
            style={{ gap: 12 }}
          >
            <span className="mono" style={{ fontSize: 12, color: "var(--text-low-content)" }}>
              {v.label}
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-hi)" }}>
              {v.value}
            </span>
          </div>
        ))}
        <div
          style={{ gridColumn: "1 / 3", height: 1, background: "var(--divider)", margin: "3px 0" }}
        />
        <div
          className="flex items-center"
          style={{ gridColumn: "1 / 3", gap: 9 }}
        >
          <Dot color="var(--phosphor)" glow={6} />
          <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
            compatibility check passed — CLI, dashboard and store schema all aligned
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Formatters.                                                          */
/* ------------------------------------------------------------------ */

function formatPct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function formatKappa(v: number | null): string {
  if (v === null) return "—";
  return v.toFixed(2);
}

function formatCost(v: number | null): string {
  if (v === null) return "—";
  return `$${v.toFixed(2)}`;
}
