import React from "react";
import { Phone } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import type { CustomerItem } from "../helper";

interface Props {
  loading: boolean;
  data: CustomerItem[];
  onSelect: (customer: CustomerItem) => void;
}

const MobileView: React.FC<Props> = ({ data, loading, onSelect }) => {
  if (loading) {
    return (
      <div className="tw:text-center tw:py-4">
        <AppSpinner />
      </div>
    );
  }

  if (!data.length) return <NoData />;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, idx) => {
        const id = item._id || item.id || String(idx);
        const franchiseId = item.franchiseId || item.refNo || "";

        return (
          <AppCard
            key={id}
            noPadding
            className="tw:mb-0 tw:cursor-pointer tw:hover:border-blue-300"
            onClick={() => onSelect(item)}
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-gradient-to-br tw:from-blue-400 tw:to-purple-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:text-sm tw:font-bold tw:flex-shrink-0">
                  {item.initials || "?"}
                </div>
                <div>
                  <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                    {item.name || "-"}
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-3 tw:mt-0.5">
                    {item.mobile && (
                      <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                        <Phone size={11} />
                        <span>{item.mobile}</span>
                      </div>
                    )}
                    {franchiseId && (
                      <span className="tw:text-xs tw:text-blue-600 tw:font-medium">
                        {franchiseId}
                      </span>
                    )}
                  </div>
                  {item.location && (
                    <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                      {item.location}
                    </div>
                  )}
                </div>
              </div>

              <AppButton
                size="small"
                color="primary"
                fill="outline"
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onSelect(item);
                }}
              >
                Select
              </AppButton>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
};

export default MobileView;
