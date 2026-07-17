import { Filter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import { Skeleton } from "~/components/ui/skeleton";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import BasketRequestModal from "~/modals/feature/product/basket-request/BasketRequestModal";
import { AuthService } from "~/services/AuthService";
import OtherRecommendedDealModal from "~/shared/catalog/modals/other-deals/OtherRecommendedDealModal";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import Footer from "../components/Footer";
import SearchWithVoice from "../components/SearchWithVoice";
import TopBrandsCategory from "../components/top-brands-category/TopBrandsCategory";
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

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    langKey: "products",
    redirect: { path: "/products/sk" },
  },
  {
    label: "Browse SK",
  },
];

const SkProductsListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const titleFromParams = searchParams.get("title") || "Browse Products";
  const search = searchParams.get("search") || "";

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
    // Once real categories are selected, drop the menu id so the refinement
    // scope reflects the chosen categories instead of the parent menu.
    ...(selectedCatIds.length > 0 ? [] : [searchParams.get("menuId") || ""]),
    searchParams.get("categoryId") || "",
    ...selectedCatIds,
  ]).join(",");
  const brandScope = dedupe([
    searchParams.get("brandId") || "",
    ...selectedBrandIds,
  ]).join(",");
  // Menu / category context from the page params (independent of the left
  // Category filter's own selection) used to scope the category list even
  // before a brand is picked.
  const menuCategoryScope = dedupe([
    searchParams.get("menuId") || "",
    searchParams.get("categoryId") || "",
  ]).join(",");

  // Form methods for the filter modal / applied filters
  const methods = useForm<any>({
    defaultValues: {
      menu: [],
      category: [],
      brand: [],
    },
  });

  const [filterModal, setFilterModal] = useState<{ show: boolean; data?: any }>({
    show: false,
    data: undefined,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [cartActionHandler, setCartActionHandler] = useState<{
    action: string;
    deal: any;
  }>({
    action: "",
    deal: {},
  });

  const [basketRequestModal, setBasketRequestModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [productDetailModal, setProductDetailModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [otherDealModal, setOtherDealModal] = useState<{
    show: boolean;
    dealId: string;
  }>({
    show: false,
    dealId: "",
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

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
      // Once the user picks categories from the side filter, drop the menu id
      // so it doesn't narrow the deal query on top of the chosen categories.
      const formValues = methods.getValues();
      if (selectedCatIds.length > 0) {
        delete formValues.menu;
        delete formValues.menuId;
      }
      const params = prepareParams(
        { ...formValues, selectedCatIds, selectedBrandIds, search },
        paginationRef.current,
      );
      const [productsData, totalRecords] = await Promise.all([
        getData(params),
        getCount(params),
      ]);
      paginationRef.current.totalRecords = totalRecords;
      setProducts(productsData);
      setHasMoreData(
        productsData.length > 0 && productsData.length < totalRecords,
      );
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
      // Once the user picks categories from the side filter, drop the menu id
      // so it doesn't narrow the deal query on top of the chosen categories.
      const formValues = methods.getValues();
      if (selectedCatIds.length > 0) {
        delete formValues.menu;
        delete formValues.menuId;
      }
      const params = prepareParams(
        { ...formValues, selectedCatIds, selectedBrandIds, search },
        paginationRef.current,
      );
      const productsData = await getData(params);
      setProducts((prev) => {
        const next = [...prev, ...productsData];
        setHasMoreData(
          productsData.length > 0 &&
            next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
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
    // Depend on the serialised querystring so any param change retriggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const handleSearch = useCallback(
    (term: string) => {
      const newParams = new URLSearchParams(searchParams);
      const trimmed = term.trim();
      if (trimmed) {
        newParams.set("search", trimmed);
      } else {
        newParams.delete("search");
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handleAddToCart = (response: { action: string; data?: any }) => {
    const { action, data } = response;

    if (action === "group-deal") {
      setCartActionHandler({
        action: "group-deal",
        deal: data.data.deal,
      });
      return;
    }

    if (action === "click") {
      setProductDetailModal({
        show: true,
        data: data.deal,
      });
    }

    if (action === "add-to-basket") {
      setBasketRequestModal({
        show: true,
        data: data,
      });
    }

    const id = data?.data?.data?.id;
    const showOtherDeals = data?.data?.data?.showOtherDeals;
    if (action === "add" && id && showOtherDeals && !AuthService.isBuyerUser()) {
      setOtherDealModal({ show: true, dealId: id });
    }
  };

  const handleCartAction = () => {
    setCartActionHandler({
      action: "",
      deal: {},
    });
  };

  const prepareInitialValues = useCallback(
    () => prepareFormDataFromSearchParams(searchParams),
    [searchParams],
  );

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
      setFilterModal({ show: false, data: undefined });
      handleFilterCallback(payload);
    },
    [handleFilterCallback],
  );

  return (
    <>
      <AppHeader
        title={
          <span className="tw:flex tw:items-center tw:gap-2">
            <ImgRender src="logo.svg" alt="StoreKing" className="tw:h-5 tw:w-5" />
            {titleFromParams}
          </span>
        }
        showCart={true}
      />

      <div className="page-bg app-page tw:p-4">
        <div>
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          <FormProvider {...methods}>
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4 tw:sticky tw:top-16 tw:bg-white tw:z-10">
              <div className="tw:flex-1">
                <SearchWithVoice value={search} onSearch={handleSearch} />
              </div>
              <div>
                <AppButton
                  color="light"
                  size="small"
                  fill="clear"
                  onClick={() =>
                    setFilterModal({ show: true, data: prepareInitialValues() })
                  }
                  className="tw:flex tw:items-center tw:gap-2 tw:whitespace-nowrap tw:h-10 tw:lg:hidden"
                >
                  <Filter className="tw:w-4 tw:h-4" />
                </AppButton>
              </div>
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
                  categoryId={categoryScope}
                  selectedIds={selectedBrandIds}
                  callback={handleBrandFilterChange}
                />
              </div>
              <div className="tw:flex-1 tw:min-h-0">
                <CategoryFilter
                  brandId={brandScope}
                  menuCategoryId={menuCategoryScope}
                  selectedIds={selectedCatIds}
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
                      key={`${product.id || product._id}-${index}`}
                      data={product}
                      callback={handleAddToCart}
                      type={1}
                      cartType="normal"
                      useBusyLoader={true}
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

            {/* Right column — top brands & categories */}
            <aside className="tw:hidden tw:lg:flex tw:flex-col tw:gap-4 tw:w-72 tw:shrink-0 tw:sticky tw:top-24 tw:self-start tw:h-[calc(100vh-9rem)]">
              <div className="tw:min-h-0 tw:overflow-y-auto tw:pr-1">
                <TopBrandsCategory />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />

      {filterModal.show && (
        <FilterModal
          show={filterModal.show}
          initialValues={filterModal.data ?? prepareInitialValues()}
          callback={handleFilterModalCallback}
        />
      )}

      <BasketRequestModal
        show={basketRequestModal.show}
        callback={() => {
          setBasketRequestModal({
            show: false,
            data: {},
          });
        }}
        dealId={basketRequestModal.data.id as string}
      />

      <ProductDetailModal
        show={productDetailModal.show}
        callback={() => {
          setProductDetailModal({
            show: false,
            data: {},
          });
        }}
        dealId={productDetailModal.data._id as string}
        cartType="normal"
      />

      <OtherRecommendedDealModal
        show={otherDealModal.show}
        dealId={otherDealModal.dealId}
        callback={(e: { action: string; data?: any }) => {
          if (e.action === "close") {
            setOtherDealModal({ show: false, dealId: "" });
          }
        }}
      />

      <AddToCartActionHandler
        action={cartActionHandler.action}
        deal={cartActionHandler.deal}
        callback={handleCartAction}
      />
    </>
  );
};

export default SkProductsListPage;
