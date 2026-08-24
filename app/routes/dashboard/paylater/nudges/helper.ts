/**
 * Data + presentation for the PayLater nudges page.
 *
 * There is no nudge API yet, so everything the page reads comes from here —
 * one place to swap for real calls later. The shapes are already the ones the
 * components consume (`getStageDetail`, `getStages`, `getAutoTriggers`), so a
 * future service only has to fill them.
 */

import {
  AlertTriangle,
  Bell,
  Snowflake,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** The six stages a paylater user moves through, in order. */
export type NudgeStageKey =
  | "invite"
  | "activate"
  | "remind"
  | "recover"
  | "upgrade"
  | "delight";

/** Which book a person sits in — B2B retailers or B2C customers. */
export type NudgeUserType = "b2b" | "b2c";

/** Tone classes for a stage: every surface that carries its colour. */
export interface StageTone {
  /** Top accent bar on the lifecycle card. */
  bar: string;
  /** Filled number circle. */
  badge: string;
  /** Stage name + headline count. */
  text: string;
  /** Footer metric chip / stage chip in the trigger table. */
  chip: string;
  /** Ring on the focused lifecycle card. */
  ring: string;
}

export const STAGE_TONES: Record<NudgeStageKey, StageTone> = {
  invite: {
    bar: "tw:bg-emerald-800",
    badge: "tw:bg-emerald-800",
    text: "tw:text-emerald-800",
    chip: "tw:bg-emerald-50 tw:text-emerald-800",
    ring: "tw:ring-emerald-600",
  },
  activate: {
    bar: "tw:bg-emerald-500",
    badge: "tw:bg-emerald-600",
    text: "tw:text-emerald-700",
    chip: "tw:bg-emerald-50 tw:text-emerald-700",
    ring: "tw:ring-emerald-500",
  },
  remind: {
    bar: "tw:bg-blue-500",
    badge: "tw:bg-blue-600",
    text: "tw:text-blue-700",
    chip: "tw:bg-blue-50 tw:text-blue-700",
    ring: "tw:ring-blue-500",
  },
  recover: {
    bar: "tw:bg-red-500",
    badge: "tw:bg-red-500",
    text: "tw:text-red-600",
    chip: "tw:bg-red-50 tw:text-red-700",
    ring: "tw:ring-red-500",
  },
  upgrade: {
    bar: "tw:bg-amber-400",
    badge: "tw:bg-amber-500",
    text: "tw:text-amber-600",
    chip: "tw:bg-amber-50 tw:text-amber-700",
    ring: "tw:ring-amber-500",
  },
  delight: {
    bar: "tw:bg-fuchsia-500",
    badge: "tw:bg-fuchsia-500",
    text: "tw:text-fuchsia-600",
    chip: "tw:bg-fuchsia-50 tw:text-fuchsia-700",
    ring: "tw:ring-fuchsia-500",
  },
};

/** One card on the lifecycle rail. */
export interface NudgeStage {
  key: NudgeStageKey;
  /** 1-based position — rendered in the badge. */
  step: number;
  name: string;
  /** Who the stage is about, in a line. */
  caption: string;
  icon: LucideIcon;
  /** How many people are sitting in the stage this week. */
  count: number;
  /** The one number the stage is judged on. */
  metric: string;
  /** One line under the focus header explaining how the stage behaves. */
  focusNote: string;
}

const STAGES: NudgeStage[] = [
  {
    key: "invite",
    step: 1,
    name: "Invite",
    caption: "Qualify · offer starter limit",
    icon: Snowflake,
    count: 34,
    metric: "₹68K new PL volume",
    focusNote: "Cash regulars who already behave like paylater users.",
  },
  {
    key: "activate",
    step: 2,
    name: "Activate",
    caption: "Sanctioned · 0 usage · 14d+",
    icon: Zap,
    count: 12,
    metric: "₹24K first-use",
    focusNote: "Limit given, never used — one push to the first bill.",
  },
  {
    key: "remind",
    step: 3,
    name: "Remind",
    caption: "Active users · T-3 → T+7",
    icon: Bell,
    count: 18,
    metric: "96% on-time rate",
    focusNote: "Steady reminder cadence — friendly early, firm late.",
  },
  {
    key: "recover",
    step: 4,
    name: "Recover",
    caption: "Overdue · DPD 7/15/30",
    icon: AlertTriangle,
    count: 3,
    metric: "₹6.2K exposure",
    focusNote: "Past due — escalate by days, keep the relationship.",
  },
  {
    key: "upgrade",
    step: 5,
    name: "Upgrade",
    caption: "Star payers · limit ↑",
    icon: TrendingUp,
    count: 8,
    metric: "+₹32K limit ceiling",
    focusNote: "Clean repayment history — reward it with more room.",
  },
  {
    key: "delight",
    step: 6,
    name: "Delight",
    caption: "Birthday · silent · festival",
    icon: Star,
    count: 6,
    metric: "+retention",
    focusNote: "Occasion nudges that have nothing to ask for.",
  },
];

/** The lifecycle rail, in stage order. */
export const getStages = (): NudgeStage[] => STAGES;

export const getStage = (key: NudgeStageKey): NudgeStage =>
  STAGES.find((stage) => stage.key === key) || STAGES[0];

/** How firm a nudge reads — drives the chip colour on rows and cadence dots. */
export type NudgeTone = "friendly" | "firm" | "off";

export const TONE_CLASS: Record<NudgeTone, string> = {
  friendly: "tw:text-emerald-600",
  firm: "tw:text-red-500",
  off: "tw:text-gray-400",
};

export const TONE_DOT_CLASS: Record<NudgeTone, string> = {
  friendly: "tw:bg-emerald-600 tw:text-white tw:border-emerald-600",
  firm: "tw:bg-red-500 tw:text-white tw:border-red-500",
  off: "tw:bg-white tw:text-gray-400 tw:border-gray-200",
};

/** One person in the stage's audience list. */
export interface NudgeAudienceMember {
  id: string;
  name: string;
  type: NudgeUserType;
  /** Outstanding amount the nudge is about. */
  amount: number;
  /** When it falls due, in words — "due in 3d", "due tomorrow". */
  due: string;
  /** Which cadence step this person is on right now. */
  step: string;
  tone: NudgeTone;
}

/** One dot on the cadence strip. */
export interface CadenceStep {
  key: string;
  label: string;
  tone: NudgeTone;
}

/** The WhatsApp draft the stage would send. */
export interface NudgePreview {
  /** Paragraphs of the message body, in order. */
  lines: string[];
  time: string;
}

/** Everything the focus band shows for one stage. */
export interface StageDetail {
  /** The blue-rule note above the audience list. */
  summary: string;
  audience: NudgeAudienceMember[];
  cadenceTitle: string;
  cadenceSource: string;
  cadence: CadenceStep[];
  cadenceNote: string;
  preview: NudgePreview;
}

const STAGE_DETAIL: Record<NudgeStageKey, StageDetail> = {
  invite: {
    summary:
      "34 cash-only buyers clear every bill on time and have KYC done. Starter limits are pre-qualified per buyer.",
    audience: [
      {
        id: "inv-1",
        name: "Ramesh Stores",
        type: "b2b",
        amount: 5000,
        due: "starter limit offer",
        step: "READY",
        tone: "friendly",
      },
      {
        id: "inv-2",
        name: "Kavya M.",
        type: "b2c",
        amount: 2000,
        due: "starter limit offer",
        step: "READY",
        tone: "friendly",
      },
      {
        id: "inv-3",
        name: "Deepak Kirana",
        type: "b2b",
        amount: 1000,
        due: "KYC done · 4 bills",
        step: "READY",
        tone: "friendly",
      },
    ],
    cadenceTitle: "Cadence · offer → follow-up",
    cadenceSource: "retailer default",
    cadence: [
      { key: "D0", label: "Offer", tone: "friendly" },
      { key: "D+2", label: "Remind", tone: "friendly" },
      { key: "D+5", label: "Last call", tone: "firm" },
      { key: "D+10", label: "Drop", tone: "off" },
    ],
    cadenceNote: "3 of 4 stages active. Offer once, follow up twice, then rest.",
    preview: {
      lines: [
        "Hi Ramesh 🙏",
        "You have paid 6 bills on time — your store is eligible for a paylater limit of ₹5,000.",
        "Buy now, pay in 14 days. No charges.",
        "Reply YES to unlock 👇",
      ],
      time: "10:24",
    },
  },
  activate: {
    summary:
      "12 buyers hold a sanctioned limit they have never touched, idle 14 days or more. One first-use push each.",
    audience: [
      {
        id: "act-1",
        name: "Nagaraj Traders",
        type: "b2b",
        amount: 10000,
        due: "idle 21d",
        step: "FIRST USE",
        tone: "friendly",
      },
      {
        id: "act-2",
        name: "Latha R.",
        type: "b2c",
        amount: 2000,
        due: "idle 16d",
        step: "FIRST USE",
        tone: "friendly",
      },
      {
        id: "act-3",
        name: "SLV Enterprises",
        type: "b2b",
        amount: 5000,
        due: "idle 14d",
        step: "FIRST USE",
        tone: "friendly",
      },
    ],
    cadenceTitle: "Cadence · D+14 → D+30",
    cadenceSource: "retailer default",
    cadence: [
      { key: "D+14", label: "Nudge", tone: "friendly" },
      { key: "D+21", label: "Bonus", tone: "friendly" },
      { key: "D+30", label: "Last try", tone: "firm" },
      { key: "D+45", label: "Pause", tone: "off" },
    ],
    cadenceNote: "3 of 4 stages active. Sweeten first, then stop asking.",
    preview: {
      lines: [
        "Hi Nagaraj 🙏",
        "Your paylater limit of ₹10,000 is ready and unused.",
        "Use it on your next order → free delivery on the first paylater bill.",
        "Order now 👇",
      ],
      time: "10:24",
    },
  },
  remind: {
    summary:
      "18 active paylater users with bills coming due. Standard T-3 → T+7 cadence, per-retailer configurable.",
    audience: [
      {
        id: "rem-1",
        name: "Suresh Kumar",
        type: "b2c",
        amount: 3820,
        due: "due in 3d",
        step: "T-3 FRIENDLY",
        tone: "friendly",
      },
      {
        id: "rem-2",
        name: "Anil Traders",
        type: "b2b",
        amount: 8500,
        due: "due tomorrow",
        step: "T-1 FRIENDLY",
        tone: "friendly",
      },
      {
        id: "rem-3",
        name: "Priya S.",
        type: "b2c",
        amount: 1200,
        due: "due today",
        step: "T-0 FIRM",
        tone: "firm",
      },
    ],
    cadenceTitle: "Cadence · T-7 → T+7",
    cadenceSource: "retailer default",
    cadence: [
      { key: "T-7", label: "Save date", tone: "off" },
      { key: "T-3", label: "Friendly", tone: "friendly" },
      { key: "T-1", label: "Tomorrow", tone: "friendly" },
      { key: "T-0", label: "Due today", tone: "friendly" },
      { key: "T+1", label: "Firm", tone: "firm" },
      { key: "T+3", label: "Escalate", tone: "firm" },
      { key: "T+7", label: "Call", tone: "off" },
    ],
    cadenceNote:
      "5 of 7 stages active. Friendly early · firm late · voice as last resort.",
    preview: {
      lines: [
        "Hi Suresh 🙏",
        "Friendly reminder — your paylater balance of ₹3,820 is due on Fri (in 3 days).",
        "Pay early → keep your Gold tier + limit intact.",
        "Tap to pay via UPI 👇",
      ],
      time: "10:24",
    },
  },
  recover: {
    summary:
      "3 buyers are past due with a balance above ₹500. Escalation is by days past due, not by amount.",
    audience: [
      {
        id: "rec-1",
        name: "Mahesh Agencies",
        type: "b2b",
        amount: 4200,
        due: "DPD 9",
        step: "T+7 FIRM",
        tone: "firm",
      },
      {
        id: "rec-2",
        name: "Vinod K.",
        type: "b2c",
        amount: 1400,
        due: "DPD 16",
        step: "DPD 15 CALL",
        tone: "firm",
      },
      {
        id: "rec-3",
        name: "Shree Mart",
        type: "b2b",
        amount: 600,
        due: "DPD 31",
        step: "DPD 30 HOLD",
        tone: "firm",
      },
    ],
    cadenceTitle: "Cadence · DPD 7 → DPD 30",
    cadenceSource: "retailer default",
    cadence: [
      { key: "D7", label: "Firm", tone: "firm" },
      { key: "D15", label: "Voice call", tone: "firm" },
      { key: "D22", label: "Limit hold", tone: "firm" },
      { key: "D30", label: "Freeze", tone: "off" },
    ],
    cadenceNote:
      "3 of 4 stages active. Firm text → voice → hold the limit, in that order.",
    preview: {
      lines: [
        "Hi Mahesh 🙏",
        "Your paylater balance of ₹4,200 is 9 days overdue.",
        "Clear it today to keep your limit active — a hold starts at 22 days.",
        "Pay now via UPI 👇",
      ],
      time: "10:24",
    },
  },
  upgrade: {
    summary:
      "8 buyers cleared 6 cycles on time and are using 70%+ of their limit. Room to raise the ceiling.",
    audience: [
      {
        id: "upg-1",
        name: "Anil Traders",
        type: "b2b",
        amount: 5000,
        due: "₹2K → ₹5K",
        step: "LIMIT ↑",
        tone: "friendly",
      },
      {
        id: "upg-2",
        name: "Suresh Kumar",
        type: "b2c",
        amount: 2000,
        due: "₹500 → ₹2K",
        step: "LIMIT ↑",
        tone: "friendly",
      },
      {
        id: "upg-3",
        name: "Bhavani Stores",
        type: "b2b",
        amount: 5000,
        due: "₹2K → ₹5K",
        step: "LIMIT ↑",
        tone: "friendly",
      },
    ],
    cadenceTitle: "Cadence · offer → confirm",
    cadenceSource: "retailer default",
    cadence: [
      { key: "D0", label: "Offer", tone: "friendly" },
      { key: "D+3", label: "Remind", tone: "friendly" },
      { key: "D+7", label: "Expire", tone: "off" },
    ],
    cadenceNote: "2 of 3 stages active. Offer twice, then let it lapse.",
    preview: {
      lines: [
        "Hi Anil 🙏",
        "6 bills paid on time — your paylater limit is going up from ₹2,000 to ₹5,000.",
        "Nothing to do, it is already live on your next order.",
        "Start shopping 👇",
      ],
      time: "10:24",
    },
  },
  delight: {
    summary:
      "6 buyers have an occasion this week — birthdays and festival regulars. Nothing to ask for, only to give.",
    audience: [
      {
        id: "del-1",
        name: "Priya S.",
        type: "b2c",
        amount: 50,
        due: "birthday today",
        step: "GIFT",
        tone: "friendly",
      },
      {
        id: "del-2",
        name: "Rekha N.",
        type: "b2c",
        amount: 50,
        due: "birthday Fri",
        step: "GIFT",
        tone: "friendly",
      },
      {
        id: "del-3",
        name: "Ganesh Stores",
        type: "b2b",
        amount: 100,
        due: "silent 34d",
        step: "WIN BACK",
        tone: "friendly",
      },
    ],
    cadenceTitle: "Cadence · occasion day",
    cadenceSource: "retailer default",
    cadence: [
      { key: "D0", label: "Wish", tone: "friendly" },
      { key: "D+1", label: "Redeem", tone: "friendly" },
      { key: "D+7", label: "Close", tone: "off" },
    ],
    cadenceNote: "2 of 3 stages active. One wish, one reminder to redeem.",
    preview: {
      lines: [
        "Happy birthday Priya 🎉",
        "50 coins are in your wallet from all of us at the store.",
        "Pick a free item on your next visit — valid for 7 days.",
        "See what you can get 👇",
      ],
      time: "10:24",
    },
  },
};

export const getStageDetail = (key: NudgeStageKey): StageDetail =>
  STAGE_DETAIL[key];

/** One row of the auto-trigger table: an event and the nudge it fires. */
export interface AutoTrigger {
  id: string;
  stage: NudgeStageKey;
  /** The condition that puts someone in the audience. */
  when: string;
  /** What goes out when it does. */
  then: string;
  audience: number;
  enabled: boolean;
}

export const getAutoTriggers = (): AutoTrigger[] => [
  {
    id: "trg-invite",
    stage: "invite",
    when: "≥ 3 cash bills · all on-time · KYC done",
    then: "Offer starter limit ₹1K / ₹2K / ₹5K",
    audience: 34,
    enabled: true,
  },
  {
    id: "trg-activate",
    stage: "activate",
    when: "Limit sanctioned · 0 usage · idle 14d",
    then: "First-use bonus · free delivery",
    audience: 12,
    enabled: true,
  },
  {
    id: "trg-remind",
    stage: "remind",
    when: "Bill due in 3 / 1 / 0 days",
    then: "WA reminder · friendly template",
    audience: 18,
    enabled: true,
  },
  {
    id: "trg-recover",
    stage: "recover",
    when: "DPD ≥ 7 · balance ≥ ₹500",
    then: "Firm reminder · voice call at DPD 15",
    audience: 3,
    enabled: true,
  },
  {
    id: "trg-upgrade",
    stage: "upgrade",
    when: "6 on-time cycles · util ≥ 70%",
    then: "Limit ↑ · B2B ₹2K→₹5K · B2C ₹500→₹2K",
    audience: 8,
    enabled: true,
  },
  {
    id: "trg-delight-birthday",
    stage: "delight",
    when: "B2C birthday this week",
    then: "Free item + 50 coins",
    audience: 3,
    enabled: true,
  },
  {
    id: "trg-delight-silent",
    stage: "delight",
    when: "Silent 30d+ · coin balance ≥ 400",
    then: "Spend-more nudge · redeem coins",
    audience: 12,
    enabled: false,
  },
];
