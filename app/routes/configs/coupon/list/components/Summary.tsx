import React from "react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import useScreenView from "~/hooks/useScreenView";
import { defaultSummary, type CouponSummary } from "../helper";

interface Props {
  summary: CouponSummary;
  loading?: boolean;
  onStatusSelect?: (status: string) => void;
}

const Summary: React.FC<Props> = ({
  summary,
  loading = false,
  onStatusSelect,
}) => {
  const { isMobile } = useScreenView();

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-2">
        {defaultSummary.map((item, index) => (
          <div key={index} className="tw:w-full">
            <AppStatsCard
              label={item.label}
              icon={<item.icon size={16} />}
              template={isMobile ? 1 : 2}
              color={item.color as any}
              onClick={() => onStatusSelect?.(item.status)}
            >
              <div className="tw:text-lg tw:lg:text-2xl tw:font-semibold">
                {loading
                  ? "—"
                  : summary[item.valueKey as keyof CouponSummary] || 0}
              </div>
            </AppStatsCard>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
