import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import type { TileDecor } from "~/components/core/tint/tints";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";

/** Label, initial and tint come pre-attached by `withTileDecor` at fetch time. */
type MenuItem = TileDecor & {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
  dealsCount?: number;
};

type Props = {
  distance?: number | string;
  menus?: MenuItem[];
  loading?: boolean;
  /** Outer spacing — the callers that grid this beside Brands clear it. */
  className?: string;
};

/** Tiles per row: four across a full-width block, three inside a grid column. */
const TILE_GRID = "tw:grid tw:grid-cols-4 tw:lg:grid-cols-3 tw:gap-3 tw:md:gap-4";

const Menus = ({
  distance = DEFAULT_BROWSE_DISTANCE,
  menus = [],
  loading = false,
  className = "tw:mb-6",
}: Props) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const handleMenuClick = (menu: MenuItem) => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      menuId: menu._id,
      menuName: menu.name,
      distance,
    });
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2">
          <Skeleton className="tw:h-3 tw:w-28" />
        </div>
        <div className={TILE_GRID}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="tw:aspect-square tw:w-full tw:rounded-2xl" />
              <Skeleton className="tw:mx-auto tw:mt-2 tw:h-3 tw:w-3/4" />
              <Skeleton className="tw:mx-auto tw:mt-1.5 tw:h-2.5 tw:w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!menus || menus.length === 0) return null;

  // Two full rows either way — 8 across four mobile columns, 6 across three
  // desktop ones. The rest are reachable via "See all".
  const visibleMenus = isMobile ? menus.slice(0, 8) : menus.slice(0, 6);

  return (
    <div className={className}>
      <div className="tw:mb-3 tw:flex tw:items-baseline tw:justify-between tw:gap-2">
        <div className="tw:flex tw:items-baseline tw:gap-2">
          <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
            Shop by Menus
          </h2>
          <span className="tw:text-xs tw:text-slate-400">
            {menus.length} {menus.length === 1 ? "menu" : "menus"}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            appNav.to("/products/buy-from-other-retailer/products/menu", {
              distance,
            })
          }
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          See all <span aria-hidden>→</span>
        </button>
      </div>

      {/* Always a wrapping grid — no slider. */}
      <div className={TILE_GRID}>
        {visibleMenus.map((menu) => {
          const initial = (
            <span className="tw:font-serif tw:text-2xl tw:font-bold tw:select-none">
              {menu._initial}
            </span>
          );

          return (
            <button
              key={menu._id}
              type="button"
              onClick={() => handleMenuClick(menu)}
              title={menu._label}
              aria-label={menu._label}
              className="tw:group tw:block tw:w-full tw:cursor-pointer tw:text-center focus:tw:outline-none"
            >
              {/* Tinted wash + white inner plate carrying the menu image (or
                  its initial, so an asset-less menu still reads as itself). */}
              <TintTile
                index={menu._tintIndex}
                className="tw:aspect-square tw:w-full tw:rounded-2xl tw:transition tw:duration-200 tw:group-hover:shadow-md"
              >
                <div className="tw:relative tw:flex tw:h-14 tw:w-14 tw:md:h-16 tw:md:w-16 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:bg-white tw:shadow-sm tw:transition-transform tw:duration-200 tw:group-hover:scale-105">
                  {menu._displayImg ? (
                    <ImgRender
                      assetId={menu._displayImg}
                      alt={menu._label}
                      width={120}
                      className="tw:h-full tw:w-full tw:object-contain tw:p-1.5"
                      fallback={initial}
                    />
                  ) : (
                    initial
                  )}
                </div>
              </TintTile>

              <div className="tw:mt-2 tw:line-clamp-1 tw:text-xs tw:md:text-[13px] tw:font-medium tw:text-slate-700 tw:transition-colors tw:group-hover:text-primary">
                {menu._label}
              </div>
              {menu.dealsCount ? (
                <div className="tw:mt-0.5 tw:text-[11px] tw:text-slate-400">
                  {menu.dealsCount} SKUs
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Menus;
