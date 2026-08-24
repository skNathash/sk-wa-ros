/**
 * Static data source for the full "Bright Store Journey" map
 * (app/routes/dashboard/journey/index.tsx) — the long-form read of the same
 * seven stages the home page shows as a compact rail
 * (dashboard/main/components/bright-store-journey).
 *
 * Everything here is a hard-coded promise for now; when the API lands, only
 * `getJourneyMap` changes — the page already treats it as async.
 */

export type JourneyStageStatus = "complete" | "current" | "locked";

/** One checklist row inside a stage card. */
export type JourneyTask = {
  key: string;
  label: string;
  /** Done tasks show a tick; pending ones show their 1-based position. */
  done: boolean;
};

/** Badge unlocked by finishing a stage — shown in the completed card's footer. */
export type JourneyBadge = {
  emoji: string;
  label: string;
};

export type JourneyStage = {
  key: string;
  /** 1-based position on the rail, shown inside current/locked pins. */
  step: number;
  title: string;
  /** What the shop actually gets out of the stage. */
  outcome: string;
  /** Effort/wait line — "5 mins · WhatsApp share + QR poster". */
  time: string;
  /** King Coins awarded for the stage. */
  coins: number;
  status: JourneyStageStatus;
  tasks: JourneyTask[];
  /** Completed stages only. */
  badge?: JourneyBadge;
  /** Current stage only — what finishing it opens up. */
  unlocks?: string;
  /** Current stage only — label on the CTA. */
  actionLabel?: string;
};

/**
 * A run of intro copy. Split into segments rather than kept as one string so
 * the emphasised words ("King Coins") stay part of the data instead of being
 * pattern-matched out of it in the view.
 */
export type JourneyTextSegment = {
  text: string;
  strong?: boolean;
};

/** The closing card at the foot of the rail — the promise, not a stage. */
export type JourneyDestination = {
  eyebrow: string;
  headline: string;
  description: string;
};

export type JourneyMap = {
  eyebrow: string;
  /** Headline is two lines: the plain lead, then the accented payoff. */
  headlineLead: string;
  headlineAccent: string;
  description: JourneyTextSegment[];
  stagesComplete: number;
  totalStages: number;
  coinsEarned: number;
  stages: JourneyStage[];
  destination: JourneyDestination;
};

export const emptyJourneyMap = (): JourneyMap => ({
  eyebrow: "",
  headlineLead: "",
  headlineAccent: "",
  description: [],
  stagesComplete: 0,
  totalStages: 0,
  coinsEarned: 0,
  stages: [],
  destination: { eyebrow: "", headline: "", description: "" },
});

/** The stage the shop is standing on right now, if any. */
export const currentStage = (data: JourneyMap) =>
  data.stages.find((stage) => stage.status === "current");

/** Coin counts read as "+2,000" everywhere they appear. */
export const formatCoins = (coins: number) =>
  `+${coins.toLocaleString("en-IN")}`;

/** Status pill copy — completed and current stages are named, others numbered. */
export const stageStatusLabel = (stage: JourneyStage) => {
  if (stage.status === "complete") return "Complete";
  if (stage.status === "current") return "You are here";
  return `Stage ${stage.step}`;
};

export const getJourneyMap = async (): Promise<JourneyMap> =>
  Promise.resolve({
    eyebrow: "Your bright store journey",
    headlineLead: "From shopkeeper",
    headlineAccent: "to Retail King.",
    description: [
      {
        text: "Seven stages. Each one unlocks a real business capability — from opening your shop URL to running a full online storefront in your neighborhood. Each stage rewards ",
      },
      { text: "King Coins", strong: true },
      {
        text: ", redeemable inside CLUB for stock, wallpapers, and premium sellers.",
      },
    ],
    stagesComplete: 4,
    totalStages: 7,
    coinsEarned: 1850,
    stages: [
      {
        key: "keys",
        step: 1,
        title: "You've got the keys to StoreKing",
        outcome: "You joined 20,000+ Bright Store retailers",
        time: "2 mins · Verify your mobile",
        coins: 100,
        status: "complete",
        tasks: [
          { key: "mobile", label: "Enter your mobile number", done: true },
          { key: "otp", label: "Verify with OTP", done: true },
          { key: "pin", label: "Set a 4-digit PIN", done: true },
        ],
        badge: { emoji: "🔑", label: "Shopkeeper" },
      },
      {
        key: "identity",
        step: 2,
        title: "Give your shop an identity customers recognize",
        outcome: "Your Bright Store has a face — logo, name, hours",
        time: "5 mins · Logo, photos, timings",
        coins: 250,
        status: "complete",
        tasks: [
          { key: "address", label: "Shop name, address, PIN", done: true },
          { key: "logo", label: "Logo and shopfront photo", done: true },
          {
            key: "hours",
            label: "Opening hours and delivery slots",
            done: true,
          },
          {
            key: "payments",
            label: "Payment methods (UPI, cash, card)",
            done: true,
          },
        ],
        badge: { emoji: "🏪", label: "Shopkeeper" },
      },
      {
        key: "shelves",
        step: 3,
        title: "Fill your digital shelves",
        outcome: "Your shop online looks as full as your shop offline",
        time: "~10 mins · Pick 20 fast-moving items to start",
        coins: 500,
        status: "complete",
        tasks: [
          {
            key: "subscribe",
            label: "Subscribe to 20 items from Library",
            done: true,
          },
          { key: "price", label: "Set MRP / discount price", done: true },
          { key: "stock", label: "Add opening stock quantity", done: true },
          { key: "preview", label: "Preview on CLUB store", done: true },
        ],
        badge: { emoji: "📚", label: "Cataloger" },
      },
      {
        key: "openSign",
        step: 4,
        title: "Turn on the OPEN sign",
        outcome: "You're a real online store — findable, shareable, live",
        time: "1 min · Your storeking.in link goes live",
        coins: 1000,
        status: "complete",
        tasks: [
          { key: "url", label: "Preview your live store URL", done: true },
          {
            key: "confirm",
            label: "Confirm timings + payment methods",
            done: true,
          },
          { key: "live", label: "Flip Go Live", done: true },
        ],
        badge: { emoji: "🌟", label: "Bright Store Owner" },
      },
      {
        key: "ringBell",
        step: 5,
        title: "Ring the bell — tell your neighborhood you're online",
        outcome: "The first 100 nearby homes know you exist online",
        time: "5 mins · WhatsApp share + QR poster",
        coins: 2000,
        status: "current",
        tasks: [
          {
            key: "whatsapp",
            label: "Share your store on WhatsApp (5-language templates)",
            done: false,
          },
          {
            key: "poster",
            label: "Print your QR poster and stick it at the counter",
            done: false,
          },
          {
            key: "rwa",
            label: "Post to your local Facebook / RWA group",
            done: false,
          },
        ],
        unlocks: "Unlocks: First customer orders in <24 hours",
        actionLabel: "Do it now",
      },
      {
        key: "firstOrder",
        step: 6,
        title: "Accept your first online order",
        outcome: "Your shop is now an online shop — for real",
        time: "Waiting on your first CLUB order",
        coins: 5000,
        status: "locked",
        tasks: [
          { key: "inbox", label: "Watch CLUB orders inbox", done: false },
          { key: "accept", label: "Tap Accept within 5 minutes", done: false },
          {
            key: "eta",
            label: "Confirm expected delivery time",
            done: false,
          },
        ],
      },
      {
        key: "deliverClose",
        step: 7,
        title: "Pick · Pack · Ship your first delivery",
        outcome: "You've closed the full loop — customer to counter to doorstep",
        time: "Fulfill + collect payment",
        coins: 10000,
        status: "locked",
        tasks: [
          { key: "pick", label: "Pick items from your shelves", done: false },
          { key: "pack", label: "Pack + label the box", done: false },
          {
            key: "hand",
            label: "Hand to delivery partner or self-deliver",
            done: false,
          },
          {
            key: "collect",
            label: "Collect payment (COD or online)",
            done: false,
          },
        ],
      },
    ],
    destination: {
      eyebrow: "Destination",
      headline: "You'll be running your own Amazon in your neighborhood.",
      description:
        "Not a fantasy — a repeatable playbook. 20,000+ StoreKing retailers have already walked this road. The average Bilikere shop hit stage 7 in 11 days.",
    },
  });
