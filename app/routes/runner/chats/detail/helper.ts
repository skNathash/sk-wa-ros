/** Who the runner is talking to, and what that side is doing right now. */
export const CHAT_THREAD_HEADER = {
  name: "Sri Lakshmi Stores",
  avatarLbl: "SL",
  /** "online · Sridhar typing…" — presence and activity read as one line. */
  statusLbl: "online · Sridhar typing…",
};

/** Day caption above the first message of the run. */
export const CHAT_DAY_LBL = "Today";

export const CHAT_COMPOSER_LBL = "Message";

/** A plain message in the thread. Hardcoded until the runner API lands. */
export interface RunnerChatMessage {
  id: number;
  text: string;
  /** "7:42 AM" — the time under the bubble. */
  _timeLbl: string;
  /** True when the runner sent it — the bubble goes right and tinted. */
  _isOut: boolean;
}

export const CHAT_MESSAGES_MORNING: RunnerChatMessage[] = [
  {
    id: 1,
    text: "Good morning Ashok 🙏 — 4 orders today, first pickup 9 AM.",
    _timeLbl: "6:42 AM",
    _isOut: false,
  },
  {
    id: 2,
    text: "Good morning sir, on the way",
    _timeLbl: "6:44 AM",
    _isOut: true,
  },
  {
    id: 3,
    text: "CLB-4790 — Ashwini Rao — ₹350 COD",
    _timeLbl: "7:03 AM",
    _isOut: false,
  },
  { id: 4, text: "Delivered ✅", _timeLbl: "7:16 AM", _isOut: true },
  {
    id: 5,
    text: "👍👍 5-star from customer, thanks",
    _timeLbl: "7:20 AM",
    _isOut: false,
  },
];

/**
 * A job offered inside the thread. It is a message, not a screen of its own —
 * the store drops the run into the chat and the runner answers there.
 */
export const CHAT_JOB_CARD = {
  tagLbl: "New pickup",
  storeName: "Green Leaf Cafe",
  _placeLbl: "Kumbalgudu",
  _distanceLbl: "0.9 km",
  orderCode: "CLB-4828",
  _feeLbl: "Fee +₹42",
  _typeLbl: "B2B",
  _timeLbl: "9:47 AM",
};

/** What was said after the job landed. */
export const CHAT_MESSAGES_PICKUP: RunnerChatMessage[] = [
  { id: 6, text: "Accepted 👍", _timeLbl: "9:48 AM", _isOut: true },
  {
    id: 7,
    text: "Bag is ready at counter. OTP 4729 for handoff.",
    _timeLbl: "9:50 AM",
    _isOut: false,
  },
];
