import { useEffect, useSyncExternalStore } from "react";

/**
 * Lets a page override the title its layout renders in `AppHeader`.
 *
 * Layouts own the header, but some pages only know their real title at runtime
 * (a directory narrowed to a segment, a detail page waiting on its record). The
 * page publishes the title here and the layout reads it — no prop drilling
 * through the outlet.
 */
let title: string | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => title;

/** Read the current override — `undefined` when no page has set one. */
export const usePageHeaderTitleOverride = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/**
 * Publish `value` as the header title for as long as the calling page is
 * mounted. The override is dropped on unmount so the layout falls back to its
 * own title.
 */
export const usePageHeaderTitle = (value?: string) => {
  useEffect(() => {
    title = value;
    emit();
    return () => {
      title = undefined;
      emit();
    };
  }, [value]);
};
