import { ChevronUp, Layers, PencilLine } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import CommonService from "~/services/CommonService";
import CompetitorPrice from "~/shared/catalog/components/competitor-price/CompetitorPrice";

const Mobile = ({
  item,
  callback,
  type,
  isFirst,
  showOnlinePrices = true,
}: {
  item: any;
  callback: (a: { action: string; data?: any; event?: any }) => void;
  type: "network" | "customer";
  isFirst?: boolean;
  showOnlinePrices?: boolean;
}) => {
  const { t } = useTranslation(["common"]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Use purchase price from _stock?.pp
  const purchasePrice = item.purchasePrice || 0;
  const sellingPrice = type === "network" ? item.b2bPrice : item.b2cPrice;

  // Get stock quantity
  const stockQty = item.actualMaxQty || 0;

  // Calculate inventory value
  const inventoryValue = stockQty * sellingPrice;

  // Discount / margin shown alongside the hero price.
  const isFixedPrice = item._discountType === "Fixed";
  const discountValue = type === "network" ? item.b2bDiscount : item.b2cDiscount;
  const discountLabel = type === "network" ? "Margin" : "Discount";

  return (
    <div
      id={`rsp-row-${item._id || item.id}`}
      className={clsx(
        "tw:bg-white tw:md:rounded-lg tw:border-b tw:border-gray-200 tw:md:border",
        isFirst ? "tw:border-t tw:border-gray-200" : "",
        isCollapsed ? "tw:md:border-2 tw:md:border-double" : "",
        item.priceSlabUpdatedAnimate ? "duplicate-animate" : "",
      )}
    >
      {/* Identity row — image, name, id/velocity, and the collapse toggle */}
      <div className="tw:flex tw:gap-3 tw:p-4 tw:pb-3">
        {/* Product Image */}
        <div className="tw:shrink-0 tw:relative">
          {item.images?.[0] ? (
            <ImgRender
              assetId={item.images[0]}
              alt={item.name}
              className="tw:w-14 tw:h-14 tw:object-contain tw:rounded-lg tw:bg-gray-50"
            />
          ) : (
            <div className="tw:w-14 tw:h-14 tw:flex tw:items-center tw:justify-center tw:bg-gray-100 tw:rounded-lg">
              <span className="tw:text-gray-400 tw:text-2xl">📦</span>
            </div>
          )}
          <div
            className={`tw:absolute tw:-top-1 tw:-right-1 tw:w-3.5 tw:h-3.5 tw:rounded-full tw:border-2 tw:border-white ${
              item.status === "Active" ? "tw:bg-green-500" : "tw:bg-red-500"
            }`}
          ></div>
        </div>

        {/* Product Info - Name full width in its container */}
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2">
            <AppLink
              asLink
              href={`/dashboard/inventory/products/view/${item._id}`}
              className="hover:tw:text-blue-600"
            >
              {item.name}
            </AppLink>
          </div>
          <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-1.5 tw:mt-1.5">
            <span className="tw:font-mono tw:text-gray-500 tw:text-[11px]">
              {item.id}
            </span>
            {item.movementType && (
              <AppBadge
                variant={item._movementTypeColor || "default"}
                className="tw:text-[10px] tw:px-2 tw:py-0 tw:h-5"
              >
                {item.movementType}
              </AppBadge>
            )}
          </div>
        </div>

        {/* Collapse toggle — its own tap target, out of the price row */}
        <button
          type="button"
          aria-label={isCollapsed ? "Show details" : "Hide details"}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="tw:shrink-0 tw:-mr-1 tw:-mt-1 tw:h-8 tw:w-8 tw:flex tw:items-center tw:justify-center tw:rounded-full tw:text-gray-400 hover:tw:bg-gray-100 hover:tw:text-gray-600 tw:transition-colors"
        >
          <ChevronUp
            size={20}
            className={`tw:transition-transform ${isCollapsed ? "tw:rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Pricing — one hero number (what they charge), supporting stats quieted */}
      <div className="tw:px-4 tw:pb-4 tw:flex tw:items-end tw:justify-between tw:gap-3">
        {/* Hero: selling price */}
        <div className="tw:min-w-0">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400 tw:mb-0.5">
            {type === "network" ? t("b2bPrice") : t("b2cPrice")}
          </div>
          <div className="tw:text-2xl tw:md:text-xl tw:font-bold tw:text-blue-600 tw:leading-none">
            <DisplayPrice price={sellingPrice} uom={item.selectedStockUom} />
          </div>
        </div>

        {/* Supporting: purchase price + discount/margin, grouped and muted */}
        <div className="tw:flex tw:items-stretch tw:rounded-lg tw:bg-gray-50 tw:divide-x tw:divide-gray-200 tw:text-right">
          <div className="tw:px-3 tw:py-1.5">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
              Purchase
            </div>
            <div className="tw:text-sm tw:font-semibold tw:text-amber-600 tw:whitespace-nowrap tw:mt-0.5">
              <DisplayPrice
                price={purchasePrice}
                uom={item.selectedStockUom}
                hideUom
              />
            </div>
          </div>
          <div className="tw:px-3 tw:py-1.5">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
              {discountLabel}
            </div>
            <div
              className={clsx(
                "tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:mt-0.5",
                isFixedPrice
                  ? "tw:text-amber-600"
                  : discountValue > 0
                    ? "tw:text-green-600"
                    : "tw:text-gray-700",
              )}
            >
              {isFixedPrice
                ? "Fixed"
                : `${CommonService.roundedByDecimalPlace(discountValue, 1)}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="tw:flex tw:gap-2 tw:px-4 tw:pb-4">
        <AppButton
          size="small"
          fill="clear"
          onClick={(e: any) => {
            e.stopPropagation();
            callback({ action: "edit", data: item });
          }}
          className="tw:border tw:border-gray-200 tw:px-3 tw:py-1.5 tw:h-auto tw:text-xs tw:font-medium tw:text-gray-600 hover:tw:border-blue-500 hover:tw:text-blue-600 tw:rounded-md tw:transition-colors"
        >
          <PencilLine size={13} />
          Edit Price
        </AppButton>

        {type === "network" && (
          <AppButton
            size="small"
            fill="clear"
            onClick={(e: any) => {
              e.stopPropagation();
              callback({ action: "editPriceSlab", data: item });
            }}
            className="tw:border tw:border-gray-200 tw:px-3 tw:py-1.5 tw:h-auto tw:text-xs tw:font-medium tw:text-gray-600 hover:tw:border-blue-500 hover:tw:text-blue-600 tw:rounded-md tw:transition-colors"
          >
            <Layers size={13} />
            Edit Slabs
            <span
              className={clsx(
                "tw:inline-block tw:ml-1.5 tw:w-2 tw:h-2 tw:rounded-full",
                item?._priceSlab?.isAvailable
                  ? "tw:bg-green-500"
                  : "tw:bg-gray-300",
              )}
            />
          </AppButton>
        )}
      </div>

      {/* Competitor / Online Price intelligence — driven by the "Show online prices" toggle */}
      {showOnlinePrices && (
        <div className="tw:px-4 tw:pb-3">
          <CompetitorPrice
            partnerPriceData={item.partnerPriceData}
            price={sellingPrice}
            dealId={item._id || item.id}
            hideLowest
          />
        </div>
      )}

      {/* Divider */}
      {!isCollapsed && <div className="tw:border-t tw:border-gray-200"></div>}

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="tw:bg-gray-50 tw:px-4 tw:py-4 tw:space-y-4">
          {/* Sales velocity — units sold over trailing windows */}
          <div>
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400 tw:mb-2">
              Units Sold
            </div>
            <div className="tw:grid tw:grid-cols-3 tw:gap-2">
              {[
                { label: "7 Days", qty: item.salesAnalytics?.last7Days?.quantity },
                { label: "15 Days", qty: item.salesAnalytics?.last15Days?.quantity },
                { label: "60 Days", qty: item.salesAnalytics?.last60Days?.quantity },
              ].map((s) => (
                <div
                  key={s.label}
                  className="tw:bg-white tw:rounded-lg tw:py-2 tw:text-center tw:border tw:border-gray-100"
                >
                  <div className="tw:text-base tw:font-bold tw:text-gray-900 tw:leading-none">
                    {s.qty ?? 0}
                  </div>
                  <div className="tw:text-[11px] tw:text-gray-500 tw:mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock and inventory value */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <div>
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400 tw:mb-0.5">
                Stock
              </div>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                <DisplayQty
                  qty={stockQty}
                  isLooseQty={item.isLooseDeal || false}
                  uom={item.selectedStockUom}
                />
              </div>
            </div>
            <div>
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400 tw:mb-0.5">
                Value ({type === "network" ? "B2B" : "B2C"})
              </div>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                <Amount value={item.inventoryValue || inventoryValue} />
              </div>
            </div>
          </div>

          {/* Location/Sellable Status Section */}
          <LocationsBlock locations={item.locations} />
        </div>
      )}
    </div>
  );
};

export default Mobile;
