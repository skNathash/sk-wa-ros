/** The rating as a whole — the figure, the count, and how it is spread. */
export const REVIEW_SUMMARY = {
  rating: 4.9,
  _countLbl: "20 reviews",
};

/** One bar of the spread: the share of ratings that landed on this star. */
export interface RunnerRatingBar {
  stars: number;
  sharePct: number;
  _shareLbl: string;
}

export const RATING_BARS: RunnerRatingBar[] = [
  { stars: 5, sharePct: 82, _shareLbl: "82%" },
  { stars: 4, sharePct: 12, _shareLbl: "12%" },
  { stars: 3, sharePct: 4, _shareLbl: "4%" },
  { stars: 2, sharePct: 1, _shareLbl: "1%" },
  { stars: 1, sharePct: 1, _shareLbl: "1%" },
];

/** A single customer's word on a job. */
export interface RunnerReview {
  id: number;
  _nameLbl: string;
  _avatarLbl: string;
  _avatarCls: string;
  rating: number;
  _textLbl: string;
  _timeLbl: string;
}

export const RUNNER_REVIEWS: RunnerReview[] = [
  {
    id: 1,
    _nameLbl: "Deepa N.",
    _avatarLbl: "DN",
    _avatarCls: "runner-chat-avatar--orange",
    rating: 5,
    _textLbl: "Always on time, very polite 🙏",
    _timeLbl: "Today",
  },
  {
    id: 2,
    _nameLbl: "Ashwini R.",
    _avatarLbl: "AR",
    _avatarCls: "runner-chat-avatar--amber",
    rating: 5,
    _textLbl: "Handles fragile items carefully.",
    _timeLbl: "Today",
  },
  {
    id: 3,
    _nameLbl: "Divya Mart",
    _avatarLbl: "DM",
    _avatarCls: "runner-chat-avatar--teal",
    rating: 5,
    _textLbl: "Best runner in Kumbalgudu — never late.",
    _timeLbl: "Today",
  },
  {
    id: 4,
    _nameLbl: "Sonu K.",
    _avatarLbl: "SK",
    _avatarCls: "runner-chat-avatar--blue",
    rating: 4,
    _textLbl: "Good, missed one bag once — fixed quickly.",
    _timeLbl: "Today",
  },
  {
    id: 5,
    _nameLbl: "Kavita P.",
    _avatarLbl: "KP",
    _avatarCls: "runner-chat-avatar--brand",
    rating: 5,
    _textLbl: "Cash handling is transparent, appreciate.",
    _timeLbl: "Yesterday",
  },
];

export const REVIEW_RECENT_LBL = "Recent reviews";
