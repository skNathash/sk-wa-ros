import { Calendar, FileText, User } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  callback: (a: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, loading, callback }) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppCard key={`skeleton-${idx}`} noPadding={true}>
            <div className="tw:px-4 tw:py-4 tw:flex tw:items-start tw:animate-pulse">
              <div className="tw:flex-1">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                  <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
                <div className="tw:mt-3 tw:h-4 tw:bg-gray-200 tw:rounded tw:w-32"></div>
              </div>
              <div className="tw:ml-4">
                <div className="tw:h-6 tw:bg-gray-200 tw:rounded tw:w-20"></div>
              </div>
            </div>
            <Divider className="tw:!my-0" />
            <div className="tw:px-4 tw:py-4 tw:space-y-3">
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:h-4 tw:w-4 tw:bg-gray-200 tw:rounded-full"></div>
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-40"></div>
              </div>
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:h-4 tw:w-4 tw:bg-gray-200 tw:rounded-full"></div>
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-full"></div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item) => (
        <AppCard
          key={item._id}
          noPadding={true}
          className="tw:overflow-hidden tw:mb-0"
        >
          <div className="tw:px-4 tw:py-3 tw:flex tw:justify-between tw:items-start">
            <div className="tw:space-y-2">
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:text-gray-400 tw:flex-shrink-0">
                  <User size={16} />
                </div>
                <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:truncate">
                  {item.customerName ? (
                    <AppLink
                      asLink={true}
                      href={`/dashboard/network/view/b2c/${item.customerId}`}
                      className="tw:text-blue-600 hover:tw:underline"
                    >
                      {item.customerName}
                    </AppLink>
                  ) : (
                    <span className="tw:text-gray-500">-</span>
                  )}
                </div>
              </div>

              <div className="tw:flex tw:items-start tw:gap-3">
                <div className="tw:text-gray-400 tw:flex-shrink-0 tw:mt-0.5">
                  <FileText size={16} />
                </div>
                <div className="tw:text-xs tw:text-gray-600 tw:leading-snug">
                  {item.reason || (
                    <span className="tw:text-gray-400 tw:italic">
                      {t("noDescription")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="tw:text-right tw:flex-shrink-0">
              <div
                className={`tw:text-lg tw:font-bold ${
                  item.type === "earn" ? "tw:text-green-600" : "tw:text-red-600"
                }`}
              >
                {item.amount != null
                  ? `${item.type === "earn" ? "+" : "-"}${Math.abs(
                      Number(item.amount)
                    )}`
                  : "--"}
              </div>
              <div className="tw:text-[10px] tw:text-gray-400 tw:uppercase tw:font-medium tw:mt-0.5">
                {t("points")}
              </div>
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:px-4 tw:py-3">
            <div className="tw:flex-1 tw:mr-4">
              <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-2 tw:mb-1">
                {item.transactionRefId ? (
                  <AppLink
                    asLink
                    href={item._redirectionUrl || "#"}
                    className="tw:text-blue-600 hover:tw:underline"
                  >
                    <span className="tw:font-semibold tw:text-base">
                      {item.transactionRefId}
                    </span>
                  </AppLink>
                ) : (
                  <span className="tw:text-gray-500 tw:italic">
                    {t("noReference")}
                  </span>
                )}
                <AppBadge
                  variant={item._typeColor || "default"}
                  className="tw:text-[10px] tw:px-1.5 tw:py-0.5 tw:uppercase tw:tracking-wider"
                >
                  {item._typeLbl}
                </AppBadge>
              </div>

              <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-gray-500">
                <Calendar size={14} />
                <span className="tw:text-xs">
                  <DateFormat value={item.createdAt} />
                </span>
              </div>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
