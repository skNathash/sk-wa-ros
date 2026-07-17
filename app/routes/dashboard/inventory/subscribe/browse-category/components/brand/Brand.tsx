import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import { ChevronRight, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { debounce } from "lodash";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppButton from "~/components/core/button/AppButton";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Alpha from "~/components/core/alpha/Alpha";
import SortDropdown from "../../../components/sort-dropdown/SortDropdown";

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 10,
};

const Brand = ({
  callback,
  selectedCategory,
  selectedBrand,
  sortKey,
}: {
  callback: (params: { action: string; data?: any; sortType?: string }) => void;
  selectedCategory: any;
  selectedBrand: any;
  sortKey: string;
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState("");
  const [sortType, setSortType] = useState(sortKey || "popular");

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });

  useEffect(() => {
    if (selectedCategory) {
      filterRef.current = {
        category: selectedCategory._id,
      };
    }
  }, [selectedCategory]);

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
    if (!selectedCategory) {
      setItems([]);
      return;
    }

    filterRef.current = {
      category: selectedCategory,
      search: "",
    };
    setSearch("");

    // Reset alpha selection when category is selected
    setSelectedAlpha("");
    filterRef.current = {
      ...filterRef.current,
      alpha: "",
    };

    if (sortKey) {
      setSortType(sortKey);
      filterRef.current = { ...filterRef.current, sortType: sortKey };
    }

    applyFilter();
  }, [selectedCategory, sortKey]);

  const debouncedSearch = useCallback(
    debounce((searchVal) => {
      if (searchVal) {
        setSelectedAlpha("");
        filterRef.current = { ...filterRef.current, alpha: "" };
      }
      applyFilter();
    }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    filterRef.current = { ...filterRef.current, search: e.target.value };
    debouncedSearch(e.target.value);
  };

  const handleAlphaSelect = (alpha: string) => {
    setSearch("");
    setSelectedAlpha(alpha);
    filterRef.current = { ...filterRef.current, alpha, search: "" };
    applyFilter();
  };

  const handleSortChange = (value: string) => {
    setSortType(value);
    filterRef.current = { ...filterRef.current, sortType: value };
    applyFilter();
  };

  if (!selectedCategory?._id) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center">
          Please select a category to view brands.
        </div>
      </div>
    );
  }

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-md">
      <div className="tw:bg-gray-50 tw:px-4 tw:py-2">
        <div className="tw:flex tw:items-center">
          <div>
            <div className="tw:font-semibold tw:mb-1">
              {selectedCategory?._displayName || selectedCategory?.name || "Brands"}
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {paginationRef.current.totalRecords} brands
            </div>
          </div>
        </div>
      </div>
      <div className="tw:flex tw:gap-2 tw:bg-white tw:py-2">
        <div className=" tw:px-1">
          <Alpha
            selected={selectedAlpha}
            callback={handleAlphaSelect}
            className="tw:h-[calc(100vh-150px)] tw:mb-2"
            orientation="vertical"
          />
        </div>
        <div className="tw:flex-1">
          <AppScrollArea className="tw:h-[calc(100vh-150px)] no-table tw:pe-2">
            <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:w-full tw:md:flex-row tw:flex-col">
              <input
                type="text"
                className="tw:w-full tw:px-2 tw:border tw:border-gray-200 tw:rounded-md tw:h-8 tw:bg-gray-50 tw:outline-none tw:text-xs"
                placeholder="Search brands"
                value={search}
                onChange={handleSearch}
              />

              <SortDropdown
                value={sortType}
                onChange={handleSortChange}
                inputClassName="tw:!h-8 tw:text-xs tw:w-full"
                className="tw:w-full tw:md:w-auto"
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
                      selectedBrand?._id === item._id,
                    "tw:border-gray-200": selectedBrand?._id !== item._id,
                  }
                )}
                onClick={() =>
                  callback({ action: "view", data: item, sortType })
                }
                key={item._id}
              >
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-medium tw:mb-1">
                    {item._displayName || item.name}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {item.totalDeals || 0} deals
                  </div>
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

export default Brand;
