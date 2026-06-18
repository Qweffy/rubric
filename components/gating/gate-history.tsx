"use client";

import { type GateHistoryEvent } from "@/components/gating/ci-gating-view";
import { SectionLabel } from "@/components/ui/section-label";


const KIND_SPEC = {
  block: {
    color: "var(--red)",
    bg: "var(--red-14)",
    border: "color-mix(in srgb, var(--red) 40%, transparent)",
    glow: "var(--glow-red)",
    label: "BLOCK",
  },
  pass: {
    color: "var(--phosphor)",
    bg: "var(--phosphor-08)",
    border: "color-mix(in srgb, var(--phosphor) 40%, transparent)",
    glow: undefined,
    label: "PASS",
  },
  override: {
    color: "var(--amber)",
    bg: "var(--amber-08)",
    border: "color-mix(in srgb, var(--amber) 40%, transparent)",
    glow: undefined,
    label: "OVERRIDE",
  },
} as const;

function EventBadge({ kind }: { kind: GateHistoryEvent["kind"] }) {
  const s = KIND_SPEC[kind];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 11px",
        font: "700 9.5px/1 var(--font-mono)",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export interface GateHistoryProps {
  events: GateHistoryEvent[];
}

/**
 * GATE HISTORY — the recent-events ledger as a vertical timeline. Each row pairs
 * a kind dot + badge with the event text and a mono "actor · when" readout.
 * Override events stay visible here, never hidden (the audit-trail invariant).
 */
export function GateHistory({ events }: GateHistoryProps) {
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
        className="flex items-center justify-between gap-3"
        style={{ padding: "11px 16px", borderBottom: "1px solid var(--divider)" }}
      >
        <SectionLabel style={{ color: "var(--text-mid)" }}>GATE HISTORY</SectionLabel>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          recent events
        </span>
      </div>
      <div style={{ position: "relative", padding: "14px 18px" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 25,
            top: 18,
            bottom: 18,
            width: 1,
            background: "var(--divider)",
          }}
        />
        <div className="flex flex-col" style={{ gap: 14 }}>
          {events.map((event, i) => {
            const s = KIND_SPEC[event.kind];
            const when =
              event.actor.length > 0 ? `${event.actor} · ${event.when}` : event.when;
            return (
              <div
                key={`${event.kind}-${event.pr}-${i}`}
                className="flex items-center"
                style={{ gap: 14, position: "relative" }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: s.color,
                    boxShadow: s.glow,
                    flex: "none",
                    zIndex: 1,
                  }}
                />
                <EventBadge kind={event.kind} />
                <span className="mono" style={{ fontSize: 12, color: "var(--text-mid)" }}>
                  #{event.pr} {event.text}
                </span>
                <span style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
                  {when}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
