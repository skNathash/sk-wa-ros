import { ChevronRight } from "lucide-react";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppLink from "~/components/core/link/AppLink";
import ImgRender from "~/components/core/img/ImgRender";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";

type Menu = {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
};

type Props = {
  distance?: number | string;
  menus?: Menu[];
  loading?: boolean;
};

const LIST_PATH = "/products/buy-from-other-retailer/products/list";

const buildMenuHref = (menu: Menu, distance: number | string) => {
  const params = new URLSearchParams({
    menuId: menu._id,
    menuName: menu._displayName || menu.name,
    distance: String(distance),
  });
  return `${LIST_PATH}?${params.toString()}`;
};

const MenuList = ({
  distance = DEFAULT_BROWSE_DISTANCE,
  menus = [],
  loading = false,
}: Props) => {
  if (!loading && (!menus || menus.length === 0)) return null;

  return (
    <div className="network-menu-list tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-sm tw:flex tw:flex-col tw:h-[calc(100vh-11rem)] tw:overflow-hidden">
      <div className="tw:px-3 tw:py-2 tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100">
        <h3 className="tw:text-[11px] tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          Menus
        </h3>
        {!loading && menus.length ? (
          <span className="tw:text-[11px] tw:font-medium tw:text-gray-400">
            {menus.length}
          </span>
        ) : null}
      </div>

      <AppScrollArea className="tw:flex-1 tw:min-h-0">
        {loading ? (
          <div className="tw:divide-y tw:divide-gray-50">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5"
              >
                <Skeleton className="tw:h-7 tw:w-7 tw:rounded-md" />
                <Skeleton className="tw:h-3 tw:w-2/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="tw:divide-y tw:divide-gray-50">
            {menus.map((menu) => (
              <AppLink
                key={menu._id}
                asLink
                noUnderline
                href={buildMenuHref(menu, distance)}
                title={menu._displayName || menu.name}
                className="tw:group tw:relative tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5 tw:w-full tw:hover:bg-primary/5 tw:transition-colors"
              >
                <span className="tw:absolute tw:left-0 tw:top-1 tw:bottom-1 tw:w-0.5 tw:rounded-r-full tw:bg-primary tw:opacity-0 tw:group-hover:opacity-100 tw:transition-opacity" />
                <div className="tw:h-7 tw:w-7 tw:shrink-0 tw:bg-gray-50 tw:border tw:border-gray-100 tw:rounded-md tw:flex tw:items-center tw:justify-center tw:overflow-hidden tw:p-0.5 tw:group-hover:border-primary/30">
                  <ImgRender
                    assetId={menu._displayImg}
                    alt={menu.name}
                    width={100}
                    className="tw:w-full tw:h-full tw:object-contain"
                  />
                </div>
                <span className="tw:flex-1 tw:min-w-0 tw:text-xs tw:font-medium tw:leading-tight tw:text-gray-800 tw:line-clamp-2 tw:group-hover:text-primary">
                  {menu._displayName || menu.name}
                </span>
                <ChevronRight className="tw:w-3.5 tw:h-3.5 tw:text-gray-300 tw:shrink-0 tw:group-hover:text-primary tw:transition-colors" />
              </AppLink>
            ))}
          </div>
        )}
      </AppScrollArea>
    </div>
  );
};

export default MenuList;
