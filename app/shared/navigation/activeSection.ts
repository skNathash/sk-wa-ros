import { useEffect, useState } from "react";
import type { SectionTabKey } from "~/types/CommonTypes";

/**
 * Window event broadcasting which top-level section is currently on screen.
 * `detail.sectionKey` is the active {@link SectionTabKey}, or `null` when no
 * section owns the page any more; `detail.tabKey` is the highlighted entry
 * inside that section's menu (see `SectionMenu`).
 */
export const ACTIVE_SECTION_EVENT = "app:active-section";

export interface ActiveSectionState {
  sectionKey: SectionTabKey | null;
  /** Key of the highlighted section-menu entry, when one is resolved. */
  tabKey?: string;
}

export type ActiveSectionEvent = CustomEvent<ActiveSectionState>;

/**
 * How many mounted section navs claim each key. A page can render the rail and
 * a drawer copy at once, so plain set/clear would drop the section as soon as
 * either one unmounts. Claims are keyed by section + tab so the two navs of the
 * same page collapse into one claim.
 */
const claims = new Map<string, number>();
const claimKey = (sectionKey: SectionTabKey, tabKey?: string) =>
  `${sectionKey}::${tabKey ?? ""}`;
const parseClaim = (key: string): ActiveSectionState => {
  const [sectionKey, tabKey] = key.split("::");
  return {
    sectionKey: sectionKey as SectionTabKey,
    tabKey: tabKey || undefined,
  };
};

let active: ActiveSectionState = { sectionKey: null };

const publish = (next: ActiveSectionState) => {
  if (active.sectionKey === next.sectionKey && active.tabKey === next.tabKey) {
    return;
  }
  active = next;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACTIVE_SECTION_EVENT, { detail: next }));
};

/** Latest broadcast section, for listeners that mount after the event fired. */
export const getActiveSection = () => active.sectionKey;

/** Latest broadcast section + highlighted tab. */
export const getActiveSectionState = () => active;

/**
 * Claim `sectionKey` (and, when known, the highlighted `tabKey`) as active.
 * Returns the matching release function.
 */
export const claimActiveSection = (
  sectionKey: SectionTabKey,
  tabKey?: string,
) => {
  const key = claimKey(sectionKey, tabKey);
  claims.set(key, (claims.get(key) ?? 0) + 1);
  publish({ sectionKey, tabKey });

  return () => {
    const remaining = (claims.get(key) ?? 1) - 1;
    if (remaining > 0) {
      claims.set(key, remaining);
      return;
    }
    claims.delete(key);
    // Another section nav may still be mounted (during a route transition both
    // the old and new page overlap) — fall back to it instead of clearing.
    if (active.sectionKey === sectionKey && active.tabKey === tabKey) {
      const next = claims.keys().next().value;
      publish(next ? parseClaim(next) : { sectionKey: null });
    }
  };
};

/**
 * Subscribes to {@link ACTIVE_SECTION_EVENT} and returns the section key the
 * currently mounted section nav (e.g. `SectionMenu`) is rendering.
 */
export const useActiveSection = () => useActiveSectionState().sectionKey;

/**
 * Same as {@link useActiveSection}, but also reports which entry of that
 * section's menu is highlighted — what the side panes title themselves after.
 */
export const useActiveSectionState = (): ActiveSectionState => {
  const [state, setState] = useState<ActiveSectionState>(getActiveSectionState);

  useEffect(() => {
    // The event may have fired before this listener attached.
    setState(getActiveSectionState());
    const onChange = (event: Event) =>
      setState((event as ActiveSectionEvent).detail ?? { sectionKey: null });
    window.addEventListener(ACTIVE_SECTION_EVENT, onChange);
    return () => window.removeEventListener(ACTIVE_SECTION_EVENT, onChange);
  }, []);

  return state;
};
