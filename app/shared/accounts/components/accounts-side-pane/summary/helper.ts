import AccountService from "~/services/AccountService";

export interface DirectionSummary {
  /** Outstanding total across every party in this direction. */
  outstanding: number;
  /** Parties contributing to the outstanding total. */
  parties: number;
  /** Settled amount over the window, when the API reports it. */
  settled: number;
}

export interface AccountsSummaryData {
  receivables: DirectionSummary;
  payables: DirectionSummary;
}

const EMPTY_DIRECTION: DirectionSummary = {
  outstanding: 0,
  parties: 0,
  settled: 0,
};

export const emptyAccountsSummary = (): AccountsSummaryData => ({
  receivables: EMPTY_DIRECTION,
  payables: EMPTY_DIRECTION,
});

/**
 * One direction of the payables/receivables aggregate. `outputType: "count"`
 * makes the endpoint return the totals block rather than the party rows.
 * The settled figure is read from whichever field the endpoint sends, since
 * only the outstanding pair is guaranteed.
 */
const fetchDirection = async (
  type: "payables" | "receivables",
  params: Record<string, any>,
): Promise<DirectionSummary> => {
  try {
    const response = await AccountService.getPayablesReceiveables({
      ...params,
      type,
      outputType: "count",
    });
    const data = response?.data?.data || {};
    return {
      outstanding: Number(data.totalOutstandingAmount) || 0,
      parties: Number(data.totalParties) || 0,
      settled:
        Number(
          data.totalSettledAmount ??
            data.totalReceivedAmount ??
            data.totalPaidAmount,
        ) || 0,
    };
  } catch (error) {
    return EMPTY_DIRECTION;
  }
};

export const getAccountsSummary = async (range: {
  startDate: string;
  endDate: string;
}): Promise<AccountsSummaryData> => {
  const params = { startDate: range.startDate, endDate: range.endDate };
  const [receivables, payables] = await Promise.all([
    fetchDirection("receivables", params),
    fetchDirection("payables", params),
  ]);
  return { receivables, payables };
};

export type SummaryTone = "in" | "out" | "pending";

/** Card tones — money in reads teal, money out red, waiting-on orange. */
export const toneClass: Record<
  SummaryTone,
  { card: string; label: string; value: string }
> = {
  in: {
    card: "tw:bg-emerald-50 tw:focus-visible:ring-2 tw:focus-visible:ring-emerald-400",
    label: "tw:text-teal-700",
    value: "tw:text-teal-800",
  },
  out: {
    card: "tw:bg-red-50 tw:focus-visible:ring-2 tw:focus-visible:ring-red-400",
    label: "tw:text-red-700",
    value: "tw:text-red-800",
  },
  pending: {
    card: "tw:bg-orange-50 tw:focus-visible:ring-2 tw:focus-visible:ring-orange-400",
    label: "tw:text-orange-600",
    value: "tw:text-orange-600",
  },
};

export interface SummaryCard {
  key: string;
  label: string;
  amount: number;
  tone: SummaryTone;
  /** Payables page view opened when the card is tapped. */
  view: "payables" | "receivables";
}

/**
 * The two cards a view puts on the summary row. Overview compares the two
 * directions; the money-in / money-out views lead with what moved over the
 * window and keep the outstanding figure beside it.
 */
export const buildSummaryCards = (
  data: AccountsSummaryData,
  view: "overview" | "in" | "out",
  periodLabel: string,
): SummaryCard[] => {
  const { receivables, payables } = data;

  if (view === "in") {
    return [
      {
        key: "received",
        label: `Received · ${periodLabel}`,
        amount: receivables.settled,
        tone: "in",
        view: "receivables",
      },
      {
        key: "to-collect",
        label: "To collect",
        amount: receivables.outstanding,
        tone: "pending",
        view: "receivables",
      },
    ];
  }

  if (view === "out") {
    return [
      {
        key: "paid",
        label: `Paid · ${periodLabel}`,
        amount: payables.settled,
        tone: "in",
        view: "payables",
      },
      {
        key: "to-pay",
        label: "To pay",
        amount: payables.outstanding,
        tone: "out",
        view: "payables",
      },
    ];
  }

  return [
    {
      key: "to-collect",
      label: "To collect",
      amount: receivables.outstanding,
      tone: "in",
      view: "receivables",
    },
    {
      key: "to-pay",
      label: "To pay",
      amount: payables.outstanding,
      tone: "out",
      view: "payables",
    },
  ];
};
