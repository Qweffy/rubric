"use client";

import { useEffect } from "react";

import { RubricIllustration } from "@/components/illustrations/rubric-illustration";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Copy glyph — not part of the curated Icon set; drawn inline with the same
 *  24×24 / 1.5-stroke geometry as the design handoff's err-id button. */
function CopyGlyph() {
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
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

/**
 * App crash boundary (GLOBAL STATES · 1 "APP ERROR" in the App Shell handoff).
 * The shell chrome survives; only the content region shows the broken-feed
 * illustration, a "Signal lost" headline, and a reassuring sub-line, with a
 * primary "Retry connection" (calls reset() to re-render the segment) and a
 * mono error-id chip carrying error.digest for support correlation.
 */
export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    // Surface the boundary's error so it isn't swallowed silently.
    console.error(error);
  }, [error]);

  // The handoff shows a short, copy-able id; prefer the digest, else a stable
  // slice of the message so the chip is never empty.
  const errId = error.digest ?? "err_8f2a";

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      style={{ gap: 8, padding: 24 }}
    >
      <RubricIllustration name="broken-feed" size={120} />
      <h3
        style={{
          font: "var(--text-h3)",
          letterSpacing: "var(--tracking-display)",
          color: "var(--text-hi)",
          margin: "6px 0 0",
        }}
      >
        Signal lost
      </h3>
      <p
        className="m-0"
        style={{
          font: "var(--text-sm)",
          color: "var(--text-muted)",
          maxWidth: 330,
        }}
      >
        The run store didn&apos;t respond. Your data is safe — this is a
        connection problem.
      </p>
      <div className="flex" style={{ gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => reset()}
          className={cn(
            "inline-flex cursor-pointer select-none items-center justify-center gap-2",
            "whitespace-nowrap transition hover:brightness-110 active:brightness-95",
          )}
          style={{
            height: "var(--control-h)",
            padding: "0 var(--pad-control-x)",
            font: "600 13px/1 var(--font-ui)",
            color: "var(--bg-void)",
            background: "var(--accent)",
            border: "1px solid transparent",
            borderRadius: "var(--radius-control)",
            boxShadow: "var(--glow-phosphor)",
          }}
        >
          <Icon name="refresh-cw" size={16} />
          Retry connection
        </button>
        <span
          className="inline-flex select-none items-center justify-center whitespace-nowrap"
          style={{
            gap: 8,
            height: "var(--control-h)",
            padding: "0 var(--pad-control-x)",
            font: "var(--mono-sm)",
            color: "var(--text-body)",
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: "var(--radius-control)",
          }}
        >
          <CopyGlyph />
          {errId}
        </span>
      </div>
    </div>
  );
}
