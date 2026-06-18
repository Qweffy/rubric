"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";

export interface CaseNotFoundViewProps {
  suiteId: string;
  runId: string;
}

/**
 * NOT-FOUND state — the case id isn't in this run. Mirrors the handoff's
 * "No such case" empty frame with a back-to-run link.
 */
export function CaseNotFoundView({ suiteId, runId }: CaseNotFoundViewProps): ReactNode {
  return (
    <div
      className="hr-void flex items-center justify-center"
      style={{ minHeight: "100%", padding: 24 }}
    >
      <div
        className="mx-auto flex flex-col items-center text-center"
        style={{ gap: 8, padding: "40px 24px", maxWidth: 380 }}
      >
        <div style={{ marginBottom: 14, opacity: 0.92 }}>
          <RubricIllustration name="empty-board" size={120} />
        </div>
        <h3
          style={{
            font: "var(--text-h3)",
            letterSpacing: "var(--tracking-display)",
            color: "var(--text-hi)",
          }}
        >
          No such case
        </h3>
        <p className="m-0" style={{ font: "var(--text-sm)", color: "var(--text-body)" }}>
          That case id isn&apos;t in run #{runId}.
        </p>
        <div style={{ marginTop: 14 }}>
          <Link
            href={`/suites/${suiteId}/runs/${runId}`}
            className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap no-underline"
            style={{
              height: 36,
              gap: 8,
              padding: "0 14px",
              font: "600 13px/1 var(--font-ui)",
              color: "var(--text-hi)",
              background: "transparent",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-control)",
            }}
          >
            <span style={{ font: "600 14px/1 var(--font-mono)" }}>‹</span>
            Back to run
          </Link>
        </div>
      </div>
    </div>
  );
}
