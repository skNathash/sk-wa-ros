import { BoxIcon, IndianRupee, ShoppingCart, Users } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

const iconForKey = (key: string) => {
  switch (key) {
    case "totalOrders":
      return <ShoppingCart />;
    case "totalValue":
      return <IndianRupee />;
    case "totalUnits":
      return <BoxIcon />;
    case "totalCustomers":
      return <Users />;
    default:
      return <ShoppingCart />;
  }
};

const Summary = ({ summary }: { summary: Array<Record<string, any>> }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:md:gap-6 tw:gap-2 tw:mb-4">
      {summary.map((it) => (
        <AppStatsCard
          key={it.key}
          label={it.label}
          icon={iconForKey(it.key)}
          template={1}
          color={it.color}
        >
          <span className="tw:text-xl tw:font-bold">
            {it.loading ? (
              <AppSpinner size="sm" />
            ) : it.key === "totalValue" ? (
              <Amount value={Number(it.value)} />
            ) : (
              it.value
            )}
          </span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
