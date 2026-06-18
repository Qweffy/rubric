"use client";

import { type KeyboardEvent } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";

import { type ClusterVM } from "./view-model";

interface ClusterTreemapProps {
  clusters: ClusterVM[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

/** Tile font sizes step down with the cluster's rank so the biggest reads first. */
function countFontSize(rank: number, total: number): number {
  if (total <= 1) return 42;
  const sizes = [42, 30, 28, 24, 22];
  return sizes[Math.min(rank, sizes.length - 1)] ?? 22;
}

interface TileProps {
  cluster: ClusterVM;
  rank: number;
  total: number;
  selected: boolean;
  flexBasis: number;
  onSelect: (id: number) => void;
  /** Compact tiles drop the long scorer line for a single ▰-bar chip. */
  compact?: boolean;
}

function Tile({
  cluster,
  rank,
  total,
  selected,
  flexBasis,
  onSelect,
  compact = false,
}: TileProps) {
  const { tint } = cluster;
  const fill = rank === 0 ? tint.fillStrong : tint.fillSoft;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(cluster.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(cluster.id)}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex cursor-pointer flex-col justify-between overflow-hidden",
        "[transition:box-shadow_var(--dur),transform_var(--dur-fast)]",
        "hover:[transform:translateY(-1px)]",
      )}
      style={{
        flex: `${String(flexBasis)} 1 0`,
        minWidth: 0,
        padding: "13px 14px",
        borderRadius: "var(--radius-control)",
        background: fill,
        border: `1px solid ${tint.border}`,
        boxShadow: selected
          ? "0 0 0 1.5px var(--phosphor), var(--glow-phosphor-sm)"
          : undefined,
      }}
    >
      {compact ? (
        <>
          <div className="flex items-center" style={{ gap: 9 }}>
            <span
              style={{
                font: "700 24px/1 var(--font-mono)",
                color: tint.accent,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {cluster.size}
            </span>
            <span
              style={{
                font: "500 11px/1.25 var(--font-mono)",
                color: cluster.scorer === "neutral" ? "var(--text-mid)" : "var(--text-hi)",
              }}
            >
              {cluster.title}
            </span>
          </div>
          <span
            style={{
              font: "600 9.5px/1 var(--font-mono)",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: tint.accent,
            }}
          >
            {cluster.scorer === "neutral"
              ? tint.scorerLabel
              : `${cluster.bars} ${tint.scorerLabel}`}
          </span>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <span
              style={{
                font: `700 ${String(countFontSize(rank, total))}px/1 var(--font-mono)`,
                color: tint.accent,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {cluster.size}
            </span>
            {selected ? <StatusBadge status="NEUTRAL" label="SELECTED" /> : null}
          </div>
          <div className="flex flex-col" style={{ gap: rank === 0 ? 7 : 5 }}>
            <span
              style={{
                font: "500 14px/1.25 var(--font-mono)",
                color: "var(--text-hi)",
              }}
            >
              {cluster.title}
            </span>
            <span
              style={{
                font: "600 9.5px/1 var(--font-mono)",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: tint.accent,
              }}
            >
              {cluster.scorer === "neutral"
                ? tint.scorerLabel
                : `${cluster.bars} ${tint.scorerLabel}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ClusterTreemap — a flex "treemap" of failure clusters: the largest cluster
 * anchors a tall left column, the remainder pack a right grid, each sized by
 * its case count and tinted by its dominant scorer. Selecting a tile drives the
 * detail panel + promote flow. Degrades to a single anchor tile when one
 * cluster exists (the seeded canonical case).
 */
export function ClusterTreemap({
  clusters,
  selectedId,
  onSelect,
}: ClusterTreemapProps) {
  const [anchor, ...rest] = clusters;
  if (anchor === undefined) return null;
  const total = clusters.length;

  // Single cluster: the anchor fills the whole map.
  if (rest.length === 0) {
    return (
      <div className="flex" style={{ gap: 8, height: 412 }}>
        <Tile
          cluster={anchor}
          rank={0}
          total={total}
          selected={selectedId === anchor.id}
          flexBasis={1}
          onSelect={onSelect}
        />
      </div>
    );
  }

  // Split the remainder into an upper row (the two next-largest) and a lower
  // row (the rest), mirroring the design's 7/3 vertical split.
  const upper = rest.slice(0, 2);
  const lower = rest.slice(2);
  const upperWeight = upper.reduce((a, c) => a + c.weight, 0);
  const lowerWeight = lower.reduce((a, c) => a + c.weight, 0) || 1;

  return (
    <div className="flex" style={{ gap: 8, height: 412 }}>
      <Tile
        cluster={anchor}
        rank={0}
        total={total}
        selected={selectedId === anchor.id}
        flexBasis={Math.max(4, anchor.weight)}
        onSelect={onSelect}
      />
      <div
        className="flex flex-col"
        style={{ flex: `${String(Math.max(6, upperWeight + lowerWeight))} 1 0`, minWidth: 0, gap: 8 }}
      >
        <div className="flex" style={{ flex: 7, minHeight: 0, gap: 8 }}>
          {upper.map((c, i) => (
            <Tile
              key={c.id}
              cluster={c}
              rank={i + 1}
              total={total}
              selected={selectedId === c.id}
              flexBasis={Math.max(3, c.weight)}
              onSelect={onSelect}
            />
          ))}
        </div>
        {lower.length > 0 ? (
          <div className="flex" style={{ flex: 3, minHeight: 0, gap: 8 }}>
            {lower.map((c, i) => (
              <Tile
                key={c.id}
                cluster={c}
                rank={upper.length + i + 1}
                total={total}
                selected={selectedId === c.id}
                flexBasis={Math.max(1, c.weight)}
                onSelect={onSelect}
                compact
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
