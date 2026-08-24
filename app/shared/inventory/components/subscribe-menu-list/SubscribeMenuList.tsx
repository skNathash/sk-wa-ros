import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import TintTile from "~/components/core/tint/TintTile";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import { getMenus, type SubscribeMenuItem } from "./helper";

const SEARCH_PATH = "/dashboard/inventory/subscribe/search";
const MENUS_PATH = "/dashboard/inventory/subscribe/menus";

interface SubscribeMenuListProps {
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  /** How many menus to show. Kept short — the pane is a shortcut, not a list. */
  limit?: number;
  className?: string;
}

/**
 * The subscribable menu list, as a compact side-pane panel. Fetches the popular
 * menu feed itself (see `./helper`) so it can be dropped into any pane without
 * the host wiring anything up; tapping a row opens the subscribe search
 * pre-filtered to that menu, and the footer link goes to the full A–Z menus
 * page. The active menu (from the URL's `menuId`) is highlighted so the pane
 * reflects what the main column is showing.
 */
const SubscribeMenuList = ({
  title = "Categories",
  limit = 8,
  className,
}: SubscribeMenuListProps) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<SubscribeMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeMenuId = searchParams.get("menuId") || "";

  useEffect(() => {
    let active = true;

    (async () => {
      const data = await getMenus(limit);
      if (!active) return;
      setItems(data);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [limit]);

  const handleSelect = (item: SubscribeMenuItem) => {
    const query = new URLSearchParams({
      tab: "search",
      hideTab: "true",
      menuId: item._id,
      menuName: item._displayName || item.name || "",
    });
    appNav.to(`${SEARCH_PATH}?${query.toString()}`);
  };

  // Nothing to show and nothing coming — drop the panel rather than leave an
  // orphan heading over an empty box.
  if (!loading && !items.length) return null;

  // `app-bleed-x` pulls the panel out of the page gutter on theme-2 mobile; with
  // no side border or radius the rows run edge to edge either way.
  return (
    <div
      className={clsx(
        "app-bleed-x tw:border-y tw:border-slate-200 tw:bg-white",
        className,
      )}
    >
      {title ? (
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:border-b tw:border-slate-200 tw:px-4 tw:py-3">
          <p className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-slate-500">
            {title}
          </p>
          {!loading && items.length ? (
            <p className="tw:text-[11px] tw:font-bold tw:tracking-widest tw:text-slate-400">
              · {items.length}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="tw:divide-y tw:divide-slate-100">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`menu-skeleton-${idx}`}
                className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3"
              >
                <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl" />
                <div className="tw:flex-1 tw:space-y-1.5">
                  <Skeleton className="tw:h-3.5 tw:w-2/3 tw:rounded" />
                  <Skeleton className="tw:h-3 tw:w-1/3 tw:rounded" />
                </div>
              </div>
            ))
          : items.map((item, idx) => {
              const isActive = activeMenuId === item._id;
              return (
                <button
                  key={`${item._id}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  aria-current={isActive ? "true" : undefined}
                  className={clsx(
                    "tw:group tw:relative tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:duration-150",
                    "tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-inset tw:focus-visible:ring-emerald-500",
                    isActive
                      ? "tw:bg-emerald-50/70"
                      : "tw:bg-white tw:hover:bg-slate-50",
                  )}
                >
                  {isActive ? (
                    <span className="tw:absolute tw:inset-y-0 tw:left-0 tw:w-[3px] tw:bg-emerald-600" />
                  ) : null}

                  <TintTile
                    index={idx}
                    className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-xl tw:text-[15px] tw:font-bold"
                  >
                    {item._initial}
                  </TintTile>

                  <span className="tw:min-w-0 tw:flex-1">
                    <span className="tw:block tw:min-w-0 tw:truncate tw:text-[15px] tw:font-bold tw:leading-snug tw:text-slate-900">
                      {item._displayName || item.name}
                    </span>
                    <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[13px] tw:leading-tight tw:text-slate-500">
                      {item._countLabel} {t("common:products")}
                    </span>
                  </span>

                  <ChevronRight
                    size={18}
                    className="tw:shrink-0 tw:text-slate-400 tw:transition-transform tw:group-hover:translate-x-0.5"
                  />
                </button>
              );
            })}
      </div>

      {!loading && (
        <button
          type="button"
          onClick={() => appNav.to(`${MENUS_PATH}?tab=menus`)}
          className="tw:group tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:border-t tw:border-slate-200 tw:px-4 tw:py-3 tw:text-[15px] tw:font-bold tw:text-emerald-700 tw:transition-colors tw:hover:bg-emerald-50/70 tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-inset tw:focus-visible:ring-emerald-500"
        >
          See all SK Library Items
          <ChevronRight
            size={16}
            className="tw:shrink-0 tw:transition-transform tw:group-hover:translate-x-0.5"
          />
        </button>
      )}
    </div>
  );
};

export default SubscribeMenuList;
