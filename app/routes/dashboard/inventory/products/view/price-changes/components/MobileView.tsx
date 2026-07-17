import { ArrowDownLeft, ArrowUpRight, Calendar, Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import SchemeDetailsPopover from "~/routes/configs/rsp/history/components/SchemeDetailsPopover";

interface MobileViewProps {
  data: any[];
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="mobile-view-list tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => {
          return (
            <AppCard key={item._id || idx} noPadding className="tw:mb-0">
              <div className="tw:p-4">
                <div className="tw:flex tw:justify-between tw:items-start">
                  <div>
                    <div className="tw:flex tw:flex-col tw:mb-1">
                      <span className="tw:text-xs tw:text-gray-500 tw:mb-1">
                        {t("updatedBy")}
                      </span>
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        <span className="tw:font-bold tw:text-gray-800 tw:text-lg">
                          {item.createdByName || t("unknownUser")}
                        </span>
                        {item.reason && (
                          <AppPopover
                            triggerContent={
                              <Info
                                size={16}
                                className="tw:text-gray-400 tw:cursor-pointer"
                              />
                            }
                          >
                            <div>
                              <div className="tw:text-xs">Remarks</div>
                              <p className="tw:text-xs tw:text-gray-700">
                                {item.reason}
                              </p>
                            </div>
                          </AppPopover>
                        )}
                      </div>
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-gray-500 tw:text-xs tw:mb-2">
                      <Calendar size={14} />
                      <DateFormat value={item.createdAt} />
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500">
                      {t("applicableForLabel")}{" "}
                      <div className="tw:inline-block tw:flex tw:flex-col tw:items-start">
                        <AppBadge variant={item.applicableForVariant}>
                          {item.applicableForText}
                        </AppBadge>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`tw:rounded-full tw:p-3 tw:border-2 ${
                      !item.isPositive
                        ? "tw:text-red-500 tw:border-red-100 tw:bg-red-50/30"
                        : "tw:text-green-500 tw:border-green-100 tw:bg-green-50/30"
                    }`}
                  >
                    {!item.isPositive ? (
                      <ArrowUpRight size={24} strokeWidth={1.5} />
                    ) : (
                      <ArrowDownLeft size={24} strokeWidth={1.5} />
                    )}
                  </div>
                </div>
              </div>

              <Divider className="tw:!m-0" />

              <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:p-4">
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <span className="tw:text-xs tw:text-gray-400">
                    {t("previousPrice")}
                  </span>
                  <span className="tw:text-gray-500 tw:font-medium">
                    <DisplayPrice
                      price={item.prevPrice}
                      uom={item.oldData?.selectedStockUom}
                    />
                  </span>
                </div>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <span className="tw:text-xs tw:text-gray-400">
                    {t("newPrice")}
                  </span>
                  <span className="tw:text-gray-900 tw:font-bold tw:text-lg">
                    <DisplayPrice
                      price={item.newPrice}
                      uom={item.newData?.selectedStockUom}
                    />
                  </span>
                  {item.newData?.offerDiscount ||
                  item.newData?.isOfferOfTheDay ? (
                    <div>
                      <SchemeDetailsPopover
                        oldData={item.oldData}
                        newData={item.newData}
                        triggerText="Scheme updated"
                      />
                    </div>
                  ) : (
                    <div className="tw:md:h-4"></div>
                  )}
                </div>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <span className="tw:text-xs tw:text-gray-400">
                    {t("mrp")}
                  </span>
                  {(() => {
                    const oldMrp = item.oldData?.mrp !== undefined ? Number(item.oldData.mrp) : 0;
                    const newMrp = item.newData?.mrp !== undefined ? Number(item.newData.mrp) : 0;
                    if (oldMrp > 0 || newMrp > 0) {
                      return (
                        <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:font-medium">
                          {oldMrp > 0 && oldMrp !== newMrp ? (
                            <>
                              <span className="tw:line-through tw:text-gray-400">
                                <DisplayPrice
                                  price={oldMrp}
                                  uom={item.oldData?.selectedStockUom}
                                  hideUom
                                />
                              </span>
                              <span className="tw:text-gray-300">→</span>
                            </>
                          ) : null}
                          <DisplayPrice
                            price={newMrp}
                            uom={item.newData?.selectedStockUom}
                            hideUom
                          />
                        </span>
                      );
                    }
                    return <span className="tw:text-gray-400 tw:text-xs">--</span>;
                  })()}
                </div>
              </div>

              <div
                className={`tw:p-4 tw:flex tw:justify-between tw:items-center tw:h-[50px] ${
                  !item.isPositive ? "tw:bg-red-50" : "tw:bg-green-50"
                }`}
              >
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                  <span>{t("change")}:</span>
                  <span
                    className={`tw:font-bold ${
                      !item.isPositive ? "tw:text-red-600" : "tw:text-green-600"
                    }`}
                  >
                    {item.change < 0 ? "" : "+"}
                    <DisplayPrice
                      price={item.change}
                      uom={item.newData?.selectedStockUom}
                      hideUom
                    />
                  </span>
                  <span className="tw:text-gray-300">/</span>
                  <span
                    className={`tw:font-bold ${
                      !item.isPositive ? "tw:text-red-600" : "tw:text-green-600"
                    }`}
                  >
                    {item.percent < 0 ? "" : "+"}
                    {item.percent.toFixed(1)}%
                  </span>
                  <span className="tw:text-gray-300">/</span>
                  <span className="tw:text-gray-500">
                    {(() => {
                      const oldMrp = item.oldData?.mrp !== undefined ? Number(item.oldData.mrp) : 0;
                      const newMrp = item.newData?.mrp !== undefined ? Number(item.newData.mrp) : 0;
                      if (oldMrp > 0 && oldMrp !== newMrp) {
                        return (
                          <>
                            {t("mrp")}: <span className="tw:line-through tw:text-gray-400"><DisplayPrice price={oldMrp} uom={item.oldData?.selectedStockUom} hideUom /></span> → <DisplayPrice price={newMrp} uom={item.newData?.selectedStockUom} hideUom />
                          </>
                        );
                      }
                      return (
                        <>
                          {t("mrp")}: <DisplayPrice price={newMrp} uom={item.newData?.selectedStockUom} hideUom />
                        </>
                      );
                    })()}
                  </span>
                </div>
                {item.newData?.isFixedPrice && (
                  <AppPopover
                    triggerContent={
                      <div className="tw:flex tw:items-center tw:gap-1 tw:bg-white tw:border tw:border-gray-100 tw:shadow-sm tw:rounded-md tw:px-2 tw:py-1 tw:cursor-pointer">
                        <span className="tw:text-[10px] tw:font-bold tw:text-gray-600 tw:uppercase">
                          {t("fixed")}
                        </span>
                        <Info size={12} className="tw:text-gray-400" />
                      </div>
                    }
                  >
                    <div>
                      <div className="tw:text-xs tw:font-semibold">
                        Fixed Price
                      </div>
                      <p className="tw:text-xs tw:text-gray-700">
                        This item is sold at a fixed price, not subject to
                        discounts or variations.
                      </p>
                    </div>
                  </AppPopover>
                )}
              </div>
            </AppCard>
          );
        })}
      </div>
      {showLoadMore && data.length > 0 && (
        <div className="tw:min-h-[60px] tw:flex tw:justify-center tw:items-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
