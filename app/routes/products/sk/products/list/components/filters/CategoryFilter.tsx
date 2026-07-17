import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppCheckbox, AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  getRefinementIds,
  prepareParams,
  type FilterItem,
} from "./helper";

type Props = {
  /** comma-separated brand ids to scope categories by (cross-filter) */
  brandId?: string;
  /**
   * comma-separated menu / category ids from the current page context used to
   * scope the category list even before a brand is selected.
   */
  menuCategoryId?: string;
  selectedIds?: string[];
  callback: (args: { action: string; data?: any }) => void;
};

const CategoryFilter = ({
  brandId,
  menuCategoryId,
  selectedIds = [],
  callback,
}: Props) => {
  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [categories, setCategories] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Category ids derived from the current brand scope via the refinement API.
  // `null` means "no scope" — list every category.
  const idsRef = useRef<string[] | null>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const buildParams = useCallback(
    (page: number) =>
      prepareParams(
        "category",
        { ids: idsRef.current, search: getValues().search },
        { ...paginationRef.current, activePage: page },
      ),
    [getValues],
  );

  const loadedCount = categories.length;
  const hasMoreData = loadedCount < totalRecords;

  const applyFilter = useCallback(async () => {
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    try {
      idsRef.current = await getRefinementIds("category", {
        category: menuCategoryId,
        brand: brandId,
      });
      const params = buildParams(1);
      const [data, total] = await Promise.all([
        getData("category", params),
        getCount("category", params),
      ]);
      setCategories(data);
      setTotalRecords(total);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [brandId, menuCategoryId, buildParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loadedCount >= totalRecords) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        "category",
        buildParams(paginationRef.current.activePage),
      );
      setCategories((prev) => [...prev, ...data]);
    } catch (error) {
      console.error("Error loading more categories:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loadedCount, totalRecords, buildParams]);

  const debouncedSearch = useDebouncedCallback(() => {
    applyFilter();
  }, 500);

  // Reload whenever the scope (selected brands) changes, but only while no
  // categories are selected here — keep the list frozen so the checked items
  // stay visible and the list isn't reshuffled mid-selection.
  useEffect(() => {
    if (selectedIds.length > 0) return;
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, menuCategoryId, selectedIds.length]);

  const handleToggle = (category: FilterItem, checked: boolean) => {
    const next = checked
      ? [...selectedIds, category._id]
      : selectedIds.filter((id) => id !== category._id);
    callback({ action: "category", data: next });
  };

  return (
    <div className="tw:bg-white tw:rounded-lg tw:flex tw:flex-col tw:h-full">
      <div className="tw:px-3 tw:pt-3 tw:pb-2">
        <h3 className="tw:text-xs tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider tw:mb-2">
          Categories
        </h3>
        <AppInput
          name="search"
          register={register}
          onChange={() => debouncedSearch()}
          placeholder="Search category"
          size="sm"
          className="tw:w-full"
          leftIcon={<Search size={16} />}
        />
      </div>

      <AppScrollArea className="tw:flex-1 tw:min-h-0 tw:px-3 tw:pb-3">
        {loading ? (
          <div className="tw:space-y-2.5 tw:pt-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="tw:h-4 tw:w-3/4" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="tw:text-xs tw:text-gray-400 tw:py-4 tw:text-center">
            No categories found
          </div>
        ) : (
          <div className="tw:space-y-2.5 tw:pt-1">
            {categories.map((category) => (
              <AppCheckbox
                key={category._id}
                size="sm"
                value={selectedIds.includes(category._id)}
                onChange={(checked) => handleToggle(category, checked)}
                label={
                  <span className="tw:line-clamp-1">
                    {category._displayName || category.name}
                  </span>
                }
              />
            ))}
            {hasMoreData && !loading && (
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalRecords}
                loadedCount={loadedCount}
              />
            )}
          </div>
        )}
      </AppScrollArea>
    </div>
  );
};

export default CategoryFilter;
