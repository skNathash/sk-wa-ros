import { Calendar } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import { useTranslation } from "react-i18next";
import NoData from "~/components/core/no-data/NoData";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
}

const MobileView = ({ data, loading, callback }: MobileViewProps) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppCard key={`skeleton-${idx}`} noPadding={true}>
            <div className="tw:px-4 tw:py-3 tw:flex tw:items-start tw:animate-pulse">
              <div className="tw:w-2/3">
                <div className="tw:flex tw:items-center tw:gap-1">
                  <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-24 tw:mb-2"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                </div>
              </div>
              <div>
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16 tw:mb-1"></div>
                <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-20"></div>
              </div>
            </div>
            <Divider className="tw:my-0!" />
            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-center">
                <div className="tw:w-2/3">
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                </div>
                <div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-12 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
              </div>
            </div>
            <Divider className="tw:my-0!" />
            <div className="tw:px-4 tw:py-3 tw:flex tw:gap-4 tw:items-center tw:justify-end">
              <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-20"></div>
              <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-8"></div>
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
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-3">
      {data.map((item) => (
        <AppCard key={item._id || item.orderId} noPadding={true}>
          <div className="tw:px-4 tw:py-3 tw:flex tw:items-start">
            <div className="tw:w-[68%]">
              <div className="tw:flex tw:items-center tw:gap-1">
                <AppLink
                  asLink
                  href={`/dashboard/orders/view/${item.orderId}`}
                  className="tw:text-blue-600 tw:font-medium tw:text-base"
                  title={item.orderRefNo}
                >
                  {item.orderRefNo}
                </AppLink>
                {item._typeColor && (
                  <AppBadge
                    variant={item._typeColor}
                    className="tw:text-xs tw:ml-1"
                  >
                    {item.orderType}
                  </AppBadge>
                )}
              </div>

              <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
                <Calendar size={16} className="tw:text-slate-400" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.createdAt || item.orderedDate} />
                </div>
              </div>
            </div>

            <div>
              <div className="tw:text-xs tw:text-gray-500">
                {t("totalValue")}
              </div>
              <Amount
                value={item.totalAmount || item.orderAmount}
                decimalPlaces={2}
                className="tw:text-base tw:font-semibold"
              />
            </div>
          </div>

          <Divider className="tw:my-0!" />

          <div className="tw:px-4 tw:py-3">
            <div className="tw:flex tw:items-center">
              <div className="tw:w-[68%]">
                <div className="tw:text-xs tw:text-gray-500">{t("status")}</div>
                <div className="tw:mt-1">
                  {item._statusColor ? (
                    <AppBadge variant={item._statusColor || "default"}>
                      {item._statusLbl || item.status}
                    </AppBadge>
                  ) : (
                    <div className="tw:text-sm tw:font-semibold">
                      {item.status}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="tw:text-xs tw:text-gray-500">{t("items")}</div>
                <div>
                  <span className="tw:text-sm tw:font-semibold">
                    {item.items?.length || item.itemsCount || 0} {t("items")}
                  </span>
                </div>
              </div>
            </div>

            <div className="tw:mt-3 tw:flex tw:items-center">
              <div className="tw:w-[68%]">
                <div className="tw:text-xs tw:text-gray-500">{t("seller")}</div>
                {item.sellerInfo?.franchiseId ? (
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/b2b/${item.sellerInfo.franchiseId}`}
                    className="tw:text-sm tw:font-semibold tw:text-blue-600"
                  >
                    {item.sellerInfo?.name ||
                      item.sellerInfo?.franchiseName ||
                      "-"}
                  </AppLink>
                ) : (
                  <div className="tw:text-sm tw:font-semibold">
                    {item.sellerInfo?.name ||
                      item.sellerInfo?.franchiseName ||
                      "-"}
                  </div>
                )}
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("paymentType")}
                </div>
                <div className="tw:text-sm tw:font-semibold">
                  {item.paymentMethod || item.paymentType || "-"}
                </div>
              </div>
            </div>
          </div>

          <Divider className="tw:my-0!" />

          <div className="tw:px-4 tw:py-3 tw:flex tw:gap-4 tw:items-center tw:justify-between">
            <div>
              {item.orderSubType && (
                <AppBadge variant="secondary" className="tw:text-xs">
                  {item.orderSubType}
                </AppBadge>
              )}
            </div>
            <div className="tw:flex tw:gap-4 tw:items-center">
              <AppLink
                asLink
                href={`/dashboard/orders/view/${item.orderId}`}
                className="tw:flex tw:items-center"
              >
                <AppButton
                  color="light"
                  fill="outline"
                  size="small"
                  className="tw:px-8!"
                >
                  {t("view")}
                </AppButton>
              </AppLink>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
