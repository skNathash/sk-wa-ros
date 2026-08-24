import { Check, ChevronRight, Clock, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { getInitial, getTint } from "../helper";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
  callback?: (payload: { action: string; data: any }) => void;
}

/** The approval queue as cards — one decision per card on small screens. */
const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  callback,
}) => {
  const { t } = useTranslation();

  if (loading)
    return (
      <div className="tw:text-center tw:py-4">
        <AppSpinner />
      </div>
    );

  if (!data.length) return <NoData />;

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        {data.map((row) => {
          const name = row.userInfo?.name || "-";
          const requestedLimit =
            Number(row.requestedLimit ?? row.creditLimit) || 0;
          const kycApproved = row.kycStatus === "Approved";

          return (
            <AppCard key={row._id} noPadding className="tw:mb-0">
              <div className="tw:px-4 tw:py-3">
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div
                    className={`tw:shrink-0 tw:w-11 tw:h-11 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-base tw:font-semibold ${getTint(
                      name,
                    )}`}
                  >
                    {getInitial(name)}
                  </div>

                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
                      <AppLink
                        asLink
                        href={row.viewBtnLink}
                        className="tw:text-base tw:font-semibold tw:truncate"
                        showLinkColor
                      >
                        {name}
                      </AppLink>
                      {row.userCategory && (
                        <span className="tw:shrink-0 tw:text-[10px] tw:font-medium tw:text-indigo-500">
                          {row.userCategory}
                        </span>
                      )}
                    </div>

                    <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500">
                      {requestedLimit > 0 && (
                        <span className="tw:whitespace-nowrap">
                          <Amount
                            value={requestedLimit}
                            decimalPlaces={0}
                            className="tw:font-semibold tw:text-gray-800"
                          />
                        </span>
                      )}
                      {row.createdAt && (
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:text-gray-400">
                          <Clock size={12} />
                          <DateFormat value={row.createdAt} formatStr="dd MMM" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="tw:shrink-0 tw:flex tw:items-center tw:gap-1">
                    <AppBadge variant={row.kycStatusColor}>
                      {row.kycStatus}
                    </AppBadge>
                    <AppLink
                      href={row.viewBtnLink}
                      asLink
                      className="tw:text-gray-400"
                    >
                      <ChevronRight size={20} />
                    </AppLink>
                  </div>
                </div>

                <Rbac roles={["ACCOUNTS.PAYLATER-MANAGE-LIMIT"]}>
                  <div className="tw:mt-3 tw:flex tw:gap-2">
                    <AppButton
                      size="small"
                      color="danger"
                      fill="outline"
                      className="tw:flex-1 tw:justify-center"
                      onClick={() => callback?.({ action: "reject", data: row })}
                    >
                      <X size={14} />
                      {t("reject", { defaultValue: "Reject" })}
                    </AppButton>
                    {/* Approving before KYC clears would sanction credit on an
                        unverified customer — hold the action until it does. */}
                    <AppButton
                      size="small"
                      color="success"
                      fill="solid"
                      className="tw:flex-1 tw:justify-center"
                      // disabled={!kycApproved}
                      onClick={() =>
                        callback?.({ action: "approve", data: row })
                      }
                    >
                      <Check size={14} />
                      {t("approve", { defaultValue: "Approve" })}
                    </AppButton>
                  </div>
                </Rbac>
              </div>
            </AppCard>
          );
        })}
      </div>

      {showLoadMore && loadMore && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={!!loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
          loaderType="button"
        />
      )}
    </>
  );
};

export default MobileView;
