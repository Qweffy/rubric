"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { SmallViewportNotice } from "@/components/shell/small-viewport-notice";

const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Subscribes to the desktop media query. Written with useSyncExternalStore so
 * the server snapshot (`false`) and the client snapshot agree without a
 * setState-in-effect, and the value updates live as the window is resized.
 */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// SSR has no viewport; assume non-desktop so the first client paint can only
// *gain* the heavy subtree, never flash it away.
function getServerSnapshot(): boolean {
  return false;
}

/**
 * `true` when the viewport is at least 1024px wide. SSR-safe (returns false on
 * the server and during the first paint), then resolves on mount and tracks
 * resizes. Use to keep the desktop-density console off small screens.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface DesktopGateProps {
  children: ReactNode;
}

/**
 * Renders `children` only at ≥1024px. Below that it renders the
 * SmallViewportNotice instead and never mounts the heavy console subtree — the
 * gate is a hard branch, not a CSS hide, so dense matrices / heatmaps never
 * mount on a phone.
 */
export function DesktopGate({ children }: DesktopGateProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <>{children}</> : <SmallViewportNotice />;
}
