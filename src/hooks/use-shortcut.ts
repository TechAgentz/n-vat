"use client";

import { useEffect, useRef } from "react";

export type ShortcutConfig = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  key: string; // e.g. "n"
};

export const DEFAULT_CONVERT_SHORTCUT: ShortcutConfig = { ctrl: true, alt: true, shift: true, key: "n" };

export function formatShortcut(s: ShortcutConfig) {
  const parts: string[] = [];
  if (s.ctrl) parts.push("Ctrl");
  if (s.alt) parts.push("Alt");
  if (s.shift) parts.push("Shift");
  if (s.meta) parts.push("Meta");
  parts.push(s.key.toUpperCase());
  return parts.join(" + ");
}

/**
 * Global keyboard shortcut hook.
 * - Requires all four modifier/key conditions to match SIMULTANEOUSLY (single keydown event).
 * - Uses `event.repeat` guard so held keys don't fire repeatedly.
 * - preventDefault + stopPropagation to swallow the browser default.
 * - Ignores when focus is in a text input/textarea unless allowInInputs is true.
 */
export function useShortcut(
  shortcut: ShortcutConfig,
  handler: (e: KeyboardEvent) => void,
  opts?: { allowInInputs?: boolean; enabled?: boolean }
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (opts?.enabled === false) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!!shortcut.ctrl !== e.ctrlKey) return;
      if (!!shortcut.alt !== e.altKey) return;
      if (!!shortcut.shift !== e.shiftKey) return;
      if (!!shortcut.meta !== e.metaKey) return;
      if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) return;

      const target = e.target as HTMLElement | null;
      if (!opts?.allowInInputs && target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      e.preventDefault();
      e.stopPropagation();
      handlerRef.current(e);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true } as any);
  }, [shortcut.ctrl, shortcut.alt, shortcut.shift, shortcut.meta, shortcut.key, opts?.allowInInputs, opts?.enabled]);
}

const STORAGE_KEY = "nvat.convertShortcut";

export function loadShortcut(): ShortcutConfig {
  if (typeof window === "undefined") return DEFAULT_CONVERT_SHORTCUT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONVERT_SHORTCUT;
    const parsed = JSON.parse(raw) as ShortcutConfig;
    if (!parsed?.key) return DEFAULT_CONVERT_SHORTCUT;
    return parsed;
  } catch { return DEFAULT_CONVERT_SHORTCUT; }
}

export function saveShortcut(s: ShortcutConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
