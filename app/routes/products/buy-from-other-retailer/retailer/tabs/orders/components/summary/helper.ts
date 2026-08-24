import Amount from "~/components/core/amount/Amount";
import { createElement } from "react";
import { emptySummary, type OrderSummary } from "../../helper";
import type { SummaryItem } from "./Summary";

const amountNode = (value: number) =>
  createElement(Amount, { value, decimalPlaces: 0 });

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

export const getSummaryData = (
  summary: OrderSummary = emptySummary,
): SummaryItem[] => [
  {
    key: "totalOrders",
    label: "TOTAL ORDERS",
    value: summary.orderCount,
    subLabel: createElement(
      "span",
      null,
      amountNode(summary.orderAmount),
      " placed",
    ),
    accent: "blue",
  },
  {
    key: "paidToSeller",
    label: "PAID TO SELLER",
    value: summary.paidAmount,
    isAmount: true,
    subLabel: `${plural(summary.paidCount, "order")} · ${Math.round(
      summary.paidPercentage,
    )}% cleared`,
    accent: "emerald",
  },
  {
    key: "paymentDue",
    label: "PAYMENT DUE",
    value: summary.dueAmount,
    isAmount: true,
    subLabel: `${plural(summary.dueCount, "order")} pending`,
    accent: "amber",
  },
];
