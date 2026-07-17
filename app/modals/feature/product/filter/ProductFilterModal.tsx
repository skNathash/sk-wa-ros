import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import type { PaginationState, TabItem } from "~/types/CommonTypes";
import {
  getBrandCount,
  getBrands,
  getCategories,
  getCategoriesCount,
  getRefinementData,
  prepareRefinementParams,
} from "./helper";
import NoData from "~/components/core/no-data/NoData";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
  viewType: string;
  categories: any[];
  brands: any[];
  menu: any[];
}

const defaultFilter: Record<string, any> = {
  activeTab: "category",
  menu: [],
  category: [],
  brand: [],
};

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const tabs: TabItem[] = [
  { key: "category", name: "Category", langKey: "category" },
  { key: "brand", name: "Brand", langKey: "brand" },
];

const ProductFilterModal = ({
  show,
  callback,
  viewType,
  categories,
  brands,
  menu,
}: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const refinementDataRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });

  // State for storing selected data
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<any[]>([]);

  const applyFilter = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        paginationRef.current = { ...defaultPaginationRef };
      }

      // Only call refinement API at page 1 (not for load more)
      if (viewType !== "buyer" && paginationRef.current.activePage === 1) {
        // Use current selected categories from parameter or state
        const categoriesToUse = selectedCategories;

        // Extend filterRef with current selected categories
        const filterWithSelections = {
          ...filterRef.current,
          selectedCategories: categoriesToUse,
        };

        const params = prepareRefinementParams(filterWithSelections);
        const refinementResp = await getRefinementData(params);
        refinementDataRef.current = refinementResp;
      }

      const activeTab = filterRef.current.activeTab;
      let response;
      let countResponse;

      // Get data
      if (activeTab === "category") {
        response = await getCategories(
          viewType,
          filterRef.current,
          paginationRef.current,
          refinementDataRef.current
        );
      } else if (activeTab === "brand") {
        const filterWithSelections = {
          ...filterRef.current,
          selectedCategories: selectedCategories,
        };
        response = await getBrands(
          viewType,
          filterWithSelections,
          paginationRef.current,
          refinementDataRef.current
        );
      }

      // Get count only when page is 1 (not for load more)
      if (paginationRef.current.activePage === 1) {
        if (activeTab === "category") {
          countResponse = await getCategoriesCount(
            viewType,
            filterRef.current,
            paginationRef.current,
            refinementDataRef.current
          );
        } else if (activeTab === "brand") {
          // Use current selected categories from parameter or state
          const categoriesToUse = selectedCategories;

          // Extend filterRef with current selected categories for brand count
          const filterWithSelections = {
            ...filterRef.current,
            selectedCategories: categoriesToUse,
          };

          countResponse = await getBrandCount(
            viewType,
            filterWithSelections,
            paginationRef.current,
            refinementDataRef.current
          );
        }
      }

      if (response) {
        if (isLoadMore) {
          setData((prev) => [...prev, ...response.data]);
        } else {
          setData([...response.data]);
        }

        // Update total count with actual count from API when page is 1
        if (paginationRef.current.activePage === 1 && countResponse) {
          setTotalCount(countResponse.data || 0);
        }
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [viewType, selectedCategories]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      filterRef.current.searchQuery = query;
      applyFilter();
    }, 500),
    [applyFilter]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Handle tab change
  const handleTabChange = (tab: TabItem) => {
    filterRef.current.activeTab = tab.key;
    setData([]);
    setTotalCount(0);
    applyFilter();
  };

  // Handle checkbox change
  const handleCheckboxChange = (item: any, checked: boolean) => {
    const activeTab = filterRef.current.activeTab;

    if (activeTab === "category") {
      if (checked) {
        setSelectedCategories((prev) => [...prev, item]);
      } else {
        setSelectedCategories((prev) =>
          prev.filter((cat) => cat._id !== item._id)
        );
      }
    } else if (activeTab === "brand") {
      if (checked) {
        setSelectedBrands((prev) => [...prev, item]);
      } else {
        setSelectedBrands((prev) =>
          prev.filter((brand) => brand._id !== item._id)
        );
      }
    }

    // Note: We don't call applyFilter here to avoid reloading data on checkbox selection
    // The data reload should only happen on tab changes or initial load
  };

  // Handle row click (for making entire row clickable)
  const handleRowClick = (item: any) => {
    const isSelected = isItemSelected(item);
    handleCheckboxChange(item, !isSelected);
  };

  // Handle apply button click
  const handleApply = () => {
    callback({
      action: "apply",
      data: {
        categories: selectedCategories,
        brands: selectedBrands,
      },
    });
  };

  // Handle reset button click
  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    callback({
      action: "reset",
      data: {
        categories: [],
        brands: [],
      },
    });
  };

  // Handle load more
  const handleLoadMore = () => {
    paginationRef.current.activePage += 1;
    applyFilter(true);
  };

  // Check if item is selected
  const isItemSelected = (item: any) => {
    const activeTab = filterRef.current.activeTab;

    if (activeTab === "category") {
      return selectedCategories.some((cat) => cat._id === item._id);
    } else if (activeTab === "brand") {
      return selectedBrands.some((brand) => brand._id === item._id);
    }
    return false;
  };

  useEffect(() => {
    if (show) {
      // Initialize selected items from props when modal opens
      setSelectedCategories(categories || []);
      setSelectedBrands(brands || []);

      // Initialize filter ref
      filterRef.current = {
        ...filterRef.current,
        activeTab: "category",
        categories: categories,
        brands: brands,
        menu: menu,
      };

      // Apply filter after initialization
      applyFilter();
    }
  }, [show, categories, brands, menu]);

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={() => callback({ action: "close", data: {} })}>
        <div className="tw:text-lg tw:font-semibold">{t("filterProducts")}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <div className="tw:max-w-2xl tw:w-full">
          <div className="tw:mb-6">
            {/* Search Input */}
            <div className="tw:mb-4 tw:mt-2">
              <Input
                type="text"
                placeholder={`${t("search")}...`}
                value={searchQuery}
                onChange={handleSearchChange}
                className="tw:w-full"
              />
            </div>

            {/* Tabs */}
            <AppTab
              tabs={tabs}
              activeTab={filterRef.current.activeTab}
              onTabChange={handleTabChange}
              variant="tabs"
            />
          </div>

          {/* Content Area */}
          <AppScrollArea className="tw:min-h-[400px]">
            {loading ? (
              <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
                <AppSpinner size="lg" />
              </div>
            ) : (
              <div className="tw:space-y-2">
                {data.map((item) => (
                  <div
                    key={item._id}
                    className="tw:flex tw:items-center tw:space-x-3 tw:p-3 tw:border tw:border-gray-200 tw:rounded-md tw:hover:bg-gray-50 tw:cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    <Checkbox
                      checked={isItemSelected(item)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(item, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="tw:flex-1">
                      <div className="tw:font-medium tw:text-gray-900">
                        {item._displayName || item.name}
                      </div>
                    </div>
                  </div>
                ))}

                {data.length === 0 && !loading && (
                  <div className="tw:text-center tw:py-8 tw:text-gray-500">
                    <NoData />
                  </div>
                )}
              </div>
            )}
          </AppScrollArea>

          {/* Load More Button */}
          {!loading && data.length > 0 && data.length < totalCount && (
            <div className="tw:mt-4">
              <LoadMoreButton
                loadMore={handleLoadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={data.length}
              />
            </div>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:space-x-3">
          <AppButton
            onClick={handleReset}
            fill="outline"
            color="secondary"
            size="small"
          >
            {t("reset")}
          </AppButton>
          <AppButton onClick={handleApply} color="primary" size="small">
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ProductFilterModal;
