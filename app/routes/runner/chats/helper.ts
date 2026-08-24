/** Masthead lines for the chat list. Hardcoded until the runner API lands. */
export const CHATS_HEADER = {
  eyebrow: "Runner app",
  statusLbl: "Online",
  title: "Chats",
  subtitle: "2 unread",
};

export const CHATS_SEARCH_LBL = "Search chats";

/** Closing note under the list — the same reassurance every chat app ends on. */
export const CHATS_ENCRYPTED_LBL = "Chats are end-to-end encrypted";

/**
 * One conversation in the runner's inbox. Hardcoded until the runner API
 * lands, so every display field is already phrased for the row.
 */
export interface RunnerChat {
  id: number;
  name: string;
  /** Initials on the avatar, or the emoji a group chat uses instead. */
  _avatarLbl: string;
  /** Avatar fill — the seam that keeps a chat recognisable at a glance. */
  _avatarCls: string;
  /** "Sridhar: Pickup ready — CLB-4828" — sender already folded in. */
  _snippetLbl: string;
  /** "5:12 PM" / "Yest" / "Mon" — how far back the last message was. */
  _timeLbl: string;
  /** Unread count, 0 when the runner has read the thread. */
  _unreadCount: number;
  /** True while the other side is on the app — the dot on the avatar. */
  _isOnline: boolean;
  /** True for StoreKing's own thread — the verified tick and OFFICIAL tag. */
  _isOfficial: boolean;
}

export const RUNNER_CHATS: RunnerChat[] = [
  {
    id: 1,
    name: "StoreKing",
    _avatarLbl: "S",
    _avatarCls: "runner-chat-avatar--brand",
    _snippetLbl: "Weekly payout of ₹4,580 sent to HDFC ****4821",
    _timeLbl: "5:12 PM",
    _unreadCount: 0,
    _isOnline: false,
    _isOfficial: true,
  },
  {
    id: 2,
    name: "Sri Lakshmi Stores",
    _avatarLbl: "SL",
    _avatarCls: "runner-chat-avatar--teal",
    _snippetLbl: "Sridhar: Pickup ready — CLB-4828",
    _timeLbl: "9:52 AM",
    _unreadCount: 2,
    _isOnline: true,
    _isOfficial: false,
  },
  {
    id: 3,
    name: "Anjali Provisions",
    _avatarLbl: "AP",
    _avatarCls: "runner-chat-avatar--blue",
    _snippetLbl: "Thanks Ashok, delivered on time 👌",
    _timeLbl: "Yest",
    _unreadCount: 0,
    _isOnline: false,
    _isOfficial: false,
  },
  {
    id: 4,
    name: "Ramesh Kirana",
    _avatarLbl: "RK",
    _avatarCls: "runner-chat-avatar--orange",
    _snippetLbl: "Any slot tomorrow morning?",
    _timeLbl: "Yest",
    _unreadCount: 0,
    _isOnline: false,
    _isOfficial: false,
  },
  {
    id: 5,
    name: "StoreKing Support",
    _avatarLbl: "?",
    _avatarCls: "runner-chat-avatar--slate",
    _snippetLbl: "How can we help?",
    _timeLbl: "Mon",
    _unreadCount: 0,
    _isOnline: false,
    _isOfficial: false,
  },
  {
    id: 6,
    name: "Kumbalgudu Runners",
    _avatarLbl: "🏍",
    _avatarCls: "runner-chat-avatar--amber",
    _snippetLbl: "Karthik: Petrol pump on ORR reopened",
    _timeLbl: "Mon",
    _unreadCount: 0,
    _isOnline: false,
    _isOfficial: false,
  },
];
