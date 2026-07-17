import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import { Hash, Package } from "lucide-react";

interface UserMobileViewProps {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  tab?: string;
}

const UserMobileView: React.FC<UserMobileViewProps> = ({
  data,
  loading,
  callback,
  tab,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-24 tw:rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        {t("noDataFound")}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((row, idx) => {
        const userId = row.shipmentUserId || row.shipmentUserInfo?.id;
        const userName = row.shipmentUserInfo?.name || row.userName || "-";
        const refId = row.refId || row.shipmentUserInfo?.refId;
        const orderCount = row.count || row.totalCount || 0;
        return (
          <AppCard key={userId || idx} noPadding className="tw:mb-0">
            <div className="tw:flex tw:items-center tw:gap-3 tw:p-4 tw:pb-3">
              <span className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:bg-slate-100 tw:text-slate-700 tw:text-sm tw:font-semibold tw:shrink-0">
                {row.initial}
              </span>
              <div className="tw:flex tw:flex-col tw:min-w-0 tw:flex-1">
                <div className="tw:font-medium tw:text-slate-900 tw:truncate">
                  {userId ? (
                    <AppLink
                      href={`/dashboard/employee/view/${userId}`}
                      asLink
                      showLinkColor
                    >
                      {userName}
                    </AppLink>
                  ) : (
                    userName
                  )}
                </div>
                {refId && (
                  <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[11px] tw:text-slate-500 tw:font-mono">
                    <Hash size={10} className="tw:text-slate-400" />
                    {refId}
                  </span>
                )}
              </div>
            </div>
            <div className="tw:flex tw:items-stretch tw:border-t tw:border-slate-100">
              <div className="tw:flex-1 tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-0.5">
                <span className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-slate-400 tw:font-medium">
                  {t("orders")}
                </span>
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-slate-800 tw:tabular-nums">
                  <Package size={12} className="tw:text-slate-400" />
                  <span className="tw:font-semibold">{orderCount}</span>
                </span>
              </div>
              <div className="tw:w-px tw:bg-slate-100" />
              <div className="tw:flex-1 tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-0.5 tw:items-end">
                <span className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-slate-400 tw:font-medium">
                  {t("totalAmount")}
                </span>
                <Amount
                  value={row.totalAmount}
                  decimalPlaces={2}
                  className="tw:text-slate-900 tw:font-bold tw:text-base tw:tabular-nums"
                />
              </div>
            </div>
            {tab !== "handedover" && (
              <div className="tw:flex tw:justify-end tw:px-4 tw:py-3 tw:border-t tw:border-slate-100">
                <AppButton
                  type="button"
                  size="small"
                  onClick={() =>
                    callback({
                      action: "handover",
                      data: { ...row, userId },
                    })
                  }
                >
                  {t("handover")}
                </AppButton>
              </div>
            )}
          </AppCard>
        );
      })}
    </div>
  );
};

export default UserMobileView;
