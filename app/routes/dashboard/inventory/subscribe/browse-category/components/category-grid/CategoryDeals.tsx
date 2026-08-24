import clsx from "clsx";
import { ArrowRight, Package, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import RemoveSubscribeBtn from "~/shared/catalog/components/subscribe-buttons/RemoveSubscribeBtn";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import { Skeleton } from "~/components/ui/skeleton";
import { getCategoryDeals } from "./helper";

const DETAIL_PATH = "/dashboard/inventory/subscribe/product-detail";
const SEARCH_PATH = "/dashboard/inventory/subscribe/search";

/**
 * Grid the deal rows inside an expanded category. The row itself is unchanged —
 * only how many sit side by side: a single column on mobile (a full-width row
 * is the only thing that fits), two from lg and three from 2xl so the preview
 * doesn't stretch a 40px-tall row across the whole desktop page. `divide-y`
 * keeps the mobile hairlines; the multi-column widths separate on gap instead,
 * since a divider can't span grid columns.
 */
const gridClassName =
  "tw:grid tw:grid-cols-1 tw:divide-y tw:divide-slate-100 tw:lg:grid-cols-2 tw:lg:divide-y-0 tw:lg:gap-x-2 tw:2xl:grid-cols-3";

interface CategoryDealsProps {
  categoryId: string;
  categoryName?: string;
  /**
   * Category-feed deal total — a looser aggregate, so it only stands in until
   * the deal count fetched with the list's own filter arrives.
   */
  totalDeals?: number;
  /** How many preview deals to load — 6 fills the tile grid's rows evenly. */
  previewCount?: number;
  /** Reports the list-accurate total back so the block header can use it too. */
  onTotalResolved?: (total: number) => void;
}

/**
 * The panel revealed when a subscribe category block is expanded: a compact
 * grid of the category's top subscribable deals — one tile each (thumb, name,
 * stores stocking, MRP + subscribe/remove) — followed by a "View all N in
 * <category>" link into the subscribe search list pre-filtered to the category.
 *
 * Mirrors the inventory browse-category `CategoryDeals` layout, but swaps the
 * add-stock modal for the subscribe cart buttons and links into the subscribe
 * product detail / search pages.
 */
const CategoryDeals = ({
  categoryId,
  categoryName,
  totalDeals,
  previewCount = 6,
  onTotalResolved,
}: CategoryDealsProps) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const appNav = useAppNav();

  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // List-accurate total; null until the count call lands.
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCategoryDeals(categoryId, { count: previewCount }).then((result) => {
      if (!active) return;
      setDeals(result.deals);
      setTotal(result.total);
      setLoading(false);
      if (result.total !== null) onTotalResolved?.(result.total);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, previewCount]);

  // The fetched count wins; the category aggregate only fills the gap while it
  // is in flight, and `deals.length` is the last resort if the count failed.
  const shownTotal = total ?? totalDeals ?? deals.length;

  const openDeal = (id: string) => appNav.to(`${DETAIL_PATH}/${id}`);

  const viewAll = () => {
    const query = new URLSearchParams({
      tab: "search",
      hideTab: "true",
      categoryId,
      categoryName: categoryName || "",
    });
    appNav.to(`${SEARCH_PATH}?${query.toString()}`);
  };

  return (
    <div className="tw:border-t tw:border-slate-100 tw:bg-slate-50/60">
      {loading ? (
        <div className={gridClassName}>
          {Array.from({ length: previewCount }).map((_, idx) => (
            <div
              key={`d-${idx}`}
              className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2"
            >
              <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-lg" />
              <div className="tw:flex-1">
                <Skeleton className="tw:h-3 tw:w-2/3" />
                <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/3" />
              </div>
              <Skeleton className="tw:h-6 tw:w-16 tw:shrink-0" />
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="tw:px-3 tw:py-6 tw:text-center tw:text-xs tw:text-slate-400">
          {t("common:noData", { defaultValue: "No data" })}
        </div>
      ) : (
        <>
          <div className={gridClassName}>
            {deals.map((deal) => {
              const initials = (deal.name || "").trim().slice(0, 3);
              const subscribed = deal.totalSubscribed || 0;
              const company = deal.companyName || deal.brand?.name || "";

              return (
                <div
                  key={deal._id}
                  className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2 tw:transition-colors tw:hover:bg-white"
                >
                  {/* Thumb — deal image, else a tinted initials tile. */}
                  <button
                    type="button"
                    onClick={() => openDeal(deal._id)}
                    className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-[color-mix(in_srgb,var(--primary)_7%,#fff)] tw:ring-1 tw:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                  >
                    {deal.images && deal.images.length > 0 ? (
                      <ImgRender
                        assetId={deal.images[0]}
                        alt={deal.name}
                        className="tw:h-10 tw:w-10 tw:object-contain"
                      />
                    ) : initials ? (
                      <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-tight tw:text-[color:var(--primary)]">
                        {initials}
                      </span>
                    ) : (
                      <Package size={16} className="tw:text-slate-300" />
                    )}
                  </button>

                  {/* Name + meta */}
                  <div className="tw:min-w-0 tw:flex-1">
                    <button
                      type="button"
                      onClick={() => openDeal(deal._id)}
                      className="tw:block tw:max-w-full tw:truncate tw:text-left tw:text-sm tw:font-medium tw:text-slate-800"
                    >
                      {deal.name}
                    </button>
                    <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:leading-none tw:text-slate-500">
                      {company && (
                        <span className="tw:min-w-0 tw:truncate tw:font-medium">
                          {company}
                        </span>
                      )}
                      {subscribed > 0 && (
                        <>
                          {company && (
                            <span className="tw:shrink-0 tw:text-slate-300">
                              •
                            </span>
                          )}
                          <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-0.5">
                            <Store size={11} className="tw:text-slate-400" />
                            {subscribed}{" "}
                            {t("discover.storesShort", {
                              count: subscribed,
                              defaultValue: "stores",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* MRP — label stacked above the value so the block's width
                      tracks the number (big prices don't strand the label or
                      widen into the name column). Fits under the 40px thumb, so
                      no extra row height. */}
                  <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:leading-none">
                    <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-400">
                      {t("discover.mrp", { defaultValue: "MRP" })}
                    </span>
                    <Amount
                      value={Number(deal.mrp) || 0}
                      className="app-amount tw:mt-0.5 tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:text-slate-800"
                    />
                  </div>

                  {/* Subscribe / Remove */}
                  <div className="tw:shrink-0">
                    {deal.isInCart ? (
                      <RemoveSubscribeBtn itemId={deal.itemId} size="small" />
                    ) : (
                      <SubscribeBtn
                        dealId={deal._id}
                        dealName={deal.name}
                        mrp={deal.mrp}
                        price={deal.price}
                        images={deal.images || []}
                        size="small"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer — full-width tap target into the category's search list. */}
          <button
            type="button"
            onClick={viewAll}
            className="tw:group tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-slate-100 tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-[color-mix(in_srgb,var(--primary)_5%,#fff)]"
          >
            <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-[color:var(--primary)]">
              {t("browseCategory.viewAllInCategory", {
                defaultValue: "View all {{count}} in {{name}}",
                count: shownTotal,
                name: categoryName || "",
              })}
              <ArrowRight
                size={13}
                className={clsx(
                  "tw:transition-transform tw:duration-200",
                  "tw:group-hover:translate-x-0.5",
                )}
              />
            </span>
            <span className="tw:shrink-0 tw:text-[11px] tw:font-medium tw:text-slate-400">
              {t("browseCategory.showingXofY", {
                defaultValue: "showing {{x}} of {{y}}",
                x: deals.length,
                y: shownTotal,
              })}
            </span>
          </button>
        </>
      )}
    </div>
  );
};

export default CategoryDeals;
