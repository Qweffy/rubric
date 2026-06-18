import Link from "next/link";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";

/** Left chevron — the curated Icon set carries only chevron-right/-down; this
 *  mirrors the design's "Back to Suites" affordance with the same geometry. */
function ChevronLeftGlyph() {
  return (
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
      style={{ display: "block" }}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/**
 * 404 boundary (GLOBAL STATES · 5 "NOT FOUND" in the App Shell handoff). Caught
 * by notFound() in a page or an unmatched route under (app); the shell chrome
 * survives, and only the content region shows the not-found-404 illustration,
 * a "No such run" headline, and a secondary "Back to Suites" link.
 */
export default function AppNotFound() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      style={{ gap: 8, padding: 24 }}
    >
      <RubricIllustration name="not-found-404" size={140} />
      <h3
        style={{
          font: "var(--text-h3)",
          letterSpacing: "var(--tracking-display)",
          color: "var(--text-hi)",
          margin: "6px 0 0",
        }}
      >
        No such run
      </h3>
      <p
        className="m-0"
        style={{
          font: "var(--text-sm)",
          color: "var(--text-muted)",
          maxWidth: 320,
        }}
      >
        Run #9999 isn&apos;t in the store. It may have been pruned or never
        existed.
      </p>
      <Link
        href="/suites"
        className="inline-flex select-none items-center justify-center gap-2 whitespace-nowrap no-underline transition hover:bg-[color-mix(in_srgb,var(--phosphor)_8%,transparent)]"
        style={{
          marginTop: 12,
          height: "var(--control-h)",
          padding: "0 var(--pad-control-x)",
          font: "600 13px/1 var(--font-ui)",
          color: "var(--text-hi)",
          background: "transparent",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-control)",
        }}
      >
        <ChevronLeftGlyph />
        Back to Suites
      </Link>
    </div>
  );
}
