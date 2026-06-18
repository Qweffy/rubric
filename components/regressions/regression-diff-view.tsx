"use client";

import { useState } from "react";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";
import {
  PromptDiff,
  type DiffLineModel,
} from "@/components/regressions/prompt-diff";
import {
  RegressedCases,
  type RegressedCaseModel,
} from "@/components/regressions/regressed-cases";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag, type TagTone } from "@/components/ui/tag";

export type { DiffLineModel } from "@/components/regressions/prompt-diff";
export type { RegressedCaseModel } from "@/components/regressions/regressed-cases";

export interface ScorerDeltaModel {
  label: string;
  /** Signed point delta already formatted, e.g. "−14.8" / "+0.7". */
  points: string;
  tone: "red" | "violet" | "neutral";
}

export interface PromptDiffModel {
  baseLabel: string;
  headLabel: string;
  baseRef: string;
  headRef: string;
  summary: string;
  lines: DiffLineModel[];
}

export interface RegressionDiffViewProps {
  suiteSlug: string;
  suiteTitle: string;
  from: string;
  to: string;
  baseRef: string;
  headRef: string;
  baseBranch: string;
  headBranch: string;
  netPts: number;
  passRateA: number;
  passRateB: number;
  passCountA: number;
  passCountB: number;
  totalA: number;
  totalB: number;
  regressedCount: number;
  fixedCount: number;
  costDelta: number;
  scorerDeltas: ScorerDeltaModel[];
  regressed: RegressedCaseModel[];
  promptDiff: PromptDiffModel;
  hasV22Body: boolean;
  hasV23Body: boolean;
}

/** One decimal, with the design's unicode minus and explicit + on gains. */
function signedPts(pts: number): { sign: string; value: string } {
  if (pts > 0) return { sign: "+", value: pts.toFixed(1) };
  if (pts < 0) return { sign: "−", value: Math.abs(pts).toFixed(1) };
  return { sign: "", value: pts.toFixed(1) };
}

function signedUsd(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}$${Math.abs(delta).toFixed(2)}`;
}

const SCORER_TONE_COLOR: Record<ScorerDeltaModel["tone"], string> = {
  red: "var(--red)",
  violet: "var(--violet)",
  neutral: "var(--text-muted)",
};

const SCORER_TAG_TONE: Record<ScorerDeltaModel["tone"], TagTone> = {
  red: "red",
  violet: "violet",
  neutral: "neutral",
};

/**
 * RegressionDiffView — the Regression Diff screen (v22 → v23). Renders the
 * page content (the app shell is provided by the route layout): a REGRESSED
 * header with the net-points pill, the BASE ↔ HEAD
 * compare selector, the gradient summary strip, the side-by-side / unified
 * prompt diff, and the cause → effect split (regressed cases | improved empty).
 * All numbers arrive pre-computed from the diff query; only the selected case
 * and the diff-layout toggle are local UI state.
 */
export function RegressionDiffView(props: RegressionDiffViewProps) {
  const {
    from,
    to,
    baseRef,
    headRef,
    baseBranch,
    headBranch,
    netPts,
    passRateA,
    passRateB,
    passCountA,
    passCountB,
    totalA,
    totalB,
    regressedCount,
    fixedCount,
    costDelta,
    scorerDeltas,
    regressed,
    promptDiff,
  } = props;

  const [selectedCase, setSelectedCase] = useState<string | null>(
    regressed[0]?.caseId ?? null,
  );

  const net = signedPts(netPts);
  const isRegressed = netPts < 0;

  return (
    <div style={{ padding: 24 }}>
      <div className="mx-auto flex flex-col" style={{ maxWidth: 1280, gap: 18 }}>
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between" style={{ gap: 16 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <h2
              style={{
                font: "700 24px/1.1 var(--font-display)",
                letterSpacing: "-0.02em",
                color: "var(--text-hi)",
                margin: 0,
              }}
            >
              {`Regression · ${from} → ${to}`}
            </h2>
            {isRegressed ? (
              <StatusBadge status="REGRESSED" style={{ height: 24 }} />
            ) : (
              <StatusBadge status="IMPROVED" style={{ height: 24 }} />
            )}
          </div>
          <div className="flex items-center" style={{ gap: 12 }}>
            <a
              className="mono"
              href="/gating"
              style={{
                fontSize: 13,
                color: "var(--cyan)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
              }}
            >
              Open in gate
            </a>
            <button
              type="button"
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 30,
                padding: "0 11px",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--text-body)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-control)",
                cursor: "pointer",
              }}
            >
              Open PR #214
            </button>
            <NetPill net={net} regressed={isRegressed} />
          </div>
        </div>

        {/* ── COMPARE SELECTOR ───────────────────────────────────── */}
        <div className="flex items-center" style={{ gap: 14 }}>
          <CompareCard
            label="BASE"
            version={from}
            ref={baseRef}
            branch={baseBranch}
            branchTone="cyan"
          />
          <SwapBadge />
          <CompareCard
            label="HEAD"
            version={to}
            ref={headRef}
            branch={headBranch}
            branchTone="amber"
            danger
          />
        </div>

        {/* ── SUMMARY STRIP ──────────────────────────────────────── */}
        <SummaryStrip
          net={net}
          passRateA={passRateA}
          passRateB={passRateB}
          passCountA={passCountA}
          passCountB={passCountB}
          totalA={totalA}
          totalB={totalB}
          regressedCount={regressedCount}
          fixedCount={fixedCount}
          costDelta={costDelta}
          scorerDeltas={scorerDeltas}
        />

        {/* ── PROMPT DIFF ────────────────────────────────────────── */}
        <PromptDiff
          baseLabel={promptDiff.baseLabel}
          headLabel={promptDiff.headLabel}
          baseRef={promptDiff.baseRef}
          headRef={promptDiff.headRef}
          summary={promptDiff.summary}
          lines={promptDiff.lines}
        />

        {/* ── CAUSE → EFFECT ─────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.18fr) minmax(0,0.82fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <RegressedCases
            cases={regressed}
            count={regressedCount}
            baseLabel={from}
            headLabel={to}
            selectedId={selectedCase}
            onSelect={setSelectedCase}
          />
          <ImprovedEmpty count={fixedCount} headLabel={to} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function NetPill({
  net,
  regressed,
}: {
  net: { sign: string; value: string };
  regressed: boolean;
}) {
  if (regressed) {
    return (
      <div
        className="flex items-center"
        style={{
          gap: 8,
          padding: "7px 14px",
          background: "var(--red-14)",
          border: "1px solid color-mix(in srgb, var(--red) 44%, transparent)",
          borderRadius: "var(--radius-control)",
          boxShadow: "var(--glow-red)",
        }}
      >
        <span className="mono" style={{ font: "600 15px/1 var(--font-mono)", color: "var(--red)" }}>
          {`NET ${net.sign}${net.value}pts`}
        </span>
        <SectionLabel style={{ color: "var(--red)" }}>REGRESSED</SectionLabel>
      </div>
    );
  }
  return (
    <div
      className="flex items-center"
      style={{
        gap: 8,
        padding: "7px 14px",
        background: "var(--phosphor-08)",
        border: "1px solid color-mix(in srgb, var(--phosphor) 44%, transparent)",
        borderRadius: "var(--radius-control)",
        boxShadow: "var(--glow-phosphor-sm)",
      }}
    >
      <span className="mono" style={{ font: "600 15px/1 var(--font-mono)", color: "var(--phosphor)" }}>
        {`NET ${net.sign}${net.value}pts`}
      </span>
      <SectionLabel style={{ color: "var(--phosphor)" }}>IMPROVED</SectionLabel>
    </div>
  );
}

interface CompareCardProps {
  label: string;
  version: string;
  ref: string;
  branch: string;
  branchTone: TagTone;
  danger?: boolean;
}

function CompareCard({ label, version, ref, branch, branchTone, danger = false }: CompareCardProps) {
  return (
    <div
      className="flex items-center"
      style={{
        flex: 1,
        gap: 10,
        padding: "11px 14px",
        background: "var(--bg-raised)",
        border: `1px solid ${danger ? "color-mix(in srgb, var(--red) 30%, transparent)" : "var(--border)"}`,
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      <span className="mono" style={{ fontSize: 13, color: "var(--text-hi)", fontFamily: "var(--font-mono)" }}>
        {version}
      </span>
      <a
        className="mono"
        href="#"
        style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none", fontFamily: "var(--font-mono)" }}
      >
        {ref}
      </a>
      <Tag tone={branchTone} style={{ letterSpacing: 0 }}>
        {branch}
      </Tag>
      <span style={{ flex: 1 }} />
      <ChevronDown />
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** The phosphor swap-arrows badge between BASE and HEAD. */
function SwapBadge() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 34,
        height: 34,
        flex: "none",
        borderRadius: "50%",
        border: "1px solid var(--border-strong)",
        background: "var(--phosphor-08)",
        boxShadow: "var(--glow-phosphor-sm)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="var(--phosphor)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m16 3 4 4-4 4" />
        <path d="M20 7H4" />
        <path d="m8 21-4-4 4-4" />
        <path d="M4 17h16" />
      </svg>
    </div>
  );
}

interface SummaryStripProps {
  net: { sign: string; value: string };
  passRateA: number;
  passRateB: number;
  passCountA: number;
  passCountB: number;
  totalA: number;
  totalB: number;
  regressedCount: number;
  fixedCount: number;
  costDelta: number;
  scorerDeltas: ScorerDeltaModel[];
}

function SummaryStrip({
  net,
  passRateA,
  passRateB,
  passCountA,
  passCountB,
  totalA,
  totalB,
  regressedCount,
  fixedCount,
  costDelta,
  scorerDeltas,
}: SummaryStripProps) {
  const cost = signedUsd(costDelta);
  return (
    <div
      style={{
        background: "linear-gradient(180deg, var(--red-14), var(--bg-raised))",
        border: "1px solid color-mix(in srgb, var(--red) 28%, transparent)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex flex-wrap items-center" style={{ gap: 28 }}>
        {/* NET CHANGE */}
        <div className="flex flex-col" style={{ gap: 3 }}>
          <SectionLabel>NET CHANGE</SectionLabel>
          <span className="mono" style={{ font: "600 34px/1 var(--font-mono)", color: "var(--red)" }}>
            {`${net.sign}${net.value}`}
            <span style={{ fontSize: 18, color: "var(--text-muted)" }}>pts</span>
          </span>
        </div>

        <Divider />

        {/* PASS-RATE */}
        <div className="flex flex-col" style={{ gap: 3 }}>
          <SectionLabel>PASS-RATE</SectionLabel>
          <span className="mono" style={{ fontSize: 18, color: "var(--text-hi)", fontFamily: "var(--font-mono)" }}>
            {`${passRateA.toFixed(1)}% → ${passRateB.toFixed(1)}%`}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {`${String(passCountA)}/${String(totalA)} → ${String(passCountB)}/${String(totalB)}`}
          </span>
        </div>

        <Divider />

        {/* REGRESSED */}
        <div className="flex flex-col" style={{ gap: 3 }}>
          <SectionLabel>REGRESSED</SectionLabel>
          <span className="mono" style={{ font: "600 22px/1 var(--font-mono)", color: "var(--red)" }}>
            {String(regressedCount)}
          </span>
        </div>

        {/* IMPROVED */}
        <div className="flex flex-col" style={{ gap: 3 }}>
          <SectionLabel>IMPROVED</SectionLabel>
          <span
            className="mono"
            style={{
              font: "600 22px/1 var(--font-mono)",
              color: fixedCount > 0 ? "var(--phosphor)" : "var(--text-low)",
            }}
          >
            {String(fixedCount)}
          </span>
        </div>

        {/* COST */}
        <div className="flex flex-col" style={{ gap: 3 }}>
          <SectionLabel>COST</SectionLabel>
          <span className="mono" style={{ font: "600 22px/1 var(--font-mono)", color: "var(--amber)" }}>
            {cost}
          </span>
        </div>

        <span style={{ flex: 1 }} />

        {/* PER-SCORER Δ */}
        <div className="flex flex-col" style={{ gap: 6 }}>
          <SectionLabel>PER-SCORER Δ</SectionLabel>
          <div className="flex" style={{ gap: 8 }}>
            {scorerDeltas.map((s) => (
              <Tag key={s.label} tone={SCORER_TAG_TONE[s.tone]} style={{ letterSpacing: 0, color: SCORER_TONE_COLOR[s.tone] }}>
                {`${s.label} ${s.points}`}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 42, background: "var(--divider)" }} />;
}

/** The right "IMPROVED · 0" empty card — v23 only added strictness. */
function ImprovedEmpty({ count, headLabel }: { count: number; headLabel: string }) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="flex items-center"
        style={{ padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel>{`IMPROVED · ${String(count)}`}</SectionLabel>
      </div>
      <div
        className="flex flex-1 flex-col items-center justify-center text-center"
        style={{ gap: 12, padding: "40px 24px", opacity: 0.62 }}
      >
        <RubricIllustration name="gate-open" size={92} />
        <span
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            maxWidth: 220,
            lineHeight: 1.6,
            fontFamily: "var(--font-mono)",
          }}
        >
          {`No cases improved on this pair — ${headLabel} only added strictness.`}
        </span>
      </div>
    </div>
  );
}
