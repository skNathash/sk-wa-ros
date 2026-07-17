import React, { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTab from "~/components/core/tab/AppTab";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import { Skeleton } from "~/components/ui/skeleton";
import { useSidebar } from "~/components/ui/sidebar";
import useTheme from "~/hooks/useTheme";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
} from "~/types/CommonTypes";
import BuyFromNetworkTab from "../../components/BuyFromNetworkTab";
import DistanceChooser from "../components/DistanceChooser";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import BrandFilter from "../list/components/filters/BrandFilter";
import CategoryFilter from "../list/components/filters/CategoryFilter";
import SellerListModal from "../modals/seller-list/SellerListModal";
import Filter from "./components/Filter";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  tabs,
} from "./helper";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppliedFilters from "./components/AppliedFilters";

const ProductCardSkeleton = () => (
  <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:space-y-4">
    <Skeleton className="tw:h-32 tw:w-full" />
    <Skeleton className="tw:h-4 tw:w-3/4" />
    <Skeleton className="tw:h-4 tw:w-1/2" />
    <Skeleton className="tw:h-4 tw:w-1/4" />
    <Skeleton className="tw:h-8 tw:w-full" />
  </div>
);

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/main" } },
  { label: "My Inventory" },
];

const MyInventoryPage: React.FC = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { setOpen } = useSidebar();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  const rawDistance = searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
  const distance: any = rawDistance === "all" ? "all" : Number(rawDistance);

  // Multi-select ids driven by the left-side Brand / Category filters.
  const selectedBrandIds = (searchParams.get("selectedBrandIds") || "")
    .split(",")
    .filter(Boolean);
  const selectedCatIds = (searchParams.get("selectedCatIds") || "")
    .split(",")
    .filter(Boolean);

  // Cross-filter scopes: brands are scoped by the selected categories and
  // vice-versa (including any single-select id present in the params).
  const dedupe = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
  const menuId = searchParams.get("menuId") || undefined;
  const categoryScope = dedupe([
    searchParams.get("categoryId") || "",
    ...selectedCatIds,
  ]).join(",");
  const brandScope = dedupe([
    searchParams.get("brandId") || "",
    ...selectedBrandIds,
  ]).join(",");

  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const methods = useForm({
    defaultValues: {
      ...defaultFilter,
    },
  });

  const handleFilterCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      // Reset the removed key in the form first, otherwise the live form still
      // holds the old value and the chip gets re-applied (never clears).
      const removedKey = payload.data?.key as keyof typeof defaultFilter;
      if (removedKey) {
        methods.setValue(removedKey as any, defaultFilter[removedKey]);
      }

      // The mobile filter modal owns its own form, so its selections arrive in
      // payload.data and must be synced into the page form before we read the
      // values to build the URL (otherwise the modal apply has no effect).
      if (payload.action === "filter" && payload.data) {
        (["menu", "category", "brand"] as const).forEach((key) => {
          if (payload.data[key] !== undefined) {
            methods.setValue(key as any, payload.data[key]);
          }
        });
      }

      const search = methods.getValues("search");
      const tab = methods.getValues("tab");

      const d = methods.getValues();
      const menuName = d.menu?.[0]?.label;
      const categoryName = d.category?.[0]?.label;
      const brandName = d.brand?.[0]?.label;

      const menuId = d.menu?.[0]?.value?.id;
      const categoryId = d.category?.[0]?.value?.id;
      const brandId = d.brand?.[0]?.value?.id;

      let params = new URLSearchParams();

      const currentDistance = searchParams.get("distance");
      if (currentDistance) {
        params.set("distance", currentDistance);
      }

      if (search) {
        params.set("search", search);
      }

      if (tab) {
        params.set("tab", tab);
      }

      if (menuName && menuId) {
        params.set("menuId", menuId);
        params.set("menuName", menuName);
      }

      if (categoryName && categoryId) {
        params.set("categoryId", categoryId);
        params.set("categoryName", categoryName);
      }

      if (brandName && brandId) {
        params.set("brandId", brandId);
        params.set("brandName", brandName);
      }

      setSearchParams(params, { replace: true });
    },
    [methods, setSearchParams, searchParams],
  );

  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({
    dealId: "",
    show: false,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const handleBuyNow = useCallback((data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }
  }, []);

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "seller" && data.data) {
        const seller = data.data;
        const dealId = seller?.deal?._id || seller?.deal?.id;
        if (dealId) {
          setSellersModal({ dealId, show: true });
        }
      }

      if (data.action === CART_ITEM_ADDED) {
        const dealId = data.data?.dealId;
        if (dealId) {
          setProducts((prev) =>
            prev.map((p) => {
              const id = p._id || p.id;
              if (!id) return p;
              if (id === dealId) {
                return {
                  ...p,
                  inCart: true,
                };
              }
              return p;
            }),
          );
        }
      }

      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    [],
  );

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(
        { ...methods.getValues(), selectedCatIds, selectedBrandIds },
        paginationRef.current,
      );
      const formattedProducts = await getData(params, distance);
      setProducts(formattedProducts);
      setHasMoreData(
        formattedProducts.length >= paginationRef.current.rowsPerPage,
      );
      const total = await getCount(params, distance);
      paginationRef.current.totalRecords = total;
    } catch (error) {
      console.error("Error applying filter:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...methods.getValues(), selectedCatIds, selectedBrandIds },
        paginationRef.current,
      );
      const formattedProducts = await getData(params, distance);
      setProducts((prev) => [...prev, ...formattedProducts]);
      setHasMoreData(
        formattedProducts.length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, methods, distance, searchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab") || tabs[0].key;
    const search = searchParams.get("search") || "";
    const menuId = searchParams.get("menuId") || "";
    const menuName = searchParams.get("menuName") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const categoryName = searchParams.get("categoryName") || "";
    const brandId = searchParams.get("brandId") || "";
    const brandName = searchParams.get("brandName") || "";

    methods.setValue("tab", tab);
    methods.setValue("search", search);
    methods.setValue("menu", []);
    methods.setValue("category", []);
    methods.setValue("brand", []);

    if (menuId && menuName) {
      methods.setValue("menu", [
        { label: menuName, value: { id: menuId, name: menuName } },
      ]);
    }
    if (categoryId && categoryName) {
      methods.setValue("category", [
        { label: categoryName, value: { id: categoryId, name: categoryName } },
      ]);
    }
    if (brandId && brandName) {
      methods.setValue("brand", [
        { label: brandName, value: { id: brandId, name: brandName } },
      ]);
    }

    setActiveTab(tab);
    applyFilter();
  }, [distance, searchParams, methods]);

  // Persist the selected ids from the side filters into the query params so
  // the list re-fetches and the selection survives reloads.
  const updateSelectedIds = useCallback(
    (key: "selectedBrandIds" | "selectedCatIds", ids: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      if (ids && ids.length > 0) {
        newParams.set(key, ids.join(","));
      } else {
        newParams.delete(key);
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleBrandFilterChange = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "brand") {
        updateSelectedIds("selectedBrandIds", data ?? []);
      }
    },
    [updateSelectedIds],
  );

  const handleCategoryFilterChange = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "category") {
        updateSelectedIds("selectedCatIds", data ?? []);
      }
    },
    [updateSelectedIds],
  );

  const handleTabChange = (tab: TabItem) => {
    methods.setValue("tab", tab.key);
    setActiveTab(tab.key);
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev.toString());
        newParams.set("tab", tab.key);
        return newParams;
      },
      { replace: true },
    );
  };

  // theme-2 keeps the product grid to 6 columns on wide screens; other themes
  // pack a denser 7-column grid.
  const productGridClass = `tw:grid tw:grid-cols-2 tw:md:grid-cols-3 ${
    theme === "theme-2" ? "tw:xl:grid-cols-6" : "tw:xl:grid-cols-7"
  } tw:gap-4`;

  return (
    <>
      <AppHeader
        title={t("myInventory")}
        showCart={true}
        showRecordPayment={false}
      />
      <div className="page-bg app-page tw:p-4">
        <SectionTabs
          sectionKey="supply"
          activeTab="buy-from-network"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="buy-from-network"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <BuyFromNetworkTab activeTab="my-inventory" className="tw:mb-4" />

          <div className="tw:mb-4 tw:text-xs tw:text-gray-600">
            Your inventory items with nearby sellers.
          </div>

          <div className="tw:flex tw:gap-4">
            {/* Left column — Brand & Category filters (desktop only) */}
            <aside className="tw:hidden tw:lg:flex tw:flex-col tw:w-72 tw:shrink-0 tw:sticky tw:top-24 tw:self-start tw:h-[calc(100vh-9rem)]">
              <div className="tw:flex-1 tw:min-h-0">
                <BrandFilter
                  menuId={menuId}
                  categoryId={categoryScope}
                  selectedIds={selectedBrandIds}
                  distance={distance}
                  callback={handleBrandFilterChange}
                />
              </div>
              <div className="tw:flex-1 tw:min-h-0">
                <CategoryFilter
                  menuId={menuId}
                  brandId={brandScope}
                  selectedIds={selectedCatIds}
                  distance={distance}
                  callback={handleCategoryFilterChange}
                />
              </div>
            </aside>

            {/* Center column — tab, search and products */}
            <div className="tw:flex-1 tw:min-w-0">
              <AppTab
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant="underline"
                className="tw:mb-4"
              />

              <div className="tw:mb-4 tw:sticky tw:top-16 tw:z-10">
                <FormProvider {...methods}>
                  <Filter
                    callback={handleFilterCallback}
                    distance={distance?.toString()}
                    rightSlot={
                      <DistanceChooser
                        selectedDistance={distance?.toString()}
                      />
                    }
                  />
                  <AppliedFilters callback={handleFilterCallback} />
                </FormProvider>
              </div>

              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={products.length}
                fwSize="sm"
                className="tw:mb-4"
              />

              {loading ? (
                <div className={productGridClass}>
                  {Array.from({ length: 12 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                  ))}
                </div>
              ) : products.length === 0 && !loading ? (
                <NoData />
              ) : (
                <>
                  <div className={productGridClass}>
                    {products.map((product, index) => (
                      <ProductCard
                        key={index}
                        data={product}
                        callback={handleBuyNow}
                      />
                    ))}
                  </div>
                  {hasMoreData && (
                    <div className="tw:flex tw:justify-center tw:mt-4">
                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                        loadedCount={products.length}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
      />

      <Footer />
    </>
  );
};

export default MyInventoryPage;
