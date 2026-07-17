import { Eye } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

type Props = {
  data: Array<any>;
  groupByType?: string;
  loading?: boolean;
};

const MobileView: React.FC<Props> = ({ data, loading }) => {
  const { t } = useTranslation(["common"]);

  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="tw:p-3 tw:bg-white tw:rounded tw:shadow-sm tw:animate-pulse"
            >
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2" />
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-3/4" />
            </div>
          ))
        : data.map((item, idx) => (
            <AppCard key={idx} className="tw:flex tw:flex-col tw:mb-0">
              {/* Top grid: Order ID, Status */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:items-start">
                <div>
                  <KeyValue label={t("orderId")} size="sm">
                    <div className="tw:font-medium">
                      <AppLink
                        asLink
                        href={item.orderLink}
                        showLinkColor={true}
                      >
                        {item.orderId}
                      </AppLink>
                    </div>
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("status")} size="sm">
                    <AppBadge variant={item._statusColor}>
                      {item._statusLabel}
                    </AppBadge>
                  </KeyValue>
                </div>

                {/* Vendor - full width with name and ID on same row */}
                <div className="tw:col-span-2">
                  <KeyValue label={t("vendor")} size="sm">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:text-sm tw:font-medium">
                        {item.vendorLink ? (
                          <AppLink
                            asLink
                            href={item.vendorLink}
                            showLinkColor={true}
                          >
                            {item.vendorInfo?.name}
                          </AppLink>
                        ) : (
                          <span>{item.vendorInfo?.name}</span>
                        )}
                      </div>
                      {item.vendorInfo?.refId && (
                        <span className="tw:text-xs tw:text-gray-500">
                          (ID: {item.vendorInfo.refId})
                        </span>
                      )}
                      {item._vendorType && (
                        <VendorTypeBadge
                          type={item._vendorType}
                          color={item._vendorTypeColor}
                          description={item._vendorTypeInfo}
                          className="tw:text-[10px]"
                        />
                      )}
                    </div>
                  </KeyValue>
                </div>
              </div>

              {/* Divider */}
              <div className="tw:my-3 tw:border-t tw:border-gray-200" />

              {/* Ordered On & Ordered Items */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <div>
                  <KeyValue label={t("orderedOn")} size="sm">
                    {item.createdAt ? (
                      <div>
                        <div className="tw:font-medium">
                          <DateFormat
                            value={item.createdAt}
                            formatStr="dd MMM yyyy"
                          />
                        </div>
                        <div className="tw:text-xs tw:text-gray-500">
                          <DateFormat
                            value={item.createdAt}
                            formatStr="hh:mm a"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="tw:text-sm">--</div>
                    )}
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("orderedItems")} size="sm">
                    <div>
                      <div className="tw:font-medium">
                        {item.orderedItemCount ?? 0} {t("items")}{" "}
                        <span className="tw:text-xs tw:text-gray-500 tw:font-normal">
                          ({item.orderedUnitCount ?? 0} units)
                        </span>
                      </div>
                      <div className="tw:font-medium tw:text-xs">
                        <Amount
                          value={item.totalAmount ?? 0}
                          decimalPlaces={2}
                          className="tw:text-green-600"
                        />
                      </div>
                    </div>
                  </KeyValue>
                </div>
              </div>

              {/* Divider */}
              <div className="tw:my-3 tw:border-t tw:border-gray-200" />

              {/* Received Date & Received Items */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <div>
                  <KeyValue label={t("receivedDate")} size="sm">
                    {item.receivedDate ? (
                      <div>
                        <div className="tw:font-medium">
                          <DateFormat
                            value={item.receivedDate}
                            formatStr="dd MMM yyyy"
                          />
                        </div>
                        <div className="tw:text-xs tw:text-gray-500">
                          <DateFormat
                            value={item.receivedDate}
                            formatStr="hh:mm a"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="tw:text-sm tw:text-gray-400">--</div>
                    )}
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("receivedItems")} size="sm">
                    {item.receivedDate ? (
                      <div>
                        <div className="tw:font-medium">
                          {item.receivedPOCount ?? 0} {t("items")}{" "}
                          <span className="tw:text-xs tw:text-gray-500 tw:font-normal">
                            ({item.receivedUnits ?? 0} units)
                          </span>
                        </div>
                        <div className="tw:text-xs tw:font-medium">
                          <Amount
                            value={item.receivedPOValue ?? 0}
                            decimalPlaces={2}
                            className="tw:text-green-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="tw:text-sm tw:text-gray-400">--</div>
                    )}
                  </KeyValue>
                </div>
              </div>

              {/* Action Button */}
              <div className="tw:mt-3 tw:flex tw:justify-between tw:items-center">
                <div>
                  {item._sourceType && (
                    <AppBadge variant={item._sourceType.color as any}>
                      <span className="tw:text-xs">
                        {item._sourceType.name}
                      </span>
                    </AppBadge>
                  )}
                </div>
                <AppLink asLink href={item.orderLink}>
                  <AppButton size="small" color="light" fill="outline">
                    <Eye />
                    {t("view")}
                  </AppButton>
                </AppLink>
              </div>
            </AppCard>
          ))}
    </div>
  );
};

export default MobileView;
