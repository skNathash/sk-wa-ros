import ProfitAndLossService from "~/services/ProfitAndLossService";
import { compactRupees } from "~/shared/accounts/pnl-format";

/** Which kind of gain an item represents — decides its tile tone and icon. */
export type ImpactKind = "time" | "revenue" | "leak" | "wastage" | "growth";

export type ImpactItem = {
  key: string;
  /** Small caps kicker, e.g. "EXTRA REVENUE". */
  kind: ImpactKind;
  kindLabel: string;
  label: string;
  /** Already-formatted gain — not every one of these is money. */
  value: string;
  /** The line under it, saying what the figure is made of. */
  detail: string;
};

export type OsImpactData = {
  /** Header line, e.g. "Because you run on StoreKing OS · Jul added ₹54,360". */
  title: string;
  subtitle: string;
  items: ImpactItem[];
};

/**
 * A `type=sk_impact` card. Only the cards this database can actually answer
 * come back — paylater collections and the credit book. The rest of the
 * design's strip (billing time saved, wastage, GST filing) has no source yet
 * and is listed in the envelope's `notReturned` rather than estimated.
 */
type ApiImpactCard = {
  key?: string;
  label?: string;
  tag?: string;
  amount?: number;
  unit?: string;
  detail?: string;
  countsTowardsUplift?: boolean;
};

export const emptyOsImpact = (): OsImpactData => ({
  title: "",
  subtitle: "",
  items: [],
});

/* Money the platform earned reads green; a balance it is holding for you reads
   blue, the same tone the leaks block uses for "watch this". */
const KIND_BY_KEY: Record<string, ImpactKind> = {
  paylater_collections: "revenue",
  credit_book: "leak",
};

const CURRENCY_UNITS = ["inr", "rupees", "₹", "amount", "money"];

const formatValue = (card: ApiImpactCard): string => {
  const amount = card.amount ?? 0;
  const unit = (card.unit ?? "").trim();

  if (!unit || CURRENCY_UNITS.includes(unit.toLowerCase())) {
    /* Only the cards that feed the headline are a gain; a balance carried is
       not something the month added, so it goes unsigned. */
    return card.countsTowardsUplift
      ? `+${compactRupees(amount)}`
      : compactRupees(amount);
  }

  return `${amount.toLocaleString("en-IN")} ${unit}`;
};

export const getOsImpact = async (): Promise<OsImpactData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiImpactCard>("sk_impact");

  const totalUplift = (section.totalUplift as number) ?? 0;
  const share = section.upliftShareOfNetProfit as number | null | undefined;
  const period = section.period.label ?? "";

  return {
    title: `Because you run on StoreKing OS · ${period} added ${compactRupees(
      totalUplift,
    )}`,
    subtitle:
      typeof share === "number"
        ? `≈${Math.round(share)}% of net profit`
        : "Quantified impact from features that would cost you money or opportunity without SK",
    items: section.data.map((card, index) => {
      const key = card.key ?? `impact-${index}`;

      return {
        key,
        kind: KIND_BY_KEY[key] ?? "revenue",
        kindLabel: (card.tag ?? card.label ?? "").toUpperCase(),
        label: card.label ?? "",
        value: formatValue(card),
        detail: card.detail ?? "",
      };
    }),
  };
};
