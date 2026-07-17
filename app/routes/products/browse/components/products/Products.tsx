import { debounce } from "lodash";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Alpha from "~/components/core/alpha/Alpha";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./heper";
import OtherRecommendedDealModal from "~/shared/catalog/modals/other-deals/OtherRecommendedDealModal";
import AuthService from "~/services/AuthService";

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 10,
};

const BrowseProducts = ({
  callback,
  selectedBrand,
  selectedCategory,
  restrictOn,
}: {
  callback: (params: { action: string; data?: any }) => void;
  selectedBrand: any;
  selectedCategory: any;
  restrictOn: string[];
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("");

  const [otherModal, setOtherModal] = useState({ show: false, dealId: "" });

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });

  const applyFilter = async () => {
    // Check if we have valid filter criteria before proceeding
    const hasValidBrand = filterRef.current.brand?._id;
    const hasValidCategory = filterRef.current.category?._id;
    const hasSearch = filterRef.current.search?.trim();
    const hasAlpha = filterRef.current.alpha;

    // If we have restrictions but no valid criteria, don't proceed
    if (
      restrictOn.includes("brand") &&
      !hasValidBrand &&
      !hasValidCategory &&
      !hasSearch &&
      !hasAlpha
    ) {
      return;
    }

    if (
      restrictOn.includes("category") &&
      !hasValidCategory &&
      !hasValidBrand &&
      !hasSearch &&
      !hasAlpha
    ) {
      return;
    }

    setIsLoading(true);
    setItems([]);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    const params = prepareParams(filterRef.current, paginationRef.current);

    const count = await getCount(params);
    paginationRef.current = {
      ...paginationRef.current,
      totalRecords: count,
    };
    const result = await getData(params);
    setItems(result.data);
    setHasMore(result.data.length < count);
    setIsLoading(false);
  };

  // Load more data for infinite scroll
  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);
    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    // Reset search and alpha when brand or category changes
    setSearch("");
    setSelectedAlpha("");

    filterRef.current = {
      brand: selectedBrand,
      category: selectedCategory,
      search: "",
      alpha: "",
    };

    // Only clear items if we don't have any valid filter criteria
    const hasValidBrand = selectedBrand?._id;
    const hasValidCategory = selectedCategory?._id;
    const requiresBrand = restrictOn.includes("brand");
    const requiresCategory = restrictOn.includes("category");

    // Clear items only if we have restrictions but no valid data for those restrictions
    if (requiresBrand && !hasValidBrand && !hasValidCategory) {
      setItems([]);
      return; // Don't call applyFilter if we don't have valid brand
    }

    if (requiresCategory && !hasValidCategory && !hasValidBrand) {
      setItems([]);
      return; // Don't call applyFilter if we don't have valid category
    }

    // Only apply filter if we have valid criteria
    if (hasValidBrand || hasValidCategory) {
      applyFilter();
    }
  }, [selectedBrand, selectedCategory, restrictOn]);

  const debouncedSearch = useCallback(debounce(applyFilter, 500), []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    filterRef.current = { ...filterRef.current, search: searchValue };

    // Clear alpha selection when search is performed
    if (searchValue && selectedAlpha) {
      setSelectedAlpha("");
      filterRef.current = { ...filterRef.current, alpha: "" };
    }

    debouncedSearch();
  };

  const handleAlphaSelect = (alpha: string) => {
    setSelectedAlpha(alpha);
    filterRef.current = { ...filterRef.current, alpha };

    // Clear search input when alpha is selected
    if (alpha && search) {
      setSearch("");
      filterRef.current = { ...filterRef.current, search: "" };
    }

    applyFilter();
  };

  const handleItemCallback = (params: { action: string; data?: any }) => {
    if (params.action === "click") {
      callback({ action: "view", data: params.data });
    }

    if (params.action === "add") {
      const id = params.data?.data?.data?.id;
      const showOtherDeals = params.data?.data?.data?.showOtherDeals;
      if (id && showOtherDeals && !AuthService.isBuyerUser()) {
        setOtherModal({ show: true, dealId: id });
        return;
      }
    }
  };

  const otherModalCb = (a: any) => {
    setOtherModal({ show: false, dealId: "" });
  };

  // Only show restriction messages if we don't have any valid filter criteria
  const hasValidBrand = selectedBrand?._id;
  const hasValidCategory = selectedCategory?._id;
  const requiresBrand = restrictOn.includes("brand");
  const requiresCategory = restrictOn.includes("category");

  if (requiresBrand && !hasValidBrand && !hasValidCategory) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center tw:p-4">
          Please select a brand to view products.
        </div>
      </div>
    );
  }

  if (requiresCategory && !hasValidCategory && !hasValidBrand) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center tw:p-4">
          Please select a category to view products.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:border tw:border-gray-200 tw:rounded-md tw:md:flex-1">
        <div className="tw:bg-gray-50 tw:px-4 tw:py-2">
          <div className="tw:flex tw:items-center">
            <button
              type="button"
              className="tw:block tw:md:hidden tw:mr-2 tw:p-1 tw:rounded-md tw:text-gray-600"
              onClick={() => callback({ action: "back" })}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="tw:font-semibold tw:mb-1">
                {selectedCategory?.name
                  ? `${selectedCategory.name} Products`
                  : selectedBrand?.name
                  ? `${selectedBrand.name} Products`
                  : "Products"}
              </div>
              <div className="tw:flex tw:items-center tw:gap-2">
                {!isLoading && (
                  <div className="tw:text-xs tw:text-gray-500">
                    {paginationRef.current.totalRecords} products
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="tw:flex tw:gap-1 tw:bg-white tw:py-2">
          <div className=" tw:px-1">
            <Alpha
              selected={selectedAlpha}
              callback={handleAlphaSelect}
              className="tw:h-[calc(100vh-200px)] tw:mb-2"
              orientation="vertical"
            />
          </div>
          <div className="tw:flex-1">
            <AppScrollArea className="tw:h-[calc(100vh-200px)] no-table tw:pe-2">
              <div className="tw:mb-2">
                <input
                  type="text"
                  className="tw:w-full tw:px-2 tw:border tw:border-gray-200 tw:rounded-md tw:h-8 tw:bg-gray-50 tw:outline-none tw:text-xs"
                  placeholder="Search products"
                  value={search}
                  onChange={handleSearch}
                />
              </div>

              {isLoading ? (
                <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                  <AppSpinner />
                </div>
              ) : null}

              {!isLoading && !items.length && <NoData />}

              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                {items.map((item, index) => (
                  <ProductCard
                    key={item._id || index}
                    data={item}
                    callback={handleItemCallback}
                    type={1}
                    cartType="normal"
                  />
                ))}
              </div>

              {hasMore && !isLoading && (
                <div className="tw:flex tw:justify-center tw:items-center tw:mt-4">
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={isLoadingMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={items.length}
                  />
                </div>
              )}
            </AppScrollArea>
          </div>
        </div>
      </div>

      <OtherRecommendedDealModal
        show={otherModal.show}
        dealId={otherModal.dealId}
        callback={otherModalCb}
      />
    </>
  );
};

export default BrowseProducts;
