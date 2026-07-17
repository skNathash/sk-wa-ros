import { Filter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import SearchWithVoice from "../components/SearchWithVoice";
// Product detail modal removed
import SellerListModal from "../modals/seller-list/SellerListModal";
import AppliedFilters from "./components/AppliedFilters";
import BrandFilter from "./components/filters/BrandFilter";
import CategoryFilter from "./components/filters/CategoryFilter";
import {
  applyFormDataToSearchParams,
  getCount,
  getData,
  prepareFormDataFromSearchParams,
  prepareParams,
} from "./helper";
import { FilterModal } from "./modals/FilterModal";

const ProductCardSkeleton = () => (
  <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:space-y-4">
    <Skeleton className="tw:h-32 tw:w-full" />
    <Skeleton className="tw:h-4 tw:w-3/4" />
    <Skeleton className="tw:h-4 tw:w-1/2" />
    <Skeleton className="tw:h-4 tw:w-1/4" />
    <Skeleton className="tw:h-8 tw:w-full" />
  </div>
);

const BuyFromOtherRetailerProductsListPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const appNav = useAppNav();

  const titleFromParams = searchParams.get("title") || "Browse Products";

  const menuId = searchParams.get("menuId") || undefined;
  const distance =
    searchParams.get("distance") || String(DEFAULT_BROWSE_DISTANCE);

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
  const categoryScope = dedupe([
    searchParams.get("categoryId") || "",
    ...selectedCatIds,
  ]).join(",");
  const brandScope = dedupe([
    searchParams.get("brandId") || "",
    ...selectedBrandIds,
  ]).join(",");

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Home",
      langKey: "home",
      redirect: { path: "/products/main" },
    },
    {
      label: "Products",
      langKey: "products",
    },
  ];

  // Form methods for search / filters
  const methods = useForm<any>({
    defaultValues: {
      menu: [],
      category: [],
      brand: [],
      feature: "",
    },
  });

  const [filterModal, setFilterModal] = useState<{ show: boolean; data?: any }>(
    {
      show: false,
      data: undefined,
    },
  );
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

    // If a seller was tapped inside the modal, open the same modal (or keep it open)
    // and also forward the seller tap to any product-level callback if needed.
    if (data.action === "seller" && data.data) {
      const seller = data.data;
      // ensure modal is open for its deal
      if (seller.deal && seller.deal._id) {
        setSellersModal({ dealId: seller.deal._id, show: true });
      }
      // Optionally, you might want to call other callbacks or handle seller-specific flows here
    }

    // 'details' action removed: product detail modal no longer used
  }, []);

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      }

      // If the modal forwards a seller tap, also call the product card callback
      if (data.action === "seller" && data.data) {
        // forward to product component if needed
        // structure: data.data is the seller object
        // call callback with a custom action if parent product expects it
        // Here we notify parent that a seller was selected
      }
    },
    [],
  );

  // detail modal removed; placeholder callback kept for compatibility
  const handleDetailModalCallback = useCallback(
    (payload: { show?: boolean; data?: any }) => {},
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
      const totalRecords = await getCount(params, distance);
      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params, distance);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error applying filter:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
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
      const productsData = await getData(params, distance);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, searchParams]);

  useEffect(() => {
    // Populate form with values derived from search params
    const initialFormValues = prepareFormDataFromSearchParams(searchParams);
    methods.reset(initialFormValues);
    applyFilter();
    // Depend on the serialised querystring so changes like `?distance=...`
    // reliably retrigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const prepareInitialValues = useCallback(() => {
    const initialValues: any = {
      menu: [],
      category: [],
      brand: [],
      feature: "",
    };

    // Prepare menu initial value
    if (searchParams.get("menuId")) {
      initialValues.menu = [
        {
          label: searchParams.get("menuName") || "",
          value: {
            id: searchParams.get("menuId"),
            name: searchParams.get("menuName") || "",
          },
        },
      ];
    }

    // Prepare category initial value
    if (searchParams.get("categoryId")) {
      initialValues.category = [
        {
          label: searchParams.get("categoryName") || "",
          value: {
            id: searchParams.get("categoryId"),
            name: searchParams.get("categoryName") || "",
          },
        },
      ];
    }

    // Prepare brand initial value
    if (searchParams.get("brandId")) {
      initialValues.brand = [
        {
          label: searchParams.get("brandName") || "",
          value: {
            id: searchParams.get("brandId"),
            name: searchParams.get("brandName") || "",
          },
        },
      ];
    }

    // Prepare stockStatus initial value
    if (searchParams.get("stockStatus")) {
      initialValues.stockStatus = searchParams
        .get("stockStatus")!
        .split(",")
        .filter(Boolean);
    }

    // Prepare movementType initial value
    if (searchParams.get("movementType")) {
      initialValues.movementType = searchParams
        .get("movementType")!
        .split(",")
        .filter(Boolean);
    }

    // Prepare tags initial value
    if (searchParams.get("tags")) {
      initialValues.tags = searchParams.get("tags")!.split(",").filter(Boolean);
    }

    // Prepare feature initial value
    if (searchParams.get("feature")) {
      initialValues.feature = searchParams.get("feature")!;
    }

    return initialValues;
  }, [searchParams.toString()]);

  const handleFilterCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    setFilterModal({ show: false, data: undefined });
    if (action === "apply") {
      applyFormDataToSearchParams(data ?? {}, searchParams, setSearchParams);
    }
  };

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
      setSearchParams(newParams);
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

  const handleAppliedFiltersChange = (payload: {
    action: string;
    data?: any;
    formData?: any;
  }) => {
    applyFormDataToSearchParams(
      payload?.formData ?? {},
      searchParams,
      setSearchParams,
    );
  };

  const handleFilterModalCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      // close modal first
      setFilterModal({ show: false, data: undefined });

      handleFilterCallback(payload);
    },
    [handleFilterCallback],
  );

  return (
    <>
      <AppHeader title={titleFromParams} showSearch={false} showCart={true} />

      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs
          sectionKey="supply"
          activeTab="buy-from-network"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
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

            {/* <BuyFromNetworkTab activeTab="products" className="tw:mb-4" /> */}
            <FormProvider {...methods}>
              <div className="tw:mb-4 tw:sticky tw:top-16 tw:z-10">
                <SearchWithVoice
                  trailing={
                    <AppButton
                      color="light"
                      size="small"
                      fill="clear"
                      onClick={() =>
                        setFilterModal({
                          show: true,
                          data: methods.getValues(),
                        })
                      }
                      className="tw:flex tw:items-center tw:gap-2 tw:whitespace-nowrap tw:h-9 tw:lg:hidden"
                    >
                      <Filter className="tw:w-4 tw:h-4" />
                    </AppButton>
                  }
                />
              </div>

              <AppliedFilters
                onFilterChange={({ formData }) =>
                  handleAppliedFiltersChange({ action: "change", formData })
                }
              />
            </FormProvider>

            <div className="tw:flex tw:gap-4">
              {/* Left column — Brand & Category filters (desktop only) */}
              <aside className="tw:hidden tw:lg:flex tw:flex-col tw:gap-4 tw:w-72 tw:shrink-0 tw:sticky tw:top-24 tw:self-start tw:h-[calc(100vh-9rem)]">
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

              {/* Center column — products */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:justify-between tw:items-center">
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={products.length}
                    fwSize="sm"
                  />
                </div>

                {loading ? (
                  <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:xl:grid-cols-5 tw:mt-4 tw:gap-4">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:xl:grid-cols-5 tw:mt-4 tw:gap-4">
                    {products.map((product, index) => (
                      <ProductCard
                        key={index}
                        data={product}
                        callback={handleBuyNow}
                      />
                    ))}
                  </div>
                ) : (
                  <NoData />
                )}

                {hasMoreData && !loading && (
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={products.length}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={searchParams.get("distance") || undefined}
        type={
          searchParams?.get("feature") === "promotionalDeals"
            ? "PromotionalDeal"
            : undefined
        }
      />
      {filterModal.show && (
        <FilterModal
          show={filterModal.show}
          initialValues={filterModal.data ?? prepareInitialValues()}
          callback={handleFilterModalCallback}
          distance={searchParams.get("distance") || undefined}
        />
      )}
    </>
  );
};

export default BuyFromOtherRetailerProductsListPage;
