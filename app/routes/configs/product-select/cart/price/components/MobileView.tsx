import { Trash2, Edit3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";

type Props = {
  callback?: (args: { action: string; data?: any }) => void;
  loading: boolean;
  animateApply?: boolean;
};

const PriceRow: React.FC<{
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}> = ({ label, value, accent }) => (
  <div className="tw:flex tw:items-center tw:justify-between tw:gap-1">
    <span className="tw:text-[10px] tw:text-gray-500 tw:font-medium tw:shrink-0">
      {label}
    </span>
    <span
      className={`tw:text-[12px] tw:font-bold tw:tabular-nums ${
        accent ? "tw:text-primary" : "tw:text-gray-800"
      }`}
    >
      {value}
    </span>
  </div>
);

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
          <AppCard key={idx} noPadding>
            <div className="tw:p-3 tw:flex tw:gap-3 tw:animate-pulse">
              <div className="tw:w-10 tw:h-10 tw:rounded-md tw:bg-gray-200 tw:shrink-0"></div>
              <div className="tw:flex-1 tw:space-y-2">
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-3/4"></div>
                <div className="tw:h-2.5 tw:bg-gray-100 tw:rounded tw:w-1/2"></div>
                <div className="tw:h-2.5 tw:bg-gray-100 tw:rounded tw:w-2/3"></div>
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
        const price = watchedProducts?.[idx]?.formData?.price;
        const profit = Number(item.formData?.profit ?? 0);
        const purchasePrice = deal.purchasePrice;

        const profitColor =
          profit > 0
            ? "tw:text-green-600"
            : profit < 0
              ? "tw:text-red-500"
              : "tw:text-gray-500";
        const ProfitIcon =
          profit > 0 ? TrendingUp : profit < 0 ? TrendingDown : Minus;

        return (
          <AppCard
            noPadding
            className={
              animateApply
                ? "animate__animated animate__pulse animate__infinite tw:bg-blue-50/30"
                : ""
            }
            key={item._id || idx}
          >
            <div className="tw:p-2.5" id={`item-${idx}`}>
              {/* Header: image + name + actions */}
              <div className="tw:flex tw:items-start tw:gap-2 tw:mb-2.5">
                <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-md tw:overflow-hidden tw:bg-gray-100 tw:border tw:border-gray-200">
                  {image ? (
                    <ImgRender
                      assetId={image}
                      alt={name}
                      className="tw:object-cover tw:h-full tw:w-full"
                      size="200x200"
                    />
                  ) : (
                    <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center">
                      <span className="tw:text-[9px] tw:text-gray-400 tw:text-center tw:leading-tight">
                        No
                        <br />
                        Img
                      </span>
                    </div>
                  )}
                </div>

                <div className="tw:flex-1 tw:min-w-0">
                  <AppLink
                    asLink={true}
                    href={`/dashboard/inventory/products/view/${deal?.dealId}`}
                    className="tw:text-[12px] tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:leading-tight tw:hover:text-primary"
                  >
                    {name}
                  </AppLink>
                  <div className="tw:text-[10px] tw:text-gray-400 tw:mt-0.5 tw:font-mono">
                    ID: {id}
                  </div>
                </div>

                <div className="tw:flex tw:gap-1 tw:shrink-0">
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

              {/* Pricing rows */}
              <div className="tw:bg-gray-50 tw:rounded-md tw:px-2.5 tw:py-2 tw:space-y-1.5 tw:border tw:border-gray-100">
                <PriceRow
                  label="MRP"
                  value={<Amount value={deal?.mrp ?? 0} />}
                />
                <PriceRow
                  label="B2B Price"
                  value={<Amount value={deal?.b2bPrice ?? 0} />}
                />
                <PriceRow
                  label="Purchase Price"
                  value={<Amount value={purchasePrice ?? 0} />}
                />
                <div className="tw:border-t tw:border-dashed tw:border-gray-200 tw:pt-1.5 tw:mt-1">
                  <PriceRow
                    label="New B2B Price"
                    value={
                      <Amount value={price ?? item.formData?.price ?? 0} />
                    }
                    accent
                  />
                </div>
              </div>

              {/* Profit badge */}
              <div
                className={`tw:flex tw:items-center tw:gap-1 tw:mt-2 tw:justify-end ${profitColor}`}
              >
                <ProfitIcon size={12} />
                <span className="tw:text-[11px] tw:font-semibold">Profit:</span>
                <span className="tw:text-[12px] tw:font-bold tw:tabular-nums">
                  <Amount value={profit} />
                </span>
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
};

export default MobileView;
