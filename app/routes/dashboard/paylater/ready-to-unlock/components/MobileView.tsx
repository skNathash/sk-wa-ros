import { Sparkles } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { getAvatarColor } from "./helper.view";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  callback,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  if (!data.length) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      {data.map((row, idx) => (
        <AppCard key={row.id || idx} noPadding className="tw:mb-0">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
            <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
              <div
                className={`tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:rounded-xl tw:text-white tw:font-semibold tw:shrink-0 ${getAvatarColor(
                  row.name,
                )}`}
              >
                {row.initials || "?"}
              </div>
              <div className="tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:truncate">
                  {row.name || "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                  {row.bills} {t("bills")} · {t("avg")}{" "}
                  <Amount value={row.avgBillValue || 0} /> ·{" "}
                  {row.fulfillmentRate}%
                </div>
              </div>
            </div>

            <div className="tw:text-right tw:shrink-0">
              <div className="tw:text-base tw:font-bold tw:text-purple-600">
                <Amount value={row.suggestedLimit || 0} />
              </div>
              <div className="tw:text-xs tw:text-gray-400">
                {t("suggested")}
              </div>
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:flex tw:justify-end tw:px-4 tw:py-3">
            <AppButton
              size="small"
              color="primary"
              onClick={() =>
                callback && callback({ action: "unlock", data: row })
              }
            >
              <Sparkles size={16} />
              {t("readyToUnlock")}
            </AppButton>
          </div>
        </AppCard>
      ))}

      {showLoadMore && !loading && data.length > 0 && (
        <div className="tw:md:col-span-2 tw:text-center tw:mt-2">
          <LoadMoreButton
            loadMore={loadMore}
            loading={!!loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
