import clsx from "clsx";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type FilterItem,
  type FilterType,
} from "./helper";

type Props = {
  /** Which facet this list drives — also the action name sent to `callback`. */
  type: FilterType;
  menuId?: string;
  /**
   * Comma-separated cross-filter scope ids: selected categories for the brand
   * facet, selected brands for the category facet.
   */
  scopeId?: string;
  selectedIds?: string[];
  distance?: number | string;
  /**
   * `boxed` — self-contained white card with its own scroll region (the
   * default-theme filter rail). `flat` — bare section that grows with its
   * content, so several facets share one outer scroll (the catalog rail).
   */
  variant?: "boxed" | "flat";
  showSearch?: boolean;
  className?: string;
  callback: (args: { action: string; data?: any }) => void;
};

const LABELS: Record<FilterType, { title: string; placeholder: string }> = {
  brand: { title: "Brands", placeholder: "Search brand" },
  category: { title: "Categories", placeholder: "Search category" },
};

const FacetFilter = ({
  type,
  menuId,
  scopeId,
  selectedIds = [],
  distance = DEFAULT_BROWSE_DISTANCE,
  variant = "boxed",
  showSearch = true,
  className,
  callback,
}: Props) => {
  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [items, setItems] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const isFlat = variant === "flat";

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  // Identifies the scope the current list was fetched for. Used to skip
  // redundant refetches — e.g. when clearing the last selection but the scope
  // (menu / cross-filter ids / distance) hasn't changed since the last fetch.
  const scopeKey = `${menuId ?? ""}|${scopeId ?? ""}|${distance ?? ""}`;
  const fetchedScopeRef = useRef<string | null>(null);

  const buildParams = useCallback(
    (page: number) =>
      prepareParams(
        { type, search: getValues().search, menuId, scopeId, distance },
        { ...paginationRef.current, activePage: page },
      ),
    [type, menuId, scopeId, distance, getValues],
  );

  const loadedCount = items.length;
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
        getData(type, params),
        getCount(type, params),
      ]);
      setItems(data);
      setTotalRecords(total);
      fetchedScopeRef.current = scopeKey;
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
    } finally {
      setLoading(false);
    }
  }, [type, buildParams, scopeKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loadedCount >= totalRecords) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        type,
        buildParams(paginationRef.current.activePage),
      );
      setItems((prev) => [...prev, ...data]);
    } catch (error) {
      console.error(`Error loading more ${type}s:`, error);
    } finally {
      setLoadingMore(false);
    }
  }, [type, loadingMore, loadedCount, totalRecords, buildParams]);

  const debouncedSearch = useDebouncedCallback(() => {
    applyFilter();
  }, 500);

  // Reload whenever the scope (menu / cross-filter selection / distance)
  // changes, but only while nothing is selected here — keep the list frozen so
  // the checked items stay visible and the list isn't reshuffled mid-selection.
  // When the selection is cleared we only refetch if the scope actually changed
  // while frozen; unchecking without a scope change must not re-hit the API.
  useEffect(() => {
    if (selectedIds.length > 0) return;
    if (fetchedScopeRef.current === scopeKey) return;
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, selectedIds.length]);

  const handleToggle = (item: FilterItem, checked: boolean) => {
    const next = checked
      ? [...selectedIds, item._id]
      : selectedIds.filter((id) => id !== item._id);
    callback({ action: type, data: next });
  };

  const header = (
    <>
      <h3
        className={clsx(
          "tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400",
          isFlat ? "tw:text-[10px]" : "tw:mb-2 tw:text-[11px]",
        )}
        style={isFlat ? { fontFamily: "var(--font-mono)" } : undefined}
      >
        {LABELS[type].title}
      </h3>
      {showSearch && (
        <AppInput
          name="search"
          register={register}
          onChange={() => debouncedSearch()}
          placeholder={LABELS[type].placeholder}
          size={isFlat ? undefined : "sm"}
          className={clsx("tw:w-full", isFlat && "tw:mt-2")}
          inputClassName={
            isFlat
              ? // `!` beats theme-2's white-fill rule for `[data-slot=input]`,
                // so the rail search reads as a filled box in every theme.
                "tw:h-8 tw:rounded-lg tw:border-slate-200 tw:bg-slate-50! tw:py-0 tw:text-[13px] tw:shadow-none tw:placeholder:text-[13px] tw:placeholder:text-slate-400"
              : undefined
          }
          leftIcon={isFlat ? undefined : <Search size={16} />}
        />
      )}
    </>
  );

  const list = loading ? (
    <div className="tw:space-y-2.5 tw:pt-1">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="tw:h-4 tw:w-3/4" />
      ))}
    </div>
  ) : items.length === 0 ? (
    <div className="tw:text-xs tw:text-gray-400 tw:py-4 tw:text-center">
      No {LABELS[type].title.toLowerCase()} found
    </div>
  ) : (
    <div className={clsx(isFlat ? "tw:space-y-0" : "tw:space-y-2.5 tw:pt-1")}>
      {items.map((item) => {
        const checked = selectedIds.includes(item._id);
        return (
          <div
            key={item._id}
            className={clsx(
              "tw:flex tw:items-center tw:gap-2.5",
              isFlat &&
                "tw:rounded-lg tw:px-1 tw:py-1 tw:hover:bg-slate-50 tw:transition-colors",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => handleToggle(item, value === true)}
              className="tw:size-3.5 tw:shrink-0 tw:border-gray-400"
            />
            {/* The row label is its own button rather than a wrapping <label>,
                so a tap on the name toggles without double-firing the box. */}
            <button
              type="button"
              onClick={() => handleToggle(item, !checked)}
              className="tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:items-center tw:gap-2 tw:text-left"
            >
              <span
                className={clsx(
                  "tw:min-w-0 tw:flex-1 tw:truncate",
                  isFlat ? "tw:text-[13px]" : "tw:text-sm",
                  checked
                    ? "tw:font-medium tw:text-slate-900"
                    : "tw:text-slate-700",
                )}
              >
                {item._displayName || item.name}
              </span>
              {isFlat && item.dealsCount ? (
                <span className="tw:shrink-0 tw:text-[11px] tw:tabular-nums tw:text-slate-400">
                  {item.dealsCount}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
      {hasMoreData && !loading && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalRecords}
          loadedCount={loadedCount}
        />
      )}
    </div>
  );

  // Flat: no card chrome, but the section still owns its scroll region so its
  // height never changes — loading more brands must not push the categories
  // block down the rail.
  if (isFlat) {
    return (
      <div className={clsx("tw:flex tw:min-h-0 tw:flex-col", className)}>
        <div className="tw:shrink-0">{header}</div>
        <AppScrollArea className="tw:mt-2 tw:min-h-0 tw:flex-1 tw:pr-1">
          {list}
        </AppScrollArea>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "tw:bg-white tw:rounded-lg tw:flex tw:flex-col tw:h-full",
        className,
      )}
    >
      <div className="tw:px-3 tw:pt-3 tw:pb-2">{header}</div>

      <AppScrollArea className="tw:flex-1 tw:min-h-0 tw:px-3 tw:pb-3">
        {list}
      </AppScrollArea>
    </div>
  );
};

export default FacetFilter;
