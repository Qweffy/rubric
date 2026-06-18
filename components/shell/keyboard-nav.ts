"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { ALL_NAV_ITEMS } from "@/components/shell/nav-items";

/**
 * RowNavContext — the bridge between the global key handler (mounted once in the
 * shell) and whichever list view is on screen. A list view calls
 * `useRowNavRegistration()` to register its ordered row refs; the shell's
 * `useKeyboardNav()` drives j / k (move), ↵ (open) and esc (clear) against the
 * registered set. Only one list registers at a time — the active view wins.
 */
export interface RowNavRegistration {
  /** Ordered DOM nodes for the current list's rows, top to bottom. */
  rows: HTMLElement[];
  /** Open / activate the row at `index` (e.g. push its route, open a drawer). */
  onOpen: (index: number) => void;
}

export interface RowNavContextValue {
  /** Index of the j/k-highlighted row, or -1 when nothing is focused. */
  activeRow: number;
  /** Register the active list. Returns an unregister cleanup for useEffect. */
  register: (registration: RowNavRegistration) => () => void;
  /** Move the highlight by `delta` rows, clamped to the registered range. */
  moveRow: (delta: number) => void;
  /** Set the highlight to an explicit row index (e.g. on hover / focus). */
  setActiveRow: (index: number) => void;
  /** Open the currently highlighted row, if any. */
  openActiveRow: () => void;
  /** Clear the highlight (esc with no drawer/palette open). */
  clearActiveRow: () => void;
}

const RowNavContext = createContext<RowNavContextValue | null>(null);

/**
 * Builds the RowNavContext value. Mounted once by the shell and provided to the
 * whole content subtree. List views consume it via `useRowNavRegistration`.
 */
export function useRowNavController(): RowNavContextValue {
  const registrationRef = useRef<RowNavRegistration | null>(null);
  const [activeRow, setActiveRow] = useState(-1);

  const register = useCallback((registration: RowNavRegistration) => {
    registrationRef.current = registration;
    setActiveRow(-1);
    return () => {
      if (registrationRef.current === registration) {
        registrationRef.current = null;
        setActiveRow(-1);
      }
    };
  }, []);

  const moveRow = useCallback((delta: number) => {
    const registration = registrationRef.current;
    if (registration === null || registration.rows.length === 0) return;
    setActiveRow((current) => {
      const max = registration.rows.length - 1;
      const next =
        current < 0
          ? delta > 0
            ? 0
            : max
          : Math.min(max, Math.max(0, current + delta));
      registration.rows[next]?.scrollIntoView({ block: "nearest" });
      return next;
    });
  }, []);

  const openActiveRow = useCallback(() => {
    const registration = registrationRef.current;
    if (registration === null) return;
    setActiveRow((current) => {
      if (current >= 0 && current < registration.rows.length) {
        registration.onOpen(current);
      }
      return current;
    });
  }, []);

  const clearActiveRow = useCallback(() => setActiveRow(-1), []);

  return useMemo(
    () => ({
      activeRow,
      register,
      moveRow,
      setActiveRow,
      openActiveRow,
      clearActiveRow,
    }),
    [activeRow, register, moveRow, openActiveRow, clearActiveRow],
  );
}

/** Read the RowNavContext. Returns null outside the shell. */
export function useRowNav(): RowNavContextValue | null {
  return useContext(RowNavContext);
}

export const RowNavProvider = RowNavContext.Provider;

export { RowNavContext };

/** True when focus is inside a text input — global chords stay quiet there. */
export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  );
}

/** "g x" go-chords, derived from the nav model so they never drift from it. */
const GO_CHORDS: Record<string, string> = Object.fromEntries(
  ALL_NAV_ITEMS.flatMap((item) => {
    const key = item.hint.startsWith("g ") ? item.hint.slice(2) : null;
    return key === null ? [] : [[key, item.href] as const];
  }),
);

/** How long a "g" prefix stays armed before it disarms itself. */
const CHORD_WINDOW_MS = 1200;

export interface KeyboardNavOptions {
  /** Toggle the ⌘K command palette open/closed. */
  onTogglePalette: () => void;
  /** True while the palette (or any modal owning esc) is open. */
  paletteOpen: boolean;
  /** Close the palette — esc routes here first when it is open. */
  onClosePalette: () => void;
  /** Row-nav controller from `useRowNavController`. */
  rowNav: RowNavContextValue;
}

/**
 * Global shell key handler. Wire once in the shell:
 *   - ⌘K / Ctrl-K toggles the command palette
 *   - g-chords (g s / g r / g t …) navigate, derived from the nav model
 *   - j / k move the row highlight, ↵ opens it, esc clears it
 *   - esc closes the palette first when it is open
 * Chords never fire while typing or while the palette is open. The palette owns
 * its own ↑/↓/↵/esc internally, so this handler steps aside for those while open.
 */
export function useKeyboardNav({
  onTogglePalette,
  paletteOpen,
  onClosePalette,
  rowNav,
}: KeyboardNavOptions): void {
  const router = useRouter();
  const chordArmed = useRef(false);
  const chordTimer = useRef<number | null>(null);

  const { moveRow, openActiveRow, clearActiveRow } = rowNav;

  useEffect(() => {
    const disarm = () => {
      chordArmed.current = false;
      if (chordTimer.current !== null) {
        window.clearTimeout(chordTimer.current);
        chordTimer.current = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        disarm();
        onTogglePalette();
        return;
      }

      // While the palette is open it owns the keyboard (↑/↓/↵/esc); only stay
      // out of its way here.
      if (paletteOpen) {
        if (event.key === "Escape") onClosePalette();
        return;
      }

      // No bare-key handling while a modifier is held or focus is in an input.
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (chordArmed.current) {
        disarm();
        const target = GO_CHORDS[event.key];
        if (target !== undefined) {
          event.preventDefault();
          router.push(target);
        }
        return;
      }

      switch (event.key) {
        case "g":
          chordArmed.current = true;
          chordTimer.current = window.setTimeout(disarm, CHORD_WINDOW_MS);
          return;
        case "j":
          event.preventDefault();
          moveRow(1);
          return;
        case "k":
          event.preventDefault();
          moveRow(-1);
          return;
        case "Enter":
          openActiveRow();
          return;
        case "Escape":
          clearActiveRow();
          return;
        default:
          return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      disarm();
    };
  }, [
    router,
    onTogglePalette,
    paletteOpen,
    onClosePalette,
    moveRow,
    openActiveRow,
    clearActiveRow,
  ]);
}

/**
 * List-view side of row nav. Call from a "use client" list with a ref object
 * holding the ordered row-node array and an open handler; it registers them with
 * the shell for the lifetime of the component and returns the active row index so
 * the list can paint the j/k highlight. A no-op (returns -1) outside the shell.
 *
 * The ref object (not its `.current`) is passed in so the node array is only read
 * inside effects — never during the caller's render — keeping callers free of
 * render-time ref access. The number of rows is passed separately as a render
 * input so the registration effect re-runs when the set size changes (rows are
 * collected during commit, so by the time the effect runs the ref is current).
 */
export function useRowNavRegistration(
  rowsRef: RefObject<(HTMLElement | null)[]>,
  rowCount: number,
  onOpen: (index: number) => void,
): number {
  const rowNav = useRowNav();
  const onOpenRef = useRef(onOpen);

  // Keep the latest open handler in a ref so the registration effect doesn't
  // re-run (and re-register, resetting the highlight) when the closure changes.
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    if (rowNav === null) return;
    const presentRows = rowsRef.current.filter(
      (row): row is HTMLElement => row !== null,
    );
    if (presentRows.length === 0) return;
    return rowNav.register({
      rows: presentRows,
      onOpen: (index) => onOpenRef.current(index),
    });
    // rowsRef is stable; the node set is collected during commit and read here.
    // rowCount triggers re-registration when the visible row set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowNav, rowCount]);

  return rowNav?.activeRow ?? -1;
}
