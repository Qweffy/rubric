"use client";

import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";

import { BiasScatter } from "@/components/judges/bias-scatter";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HeatmapCell } from "@/components/ui/heatmap-cell";
import { Icon } from "@/components/ui/icon";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  type Disagreement,
  type JudgeCalibration,
} from "@/lib/queries/calibration";

export interface JudgeCalibrationViewProps {
  /** The judge's calibration profile, or null when the name is unknown. */
  calibration: JudgeCalibration | null;
  /** The judge name that was requested (for the unknown-judge empty state). */
  requestedJudge: string;
}

/** Map a judge status to the headline badge + its short tone word. */
const STATUS_BADGE: Record<
  JudgeCalibration["status"],
  { status: string; label?: string }
> = {
  aligned: { status: "WELL-CALIBRATED" },
  "under-calibrated": { status: "UNDER-CALIBRATED" },
  biased: { status: "JUDGE", label: "BIASED" },
  drifted: { status: "DRIFTED" },
};

/**
 * JudgeCalibration view — the calibration bench. Renders the κ gauge, the
 * agreement / false-pass / false-fail strip, the judge↔human confusion matrix,
 * the position + length bias scatters, and the concrete disagreements list.
 *
 * Every number is taken from the `calibration` payload (seeded canonical data);
 * nothing is hardcoded. When the judge has never been calibrated (no confusion
 * matrix) we fall back to the "Not calibrated yet" empty state from the design.
 */
export function JudgeCalibrationView({
  calibration,
  requestedJudge,
}: JudgeCalibrationViewProps) {
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
        {calibration !== null && calibration.confusion !== null ? (
          <Calibrated calibration={calibration} />
        ) : (
          <NotCalibrated judgeName={calibration?.judgeName ?? requestedJudge} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty — the judge has no human labels to measure against yet.        */
/* ------------------------------------------------------------------ */

function NotCalibrated({ judgeName }: { judgeName: string }) {
  return (
    <>
      <Header
        judgeName={judgeName}
        subtitle="NOT CALIBRATED · NO HUMAN LABELS YET"
      />
      <Card padding={false}>
        <EmptyState
          illustration="judge-orb-idle"
          title="Not calibrated yet"
          description="Label at least 30 cases by hand to measure this judge against humans."
          action="Start labeling"
          actionIcon="check"
        />
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The full calibrated screen.                                          */
/* ------------------------------------------------------------------ */

function Calibrated({ calibration }: { calibration: JudgeCalibration }) {
  const { judgeName, n, confusion, disagreements } = calibration;
  // Narrowed by the caller (NotCalibrated handles the null branch), but keep
  // the guard so this component is independently safe.
  if (confusion === null) return null;

  const total = confusion.tp + confusion.tn + confusion.fp + confusion.fn;
  const subtitle = `M2 · n = ${n ?? total} LABELED PAIRS · CHECKOUT-EXTRACTION`;

  return (
    <>
      <Header judgeName={judgeName} subtitle={subtitle} />
      <KappaStrip calibration={calibration} total={total} />
      <MatrixAndScatters calibration={calibration} total={total} />
      <DisagreementList disagreements={disagreements} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Header — title + judge selector + sub-line + right-hand actions.     */
/* ------------------------------------------------------------------ */

function Header({
  judgeName,
  subtitle,
}: {
  judgeName: string;
  subtitle: string;
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
            gap: 14,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              font: "var(--text-h1)",
              letterSpacing: "var(--tracking-display)",
              color: "var(--text-hi)",
              margin: 0,
            }}
          >
            Judge Calibration
          </h1>
          <JudgeSelector judgeName={judgeName} />
        </div>
        <SectionLabel>{subtitle}</SectionLabel>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/judges/compare"
          className="mono"
          style={{
            font: "var(--mono-base)",
            fontSize: 13,
            color: "var(--cyan)",
            textDecoration: "none",
          }}
        >
          Compare judges
        </Link>
        <AddLabelsButton />
      </div>
    </div>
  );
}

/** The "claude-opus-4 ▾" model selector chip beside the title. */
function JudgeSelector({ judgeName }: { judgeName: string }) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-label={`Judge: ${judgeName}`}
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 30,
        padding: "0 11px",
        background: "transparent",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-control)",
        color: "var(--text-hi)",
        font: "500 12px/1 var(--font-mono)",
        cursor: "pointer",
      }}
    >
      <Icon name="bot" size={14} style={{ color: "var(--violet)" }} />
      {judgeName}
      <Icon name="chevron-down" size={13} strokeWidth={1.6} />
    </button>
  );
}

/** Secondary outline "Add labels" button (leading + glyph), per the design. */
function AddLabelsButton() {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center justify-center"
      style={{
        gap: 8,
        height: "var(--control-h)",
        padding: "0 14px",
        background: "transparent",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-control)",
        color: "var(--text-hi)",
        font: "600 13px/1 var(--font-ui)",
        whiteSpace: "nowrap",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
      Add labels
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Kappa strip — gauge card + agreement / false-pass / false-fail.      */
/* ------------------------------------------------------------------ */

function KappaStrip({
  calibration,
  total,
}: {
  calibration: JudgeCalibration;
  total: number;
}) {
  const { kappa, agreement, confusion } = calibration;
  if (confusion === null) return null;

  const agreeingPairs = confusion.tp + confusion.tn;
  const agreementPct =
    agreement !== null
      ? (agreement * 100).toFixed(1)
      : ((agreeingPairs / total) * 100).toFixed(1);

  const badge = STATUS_BADGE[calibration.status];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.15fr 1fr 1fr 1fr",
        gap: 16,
      }}
    >
      {/* KAPPA CARD */}
      <Card
        glow
        style={{
          boxShadow: "var(--shadow-card), var(--glow-violet)",
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ScoreGauge value={kappa ?? 0} mode="kappa" size={140} />
          <StatusBadge
            status={badge.status}
            label={badge.label}
            style={{ height: 22 }}
          />
        </div>
      </Card>

      {/* AGREEMENT */}
      <StatCard label="AGREEMENT">
        <BigStat
          value={agreementPct}
          suffix="%"
          color="var(--text-hi)"
        />
        <StatFoot>
          {agreeingPairs}/{total} pairs
        </StatFoot>
      </StatCard>

      {/* FALSE-PASS */}
      <StatCard
        label="FALSE-PASS"
        labelTone="amber"
        borderColor="color-mix(in srgb, var(--amber) 36%, transparent)"
      >
        <BigStat value={String(confusion.fp)} color="var(--amber)" />
        <StatFoot>judge PASS · human FAIL</StatFoot>
      </StatCard>

      {/* FALSE-FAIL */}
      <StatCard label="FALSE-FAIL">
        <BigStat value={String(confusion.fn)} color="var(--red)" />
        <StatFoot>the safer error</StatFoot>
      </StatCard>
    </div>
  );
}

function StatCard({
  label,
  labelTone = "low",
  borderColor,
  children,
}: {
  label: string;
  labelTone?: "low" | "amber";
  borderColor?: string;
  children: ReactNode;
}) {
  return (
    <Card
      style={{
        padding: 16,
        ...(borderColor ? { borderColor } : null),
      }}
    >
      <SectionLabel
        tone={labelTone === "amber" ? "amber" : "low"}
        style={{ marginBottom: 10 }}
      >
        {label}
      </SectionLabel>
      {children}
    </Card>
  );
}

function BigStat({
  value,
  suffix,
  color,
}: {
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <div
      className="mono"
      style={{ font: "var(--mono-xl)", color, fontVariantNumeric: "tabular-nums" }}
    >
      {value}
      {suffix ? (
        <span style={{ fontSize: 18, color: "var(--text-muted)" }}>{suffix}</span>
      ) : null}
    </div>
  );
}

function StatFoot({ children }: { children: ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        font: "var(--mono-sm)",
        marginTop: 8,
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Matrix + bias scatters row.                                          */
/* ------------------------------------------------------------------ */

function MatrixAndScatters({
  calibration,
  total,
}: {
  calibration: JudgeCalibration;
  total: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.82fr) minmax(0, 1fr)",
        gap: 16,
        alignItems: "start",
      }}
    >
      <ConfusionMatrix calibration={calibration} total={total} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <PositionBiasCard posBias={calibration.bias.posBias} />
        <LengthBiasCard
          lengthBias={calibration.bias.lengthBias}
          lengthR2={calibration.bias.lengthR2}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confusion matrix — TP / FP / FN / TN built on HeatmapCell.           */
/* ------------------------------------------------------------------ */

function ConfusionMatrix({
  calibration,
  total,
}: {
  calibration: JudgeCalibration;
  total: number;
}) {
  const { confusion } = calibration;
  if (confusion === null) return null;

  const pct = (v: number): string => `${((v / total) * 100).toFixed(1)}%`;

  return (
    <Card
      padding={false}
      header="JUDGE vs HUMAN"
      actions={
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}
        >
          n = {total}
        </span>
      }
    >
      <div style={{ padding: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "54px 1fr 1fr",
            gap: 0,
          }}
        >
          <div />
          <ColumnHeader>HUMAN PASS</ColumnHeader>
          <ColumnHeader>HUMAN FAIL</ColumnHeader>

          {/* JUDGE PASS row */}
          <RowHeader>JUDGE PASS</RowHeader>
          {/* TP */}
          <MatrixCell
            tone="pass"
            value={confusion.tp}
            caption={pct(confusion.tp)}
          />
          {/* FP — the loudest cell: the false-pass you fear */}
          <MatrixCell
            tone="false-pass"
            value={confusion.fp}
            caption="false-pass"
            tooltip={`${confusion.fp} cases · judge PASS, human FAIL`}
          />

          {/* JUDGE FAIL row */}
          <RowHeader>JUDGE FAIL</RowHeader>
          {/* FN */}
          <MatrixCell
            tone="false-fail"
            value={confusion.fn}
            caption="false-fail"
            tooltip={`${confusion.fn} cases · judge FAIL, human PASS`}
          />
          {/* TN */}
          <MatrixCell
            tone="pass"
            value={confusion.tn}
            caption={pct(confusion.tn)}
          />
        </div>

        {/* false-pass call-out */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            padding: "9px 11px",
            background: "var(--amber-14)",
            border: "1px solid color-mix(in srgb, var(--amber) 36%, transparent)",
            borderRadius: "var(--radius-control)",
          }}
        >
          <Dot color="var(--amber)" />
          <span
            className="mono"
            style={{ font: "var(--mono-sm)", color: "var(--text-hi)" }}
          >
            {confusion.fp} cases: judge too lenient
          </span>
          <Link
            href="/judges?view=false-pass"
            style={{ font: "var(--mono-sm)", color: "var(--cyan)", textDecoration: "none" }}
          >
            view
          </Link>
        </div>

        <div
          className="mono"
          style={{
            font: "var(--mono-sm)",
            color: "var(--text-muted)",
            marginTop: 10,
          }}
        >
          diagonal = agreement (✓) · off-diagonal = disagreement (✗) ·{" "}
          {confusion.tp}+{confusion.tn}+{confusion.fp}+{confusion.fn} = {total}
        </div>
      </div>
    </Card>
  );
}

type MatrixTone = "pass" | "false-pass" | "false-fail";

/**
 * A confusion-matrix cell. Built around the big mono value + glyph + caption
 * the design draws; the strong amber border + glow singles out the false-pass
 * cell ("what you fear"). HeatmapCell drives the redundant glyph/fill encoding.
 */
function MatrixCell({
  tone,
  value,
  caption,
  tooltip,
}: {
  tone: MatrixTone;
  value: number;
  caption: string;
  tooltip?: ReactNode;
}) {
  const isPass = tone === "pass";
  const heatState = isPass ? "pass" : "fail";

  // The design fills the diagonal (agreement) cells with a denser phosphor wash
  // and prints them in the void color; the off-diagonal cells use the amber /
  // red tints from HeatmapCell. We override the diagonal fill to match.
  const diagonalStyle: CSSProperties = isPass
    ? {
        background: "color-mix(in srgb, var(--phosphor) 33%, transparent)",
        color: "var(--bg-void)",
      }
    : {};

  const falsePassStyle: CSSProperties =
    tone === "false-pass"
      ? {
          border: "2px solid var(--amber)",
          boxShadow: "0 0 16px color-mix(in srgb, var(--amber) 40%, transparent)",
          zIndex: 2,
          color: "var(--amber)",
        }
      : {};

  const captionColor =
    tone === "false-pass"
      ? "var(--amber)"
      : tone === "false-fail"
        ? "var(--red)"
        : "var(--bg-void)";

  return (
    <HeatmapCell
      state={heatState}
      hideGlyph
      tooltip={tooltip}
      size={120}
      lastInRow
      lastRow
      value={
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <span style={{ font: "600 30px/1 var(--font-mono)" }}>{value}</span>
          <span style={{ fontSize: 13, lineHeight: 1 }}>{isPass ? "✓" : "✗"}</span>
          <span style={{ fontSize: 11, color: captionColor }}>{caption}</span>
        </span>
      }
      style={{
        flexDirection: "column",
        gap: 3,
        aspectRatio: "1",
        border: "1px solid var(--bg-void)",
        borderRight: "1px solid var(--bg-void)",
        borderBottom: "1px solid var(--bg-void)",
        ...diagonalStyle,
        ...falsePassStyle,
      }}
    />
  );
}

function ColumnHeader({ children }: { children: ReactNode }) {
  return (
    <div
      className="hr-label"
      style={{
        textAlign: "center",
        fontSize: 10,
        paddingBottom: 8,
        color: "var(--text-hi)",
        font: "var(--label-mono)",
        letterSpacing: "var(--label-tracking)",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function RowHeader({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 8,
      }}
    >
      <span
        className="hr-label"
        style={{
          fontSize: 10,
          color: "var(--violet)",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          font: "var(--label-mono)",
          letterSpacing: "var(--label-tracking)",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bias scatter cards.                                                  */
/* ------------------------------------------------------------------ */

/** Signed coefficient string, e.g. "+0.03" / "-0.11". */
function signed(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

function PositionBiasCard({ posBias }: { posBias: number | null }) {
  if (posBias === null) {
    return <BiasUnavailable label="POSITION BIAS" />;
  }
  const magnitude = Math.abs(posBias);
  const negligible = magnitude < 0.1;

  return (
    <Card
      padding={false}
      header="POSITION BIAS"
      actions={
        negligible ? (
          <StatusBadge
            status="WELL-CALIBRATED"
            label={`NEGLIGIBLE ${signed(posBias)}`}
          />
        ) : (
          <StatusBadge
            status="PENDING"
            label={`POSITION BIAS ${signed(posBias)}`}
          />
        )
      }
    >
      <div style={{ padding: 14 }}>
        <BiasScatter slope={posBias} axisLabel="position →" />
      </div>
    </Card>
  );
}

function LengthBiasCard({
  lengthBias,
  lengthR2,
}: {
  lengthBias: number | null;
  lengthR2: number | null;
}) {
  if (lengthBias === null) {
    return <BiasUnavailable label="LENGTH BIAS" />;
  }
  const mild = Math.abs(lengthBias) < 0.2;

  return (
    <Card
      padding={false}
      header="LENGTH BIAS"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lengthR2 !== null ? (
            <span
              className="mono"
              style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}
            >
              r² {lengthR2.toFixed(2)}
            </span>
          ) : null}
          <StatusBadge
            status="PENDING"
            label={`${mild ? "MILD — FAVORS LONGER" : "FAVORS LONGER"} ${signed(lengthBias)}`}
          />
        </div>
      }
    >
      <div style={{ padding: 14 }}>
        <BiasScatter
          slope={lengthBias}
          lineColor="var(--amber)"
          dashed
          axisLabel="response length →"
        />
      </div>
    </Card>
  );
}

function BiasUnavailable({ label }: { label: string }) {
  return (
    <Card padding={false} header={label}>
      <div
        style={{
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "var(--text-sm)",
          color: "var(--text-muted)",
        }}
      >
        Bias scatter unavailable
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Disagreement list.                                                   */
/* ------------------------------------------------------------------ */

const DISAGREEMENT_GRID =
  "minmax(220px, 1.4fr) 110px 110px 110px minmax(0, 1fr)";

function DisagreementList({
  disagreements,
}: {
  disagreements: Disagreement[];
}) {
  // A disagreement is a false-pass when the judge said pass but the human said
  // fail; the inverse is a false-fail. Count both from the actual rows.
  const falsePass = disagreements.filter(
    (d) => d.judgeLabel === "pass" && d.humanLabel === "fail",
  ).length;
  const falseFail = disagreements.filter(
    (d) => d.judgeLabel === "fail" && d.humanLabel === "pass",
  ).length;

  return (
    <Card
      padding={false}
      header={`DISAGREEMENTS · ${disagreements.length}`}
      actions={
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", color: "var(--text-muted)" }}
        >
          {falsePass} false-pass · {falseFail} false-fail · j/k to navigate
        </span>
      }
    >
      {/* column header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: DISAGREEMENT_GRID,
          gap: 14,
          padding: "8px 16px",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <ColH>CASE</ColH>
        <ColH>JUDGE</ColH>
        <ColH>HUMAN</ColH>
        <ColH>GAP</ColH>
        <ColH>WHY</ColH>
      </div>

      {disagreements.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            font: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          No judge↔human disagreements — every labeled pair agrees.
        </div>
      ) : (
        <div
          style={{
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {disagreements.map((d, i) => (
            <DisagreementRow
              key={d.caseRowId}
              disagreement={d}
              selected={i === 0}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function DisagreementRow({
  disagreement,
  selected,
}: {
  disagreement: Disagreement;
  selected: boolean;
}) {
  const isFalsePass =
    disagreement.judgeLabel === "pass" && disagreement.humanLabel === "fail";
  const gapLabel = isFalsePass ? "false-pass" : "false-fail";
  const gapColor = isFalsePass ? "var(--amber)" : "var(--red)";

  // The judge tally cell ("3/5 PASS"): the rubric score the judge gave is stored
  // as an absolute count out of 5 (see judgeVerdicts.score / db/seed.ts), so it
  // is the numerator directly — not a 0-1 fraction. Badged with the judge call.
  const scoreOutOf = 5;
  const tally = `${Math.round(disagreement.judgeScore)}/${scoreOutOf}`;
  const judgeWord = disagreement.judgeLabel === "pass" ? "PASS" : "FAIL";

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: DISAGREEMENT_GRID,
    alignItems: "center",
    gap: 14,
    padding: "11px 14px",
    background: selected
      ? isFalsePass
        ? "var(--amber-14)"
        : "var(--red-14)"
      : "var(--bg-raised)",
    border: `1px solid ${
      selected
        ? isFalsePass
          ? "color-mix(in srgb, var(--amber) 38%, transparent)"
          : "color-mix(in srgb, var(--red) 38%, transparent)"
        : "var(--border)"
    }`,
    borderRadius: "var(--radius-card)",
  };

  return (
    <div style={rowStyle}>
      {/* CASE */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", fontSize: 13, color: "var(--text-hi)" }}
        >
          {disagreement.caseId}
        </span>
        <span
          className="mono"
          style={{ font: "var(--mono-sm)", fontSize: 11, color: "var(--text-muted)" }}
        >
          {disagreement.suiteSlug}
        </span>
      </div>

      {/* JUDGE — violet tally badge */}
      <PlainBadge
        color="var(--violet)"
        background="var(--violet-16)"
        border="color-mix(in srgb, var(--violet) 40%, transparent)"
      >
        {tally} {judgeWord}
      </PlainBadge>

      {/* HUMAN — amber FAIL / outline PASS */}
      {disagreement.humanLabel === "fail" ? (
        <PlainBadge
          color="var(--amber)"
          background="var(--amber-14)"
          border="color-mix(in srgb, var(--amber) 38%, transparent)"
        >
          FAIL
        </PlainBadge>
      ) : (
        <PlainBadge
          color="var(--text-hi)"
          background="transparent"
          border="var(--border-strong)"
        >
          PASS
        </PlainBadge>
      )}

      {/* GAP */}
      <span
        className="mono"
        style={{ font: "var(--mono-sm)", color: gapColor }}
      >
        {gapLabel}
      </span>

      {/* WHY */}
      <span style={{ font: "var(--text-sm)", color: "var(--text-body)" }}>
        {disagreement.reasoning ?? "—"}
      </span>
    </div>
  );
}

/**
 * A non-status mono badge used in the disagreement table (the judge tally,
 * human verdict). Distinct from StatusBadge because the text is data, not a
 * fixed status word.
 */
function PlainBadge({
  children,
  color,
  background,
  border,
}: {
  children: ReactNode;
  color: string;
  background: string;
  border: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 20,
        padding: "0 7px",
        font: "600 10px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color,
        background,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
        width: "max-content",
      }}
    >
      {children}
    </span>
  );
}

function ColH({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        font: "600 10px/1.2 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: "var(--text-low)",
      }}
    >
      {children}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        flex: "none",
      }}
    />
  );
}
