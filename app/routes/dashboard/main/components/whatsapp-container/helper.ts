import type {
  SwaHistoryMessage,
  SwaHistoryResponse,
  SwaIntentCode,
  SwaMessageData,
} from "~/services/SwaService";

/** A run of text where some words carry emphasis (amounts, counts, names). */
export type ChatText = { text: string; bold?: boolean }[];

/** Accent rail on an incoming bubble — see `.wa-bubble-*` in dashboard-home.css. */
export type BubbleTone = "brief" | "plain" | "recommend" | "tip";

/** Accent rail on an action card — see `.wa-card-*`. */
export type CardTone = "warning" | "violet" | "primary";

export type ChatCard = {
  key: string;
  emoji: string;
  title: string;
  meta: string;
  tone: CardTone;
  /** Where the row's arrow leads. */
  to: string;
};

export type ChatReply = {
  key: string;
  label: string;
  /** Solid replies are the recommended action; the rest are outlined. */
  variant: "solid" | "outline";
  /** Text sent to Swa when the chip is tapped. */
  send: string;
};

export type ChatItem =
  /** Date pill in the middle of the thread ("TODAY · MONDAY, 17 AUG"). */
  | { type: "divider"; key: string; label: string; day: string }
  | {
      type: "message";
      key: string;
      /** `in` is Swa, `out` is the shop owner. */
      direction: "in" | "out";
      /** Ignored for outgoing bubbles — they carry no rail. */
      tone?: BubbleTone;
      /** Small caps line above the headline ("KING COINS"). */
      eyebrow?: string;
      /** Serif display line. */
      headline?: string;
      body?: ChatText;
      time: string;
      /** Blue double tick. */
      read?: boolean;
    }
  | { type: "cards"; key: string; cards: ChatCard[] }
  | { type: "replies"; key: string; replies: ChatReply[] };

/** Header identity — fixed, the thread itself comes from the API. */
export const chatIdentity = {
  title: "Swa",
  avatarMark: "S",
  tagline: "your AI business partner",
  composerPlaceholder: "Ask Swa anything…",
};

/**
 * How each intent dresses its bubble: the rail tone, the small-caps line above
 * the answer, and the screen the follow-up card opens. Open-ended answers
 * (`intentCode: null`) get none of it and render as a plain bubble.
 */
const INTENT_PRESENTATION: Record<
  Exclude<SwaIntentCode, null>,
  { tone: BubbleTone; eyebrow: string; card: Omit<ChatCard, "key"> }
> = {
  LOYALTY_BALANCE: {
    tone: "brief",
    eyebrow: "King Coins",
    card: {
      emoji: "🪙",
      title: "Coin economy",
      meta: "Earnings, redemptions and coin deals",
      tone: "primary",
      to: "/products/coin-economy",
    },
  },
  BILLING_DUES: {
    tone: "recommend",
    eyebrow: "Billing dues",
    card: {
      emoji: "🧾",
      title: "PayLater dues",
      meta: "Collect what is pending",
      tone: "warning",
      to: "/dashboard/paylater",
    },
  },
  ORDER_STATUS: {
    tone: "tip",
    eyebrow: "Order status",
    card: {
      emoji: "📦",
      title: "Orders",
      meta: "Track and process open orders",
      tone: "violet",
      to: "/dashboard/orders/list",
    },
  },
};

/** "06:52" in the shop's local time — the stamp under every bubble. */
export const chatTime = (date: Date = new Date()): string =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** "Monday, 17 Aug" — the date part of a day pill. */
const dayDate = (date: Date): string =>
  date.toLocaleDateString([], {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

/** How many days back `date` is from today, at day granularity. */
const daysAgo = (date: Date): number => {
  const startOf = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  return Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);
};

/**
 * "Today · Monday, 17 Aug" — the pill above a day's messages. Replayed history
 * can be older, so the two most recent days are named and the rest carry the
 * date alone.
 */
export const chatDayLabel = (date: Date = new Date()): string => {
  const gap = daysAgo(date);
  const prefix = gap === 0 ? "Today · " : gap === 1 ? "Yesterday · " : "";

  return prefix + dayDate(date);
};

/** Calendar day of a date, for matching dividers across pages. */
const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

let sequence = 0;
const nextKey = (prefix: string) => `${prefix}-${++sequence}`;

/** The retailer's own message, shown the moment it is typed. */
export const buildOutgoingItem = (text: string): ChatItem => ({
  type: "message",
  key: nextKey("out"),
  direction: "out",
  body: [{ text }],
  time: chatTime(),
  read: false,
});

/**
 * Swa's answer as thread rows: the bubble, dressed by intent, plus the card
 * that opens the screen the answer is about.
 */
export const buildIncomingItems = (
  message: Pick<SwaMessageData, "reply" | "intentCode">,
  at: Date = new Date(),
): ChatItem[] => {
  const presentation = message.intentCode
    ? INTENT_PRESENTATION[message.intentCode]
    : undefined;

  const bubble: ChatItem = {
    type: "message",
    key: nextKey("in"),
    direction: "in",
    tone: presentation?.tone ?? "plain",
    eyebrow: presentation?.eyebrow,
    body: [{ text: message.reply }],
    time: chatTime(at),
    read: true,
  };

  if (!presentation) return [bubble];

  return [
    bubble,
    {
      type: "cards",
      key: nextKey("cards"),
      cards: [{ ...presentation.card, key: nextKey("card") }],
    },
  ];
};

/** The opening row of the thread — the date pill and Swa's greeting. */
export const buildOpeningItems = (): ChatItem[] => [
  {
    type: "divider",
    key: nextKey("divider"),
    label: chatDayLabel(),
    day: dayKey(new Date()),
  },
  {
    type: "message",
    key: nextKey("in"),
    direction: "in",
    tone: "plain",
    body: [
      {
        text: "Hi! Ask me about your King Coins, your dues or any order — I am here all day.",
      },
    ],
    time: chatTime(),
    read: true,
  },
  {
    type: "replies",
    key: nextKey("replies"),
    replies: [
      {
        key: nextKey("reply"),
        label: "What's my balance?",
        variant: "solid",
        send: "whats my balance",
      },
      {
        key: nextKey("reply"),
        label: "Any dues pending?",
        variant: "outline",
        send: "any dues pending",
      },
      {
        key: nextKey("reply"),
        label: "Order status",
        variant: "outline",
        send: "what is my order status",
      },
    ],
  },
];

/** Shown in place of an answer when the send fails. */
export const buildErrorItem = (): ChatItem => ({
  type: "message",
  key: nextKey("err"),
  direction: "in",
  tone: "plain",
  body: [{ text: "I could not reach the server just now. Please try again." }],
  time: chatTime(),
  read: true,
});

/** Same calendar day — decides where a divider goes between two turns. */
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Whether the server says there is another page. Servers that send neither
 * hint leave it to the caller — a page that comes back empty is the end.
 */
export const historyHasMore = (
  data: SwaHistoryResponse["data"],
  loaded: number,
): boolean | undefined => {
  if (Array.isArray(data)) return undefined;
  if (typeof data?.hasMore === "boolean") return data.hasMore;
  if (typeof data?.total === "number") return loaded < data.total;

  return undefined;
};

/** The turn count the server reports, when it reports one. */
export const historyTotal = (
  data: SwaHistoryResponse["data"],
): number | undefined =>
  !Array.isArray(data) && typeof data?.total === "number"
    ? data.total
    : undefined;

/** Unwraps the history payload, which is either bare or `{ messages }`. */
export const historyMessages = (data: SwaHistoryResponse["data"]) =>
  Array.isArray(data) ? data : (data?.messages ?? []);

/**
 * One stored turn as a thread row. The side comes from `direction` or `role`,
 * the text from whichever of `text`/`message`/`reply` the server filled in, and
 * the stamp from the turn's own time rather than now.
 */
const buildHistoryItems = (
  message: SwaHistoryMessage,
  at: Date,
): ChatItem[] => {
  const text = (message.text ?? message.message ?? message.reply ?? "").trim();
  if (!text) return [];

  const isOut =
    message.direction === "out" ||
    message.role === "user" ||
    message.role === "customer";

  if (isOut)
    return [
      {
        type: "message",
        key: nextKey("out"),
        direction: "out",
        body: [{ text }],
        time: chatTime(at),
        read: true,
      },
    ];

  return buildIncomingItems(
    { reply: text, intentCode: message.intentCode ?? null },
    at,
  );
};

/**
 * The stored thread as rows, oldest first, with a day pill wherever the date
 * changes. An empty history falls back to the greeting so the chat is never
 * blank on open.
 */
export const buildHistoryThread = (
  data: SwaHistoryResponse["data"],
): ChatItem[] => {
  const messages = historyMessages(data);
  if (!messages.length) return buildOpeningItems();

  const items: ChatItem[] = [];
  let previous: Date | null = null;

  messages.forEach((message) => {
    const stamp = message.createdAt ?? message.timestamp;
    const at = stamp ? new Date(stamp) : new Date();
    const dated = !isNaN(at.getTime()) ? at : new Date();

    if (!previous || !isSameDay(previous, dated)) {
      items.push({
        type: "divider",
        key: nextKey("divider"),
        label: chatDayLabel(dated),
        day: dayKey(dated),
      });
      previous = dated;
    }

    items.push(...buildHistoryItems(message, dated));
  });

  return items;
};

/**
 * Puts an older page in front of the thread. Both pages open their first day
 * with a pill, so when the page ends on the day the thread already opens with,
 * the thread's own pill is dropped — the older page's one now heads that day.
 */
export const prependOlderThread = (
  older: ChatItem[],
  current: ChatItem[],
): ChatItem[] => {
  const lastOlderDay = older
    .filter((item) => item.type === "divider")
    .at(-1)?.day;
  const firstDivider = current.findIndex((item) => item.type === "divider");
  const duplicate =
    firstDivider !== -1 &&
    (current[firstDivider] as { day: string }).day === lastOlderDay;

  return [
    ...older,
    ...(duplicate
      ? current.filter((_, index) => index !== firstDivider)
      : current),
  ];
};
