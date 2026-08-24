/**
 * Static data source for the "Bright Store Journey" onboarding card — the
 * seven stages a shop walks through from getting the keys to closing its
 * first delivered order.
 */

export type JourneyStageStatus = "complete" | "current" | "locked";

export type JourneyStage = {
  key: string;
  /** 1-based position, shown inside locked/current pins. */
  step: number;
  label: string;
  emoji: string;
  status: JourneyStageStatus;
};

export type JourneyCta = {
  title: string;
  /** "5 min · WhatsApp share + QR poster · Unlocks: ..." */
  meta: string;
  emoji: string;
  coins: number;
  actionLabel: string;
};

export type JourneyData = {
  eyebrow: string;
  headline: string;
  description: string;
  stagesDone: number;
  totalStages: number;
  kingCoins: number;
  stages: JourneyStage[];
  cta: JourneyCta;
};

export const emptyJourney = (): JourneyData => ({
  eyebrow: "",
  headline: "",
  description: "",
  stagesDone: 0,
  totalStages: 0,
  kingCoins: 0,
  stages: [],
  cta: { title: "", meta: "", emoji: "", coins: 0, actionLabel: "" },
});

/** The stage the shop is standing on right now, if any. */
export const currentStage = (data: JourneyData) =>
  data.stages.find((stage) => stage.status === "current");

export const getJourney = async (): Promise<JourneyData> =>
  Promise.resolve({
    eyebrow: "Your bright store journey",
    headline: "You're 2 steps from taking your first online order.",
    description:
      "Ring the bell — one WhatsApp forward reaches 100+ nearby homes. Do this today and your first CLUB order lands by lunch.",
    stagesDone: 4,
    totalStages: 7,
    kingCoins: 1850,
    stages: [
      { key: "keys", step: 1, label: "Got the keys", emoji: "🔑", status: "complete" },
      { key: "identity", step: 2, label: "Shop identity", emoji: "🏪", status: "complete" },
      { key: "shelves", step: 3, label: "Fill shelves", emoji: "📚", status: "complete" },
      { key: "openSign", step: 4, label: "Open sign on", emoji: "🌟", status: "complete" },
      { key: "ringBell", step: 5, label: "Ring the bell", emoji: "📢", status: "current" },
      { key: "firstOrder", step: 6, label: "First order", emoji: "🛒", status: "locked" },
      { key: "deliverClose", step: 7, label: "Deliver + close", emoji: "👑", status: "locked" },
    ],
    cta: {
      title: "Ring the bell — tell your neighborhood you're online.",
      meta: "5 min · WhatsApp share + QR poster · Unlocks: first customer orders in <24 hours",
      emoji: "📢",
      coins: 2000,
      actionLabel: "Do it now",
    },
  });
