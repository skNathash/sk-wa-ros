import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import SwaService, { type SwaStreamMessage } from "~/services/SwaService";
import ChatComposer from "./components/ChatComposer";
import ChatHeader from "./components/ChatHeader";
import ChatRow from "./components/ChatRow";
import TypingRow from "./components/TypingRow";
import {
  buildErrorItem,
  buildHistoryThread,
  buildIncomingItems,
  buildOpeningItems,
  buildOutgoingItem,
  chatIdentity,
  historyHasMore,
  historyMessages,
  historyTotal,
  prependOlderThread,
  type ChatItem,
} from "./helper";

/** Turns of the stored thread fetched per page, on open and on scroll-up. */
const HISTORY_LIMIT = 10;

/**
 * Swa, the shop's assistant, as a WhatsApp-style thread. What the retailer
 * types goes to `POST swa/message` and the reply comes straight back on that
 * call; the `swa/stream` connection stays open alongside it for the alerts Swa
 * raises on its own. It is the whole screen on mobile and the side pane on
 * desktop (see {@link HomeSidePane}); the chat surface itself is styled in
 * `app/styles/dashboard-home.css` under `.wa-*`.
 */
const WhatsappContainer = () => {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [connected, setConnected] = useState(false);
  /**
   * Turns pulled in so far against what there is to pull — what the load-more
   * row at the top of the transcript counts down. The server rarely sends a
   * total, so one more page is assumed while it says there is more.
   */
  const [paging, setPaging] = useState({ loaded: 0, total: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /** Turns already pulled in — the offset the next page starts at. */
  const loadedRef = useRef(0);
  /** False once a page comes back short, so scrolling up stops asking. */
  const hasOlderRef = useRef(true);
  const loadingOlderRef = useRef(false);
  /** Transcript height before an older page went in, to hold the view still. */
  const heldHeightRef = useRef<number | null>(null);
  // Read inside `send` so the callback stays stable and the memoised rows and
  // composer are not re-rendered every time a send starts or finishes.
  const sendingRef = useRef(false);

  /**
   * The element that actually scrolls. It belongs to {@link AppScrollArea}, so
   * it is reached through the transcript rather than held as a ref of its own.
   */
  const viewport = useCallback(
    () =>
      contentRef.current?.closest<HTMLDivElement>(
        "[data-slot=scroll-area-viewport]",
      ) ?? null,
    [],
  );

  /**
   * One page of stored turns, oldest-first, put in front of the thread. The
   * page that comes back short is the last one there is.
   */
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current || !hasOlderRef.current) return;

    loadingOlderRef.current = true;
    const first = loadedRef.current === 0;
    if (!first) setLoadingOlder(true);

    const { statusCode, data } = await SwaService.getHistory(
      HISTORY_LIMIT,
      loadedRef.current,
    );
    const messages =
      statusCode === 200 && data?.success ? historyMessages(data.data) : [];

    loadedRef.current += messages.length;
    // A short page is not the end on its own — servers cap pages for their own
    // reasons. Only an empty page, or the server saying so, stops the paging.
    hasOlderRef.current =
      historyHasMore(data?.data, loadedRef.current) ?? messages.length > 0;

    setPaging({
      loaded: loadedRef.current,
      total:
        historyTotal(data?.data) ??
        loadedRef.current + (hasOlderRef.current ? HISTORY_LIMIT : 0),
    });

    if (messages.length) {
      // Anything typed meanwhile stays where it is — the page goes in front of
      // the thread, never over it.
      heldHeightRef.current = first ? null : (viewport()?.scrollHeight ?? null);
      const older = buildHistoryThread(data.data);
      setItems((current) => prependOlderThread(older, current));
    } else if (first) {
      // Nothing stored yet (or the call failed) — open on the greeting.
      setItems((current) => [...buildOpeningItems(), ...current]);
    }

    loadingOlderRef.current = false;
    setLoadingOlder(false);
    if (first) setLoading(false);
  }, [viewport]);

  useEffect(() => {
    loadOlder();
  }, [loadOlder]);

  // Proactive alerts — anything Swa raises without being asked lands here.
  useEffect(() => {
    const close = SwaService.openStream({
      onConnected: () => setConnected(true),
      onMessage: (message: SwaStreamMessage) =>
        setItems((current) => [
          ...current,
          ...buildIncomingItems({
            reply: message.text,
            intentCode: message.intentCode ?? null,
          }),
        ]),
      onError: () => setConnected(false),
    });

    return close;
  }, []);

  // New rows stick the thread to the bottom; an older page instead keeps the
  // message the retailer was reading exactly where it was, by giving back the
  // height the page just added.
  useLayoutEffect(() => {
    const scroller = viewport();
    const held = heldHeightRef.current;

    if (scroller && held !== null) {
      scroller.scrollTop += scroller.scrollHeight - held;
      heldHeightRef.current = null;
      return;
    }

    bottomRef.current?.scrollIntoView({
      behavior: loading ? "auto" : "smooth",
      block: "end",
    });
  }, [items, sending, loading, viewport]);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message || sendingRef.current) return;

    setItems((current) => [...current, buildOutgoingItem(message)]);
    sendingRef.current = true;
    setSending(true);

    const { statusCode, data } = await SwaService.sendMessage(message);

    setItems((current) => [
      ...current,
      ...(statusCode === 200 && data?.success && data.data?.reply
        ? buildIncomingItems(data.data)
        : [buildErrorItem()]),
    ]);
    sendingRef.current = false;
    setSending(false);
  }, []);

  return (
    <div className="wa-chat tw:flex tw:flex-col tw:overflow-hidden">
      <ChatHeader connected={connected} sending={sending} />

      {/* Transcript — the only scrolling part, so the header and composer stay
          pinned whichever surface the chat is rendered on. */}
      <AppScrollArea className="wa-chat-body tw:min-h-0 tw:flex-1">
        <div ref={contentRef} className="tw:space-y-2 tw:p-3">
          {/* Older turns sit above, so the loader does too — reaching the top
              of the thread is what pulls in the page before it. */}
          {!loading && paging.loaded < paging.total && (
            <LoadMoreButton
              loadMore={loadOlder}
              loading={loadingOlder}
              loadedCount={paging.loaded}
              totalCount={paging.total}
            />
          )}
          {loading && <TypingRow avatarMark={chatIdentity.avatarMark} />}
          {items.map((item) => (
            <ChatRow
              key={item.key}
              item={item}
              avatarMark={chatIdentity.avatarMark}
              onReply={send}
            />
          ))}
          {sending && <TypingRow avatarMark={chatIdentity.avatarMark} />}
          <div ref={bottomRef} />
        </div>
      </AppScrollArea>

      <ChatComposer sending={sending} onSend={send} />
    </div>
  );
};

export default WhatsappContainer;
