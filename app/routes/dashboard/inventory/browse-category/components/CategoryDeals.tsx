import clsx from "clsx";
import { ArrowRight, Package, Plus, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import ImgRender from "~/components/core/img/ImgRender";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { Skeleton } from "~/components/ui/skeleton";
import type { SellerDeal } from "~/types/CommonTypes";
import { getCategoryDeals } from "../helper";

interface CategoryDealsProps {
  categoryId: string;
  categoryName?: string;
  /** Total SKUs in the category, shown in the "View all N" footer. */
  totalDeals?: number;
  /** How many preview deals to load. Mirrors the design (4). */
  previewCount?: number;
  /** Fires when a deal's add button is tapped. */
  onDealAction?: (args: { action: string; data: SellerDeal }) => void;
}

/**
 * The panel revealed when a category block is expanded: a compact preview of
 * the category's top deals (thumb/initials, name, company · shops, price + add)
 * followed by a "View all N in <category>" link into the full products list.
 */
const CategoryDeals = ({
  categoryId,
  categoryName,
  totalDeals,
  previewCount = 4,
  onDealAction,
}: CategoryDealsProps) => {
  const { t } = useTranslation(["common"]);

  const [deals, setDeals] = useState<SellerDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCategoryDeals(categoryId, { count: previewCount }).then((data) => {
      if (!active) return;
      setDeals(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [categoryId, previewCount]);

  const viewAllHref = `/dashboard/inventory/products/list?tab=products&categoryId=${categoryId}&categoryName=${encodeURIComponent(
    categoryName || "",
  )}`;

  return (
    <div className="tw:border-t tw:border-slate-100 tw:bg-slate-50/60">
      {loading ? (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:divide-y tw:divide-slate-100 tw:md:divide-y-0 tw:md:gap-3">
          {Array.from({ length: previewCount }).map((_, idx) => (
            <div
              key={`d-${idx}`}
              className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2 tw:md:rounded-lg tw:md:border tw:md:border-slate-100 tw:md:bg-white"
            >
              <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-lg" />
              <div className="tw:flex-1">
                <Skeleton className="tw:h-3 tw:w-2/3" />
                <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/3" />
              </div>
              <Skeleton className="tw:h-6 tw:w-12 tw:shrink-0" />
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="tw:px-3 tw:py-6 tw:text-center tw:text-xs tw:text-slate-400">
          {t("noData", { defaultValue: "No data" })}
        </div>
      ) : (
        <>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:divide-y tw:divide-slate-100 tw:md:divide-y-0 tw:md:gap-3">
            {deals.map((deal) => {
              const initials = (deal.name || "").trim().slice(0, 3);
              const shops =
                (deal as any).totalSellers ?? deal.sellers?.length ?? 0;
              const company =
                deal.companyName || (deal.brand as any)?._displayName || "";
              const stock = Number((deal as any).actualMaxQty) || 0;
              const isOutOfStock = stock === 0;

              return (
                <div
                  key={deal._id}
                  className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2 tw:transition-colors tw:hover:bg-white tw:md:rounded-lg tw:md:border tw:md:border-slate-100 tw:md:bg-white"
                >
                  {/* Thumb — deal image, else a tinted initials tile. */}
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${deal._id}`}
                    className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-[color-mix(in_srgb,var(--primary)_7%,#fff)] tw:ring-1 tw:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                  >
                    {deal.images && deal.images.length > 0 ? (
                      <ImgRender
                        assetId={deal.images[0]}
                        alt={deal.name}
                        className="tw:h-10 tw:w-10 tw:object-cover"
                      />
                    ) : initials ? (
                      <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-tight tw:text-[color:var(--primary)]">
                        {initials}
                      </span>
                    ) : (
                      <Package size={16} className="tw:text-slate-300" />
                    )}
                  </AppLink>

                  {/* Name + meta */}
                  <div className="tw:min-w-0 tw:flex-1">
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/products/view/${deal._id}`}
                      className="tw:block tw:truncate tw:text-sm tw:font-medium tw:text-slate-800 tw:hover:tw:text-[color:var(--primary)]"
                    >
                      {deal.name}
                    </AppLink>
                    <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:leading-none tw:text-slate-500">
                      {company && (
                        <span className="tw:min-w-0 tw:truncate tw:font-medium">
                          {company}
                        </span>
                      )}
                      {shops > 0 && (
                        <>
                          {company && (
                            <span className="tw:shrink-0 tw:text-slate-300">
                              •
                            </span>
                          )}
                          <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-0.5">
                            <Store size={11} className="tw:text-slate-400" />
                            {shops} {t("shops", { defaultValue: "shops" })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock — label stacked above the value so the block's width
                      tracks the number and big quantities don't strand the label
                      or widen into the name column. */}
                  <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:leading-none">
                    <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-400">
                      {t("stock", { defaultValue: "Stock" })}
                    </span>
                    <div
                      className={clsx(
                        "app-amount tw:mt-0.5 tw:text-sm tw:font-semibold tw:whitespace-nowrap",
                        isOutOfStock ? "tw:text-rose-500" : "tw:text-slate-800",
                      )}
                    >
                      <DisplayQty
                        qty={stock}
                        isLooseQty={false}
                        uom={(deal as any).selectedStockUom}
                        hideDefaultUom
                      />
                    </div>
                  </div>

                  {/* Add */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDealAction?.({ action: "add", data: deal });
                    }}
                    className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-[color-mix(in_srgb,var(--primary)_30%,#fff)] tw:bg-[color-mix(in_srgb,var(--primary)_8%,#fff)] tw:text-[color:var(--primary)] tw:transition tw:hover:bg-[color-mix(in_srgb,var(--primary)_16%,#fff)] tw:active:scale-90"
                    aria-label={t("add", { defaultValue: "Add" })}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer — full-width tap target into the category's product list. */}
          <AppLink
            asLink
            href={viewAllHref}
            className="tw:group tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-slate-100 tw:px-3 tw:py-2.5 tw:transition-colors tw:hover:bg-[color-mix(in_srgb,var(--primary)_5%,#fff)]"
          >
            <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-[color:var(--primary)]">
              {t("viewAllInCategory", {
                defaultValue: "View all {{count}} in {{name}}",
                count: totalDeals ?? deals.length,
                name: categoryName || "",
              })}
              <ArrowRight
                size={13}
                className="tw:transition-transform tw:duration-200 tw:group-hover:translate-x-0.5"
              />
            </span>
            <span className="tw:shrink-0 tw:text-[11px] tw:font-medium tw:text-slate-400">
              {t("showingXofY", {
                defaultValue: "showing {{x}} of {{y}}",
                x: deals.length,
                y: totalDeals ?? deals.length,
              })}
            </span>
          </AppLink>
        </>
      )}
    </div>
  );
};

export default CategoryDeals;
