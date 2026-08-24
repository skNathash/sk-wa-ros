export type UserType = "b2c" | "b2b";

export type UserItem = {
  _id?: string;
  id?: string;
  referenceId?: string;
  name?: string;
  mobile?: string;
  franchiseId?: string;
  refNo?: string;
  initials?: string;
  location?: string;
  bills?: number;
  avgBillValue?: number;
  fulfillmentRate?: number;
  suggestedLimit?: number;
  /** Extra raw data kept for the unlock view. */
  raw?: Record<string, any>;
  [key: string]: any;
};

const roundLimit = (value: number) => {
  if (value <= 0) return 0;
  if (value < 1000) return Math.ceil(value / 50) * 50;
  return Math.ceil(value / 100) * 100;
};

/**
 * Derives the unlock-page stats from a selected user item. Falls back to 0
 * for any missing values.
 */
export const getUserStats = (user: UserItem | null) => {
  if (!user) {
    return {
      bills: 0,
      avgBill: 0,
      onTime: 0,
      silentDays: 0,
      creditScore: 0,
      suggestedLimit: 0,
    };
  }

  const bills = user.bills || 0;
  const avgBill = user.avgBillValue || 0;
  const fulfillmentRate = user.fulfillmentRate || 0;

  // A simple rule-based score from the available data, matching the spirit
  // of the credit score shown in the design.
  const scoreBase = Math.min(100, 60 + fulfillmentRate * 0.4);
  const creditScore = Math.round(scoreBase);

  return {
    bills,
    avgBill,
    onTime: fulfillmentRate,
    silentDays: 0,
    creditScore,
    suggestedLimit: user.suggestedLimit || roundLimit(avgBill * 1.2),
  };
};

export const QUICK_LIMITS = [200, 500, 1000, 5000];
export const MAX_LIMIT = 5000;
