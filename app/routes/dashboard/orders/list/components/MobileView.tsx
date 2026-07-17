import { Calendar, Download, Eye } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
  activeTab?: string;
}

const MobileView = ({
  data,
  loading,
  callback,
  activeTab,
}: MobileViewProps) => {
  const { t } = useTranslation(["common"]);

  // Loading state
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
            <Divider className="tw:!my-0" />
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
              <div className="tw:mt-3 tw:flex tw:items-center">
                <div className="tw:w-2/3">
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                </div>
                <div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-12 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
              </div>
            </div>
            <Divider className="tw:!my-0" />
            <div className="tw:px-4 tw:py-3 tw:flex tw:gap-4 tw:items-center tw:justify-end">
              <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-20"></div>
              <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-8"></div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  // Data state
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-3">
      {data.map((item) => (
        <AppCard key={item.orderId} noPadding={true}>
          <div className="tw:px-4 tw:py-3 tw:flex tw:items-start">
            <div className="tw:w-[68%]">
              <div className="tw:flex tw:items-center tw:gap-1">
                <AppLink
                  asLink
                  href={`/dashboard/orders/view/${item.orderId}`}
                  className="tw:text-blue-600"
                >
                  <span className="tw:text-blue-600 tw:font-medium tw:text-base">
                    {item.orderRefNo}
                  </span>
                </AppLink>
              </div>

              <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
                <Calendar size={16} className="tw:text-slate-400" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.orderedDate} />
                </div>
              </div>

              {activeTab !== "b2c-orders" && (
                <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:flex tw:items-start tw:gap-1.5">
                    <span className="tw:text-[10px] tw:text-gray-400 tw:font-medium tw:uppercase tw:mt-0.5">
                      {t("route")}:
                    </span>
                    <span className="tw:text-xs tw:font-medium tw:text-blue-600">
                      {item.routeInfo
                        ? item.routeInfo.description ||
                          item.routeInfo.routeCode ||
                          "No route"
                        : "No route"}
                    </span>
                  </div>

                  <div className="tw:flex tw:items-baseline tw:gap-1.5 ">
                    <span className="tw:text-[10px] tw:text-gray-400 tw:font-medium tw:uppercase">
                      {t("deliveryDate")}:
                    </span>
                    <div className="tw:text-xs tw:text-gray-500">
                      {item.routeInfo?.deliveryDate ? (
                        <DateFormat
                          value={item.routeInfo.deliveryDate}
                          formatStr="dd MMM yyyy"
                        />
                      ) : (
                        <span>--</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="tw:text-right">
              <div className="tw:text-[10px] tw:text-gray-400 tw:font-medium tw:uppercase">
                {t("totalValue")}
              </div>
              <Amount
                value={item.orderAmount}
                decimalPlaces={2}
                className="tw:text-base tw:font-bold tw:text-slate-800"
              />
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:px-4 tw:py-3">
            <div className="tw:flex tw:items-center">
              <div className="tw:w-[68%]">
                <div className="tw:text-xs tw:text-gray-500">
                  {activeTab === "my-orders"
                    ? t("purchasedFrom")
                    : t("customer")}
                </div>
                <div className="tw:mt-1">
                  <div className="tw:text-sm tw:font-medium tw:text-slate-700">
                    {activeTab === "my-orders" ? (
                      item.sellerInfo?.franchiseName || "-"
                    ) : item.customerInfo ? (
                      item.customerInfo.isGuestCustomer ? (
                        <div>
                          <AppBadge variant="secondary">
                            {t("walkin-customer")}
                          </AppBadge>
                        </div>
                      ) : (
                        <div className="tw:flex tw:flex-col tw:gap-1">
                          <AppLink
                            asLink
                            href={`/dashboard/network/view/${
                              item.orderType === "B2B" ? "b2b" : "b2c"
                            }/${item.customerInfo.customerId}`}
                            className="tw:text-blue-600 tw:font-semibold"
                          >
                            {item.customerInfo.name}
                          </AppLink>
                          <div className="tw:flex tw:gap-1 tw:flex-wrap">
                            <AppBadge
                              variant={item._typeColor}
                              className="tw:text-[10px] tw:px-1.5 tw:py-0"
                            >
                              {item.orderType}
                            </AppBadge>
                            {activeTab === "b2c-orders" && item.pickupType && (
                              <AppBadge
                                variant={item.pickupTypeColor}
                                className="tw:text-[10px] tw:px-1.5 tw:py-0"
                              >
                                {item.pickupType}
                              </AppBadge>
                            )}
                          </div>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("totalItems")}
                </div>
                <div className="tw:mt-1">
                  <div className="tw:text-sm tw:font-medium tw:text-slate-700">
                    {item.itemsCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="tw:mt-3 tw:flex tw:items-start">
              <div className="tw:w-[68%]">
                <div className="tw:text-xs tw:text-gray-500">
                  {t("paymentType")}
                </div>
                <div className="tw:flex tw:gap-1 tw:items-center">
                  <div className="tw:text-sm tw:font-semibold tw:mt-1">
                    {item.paymentMethod}
                  </div>
                  <div>
                    <AppBadge
                      variant={item._paymentStatusColor || "default"}
                      className="tw:text-[9px]"
                    >
                      {item._paymentStatusLbl || "-"}
                    </AppBadge>
                  </div>
                </div>
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("orderStatus")}
                </div>
                <div className="tw:mt-1">
                  <AppBadge variant={item._statusColor || "default"}>
                    {item._statusLbl}
                  </AppBadge>
                </div>
              </div>
            </div>

            {item.createdBy?.name && (
              <div className="tw:mt-3">
                <div className="tw:text-xs tw:text-gray-500">
                  {t("createdBy")}
                </div>
                <div className="tw:text-xs tw:font-medium tw:text-slate-600">
                  {item.createdBy.name}
                </div>
              </div>
            )}
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:px-4 tw:py-3 tw:flex tw:gap-4 tw:items-center tw:justify-between">
            <div className="tw:flex tw:gap-1 tw:flex-wrap tw:items-center">
              {item.orderSubType && (
                <AppBadge
                  variant={item._subTypeColor || "secondary"}
                  className="tw:text-xs"
                >
                  {item.orderSubType}
                </AppBadge>
              )}
              {item._isReserveOrder && <ReserveBadge template={2} />}
              {item.assistedOrder === true && (
                <AppBadge variant="primary" className="tw:text-xs">
                  Assisted
                </AppBadge>
              )}
              {item.quickCheckout === true && (
                <AppBadge variant="warning" className="tw:text-xs">
                  Quick Checkout
                </AppBadge>
              )}
            </div>
            <div className="tw:flex tw:gap-4 tw:items-center">
              <AppButton
                color="light"
                fill="outline"
                size="small"
                className="tw:!px-8"
                onClick={() =>
                  callback && callback({ action: "view-order", data: item })
                }
              >
                <Eye />
                {t("view")}
              </AppButton>

              {item.invoices && item.invoices.length > 0 && (
                <>
                  {item.orderType === "B2C" ? (
                    <PrintReceipt
                      orderId={item.orderId}
                      size="small"
                      onlyIcon={true}
                    />
                  ) : (
                    <AppButton
                      color="primary"
                      fill="outline"
                      size="small"
                      onClick={() =>
                        callback &&
                        callback({ action: "download-invoice", data: item })
                      }
                    >
                      <Download />
                    </AppButton>
                  )}
                </>
              )}
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
