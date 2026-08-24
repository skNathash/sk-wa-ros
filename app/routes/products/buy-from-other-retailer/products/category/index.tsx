import { debounce } from "lodash";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import { useSidebar } from "~/components/ui/sidebar";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import SupplyCatalogPane from "~/shared/catalog/components/supply-catalog-pane/SupplyCatalogPane";
import BrowseSearchField from "~/shared/catalog/components/browse/BrowseSearchField";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import BuyFromNetworkTab from "../../components/BuyFromNetworkTab";
import DistanceChooser from "../components/DistanceChooser";
import Products from "../components/products/Products";
import CategoryBrowseGrid from "./components/CategoryBrowseGrid";
import CategoryGrid from "./components/CategoryGrid";
import CategoryListPanel, {
  type CategoryItem,
} from "./components/CategoryListPanel";
import MenuColumn, { type MenuItem } from "./components/MenuColumn";
import { getCount, getData, prepareParams } from "./helper";

const KM = DEFAULT_BROWSE_DISTANCE;

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/main" } },
  { label: "Browse by Category" },
];

const CategoriesPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";
  const { setOpen } = useSidebar();

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  React.useEffect(() => {
    setOpen(false);
  }, []);

  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
      distance: KM,
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const alpha = searchParams.get("alpha") || "";
  const rawDistance = searchParams.get("distance") || KM;
  const distance: any = rawDistance === "all" ? "all" : rawDistance;

  const [items, setItems] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreData, setHasMoreData] = React.useState(true);

  const [selectedMenu, setSelectedMenu] = React.useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryItem | null>(null);

  const paginationRef = React.useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const applyFilter = React.useCallback(async () => {
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    setItems([]);
    try {
      const filter = { ...getValues(), menuId: selectedMenu?._id };
      const params = prepareParams(filter, paginationRef.current);
      const d = getValues().distance;
      const distanceParam: any = d === "all" ? "all" : Number(d);
      const data = await getData(params, distanceParam);

      const count = await getCount(params, distanceParam);
      paginationRef.current.totalRecords = count;

      setItems(data);
      setHasMoreData(data.length > 0 && data.length < count);

      // auto-select the first category so the products column populates
      setSelectedCategory(data[0] || null);
    } finally {
      setLoading(false);
    }
  }, [getValues, selectedMenu]);

  React.useEffect(() => {
    const search = searchParams.get("search") || "";
    const a = searchParams.get("alpha") || "";
    const d = searchParams.get("distance") || KM;
    setValue("search", search);
    setValue("alpha", search ? "" : a);
    setValue("distance", d);

    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedMenu]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const filter = { ...getValues(), menuId: selectedMenu?._id };
      const params = prepareParams(filter, paginationRef.current);
      const d = getValues().distance;
      const distanceParam: any = d === "all" ? "all" : Number(d);
      const data = await getData(params, distanceParam);
      setItems((prev) => {
        const next = [...prev, ...data];
        setHasMoreData(
          data.length > 0 && next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, getValues, selectedMenu]);

  const handleFilterChange = (params: Record<string, any> = {}) => {
    const formData = { ...getValues(), ...params };

    let p: Record<string, any> = {};

    if (formData.alpha) {
      p.alpha = formData.alpha;
    }

    if (formData.search) {
      p.search = formData.search?.trim();
    }

    setSearchParams(
      {
        ...p,
      },
      { replace: true },
    );
  };

  const handleSearch = debounce(() => {
    setValue("alpha", "");
    handleFilterChange();
  }, 500);

  const handleAlphaChange = (a: string) => {
    setValue("search", "");
    handleFilterChange({ alpha: a });
  };

  const handleSelectMenu = (menu: MenuItem | null) => {
    setSelectedMenu(menu);
    setSelectedCategory(null);
  };

  return (
    <>
      <AppHeader title={t("browseByCategory")} showCart={true} />
      <div className="page-bg app-page tw:p-4">
        <SectionTabs sectionKey="supply" activeTab="browse" noShadow sticky />

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="browse"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <div className="tw:mb-4 tw:relative tw:z-10">
              <BuyFromNetworkTab
                activeTab="categories"
                className="tw:mb-4 hide-in-theme-2"
              />

              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane /
                    theme-2.css). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {isTheme2 ? (
                    /* theme-2 — card-grid browse view instead of the 3-column
                   menu/category/product layout. */
                    <div className="tw:flex tw:flex-col tw:gap-3">
                      {/* `search-sticky` (theme-2.css) pins the bar under the
                          header and bleeds it edge-to-edge out of the page
                          padding, like the main browse page. */}
                      <BrowseSearchField
                        register={register}
                        onChange={handleSearch}
                        className="search-sticky tw:top-27 tw:md:top-15"
                        trailing={
                          <DistanceChooser selectedDistance={distance} />
                        }
                      />
                      <Alpha
                        selected={alpha}
                        callback={handleAlphaChange}
                        className="tw:w-full"
                      />
                      <CategoryBrowseGrid
                        items={items}
                        loading={loading}
                        loadingMore={loadingMore}
                        hasMoreData={hasMoreData}
                        totalRecords={paginationRef.current.totalRecords}
                        rowsPerPage={paginationRef.current.rowsPerPage}
                        distance={distance}
                        loadMore={loadMore}
                      />
                    </div>
                  ) : (
                    <div className="browse-grid--category tw:grid tw:grid-cols-1 tw:md:grid-cols-[16rem_22rem_1fr] tw:md:grid-rows-1 tw:gap-3 tw:h-[calc(100vh-12rem)]">
                      {/* Col 1 — menus (desktop only) */}
                      {!isMobile && (
                        <MenuColumn
                          distance={distance}
                          selectedId={selectedMenu?._id}
                          onSelect={handleSelectMenu}
                        />
                      )}

                      {/* Col 2 — categories (always visible) */}
                      <div className="tw:flex tw:flex-col tw:gap-2 tw:min-h-0 tw:h-full">
                        <BrowseSearchField
                          register={register}
                          onChange={handleSearch}
                          trailing={
                            <DistanceChooser selectedDistance={distance} />
                          }
                        />
                        <Alpha
                          selected={alpha}
                          callback={handleAlphaChange}
                          className="tw:w-full"
                        />
                        <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto">
                          {isMobile ? (
                            <CategoryGrid
                              items={items}
                              loading={loading}
                              loadingMore={loadingMore}
                              hasMoreData={hasMoreData}
                              totalRecords={paginationRef.current.totalRecords}
                              rowsPerPage={paginationRef.current.rowsPerPage}
                              distance={distance}
                              loadMore={loadMore}
                            />
                          ) : (
                            <CategoryListPanel
                              items={items}
                              loading={loading}
                              loadingMore={loadingMore}
                              hasMoreData={hasMoreData}
                              totalRecords={paginationRef.current.totalRecords}
                              selectedId={selectedCategory?._id}
                              onSelect={setSelectedCategory}
                              loadMore={loadMore}
                            />
                          )}
                        </div>
                      </div>

                      {/* Col 3 — products (desktop only) */}
                      {!isMobile && (
                        <Products
                          menuId={selectedMenu?._id}
                          menuName={selectedMenu?.name}
                          categoryId={selectedCategory?._id}
                          categoryName={selectedCategory?.name}
                          distance={distance}
                          placeholder="Select a category to view its products"
                        />
                      )}
                    </div>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    catalog list pane beside the icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <div className="tw:flex tw:flex-col tw:gap-4">
                    <SupplyCatalogPane
                      title="Marketplace"
                      distance={distance}
                      activeKey="categories"
                      showPurchaseCart
                      showTrendingSearches
                      showPreviousPurchases
                    />
                  </div>
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoriesPage;
