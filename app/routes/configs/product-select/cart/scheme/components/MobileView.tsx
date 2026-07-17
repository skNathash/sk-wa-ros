import { Trash2, Edit3 } from "lucide-react";
import React from "react";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppLink from "~/components/core/link/AppLink";
import {
  useFieldArray,
  useFormContext,
  Controller,
  useWatch,
} from "react-hook-form";
import CalcDiscountPrice from "~/shared/catalog/components/CalcDiscountPrice";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import DateFormat from "~/components/core/date/DateFormat";
import type { DayPickerProps } from "react-day-picker";
import KeyValue from "~/components/core/key-value/KeyValue";
import DisplayProfit from "~/shared/others/components/DisplayProfit";

type Props = {
  callback?: (args: { action: string; data?: any }) => void;
  loading: boolean;
  animateApply?: boolean;
};

const dateConfig: DayPickerProps = {
  startMonth: new Date(),
};

const MobileView: React.FC<Props> = ({ callback, loading, animateApply }) => {
  const { control } = useFormContext();

  const watchedProducts = useWatch({ control, name: "products" });

  const { fields } = useFieldArray({
    control,
    name: "products",
  });

  if (!fields || fields.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <AppCard key={idx} noPadding className="tw:h-[180px]">
            <div className="tw:p-2.5 tw:h-full tw:flex tw:flex-col tw:justify-between">
              <div className="tw:flex tw:gap-2">
                <div className="skeleton-loader tw:w-14 tw:h-14 tw:rounded-lg"></div>
                <div className="tw:flex-1">
                  <div className="skeleton-loader tw:h-4 tw:w-3/4 tw:mb-1"></div>
                  <div className="skeleton-loader tw:h-3 tw:w-1/2"></div>
                </div>
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                <div className="skeleton-loader tw:h-7 tw:w-full tw:rounded-lg"></div>
                <div className="skeleton-loader tw:h-7 tw:w-full tw:rounded-lg"></div>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center">
                <div className="skeleton-loader tw:h-6 tw:w-16"></div>
                <div className="tw:flex tw:gap-1.5">
                  <div className="skeleton-loader tw:h-7 tw:w-7 tw:rounded-lg"></div>
                  <div className="skeleton-loader tw:h-7 tw:w-7 tw:rounded-lg"></div>
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
      {fields.map((item: any, idx: number) => {
        const deal = item.dealInfo || {};
        const image = deal.images?.[0];
        const name = deal.dealName || deal.name || "-";
        const id = deal.dealRefId || deal._id || "";
        const offerDiscount = watchedProducts?.[idx]?.formData?.offerDiscount;
        const offerStartDate = item.formData?.offerStartDate;
        const offerEndDate = item.formData?.offerEndDate;
        const b2bPrice = deal.b2bPrice;
        const purchasePrice = deal.purchasePrice;
        const mrp = deal.mrp;

        const schemePrice = watchedProducts?.[idx]?.formData?.schemePrice ?? 0;

        return (
          <AppCard
            noPadding
            className={
              animateApply
                ? " animate__animated animate__pulse animate__infinite tw:bg-blue-50/30"
                : ""
            }
            key={item._id || idx}
          >
            <div className="tw:p-2.5" id={`item-${idx}`}>
              {/* Product Header */}
              <div className="tw:flex tw:gap-2.5 tw:mb-2">
                <div className="tw:relative tw:flex-shrink-0 tw:w-14 tw:h-14 tw:rounded-lg tw:overflow-hidden tw:bg-gray-50 tw:border tw:border-gray-100 tw:shadow-sm">
                  {image ? (
                    <ImgRender
                      assetId={image}
                      alt={name}
                      className="tw:object-cover tw:h-full tw:w-full"
                      size="200x200"
                    />
                  ) : (
                    <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center">
                      <div className="tw:text-[10px] tw:text-gray-400">
                        No Image
                      </div>
                    </div>
                  )}
                  {offerDiscount > 0 && (
                    <div className="tw:absolute tw:top-0 tw:left-0 tw:bg-orange-500 tw:text-white tw:text-[8px] tw:font-bold tw:px-1 tw:py-0.5 tw:rounded-br-lg">
                      {offerDiscount}%
                    </div>
                  )}
                </div>

                <div className="tw:flex-1 tw:min-w-0">
                  <h3 className="tw:text-[12px] tw:font-bold tw:text-gray-900 tw:line-clamp-2 tw:leading-tight tw:mb-0.5">
                    <AppLink
                      asLink={true}
                      href={`/dashboard/inventory/products/view/${deal?.dealId}`}
                      className="tw:font-medium"
                    >
                      {name}
                    </AppLink>
                  </h3>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div className="tw:text-xs tw:text-gray-500">ID: {id}</div>
                    <div className="tw:text-xs tw:text-gray-500">
                      Tax: {deal?.tax || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mb-2">
                <div className="tw:bg-gray-50 tw:rounded-lg tw:p-1.5 tw:border tw:border-gray-100">
                  <span className="tw:block tw:text-[8px] tw:text-gray-500 tw:uppercase tw:font-bold tw:mb-0.5">
                    MRP
                  </span>
                  <span className="tw:text-[11px] tw:font-bold tw:text-gray-700">
                    <DisplayPrice price={mrp ?? 0} uom={deal?.selectedStockUom} />
                  </span>
                </div>
                <div className="tw:bg-gray-50 tw:rounded-lg tw:p-1.5 tw:border tw:border-gray-100">
                  <span className="tw:block tw:text-[8px] tw:text-gray-500 tw:uppercase tw:font-bold tw:mb-0.5">
                    B2B Price
                  </span>
                  <span className="tw:text-[11px] tw:font-bold tw:text-gray-700 tw:line-through tw:opacity-50">
                    <DisplayPrice price={b2bPrice ?? 0} uom={deal?.selectedStockUom} />
                  </span>
                </div>
                <div className="tw:bg-primary/5 tw:rounded-lg tw:p-1.5 tw:border tw:border-primary/10">
                  <span className="tw:block tw:text-[8px] tw:text-primary tw:uppercase tw:font-bold tw:mb-0.5">
                    Scheme price
                  </span>
                  <span className="tw:text-[13px] tw:font-black tw:text-primary">
                    <DisplayPrice
                      price={item.formData?.schemePrice ?? 0}
                      uom={deal?.selectedStockUom}
                    />
                  </span>
                </div>
              </div>

              {/* Scheme Discount */}
              <div className="tw:flex tw:items-center tw:justify-between tw:px-0.5 tw:mb-2">
                <span className="tw:text-[9px] tw:text-gray-500 tw:font-medium">
                  Scheme Discount
                </span>
                <span className="tw:text-[9px] tw:text-gray-900 tw:font-bold">
                  {offerDiscount ? `${offerDiscount}%` : "N/A"}
                </span>
              </div>

              {/* Validity & Info */}
              <div className="tw:flex tw:flex-col tw:gap-1 tw:mb-2">
                <div className="tw:flex tw:items-center tw:justify-between tw:px-0.5">
                  <span className="tw:text-[9px] tw:text-gray-500 tw:font-medium">
                    Validity
                  </span>
                  <span className="tw:text-[9px] tw:text-gray-900 tw:font-bold">
                    {offerStartDate && offerEndDate ? (
                      <>
                        <DateFormat value={offerStartDate} formatStr="dd MMM" />{" "}
                        - <DateFormat value={offerEndDate} formatStr="dd MMM" />
                      </>
                    ) : (
                      "N/A"
                    )}
                  </span>
                </div>
                <div className="tw:flex tw:items-center tw:justify-between tw:px-0.5">
                  <span className="tw:text-[9px] tw:text-gray-500 tw:font-medium">
                    Purchase Price
                  </span>
                  <span className="tw:text-[9px] tw:text-gray-900 tw:font-bold">
                    <DisplayPrice price={purchasePrice ?? 0} uom={deal?.selectedStockUom} />
                  </span>
                </div>
              </div>

              {/* Footer: Profit & Actions */}
              <div className="tw:flex tw:items-center tw:justify-between tw:pt-2 tw:border-t tw:border-gray-100">
                {schemePrice > 0 ? (
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[8px] tw:text-gray-500 tw:uppercase tw:font-bold">
                      Profit
                    </span>
                    <DisplayProfit
                      price={purchasePrice ?? 0}
                      offerPrice={schemePrice}
                      className="tw:text-[14px] tw:font-black"
                    />
                  </div>
                ) : (
                  <div />
                )}

                <div className="tw:flex tw:gap-1">
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={(e: any) => {
                      e.preventDefault();
                      callback && callback({ action: "edit", data: item });
                    }}
                  >
                    <Edit3 size={12} />
                  </AppButton>
                  <AppButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={(e: any) => {
                      e.preventDefault();
                      callback &&
                        callback({
                          action: "remove-from-cart",
                          data: { itemId: item._id, index: idx },
                        });
                    }}
                  >
                    <Trash2 size={12} />
                  </AppButton>
                </div>
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
};

export default MobileView;
