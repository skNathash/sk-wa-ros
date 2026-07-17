import { Package, Trash2 } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { Controller, useFormContext } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import { AppSelect } from "~/components/core/form";

const reserveOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

type Props = {
  callback?: (args: { action: string; data?: any }) => void;
  loading: boolean;
  animateApply?: boolean;
  products: any[];
};

const MobileView: React.FC<Props> = ({
  callback,
  loading,
  animateApply,
  products,
}) => {
  if (!products || products.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-7 tw:gap-2">
        {/* skeleton loader */}
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx} className="tw:p-2 tw:relative">
            <div className="tw:relative tw:w-full tw:h-28 tw:mb-2">
              <div className="skeleton-loader tw:h-28 tw:w-full"></div>
            </div>
            <div className="tw:relative tw:w-full tw:h-28 tw:mb-2">
              <div className="skeleton-loader tw:h-28 tw:w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-2">
      {products.map((item: any, idx: number) => {
        const deal = item.dealInfo || {};

        const image = deal.images?.[0];
        const name = deal.dealName || deal.name || "-";
        const id = deal.dealRefId || deal._id || "";
        const mrp = deal.mrp ?? 0;
        const inStock = deal.quantity ?? "-";

        return (
          <div id={`item-${idx}`} key={item._id}>
            <AppCard
              noPadding
              className={
                "tw:mb-0" +
                (animateApply
                  ? " animate__animated animate__pulse animate__infinite tw:bg-blue-50/50"
                  : "")
              }
            >
              <div className="tw:p-2 tw:relative">
                <div className="tw:relative tw:w-full tw:h-28 tw:mb-2">
                  {image ? (
                    <ImgRender
                      assetId={image}
                      alt={name}
                      className="tw:object-cover tw:h-full tw:w-full"
                      size="200x200"
                    />
                  ) : (
                    <div className="tw:w-full tw:h-full tw:rounded-md tw:bg-gray-100 tw:flex tw:items-center tw:justify-center">
                      <Package className="tw:w-6 tw:h-6 tw:text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="tw:h-10">
                    <h3 className="tw:text-sm tw:font-semibold tw:line-clamp-2 tw:mb-1">
                      <AppLink
                        asLink={true}
                        href={`/dashboard/inventory/products/view/${deal?.dealId}`}
                        className="tw:font-medium"
                      >
                        {name}
                      </AppLink>
                    </h3>
                  </div>

                  <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                    ID: {id}
                  </div>

                  <div className="tw:text-sm tw:font-semibold tw:text-primary tw:mb-2">
                    MRP: <Amount value={mrp} />
                  </div>

                  <div className="tw:mb-3">
                    <span className="tw:text-[10px] tw:font-medium tw:text-gray-600 tw:block tw:mb-1">
                      Enable Reserve:
                    </span>
                    <AppSelect
                      size="sm"
                      options={reserveOptions}
                      value={item.formData.enableReserve}
                      onChange={(val: any) => {
                        callback &&
                          callback({
                            action: "update-index-form",
                            data: {
                              index: idx,
                              key: "enableReserve",
                              value: val,
                            },
                          });
                      }}
                      inputClassName="tw:w-full tw:mb-1"
                    />
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between">
                    <div className="tw:text-xs tw:text-green-600">
                      Stock: {inStock}
                    </div>

                    <div className="tw:flex tw:items-center tw:gap-1">
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
                        <Trash2 size={14} />
                      </AppButton>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
