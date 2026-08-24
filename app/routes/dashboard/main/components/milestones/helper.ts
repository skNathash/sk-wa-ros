/**
 * Static data source for the "Milestones" card — firsts the shop has already
 * banked, plus the next one still locked.
 */

export type Milestone = {
  key: string;
  title: string;
  /** "10 Aug 2023" when earned, "Locked · keep going" when not. */
  meta: string;
  emoji: string;
  earned: boolean;
};

export type MilestonesData = {
  heading: string;
  earnedCount: number;
  totalCount: number;
  linkLabel: string;
  linkTo: string;
  milestones: Milestone[];
};

export const emptyMilestones = (): MilestonesData => ({
  heading: "",
  earnedCount: 0,
  totalCount: 0,
  linkLabel: "",
  linkTo: "",
  milestones: [],
});

export const getMilestones = async (): Promise<MilestonesData> =>
  Promise.resolve({
    heading: "Milestones",
    earnedCount: 4,
    totalCount: 6,
    linkLabel: "All",
    linkTo: "/dashboard/insight",
    milestones: [
      {
        key: "firstBill",
        title: "First bill printed",
        meta: "10 Aug 2023",
        emoji: "🧾",
        earned: true,
      },
      {
        key: "firstLakh",
        title: "First ₹1 lakh month",
        meta: "Sep 2023",
        emoji: "💰",
        earned: true,
      },
      {
        key: "hundredthCustomer",
        title: "100th customer served",
        meta: "Nov 2023",
        emoji: "🎯",
        earned: true,
      },
      {
        key: "firstRunner",
        title: "First runner onboarded",
        meta: "Feb 2024",
        emoji: "🛵",
        earned: true,
      },
      {
        key: "fiveLakh",
        title: "First ₹5 lakh month",
        meta: "Locked · keep going",
        emoji: "🏆",
        earned: false,
      },
    ],
  });
