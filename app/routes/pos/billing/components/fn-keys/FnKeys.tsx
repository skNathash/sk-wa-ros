import { useEffect, useRef } from "react";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";

export type FnKeyItem = {
  /** The physical key, spelled exactly as `KeyboardEvent.key` reports it. */
  key: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /**
   * Voice is the one action that can't be fired by calling a handler — the
   * dictation sheet lives inside VoiceSearch's own button. Items marked this
   * way render that button in place, and the shortcut clicks it.
   */
  voice?: { callback: (arg: { action: string; data?: any }) => void };
};

type Props = {
  items: FnKeyItem[];
};

/**
 * Till function keys. The row under the scan rail is both the legend an
 * operator reads once and the buttons a mouse can still reach — every entry is
 * a real control, so nothing here is a shortcut the UI can't otherwise do.
 */
const FnKeys = ({ items }: Props) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Bound once: the handler reads the live list off the ref, so re-renders
  // (cart count, window count) never rebind the listener.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const item = itemsRef.current.find((i) => i.key === e.key);
      if (!item) return;
      e.preventDefault();
      if (item.disabled) return;
      if (item.voice) {
        rowRef.current
          ?.querySelector<HTMLButtonElement>(".app-fnkey-voice")
          ?.click();
        return;
      }
      item.onPress?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div ref={rowRef} className="app-fnkeys" role="toolbar" aria-label="Function keys">
      {items.map((item) => {
        const body = (
          <>
            <kbd className="app-fnkey-cap">{item.key}</kbd>
            <span className="app-fnkey-label">{item.label}</span>
          </>
        );

        if (item.voice) {
          return (
            <VoiceSearch
              key={item.key}
              callback={item.voice.callback}
              className="app-fnkey app-fnkey-voice"
            >
              {body}
            </VoiceSearch>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            className="app-fnkey"
            onClick={item.onPress}
            disabled={item.disabled}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
};

export default FnKeys;
