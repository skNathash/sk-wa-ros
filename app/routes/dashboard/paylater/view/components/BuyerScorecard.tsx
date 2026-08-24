import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import {
  EMPTY_SCORECARD,
  getBuyerScorecard,
  type BuyerScorecard as BuyerScorecardData,
} from "../helper";

interface BuyerScorecardProps {
  /** The buyer the request belongs to. */
  buyerId: string;
  className?: string;
}

/**
 * What this buyer is worth to the seller, read before the limit is set: what
 * they have spent, how big a cart runs, how much of it was actually delivered
 * and how they have handled the credit they already hold.
 */
const BuyerScorecard = ({ buyerId, className = "" }: BuyerScorecardProps) => {
  const [data, setData] = useState<BuyerScorecardData>(EMPTY_SCORECARD);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buyerId) return;
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getBuyerScorecard(buyerId);
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setData(EMPTY_SCORECARD);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [buyerId]);

  const summaryItems = [
    {
      key: "spend",
      label: `${data.months}-month spend`,
      value: data.spend,
      icon: "calendar-days",
      color: "success" as const,
      description: `${data.orders} ${data.orders === 1 ? "order" : "orders"}`,
      isValueAmount: true,
    },
    {
      key: "avgOrderValue",
      label: "Avg cart",
      value: data.avgOrderValue,
      icon: "shopping-cart",
      color: "info" as const,
      description: "per order",
      isValueAmount: true,
    },
    {
      key: "fillRate",
      label: "Fill rate",
      value: data.fillRate === null ? "—" : `${data.fillRate}%`,
      icon: "circle-check-big",
      color: "secondary" as const,
      description: "delivered in full",
    },
    {
      key: "onTimeRate",
      label: "On-time pay",
      value: data.onTimeRate === null ? "—" : `${data.onTimeRate}%`,
      icon: "wallet",
      color: "warning" as const,
      description: data.walletCount
        ? `across ${data.walletCount} ${
            data.walletCount === 1 ? "wallet" : "wallets"
          }`
        : "no wallets yet",
    },
  ];

  return (
    <div
      className={`tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mb-4 ${className}`}
    >
      {summaryItems.map((item) => (
        <AppStatsCard
          key={item.key}
          label={item.label}
          icon={item.icon}
          color={item.color}
          template={2}
        >
          <div className="tw:text-2xl tw:font-bold">
            {loading ? (
              <AppSpinner />
            ) : (
              <>
                {item.isValueAmount ? (
                  <Amount value={Number(item.value) || 0} decimalPlaces={0} />
                ) : (
                  <span className="tw:text-gray-500">{item.value}</span>
                )}
              </>
            )}
          </div>
          <div className="tw:text-xs tw:text-gray-500">{item.description}</div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default BuyerScorecard;
