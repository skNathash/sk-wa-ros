import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import useAppNav from "~/hooks/useAppNav";
import { useVendorCtx } from "../../../layout/layout";
import { getData, type TopSkuItem } from "./helper";

type TopSkusProps = {
  vendorId?: string;
};

/**
 * Top SKUs purchased from this vendor, sorted by purchased quantity
 * (purchased-deals-by-franchise?sortBy=quantity). "See all" opens the
 * vendor catalog tab. Same row/card design as "Top SKUs you buy here"
 * on the seller (buy-from-other-retailer) overview.
 */
const TopSkus: React.FC<TopSkusProps> = ({ vendorId }) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const { vendorName } = useVendorCtx();

  const [skus, setSkus] = useState<TopSkuItem[]>([]);
  const [loading, setLoading] = useState(!!vendorId);

  useEffect(() => {
    if (!vendorId) {
      setSkus([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        setSkus(await getData(vendorId));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  if (!loading && skus.length === 0) {
    return null;
  }

  return (
    // Desktop: header and list are one card (the wrapper carries the surface,
    // the children go flat). Mobile: the header is a plain band on the page bg
    // and only the list keeps a surface, so they need the gap between them.
    <div className="tw:mb-4 tw:space-y-2 tw:md:space-y-0 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:bg-white tw:md:shadow-sm tw:md:ring-1 tw:md:ring-slate-200/70">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:md:border-b tw:md:border-slate-100 tw:md:px-4 tw:md:py-3">
        <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-baseline tw:gap-x-2">
          <h2 className="tw:text-[0.9375rem] tw:font-bold tw:text-slate-900">
            {t("topSkusFromVendor", {
              defaultValue: "Top SKUs from {{vendor}}",
              vendor: vendorName || t("vendor"),
            })}
          </h2>
          <span className="tw:text-[11px] tw:text-gray-400">
            {t("byQuantity", "by quantity")}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            appNav.to(`/dashboard/vendor/view/${vendorId}/products`, {
              tab: "products",
            })
          }
          className="tw:shrink-0 tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          {t("seeAll", "See all")} →
        </button>
      </div>

      {/* `app-bleed-x` (theme-2 mobile) pulls the list out of the page gutter
          so the rows run edge to edge; a no-op on desktop and other themes. */}
      <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:divide-y tw:divide-slate-100 tw:md:rounded-none tw:md:shadow-none tw:md:ring-0">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`top-sku-skeleton-${idx}`}
                className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-3"
              >
                <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-lg tw:bg-slate-100 tw:animate-pulse" />
                <div className="tw:flex-1 tw:space-y-2">
                  <div className="tw:h-3 tw:w-2/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
                  <div className="tw:h-2.5 tw:w-3/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
                </div>
              </div>
            ))
          : skus.map((sku) => (
              <div
                key={sku.id}
                className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2.5"
              >
                <TintTile
                  index={tintIndexFor(sku.name)}
                  className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-lg tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide"
                >
                  <span className="tw:line-clamp-2 tw:px-0.5 tw:text-center tw:leading-tight">
                    {sku.brandCode}
                  </span>
                </TintTile>

                <div className="tw:min-w-0 tw:flex-1">
                  <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                    {sku.name}
                  </p>
                  <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:text-[11px] tw:text-emerald-700/80">
                    <span>
                      {sku.totalQuantityPurchased} {sku.displayUom}
                    </span>
                    <span className="tw:text-slate-300">·</span>
                    <span>
                      {sku.orderCount} {sku.orderCount === 1 ? "PO" : "POs"}
                    </span>
                  </p>
                </div>

                <div className="tw:shrink-0 tw:text-right">
                  <p className="tw:text-[13px] tw:font-bold tw:text-slate-900">
                    <Amount value={sku.totalPurchaseValue} decimalPlaces={0} />
                  </p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default TopSkus;
