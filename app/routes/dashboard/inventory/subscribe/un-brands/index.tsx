import { debounce, get } from "lodash";
import { Filter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import { UN_BRAND_ID } from "~/constants";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PageAccessService from "~/services/PageAccessService";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import ParentCategorySearchInput from "~/shared/catalog/components/search-input/parent-category/ParentCategorySearchInput";
import type { PaginationState } from "~/types/CommonTypes";
import * as helper from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { allowNoSubscribe: true });
}

type FormData = {
  search: string;
  selectedMenu: any[];
  selectedCategory: any[];
  category: any[];
};

const getRandomSortType = () => {
  try {
    const opts = InventorySubscribeService.getSortOptions().map(
      (opt) => opt.value,
    );
    if (opts.length === 0) return "popular";
    return opts[Math.floor(Math.random() * opts.length)];
  } catch (err) {
    return "popular";
  }
};

const STAPLES_ID = "C6424";
const RICE_ID = "C6720";
const COOKING_ESSENTIALS_ID = "C7339";
const FRESH_FRUITS_ID = "C7114";
const FRESH_VEGETABLES_ID = "C7111";
const FRESH_FLOWERS_ID = "C7799";
const SNACKS_ID = "C7340";

const BRAND_ID = UN_BRAND_ID;

const defaultSearchParams = {
  tab: "un-brands",
};

const menuParams = {
  page: 1,
  count: 500,
  filter: {
    "applicableBrand.brandId": BRAND_ID,
  },
};

const getCategoryFilter = (menuId: string = "") => {
  let p: Record<string, any> = {
    page: 1,
    count: 500,
    filter: {
      "applicableBrand.brandId": BRAND_ID,
    },
  };

  if (menuId) {
    p.filter["applicableMenu.menuId"] = menuId;
  }

  return p;
};

const UnBrandsSubscribe = () => {
  const { t } = useTranslation();
  const nav = useAppNav();
  const appToast = useAppToast();

  const { control, setValue, getValues, register } = useForm<FormData>({
    defaultValues: {
      search: "",
      selectedMenu: [],
      selectedCategory: [],
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedMenu, selectedCategory] = useWatch({
    control,
    name: ["selectedMenu", "selectedCategory"],
  }) as any[];

  const [categoryFilter, setCategoryFilter] = useState<Record<string, any>>({
    ...getCategoryFilter(STAPLES_ID),
  });

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyLoader, setBusyLoader] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [sortType, setSortType] = useState<string>(getRandomSortType());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleViewDeals = async (subCategory: any) => {
    const parentCategory: Record<string, any> =
      getValues("selectedCategory") || {};
    const parentCategoryId = parentCategory?.value?.id;

    const menu = getValues("selectedMenu") || [];

    const params: Record<string, any> = {
      page: 1,
      limit: 2,
      filter: {
        status: "Active",
        "applicableBrand.brandId": BRAND_ID,
      },
      dealSubscribeType: "NOTSUBSCRIBED",
      sort: {},
    };

    // set menu
    if (menu.length > 0) {
      params.filter["applicableMenu.menuId"] = menu[0].value.id;
    }

    // set sub-category (the clicked item) as applicableCategory
    const subCategoryId = subCategory._id;
    if (subCategoryId) {
      params.filter["applicableCategory.categoryId"] = {
        $in: [subCategoryId],
      };
    }

    // if parent category exists, include it as well
    if (parentCategoryId) {
      params.filter["applicableParentCategory.parentCategoryId"] = {
        $in: [parentCategoryId],
      };
    }

    try {
      setBusyLoader(true);
      const response = await InventorySubscribeService.getDeals(params);
      const deals = InventorySubscribeService.formatDealResponse(
        response?.data?.data || [],
      );

      if (deals.length === 1) {
        const deal = deals[0];

        let uniqueCount = 0;
        let hasDealInCart = false;
        try {
          const cartResp = await InventorySubscribeService.getCart();
          if (cartResp?.statusCode === 200) {
            const serverProducts = cartResp.data?.data?.products || [];
            const dealIds = serverProducts
              .map((p: any) => p.dealId || p._id)
              .filter(Boolean);
            hasDealInCart = dealIds.includes(deal._id);
            uniqueCount = new Set(dealIds).size;
          }
        } catch (err) {
          const local = InventorySubscribeService.getLocalCart() || [];
          const dealIds = local.map((p: any) => p.dealId).filter(Boolean);
          hasDealInCart = dealIds.includes(deal._id);
          uniqueCount = new Set(dealIds).size;
        }

        if (!hasDealInCart && uniqueCount >= 50) {
          appToast.show({
            msg: "You can only subscribe up to 50 products at a time. Please review your cart to subscribe",
            color: "warning",
          });
          return;
        }

        const createResp = await InventorySubscribeService.createRequest({
          dealId: deal._id,
          quantity: 0,
          price: deal.mrp,
        });

        if (createResp.statusCode === 200) {
          const product = createResp.data?.data || {};
          InventorySubscribeService.saveInLocalCart({
            dealId: deal._id,
            dealName: deal.name,
            quantity: 0,
            price: deal.mrp,
            images: deal.images,
            itemId: product.itemId,
            subCategoryId: subCategoryId,
          });
          InventorySubscribeService.triggerItemAddedEvent({
            dealId: deal._id,
            dealName: deal.name,
          });

          // Mark the clicked sub-category as subscribed in the local items state
          try {
            setItems((prev) =>
              prev.map((it) =>
                it._id === subCategory._id ? { ...it, isSubscribed: true } : it,
              ),
            );
          } catch (err) {
            // ignore errors updating local state
          }

          appToast.show({ msg: "Product subscribed", color: "success" });
        } else {
          appToast.show({
            msg: createResp?.data?.message || "Failed to subscribe",
            color: "danger",
          });
        }
      } else {
        nav.to("/dashboard/inventory/subscribe/search", {
          tab: "search",
          mode: "unbrand",
          categoryId: subCategoryId,
          categoryName: subCategory.name || "",
        });
      }
    } catch (err) {
      console.error(err);
      appToast.show({ msg: "Failed to fetch deals", color: "danger" });
    } finally {
      setBusyLoader(false);
    }
  };

  const defaultPagination: PaginationState = {
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  };

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const isInitializingRef = useRef(false);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    const filter = getValues();

    if (!filter.selectedMenu || filter.selectedMenu.length === 0) {
      return;
    }

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setItems([]);

    try {
      const params = helper.prepareParams(
        {
          menu: filter.selectedMenu,
          category: filter.selectedCategory,
          search: filter.search,
          sortType: sortType,
        },
        paginationRef.current,
      );

      const totalRecords = await helper.getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const res = await helper.getData(params);
      const data = (res && res.data) || [];
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [sortType, getValues]);

  useEffect(() => {
    const menuId = searchParams.get("menuId");
    const categoryId = searchParams.get("categoryId");
    const searchQ = searchParams.get("search") || "";
    const menuName = searchParams.get("menuName");
    const categoryName = searchParams.get("categoryName");
    const filter = searchParams.get("filter");

    // Prevent multiple redirects during initialization
    if (!filter && isInitializingRef.current) {
      return;
    }

    setItems([]);
    setLoading(true);
    setValue("selectedCategory", []);
    // Populate search input from URL param when present
    if (searchQ) {
      setValue("search", searchQ);
    } else {
      // clear search if no param
      setValue("search", "");
    }

    if (!filter) {
      // Mark that we're initializing to prevent multiple redirects
      isInitializingRef.current = true;

      // Fetch menus, pick a random one, then fetch categories and pick a random category
      const fetchRandomMenuAndCategory = async () => {
        try {
          // Fetch menu list
          const params: Record<string, any> = {
            ...menuParams,
            filter: {
              "applicableMenu.menuId": {
                $in: [
                  STAPLES_ID,
                  COOKING_ESSENTIALS_ID,
                  FRESH_FRUITS_ID,
                  FRESH_VEGETABLES_ID,
                  FRESH_FLOWERS_ID,
                  SNACKS_ID,
                ],
              },
            },
          };
          const menuResp = await InventorySubscribeService.getMenus(params);

          const menus = InventorySubscribeService.formatMenuResponse(
            menuResp.data?.data || [],
          );

          let selectedMenuId = "";
          let selectedMenuName = "";

          if (menus.length > 0) {
            // Pick a random menu
            const randomMenuIndex = Math.floor(Math.random() * menus.length);
            const randomMenu = menus[randomMenuIndex];
            selectedMenuId = randomMenu._id || "";
            selectedMenuName = randomMenu.name || "";

            // Update FormData using setValue
            setValue("selectedMenu", [
              {
                label: selectedMenuName,
                value: { id: selectedMenuId, name: selectedMenuName },
              },
            ]);
          } else {
            selectedMenuId = STAPLES_ID;
            selectedMenuName = "Staples";

            // Update FormData using setValue
            setValue("selectedMenu", [
              {
                label: selectedMenuName,
                value: { id: selectedMenuId, name: selectedMenuName },
              },
            ]);
          }

          // Update categoryFilter and apply filter
          setCategoryFilter({
            ...getCategoryFilter(selectedMenuId),
          });
          applyFilter();
        } catch (err) {
          console.error(err);
          isInitializingRef.current = false;
        }
      };

      fetchRandomMenuAndCategory();
      return;
    }

    // Reset initialization flag when filter is applied
    isInitializingRef.current = false;

    if (menuId) {
      setValue("selectedMenu", [
        { label: menuName, value: { id: menuId, name: menuName } },
      ]);
      setCategoryFilter({
        ...getCategoryFilter(menuId),
      });
    } else {
      setValue("selectedMenu", []);
      setCategoryFilter({ ...getCategoryFilter("") });
    }

    if (categoryId) {
      setValue("selectedCategory", [
        {
          label: categoryName,
          value: { id: categoryId, name: categoryName },
        },
      ]);
    }

    if (menuId) {
      applyFilter();
    }
  }, [searchParams, setValue, applyFilter]);

  const handleMenuSelect = async (_item: any, _action: "add" | "remove") => {
    const id = _item?.value?.id || "";
    const name = _item?.label || "";

    if (_action === "add") {
      setSearchParams(
        {
          ...defaultSearchParams,
          filter: "applied",
          menuId: id,
          menuName: name,
          categoryId: "all",
          categoryName: "All",
        },
        { replace: true },
      );
    } else {
      setSearchParams(
        {
          ...defaultSearchParams,
          filter: "applied",
        },
        { replace: true },
      );
    }
  };

  // Load more data for LoadMoreButton
  const loadMore = useCallback(async () => {
    const filter = getValues();

    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = helper.prepareParams(
        {
          menu: filter.selectedMenu,
          category: filter.selectedCategory,
          search: filter.search,
          sortType: sortType,
        },
        paginationRef.current,
      );
      const res = await helper.getData(params);
      const data = (res && res.data) || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, sortType]);

  const handleCategorySelect = (_item: any, _action: "add" | "remove") => {
    const id = _item?.value?.id || "";
    const name = _item?.label || "";

    const menu = getValues("selectedMenu");
    const menuId = menu[0]?.value?.id || "";
    const menuName = menu[0]?.label || "";

    if (_action === "add") {
      const params = Object.fromEntries(searchParams.entries());
      setSearchParams(
        {
          ...defaultSearchParams,
          ...params,
          filter: "applied",
          menuId: menuId,
          menuName: menuName,
          categoryId: id,
          categoryName: name,
        },
        { replace: true },
      );
    } else {
      const params = Object.fromEntries(searchParams.entries());
      delete params.categoryId;
      delete params.categoryName;
      setSearchParams(
        {
          ...defaultSearchParams,
          ...params,
          filter: "applied",
          menuId: menuId,
          menuName: menuName,
        },
        { replace: true },
      );
    }
  };

  const handleSearchChange = useCallback(
    debounce(() => {
      // applyFilter();
      const menu = getValues("selectedMenu");
      const menuId = menu[0]?.value?.id || "";
      const menuName = menu[0]?.label || "";
      setSearchParams(
        {
          ...defaultSearchParams,
          filter: "applied",
          ...Object.fromEntries(searchParams.entries()),
          menuId: menuId,
          menuName: menuName,
          search: getValues("search"),
        },
        { replace: true },
      );
    }, 500),
    [searchParams, getValues],
  );

  const renderFilterLabel = () => {
    const menu = selectedMenu[0]?.label || "";
    const category = selectedCategory[0]?.label || "";
    const isAllCategory = selectedCategory[0]?.value?.id === "all";
    if (!isAllCategory && category) {
      return category;
    }

    if (menu) {
      return menu;
    }

    return "";
  };

  return (
    <>
      {/* Filter bar. Uses the shared full-bleed sticky strip so it carries an
          opaque background once pinned — without it the grid scrolled through
          the transparent bar. `catalog-search-flush` cancels the page's top
          gutter (this is the first block in the column on the unbrand flow,
          where the layout hides the tab row). */}
      <div className="catalog-search-sticky catalog-search-flush">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
          {/* Menu and Toggle - always visible */}
          <div className="tw:flex tw:gap-2 tw:items-end">
            <div className="tw:flex-1">
              <MenuSearchInput
                size="sm"
                placeholder="Select Menu"
                callback={handleMenuSelect}
                values={selectedMenu}
                feature="inventory-subscribe"
                multiSelect={false}
                params={menuParams}
                renderType="app-select"
                label={t("menu")}
              />
            </div>
            {/* Toggle button - only visible on mobile */}
            <AppButton
              size="small"
              fill="outline"
              color="light"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className="tw:mb-0 tw:md:hidden"
              title={showMobileFilters ? "Hide Filters" : "Show Filters"}
            >
              <Filter
                className={`tw:w-4 tw:h-4 ${
                  showMobileFilters ? "tw:fill-current" : ""
                }`}
              />
            </AppButton>
          </div>

          {/* Category - visible on desktop, conditionally on mobile */}
          <div
            className={
              showMobileFilters
                ? "tw:block tw:md:block"
                : "tw:hidden tw:md:block"
            }
          >
            <ParentCategorySearchInput
              disabled={!selectedMenu?.length}
              placeholder="Select Category"
              size="sm"
              multiSelect={true}
              callback={handleCategorySelect}
              values={selectedCategory}
              feature="inventory-subscribe"
              params={categoryFilter}
              renderType="app-select"
              label={t("category")}
              includeSelectAllOption={true}
            />
          </div>

          {/* Search - visible on desktop, conditionally on mobile */}
          <div
            className={
              showMobileFilters
                ? "tw:block tw:md:block"
                : "tw:hidden tw:md:block"
            }
          >
            <AppInput
              name="search"
              placeholder="Search Sub-Categories"
              size="sm"
              register={register}
              onChange={handleSearchChange}
              className="tw:w-full"
              label={t("search")}
            />
          </div>
        </div>
      </div>

      <div className="tw:mt-4">
        {loading ? (
          // Show skeleton placeholders while loading
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-6 tw:gap-3">
            {Array.from({ length: paginationRef.current.rowsPerPage }).map(
              (_, idx) => (
                <AppCard key={`skeleton-${idx}`} className="tw:mb-3">
                  <div>
                    <Skeleton className="tw:h-32 tw:w-full tw:mb-2" />
                    <Skeleton className="tw:h-3 tw:w-full" />
                  </div>
                </AppCard>
              ),
            )}
          </div>
        ) : (
          <>
            {paginationRef.current.totalRecords > 0 &&
              selectedCategory?.length > 0 && (
                <div className="tw:mb-4 tw:text-sm tw:text-gray-600">
                  Showing {paginationRef.current.totalRecords} sub-categories of{" "}
                  <span className="tw:font-semibold">
                    {renderFilterLabel() || "selected category"}
                  </span>
                </div>
              )}

            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-3">
              {items.map((it, idx) => (
                <AppCard
                  key={`${it._id}-${idx}`}
                  className="tw:overflow-hidden"
                  noPadding
                >
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:bg-white">
                      <div className="tw:flex tw:justify-center tw:items-center tw:relative tw:h-32">
                        {it._displayImg ? (
                          <ImgRender
                            assetId={it._displayImg}
                            alt={it.name}
                            className="tw:h-full tw:object-cover tw:w-full"
                            size="300"
                          />
                        ) : (
                          <div className="tw:h-28 tw:object-cover tw:w-full tw:bg-gray-100 tw:flex tw:items-center tw:justify-center"></div>
                        )}
                      </div>
                    </div>

                    <div className="tw:p-3 tw:pt-3">
                      <div className="tw:h-14 tw:flex tw:items-center">
                        <div className="tw:md:text-base tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
                          {it._displayName}
                        </div>
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:line-clamp-2">
                        {it.description}
                      </div>
                      <div className="tw:mt-3 tw:flex tw:justify-center">
                        {it.isSubscribed ? (
                          <AppButton
                            size="small"
                            className="tw:w-full"
                            color="light"
                            onClick={() =>
                              nav.to("/dashboard/inventory/subscribe/cart")
                            }
                          >
                            Subscribed
                          </AppButton>
                        ) : (
                          <AppButton
                            size="small"
                            className="tw:w-full"
                            color="success"
                            onClick={() => handleViewDeals(it)}
                          >
                            {it.totalDeals === 1 ? "Subscribe" : "View Deals"}
                          </AppButton>
                        )}
                      </div>
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>

            {/* Show helpful prompt when menu or category not selected */}
            {!loading && !selectedMenu?.length && (
              <AppCard className="tw:mb-3">
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-8">
                  <div className="tw:text-center">
                    <div className="tw:text-lg tw:font-medium tw:mb-2">
                      Select menu and category
                    </div>
                    <div className="tw:text-sm tw:text-gray-500">
                      Please select a menu and one or more categories to view
                      subscribe items.
                    </div>
                  </div>
                </div>
              </AppCard>
            )}

            {!loading && selectedMenu?.length && items.length === 0 ? (
              <NoData />
            ) : null}

            {hasMoreData && items.length && !loading ? (
              <div className="tw:flex tw:justify-center tw:mt-2">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
      <BusyLoader show={busyLoader} />
    </>
  );
};

export default UnBrandsSubscribe;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Inventory - Un-Branded Catalog Subscription",
      ),
    },
  ];
}
