import { BadgePercent, Package, TrendingUp, Zap } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Summary, {
  type SummaryItem,
} from "../../../../tabs/overview/components/summary/Summary";
import { defaultCatalogSummary, type CatalogSummaryData } from "../../helper";

type Props = {
  className?: string;
  /** Stats from the list API's `outputType=summary` response. */
  data?: CatalogSummaryData;
  loading?: boolean;
};

const iconClass = "tw:w-3.5 tw:h-3.5";
const spinner = <AppSpinner className="tw:w-6 tw:h-6" />;

// Discounts come back fractional (e.g. 1.25) — trim to one decimal and drop a
// trailing ".0" so whole numbers read clean.
const formatPercent = (value: number) =>
  `${Number(value.toFixed(1))}%`;

const CatalogSummary = ({
  className,
  data = defaultCatalogSummary,
  loading = false,
}: Props) => {
  const { totalDeals, discountedDeals, avgDiscount, maxDiscount } = data;

  const discountedShare =
    totalDeals > 0 ? Math.round((discountedDeals / totalDeals) * 100) : 0;

  const summary: SummaryItem[] = [
    {
      value: loading ? spinner : <span>{totalDeals}</span>,
      label: "SKUS STOCKED",
      subLabel: "matching your filters",
      icon: <Package className={iconClass} />,
      accent: "blue",
    },
    {
      value: loading ? spinner : <span>{discountedDeals}</span>,
      label: "DISCOUNTED",
      subLabel: discountedShare ? `${discountedShare}% of catalog` : undefined,
      icon: <BadgePercent className={iconClass} />,
      accent: "violet",
    },
    {
      value: loading ? spinner : <span>{formatPercent(avgDiscount)}</span>,
      label: "AVG DISCOUNT",
      subLabel: "below MRP",
      icon: <Zap className={iconClass} />,
      accent: "amber",
    },
    {
      value: loading ? spinner : <span>{formatPercent(maxDiscount)}</span>,
      label: "MAX DISCOUNT",
      subLabel: "best deal in catalog",
      icon: <TrendingUp className={iconClass} />,
      accent: "emerald",
    },
  ];

  return <Summary data={summary} className={className} />;
};

export default CatalogSummary;
