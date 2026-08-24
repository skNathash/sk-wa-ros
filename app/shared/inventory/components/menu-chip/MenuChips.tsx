import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import AppSwiper from "~/components/core/swiper";
import { Skeleton } from "~/components/ui/skeleton";
import { getMenus } from "./resolver";
import type { MenuChipsProps, MenuItem } from "./types";

const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  freeMode: true,
  slidesPerView: "auto",
};

/**
 * Horizontal strip of menu pills shown above the browse search/grid. Loads the
 * store's menus for the given `source` (subscribe vs inventory) and lets the
 * user filter the grid below by a single menu. The leading "All" chip clears
 * the filter; tapping the active menu again toggles it off.
 *
 * Controlled: selection lives with the parent (usually the URL `menuId` param),
 * surfaced via `selectedMenuId` / `onSelect` — matching the URL-as-source-of-
 * truth pattern in CategoryGrid/BrandsGrid. Renders nothing while there are no
 * menus (e.g. before the first load returns or on error).
 */
const MenuChips = ({
  source,
  entity,
  selectedMenuId,
  onSelect,
  className,
}: MenuChipsProps) => {
  const { t } = useTranslation(["common"]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMenus(source, entity).then((result) => {
      if (!active) return;
      setMenus(result.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [source, entity]);

  if (loading) {
    return (
      <div className={className}>
        <div className="tw:flex tw:gap-2 tw:overflow-hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton
              key={`ms-${idx}`}
              className="tw:h-7 tw:w-20 tw:shrink-0 tw:rounded-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!menus.length) return null;

  const handleMenuTap = (menu: MenuItem) => {
    // Tapping the active menu clears the filter.
    onSelect(menu._id === selectedMenuId ? null : menu);
  };

  return (
    <AppSwiper config={swiperConfig} className={className}>
      <AppSwiper.Slide isAutoWidth>
        <FilterChip active={!selectedMenuId} onClick={() => onSelect(null)}>
          {t("all", { defaultValue: "All" })}
        </FilterChip>
      </AppSwiper.Slide>

      {menus.map((menu) => (
        <AppSwiper.Slide key={menu._id} isAutoWidth>
          <FilterChip
            active={menu._id === selectedMenuId}
            count={menu.totalDeals ?? menu.dealsCount}
            onClick={() => handleMenuTap(menu)}
          >
            {menu._displayName || menu.name}
          </FilterChip>
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

export default MenuChips;
