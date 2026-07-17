import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
// removed IonIcon and ionicons in favor of lucide-react icons
import clsx from "clsx";
import { debounce } from "lodash";
import { ChevronRight, Dot } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Alpha from "~/components/core/alpha/Alpha";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import SortDropdown from "../../../components/sort-dropdown/SortDropdown";

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
  selectedParentCategory,
  selectedMenu,
  sortKey,
}: {
  callback: (params: { action: string; data?: any; sortType?: string }) => void;
  selectedCategory: any;
  selectedParentCategory?: any;
  selectedMenu?: { label: string; value: { id: string; name: string } };
  sortKey: string;
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAlpha, setSelectedAlpha] = useState(selectedMenu ? "" : "A");
  const [sortType, setSortType] = useState("popular");

  const filterRef = useRef<Record<string, any>>({
    alpha: selectedMenu ? "" : "A",
    sortType: sortKey || "popular",
  });
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
    // Update filterRef with selectedMenu.value._id
    filterRef.current = {
      ...filterRef.current,
      search: "",
      ...(selectedMenu?.value?.id
        ? { menuId: selectedMenu.value.id }
        : { menuId: null }),
    };

    // Parent category selection takes precedence when provided.
    // The parent category id is available on `selectedParentCategory._id`.
    if (selectedParentCategory?._id) {
      filterRef.current = {
        ...filterRef.current,
        parentCategoryId: selectedParentCategory._id,
      };
    } else {
      const { parentCategoryId, ...rest } = filterRef.current;
      filterRef.current = { ...rest };
    }

    setSearch("");

    // Reset alpha selection when menu is selected
    if (selectedMenu) {
      setSelectedAlpha("");
      filterRef.current = {
        ...filterRef.current,
        alpha: "",
      };
    } else {
      setSelectedAlpha("A");
      filterRef.current = { ...filterRef.current, alpha: "A" };
    }

    if (sortKey) {
      setSortType(sortKey);
      filterRef.current = { ...filterRef.current, sortType: sortKey };
    }

    applyFilter();
  }, [selectedMenu, sortKey, selectedParentCategory]);

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

  // If neither a menu nor a parent category is selected, show a prompt
  const needsSelection =
    !selectedMenu?.value?.id && !selectedParentCategory?._id;

  if (needsSelection) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:p-4">
          <div className="tw:text-sm tw:text-gray-600 tw:mb-2">
            Please select either a <strong>Menu</strong> or a{" "}
            <strong>Parent Category</strong> to view categories.
          </div>
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
              {selectedParentCategory?._displayName ||
                selectedParentCategory?.name ||
                selectedMenu?.value?._displayName ||
                selectedMenu?.value?.name ||
                "Categories"}
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {paginationRef.current.totalRecords} categories
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
                placeholder="Search categories"
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
                      selectedCategory?._id === item._id,
                    "tw:border-gray-200": selectedCategory?._id !== item._id,
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
                    {item.parentName ? (
                      <div className="tw:text-xs tw:text-gray-400 tw:ml-1">
                        <small>{item.parentName}</small>
                      </div>
                    ) : null}
                  </div>
                  <div className="tw:flex tw:gap-1 tw:items-center">
                    <div className="tw:text-xs tw:text-gray-500">
                      {item.totalDeals || 0} deals
                    </div>
                    <span className="tw:text-xs tw:text-gray-500">
                      <Dot />
                    </span>
                    <div className="tw:text-xs tw:text-gray-500">
                      {item.uniqueBrandCount || 0} brands
                    </div>
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

export default Category;
