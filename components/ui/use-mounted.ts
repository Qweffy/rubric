"use client";

import { useSyncExternalStore } from "react";

// The store never changes, so subscribe is a no-op that returns an unsubscribe
// which itself does nothing. Written without an empty function literal to satisfy
// no-empty-function.
const unsubscribe = (): void => undefined;
const subscribe = (): (() => void) => unsubscribe;

/**
 * `true` once mounted on the client, `false` during SSR + the first paint.
 * Implemented with useSyncExternalStore so the client/server snapshots differ
 * without a setState-in-effect — the idiom the React Compiler / react-hooks v7
 * rule requires. Used to gate `createPortal(...)` in the tier-3 overlays, which
 * must not run on the server (no document.body) and must not mismatch hydration.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
