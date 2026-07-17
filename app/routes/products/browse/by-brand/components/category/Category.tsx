import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./heper";
// removed IonIcon and ionicons in favor of lucide-react icons
import clsx from "clsx";
import { debounce } from "lodash";
import { ArrowLeft, ChevronRight, Dot } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Alpha from "~/components/core/alpha/Alpha";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import ProductService from "~/services/ProductService";

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 10,
};

const Category = ({
  callback,
  selectedCategory,
  selectedBrand,
}: {
  callback: (params: { action: string; data?: any }) => void;
  selectedCategory: any;
  selectedBrand?: any;
}) => {
  const { t } = useTranslation(["common"]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("");

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });

  const applyFilter = async () => {
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
    const fetchDataAndApplyFilter = async () => {
      // Reset search and alpha when brand changes
      setSearch("");
      setSelectedAlpha("");

      // Update filterRef with selectedBrand and reset search/alpha
      filterRef.current = {
        ...filterRef.current,
        brand: selectedBrand,
        search: "",
        alpha: "",
      };

      // Call getDealRefinement when brand is found to get category IDs
      if (selectedBrand?._id) {
        try {
          const response = await ProductService.getDealRefinement({
            filter: {
              brand: selectedBrand._id,
            },
            showColumns: ["category"],
          });

          // Extract category IDs from the response
          const categoryIds = response.data?.category || [];

          // Store category IDs in filterRef
          filterRef.current = {
            ...filterRef.current,
            categoryIds: categoryIds,
          };
        } catch (error) {
          console.error("Error fetching category IDs:", error);
        }
      }

      // Apply filter after fetching data
      applyFilter();
    };

    fetchDataAndApplyFilter();
  }, [selectedBrand]);

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

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-md tw:w-full">
      <div className="tw:bg-gray-50 tw:px-4 tw:py-2">
        <div className="tw:flex tw:items-center">
          {/* Mobile-only back button */}
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
              {selectedBrand?.name || t("categories")}
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {paginationRef.current.totalRecords} {t("categories")}
            </div>
          </div>
        </div>
      </div>

      <div className="tw:flex tw:gap-2 tw:bg-white tw:py-2">
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
                placeholder={t("searchCategory")}
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

            {items.map((item) => (
              <div
                className={clsx(
                  "tw:border tw:rounded-md tw:p-2 tw:mb-2 tw:flex tw:gap-2 tw:items-center tw:cursor-pointer",
                  {
                    "tw:border-blue-500 tw:bg-blue-50":
                      selectedCategory?._id === item._id,
                    "tw:border-gray-200": selectedCategory?._id !== item._id,
                  }
                )}
                onClick={() => callback({ action: "view", data: item })}
                key={item._id}
              >
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-medium tw:mb-1">
                    {item._displayName}
                  </div>
                  {/* <div className="tw:flex tw:gap-1 tw:items-center">
                    <div className="tw:text-xs tw:text-gray-500">
                      {item.dealsCount || 0} deals
                    </div>
                  </div> */}
                </div>
                <div>
                  <ChevronRight size={16} aria-hidden />
                </div>
              </div>
            ))}

            {hasMore && !isLoading && (
              <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
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
  );
};

export default Category;
