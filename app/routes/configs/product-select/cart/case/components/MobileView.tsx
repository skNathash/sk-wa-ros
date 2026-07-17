import { Edit3, Package, Trash2 } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";

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
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx} className="tw:p-2 tw:relative">
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
        const packageType = item.formData?.packageType;
        const packageQty = item.formData?.packageQty;
        const inStock = deal.quantity ?? "-";

        return (
          <AppCard
            noPadding
            className={
              "tw:mb-0" +
              (animateApply
                ? " animate__animated animate__pulse animate__infinite tw:bg-blue-50/50"
                : "")
            }
            key={item._id || idx}
          >
            <div className="tw:p-2 tw:relative" id={`item-${idx}`}>
              <div className="tw:relative tw:w-full tw:h-20 tw:mb-2">
                {image ? (
                  <ImgRender
                    assetId={image}
                    alt={name}
                    className="tw:object-contain tw:h-full tw:w-full tw:bg-gray-100 tw:rounded"
                    size="60x60"
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

                <div className="tw:my-2">
                  <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                    Sell In
                  </div>
                  <div className="tw:flex tw:items-baseline tw:gap-1.5">
                    <span className="tw:text-xs tw:font-bold tw:text-slate-800">
                      {packageType ?? "-"}
                    </span>
                    {packageType && packageType !== "Choose" && (
                      <span className="tw:text-[10px] tw:font-medium tw:text-slate-500">
                        ({packageQty || (packageType === "Unit" ? 1 : 0)} Units)
                      </span>
                    )}
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between">
                  <div className="tw:text-xs tw:text-green-600">
                    Stock: {inStock}
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-1">
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={(e: any) => {
                        e.preventDefault();
                        callback && callback({ action: "edit", data: item });
                      }}
                    >
                      <Edit3 size={14} />
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
                      <Trash2 size={14} />
                    </AppButton>
                  </div>
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
