"use client";

import { useEffect, useState } from "react";

const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3);

/**
 * Counts from 0 up to `target` with an ease-out curve on mount (and whenever
 * `target` changes). Snaps straight to `target` under prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 600): number {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf = 0;
    let start: number | null = null;
    const step = (t: number): void => {
      if (reduced) {
        setShown(target);
        return;
      }
      start ??= t;
      const p = Math.min(1, (t - start) / durationMs);
      setShown(Math.round(target * easeOutCubic(p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    // All setState calls happen inside rAF callbacks — never synchronously
    // in the effect body (react-hooks/set-state-in-effect).
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return shown;
}
