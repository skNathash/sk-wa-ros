import { produce } from "immer";
import { shuffle } from "lodash";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import type { SwiperOptions } from "swiper/types";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppSwiper from "~/components/core/swiper";
import { Input } from "~/components/ui/input";
import { PAGE_TITLE_PREFIX } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import ConnectedSellerDetails from "~/routes/user/my-profile/components/ConnectedSellerDetails";
import AuthService from "~/services/AuthService";
import PageAccessService from "~/services/PageAccessService";
import BrowseByBrandsCategory from "~/shared/catalog/components/BrowseByBrandsCategory";
import BuyFromNetworkTab from "~/shared/catalog/components/buyfrom-network-tab/BuyFromNetworkTab";
import PromoteCoinStore from "~/shared/catalog/components/promote-coin-store/PromoteCoinStore";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import CategoryDeal from "./components/CategoryDeal";
import Menus from "./components/Menus";
import SellerDataRender from "./components/seller-data-render/SellerDataRender";
import { getCategories, getMenus } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "Products",
    langKey: "products",
  },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const ProductsMain = () => {
  const appNav = useAppNav();
  const { t } = useTranslation();

  const viewType = AuthService.isBuyerUser() ? "buyer" : "normal";
  const [loading, setLoading] = useState(true);
  const [busyLoading, setBusyLoading] = useState({ show: false, msg: "" });
  const [menus, setMenus] = useState<any[]>([]);
  const [activeMenuIndex, setActiveMenuIndex] = useState(-1);

  const location = useLocation();

  const [categories, setCategories] = useState<any[]>([]);
  const [displayCategories, setDisplayCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      setMenus([]);
      const data = await getMenus(viewType);
      setMenus(data);
      setLoading(false);
    };
    if (viewType !== "buyer") {
      fetchMenus();
    }
  }, [viewType]);

  useEffect(() => {
    const t = setTimeout(() => {
      // If menus available and no active selection, try to pick from query param
      if (menus.length > 0 && activeMenuIndex == -1) {
        // try to read menuId from query params
        const params = new URLSearchParams(location.search);
        const menuId = params.get("menuId");

        if (menuId) {
          const idx = menus.findIndex((m: any) => m._id === menuId);
          if (idx >= 0) {
            onMenuTap({ menu: menus[idx] });
          } else {
            onMenuTap({ menu: menus[0] });
          }
        } else {
          onMenuTap({ menu: menus[0] });
        }
      }
      clearTimeout(t);
    }, 800);
  }, [menus, activeMenuIndex]);

  const onMenuTap = async ({ menu, fromMenuClick }: any) => {
    setCategories([]);
    setDisplayCategories([]);

    setActiveMenuIndex(menus.findIndex((m: any) => m._id === menu._id));

    setBusyLoading({ show: true, msg: "Loading..." });
    const r = await getCategories(viewType, menu._id);
    const shuffled = shuffle(r);

    setCategories(shuffled);

    if (shuffled.length > 0) {
      setDisplayCategories(shuffled.slice(0, 3));
    }

    setBusyLoading({ show: false, msg: "" });

    // if this action originated from a menu click, update query params in URL
    if (fromMenuClick) {
      appNav.to(location.pathname, { menuId: menu._id, menuName: menu.name });
    }
  };

  const viewCategory = (category: any) => {
    appNav.to("/products/sk", {
      categoryIds: category._id,
      categoryNames: category.name,
      // include the active menu context when navigating to products
      menuId: menus?.[activeMenuIndex]?._id,
      menuName: menus?.[activeMenuIndex]?.name,
    });
  };

  const renderCategoryItem = (category: any) => {
    return (
      <div
        className="tw:text-center tw:cursor-pointer"
        onClick={() => viewCategory(category)}
      >
        <div className="tw:bg-gray-100 tw:p-1 tw:rounded-xl tw:mb-1 tw:overflow-hidden tw:h-20 tw:lg:h-24 tw:flex tw:items-center tw:justify-center tw:text-center">
          <ImgRender
            assetId={category._displayImg || category.displayImg}
            className="tw:object-contain tw:w-full tw:h-full"
          />
        </div>
        <div className="tw:text-xs tw:font-semibold tw:line-clamp-2">
          {category._displayName}
        </div>
      </div>
    );
  };

  const loadMoreData = () => {
    if (displayCategories.length < categories.length) {
      setDisplayCategories(
        produce((draft) => {
          const itemsToAdd = categories.slice(
            draft.length,
            Math.min(draft.length + 10, categories.length),
          );
          draft.push(...itemsToAdd);
        }),
      );
    } else {
      // Push an object with type: "wdgrender" when all categories are displayed
      if (!displayCategories.some((item) => item.type === "wdgrender")) {
        setDisplayCategories(
          produce((draft) => {
            draft.push({ type: "wdgrender" });
          }),
        );
      }
    }
  };

  const dealCb = (e: any) => {};

  return (
    <>
      <AppHeader
        title={viewType === "buyer" ? t("buyFromSKSeller") : t("buyFromSK")}
        showCart={true}
        showSkSellerNote={true}
      />

      <div className="app-page page-bg tw:relative">
        <div className="tw:bg-white tw:p-4">
          <PromoteCoinStore />
          <BuyFromNetworkTab className="tw:mb-4" />
          {/* <AppBreadcrumbs data={breadcrumbs} /> */}
          <PageDescription
            description={viewType === "buyer" ? "buyFromSeller" : "buyFromSK"}
            className="tw:mb-4"
          />
          <div className="tw:flex tw:flex-col tw:lg:flex-row tw:items-start tw:lg:items-center tw:md:gap-3 tw:gap-1">
            <div
              className="tw:w-full tw:flex-1 tw:relative tw:cursor-pointer"
              onClick={() => appNav.to("/products/search")}
            >
              <Input
                readOnly
                placeholder={t("searchProducts")}
                className="tw:pl-10"
              />
              <SearchIcon
                size={18}
                className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:text-gray-500"
              />
            </div>

            {/* Show browse by brands only for sellers and when categories are loaded */}
            {!AuthService.isBuyerUser() && (
              <>
                <BrowseByBrandsCategory
                  variant="desktop"
                  className="tw:hidden tw:lg:inline-flex"
                />
                <BrowseByBrandsCategory
                  variant="mobile"
                  className="tw:flex tw:lg:hidden"
                />
              </>
            )}
          </div>
        </div>
        <div className="app-container tw:px-4">
          {viewType === "buyer" ? (
            <>
              {AuthService.isSkBuyer() && (
                <div className="tw:mb-4 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3">
                  <ConnectedSellerDetails
                    fid={AuthService.getLinkedSeller()?._id || ""}
                    template={2}
                  />
                </div>
              )}
              <SellerDataRender />
            </>
          ) : (
            <>
              {loading ? (
                <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                  <AppSpinner />
                </div>
              ) : null}

              {menus.length > 0 && (
                <AppCard className="tw:p-2 tw:pb-0" bodyClassName="tw:px-2">
                  <Menus
                    menus={menus}
                    callback={onMenuTap}
                    activeIndex={activeMenuIndex}
                  />
                </AppCard>
              )}

              {categories.length > 0 ? (
                <>
                  {/* Browse by brands moved next to the search input */}

                  {/* categories swiper */}
                  <div className="tw:hidden tw:lg:block tw:py-4">
                    <AppSwiper config={categorySwiperOptions}>
                      {categories.map((category, index) => (
                        <AppSwiper.Slide key={index}>
                          <div className="tw:w-full">
                            {renderCategoryItem(category)}
                          </div>
                        </AppSwiper.Slide>
                      ))}
                    </AppSwiper>
                  </div>

                  {/* categories grid */}
                  <div className="tw:grid tw:grid-cols-4 tw:lg:hidden tw:gap-2">
                    {categories.map((category, index) => (
                      <div key={index}>{renderCategoryItem(category)}</div>
                    ))}
                  </div>

                  {/* categories section deal */}
                  <div>
                    {displayCategories.map((item, index) => (
                      <CategoryDeal
                        key={index}
                        categoryId={item._id}
                        callback={dealCb}
                        name={item._displayName}
                        menuName={menus?.[activeMenuIndex]?.name}
                        menuId={menus?.[activeMenuIndex]?._id}
                        type={viewType}
                      />
                    ))}

                    {displayCategories.length < categories.length &&
                      categories.length > 0 && (
                        <div className="tw:flex tw:justify-center tw:mt-4 tw:mb-4">
                          <LoadMoreButton
                            loadMore={loadMoreData}
                            loading={loading}
                            totalCount={categories.length}
                            loadedCount={displayCategories.length}
                          />
                        </div>
                      )}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      <BusyLoader show={busyLoading.show} />
    </>
  );
};

const categorySwiperOptions: SwiperOptions = {
  slidesPerView: 10.5,
  spaceBetween: 10,
  slidesOffsetAfter: 10,
  slidesOffsetBefore: 10,
  pagination: false,
  navigation: false,
  mousewheel: {
    forceToAxis: true,
  },
};

export function meta() {
  return [
    { title: `${PAGE_TITLE_PREFIX}Products` },
    {
      name: "description",
      content: "View detailed information about the products",
    },
  ];
}

export default ProductsMain;
