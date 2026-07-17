import { BoxIcon, PackageIcon } from "lucide-react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { useFormContext, useWatch } from "react-hook-form";
import React from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Props = {
  loading: boolean;
};

const Summary: React.FC<Props> = ({ loading }) => {
  const { control } = useFormContext();

  const products: any[] = useWatch({ control, name: "products" }) || [];

  const totalProducts = products.length;
  const totalEnabled = products.filter(
    (p) => p?.formData?.isPromotionalDeal === "yes",
  ).length;
  const totalDisabled = products.filter(
    (p) => p?.formData?.isPromotionalDeal === "no",
  ).length;

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:md:gap-6 tw:gap-2 tw:mb-4">
      <AppStatsCard
        label="Total Products"
        icon={<PackageIcon />}
        template={1}
        color="info"
      >
        {loading ? (
          <AppSpinner />
        ) : (
          <span className="tw:text-xl tw:font-bold">{totalProducts}</span>
        )}
      </AppStatsCard>

      <AppStatsCard
        label="Promotional Enabled"
        icon={<BoxIcon />}
        template={1}
        color="success"
      >
        {loading ? (
          <AppSpinner />
        ) : (
          <span className="tw:text-xl tw:font-bold">{totalEnabled}</span>
        )}
      </AppStatsCard>

      <AppStatsCard
        label="Promotional Disabled"
        icon={<BoxIcon />}
        template={1}
        color="warning"
      >
        {loading ? (
          <AppSpinner />
        ) : (
          <span className="tw:text-xl tw:font-bold">{totalDisabled}</span>
        )}
      </AppStatsCard>
    </div>
  );
};

export default Summary;
