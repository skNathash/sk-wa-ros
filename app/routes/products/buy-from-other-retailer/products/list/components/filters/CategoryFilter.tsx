import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppCheckbox, AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams, type FilterItem } from "./helper";

type Props = {
  menuId?: string;
  brandId?: string;
  selectedIds?: string[];
  distance?: number | string;
  callback: (args: { action: string; data?: any }) => void;
};

const CategoryFilter = ({
  menuId,
  brandId,
  selectedIds = [],
  distance = DEFAULT_BROWSE_DISTANCE,
  callback,
}: Props) => {
  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [categories, setCategories] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  // Identifies the scope the current list was fetched for. Used to skip
  // redundant refetches — e.g. when clearing the last selection but the scope
  // (menu / brands / distance) hasn't changed since the last fetch.
  const scopeKey = `${menuId ?? ""}|${brandId ?? ""}|${distance ?? ""}`;
  const fetchedScopeRef = useRef<string | null>(null);

  const buildParams = useCallback(
    (page: number) =>
      prepareParams(
        {
          type: "category",
          search: getValues().search,
          menuId,
          scopeId: brandId,
          distance,
        },
        { ...paginationRef.current, activePage: page },
      ),
    [menuId, brandId, distance, getValues],
  );

  const loadedCount = categories.length;
  const hasMoreData = loadedCount < totalRecords;

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };
    setLoading(true);
    try {
      const params = buildParams(1);
      const [data, total] = await Promise.all([
        getData("category", params),
        getCount("category", params),
      ]);
      setCategories(data);
      setTotalRecords(total);
      fetchedScopeRef.current = scopeKey;
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [buildParams, scopeKey]);

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

  // Reload whenever the scope (menu / selected brands / distance) changes, but
  // only while no categories are selected here — keep the list frozen so the
  // checked items stay visible and the list isn't reshuffled mid-selection.
  // When the selection is cleared we only refetch if the scope actually changed
  // while frozen; unchecking without a scope change must not re-hit the API.
  useEffect(() => {
    if (selectedIds.length > 0) return;
    if (fetchedScopeRef.current === scopeKey) return;
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, selectedIds.length]);

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
