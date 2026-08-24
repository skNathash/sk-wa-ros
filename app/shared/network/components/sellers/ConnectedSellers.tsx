import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import type { PaginationState } from "~/types/CommonTypes";
import SellerItem from "./SellerItem";
import { getCount, getData, prepareParams } from "./helper";

const DEFAULT_COUNT = 20;

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: DEFAULT_COUNT,
  startSlNo: 1,
  endSlNo: DEFAULT_COUNT,
  totalRecords: 0,
};

interface ConnectedSellersProps {
  /** Search text owned by the parent — the list refetches when it changes. */
  searchKey?: string;
  /** Distance filter carried from the URL so the list matches Discover. */
  distance?: string | number;
  /** Seller (franchise) id currently open in the main pane — highlighted row. */
  activeSellerId?: string;
  /** Renders the "Load more" button below the list. */
  showLoadMore?: boolean;
  /** Renders an empty state when nothing matches (else the block collapses). */
  showEmpty?: boolean;
  /** Fires with the total connected count after every fetch. */
  onCountChange?: (count: number) => void;
  onSelect?: (seller: any) => void;
  className?: string;
}

/**
 * Connected sellers block for the retailer side pane.
 *
 * Same nearby endpoint as {@link Sellers} (see ./helper) but pinned to
 * `isConnected: true`, so the two lists are disjoint and each paginates on its
 * own. Search is driven by the parent's input via `searchKey`.
 */
const ConnectedSellers: React.FC<ConnectedSellersProps> = ({
  searchKey = "",
  distance,
  activeSellerId,
  showLoadMore = true,
  showEmpty = false,
  onCountChange,
  onSelect,
  className = "",
}) => {
  const { t } = useTranslation(["common"]);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const resolvedDistance =
    distance != null && distance !== "" ? distance : DEFAULT_BROWSE_DISTANCE;

  const buildFilter = () => ({
    connected: true,
    distance: resolvedDistance,
    search: searchKey,
  });

  const applyFilter = async () => {
    setLoading(true);
    setItems([]);

    paginationRef.current = { ...defaultPagination };

    const params = prepareParams(buildFilter(), paginationRef.current);

    try {
      const data = await getData(params);
      const total = await getCount(params);

      setItems(data || []);

      paginationRef.current.totalRecords = total || 0;
      setHasMoreData((data || []).length >= paginationRef.current.rowsPerPage);
      onCountChange?.(total || 0);
    } catch (err) {
      console.error("Error loading connected sellers", err);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        prepareParams(buildFilter(), paginationRef.current),
      );
      setItems((prev) => [...prev, ...(data || [])]);
      setHasMoreData((data || []).length >= paginationRef.current.rowsPerPage);
    } catch (err) {
      console.error("Error loading more connected sellers", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // The parent debounces the search input, so reacting to the value directly is
  // enough here.
  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedDistance, searchKey]);

  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`connected-seller-skeleton-${index}`}
            className="tw:flex tw:items-center tw:gap-2.5 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5"
          >
            <div className="skeleton-loader tw:size-9 tw:shrink-0 tw:rounded-full" />
            <div className="tw:min-w-0 tw:flex-1">
              <div className="skeleton-loader tw:h-3.5 tw:w-28 tw:rounded" />
              <div className="skeleton-loader tw:mt-1 tw:h-3 tw:w-36 tw:rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    // Nothing connected matches. By default the block just collapses — the
    // parent still shows the other sellers below it.
    if (!showEmpty) return null;

    return (
      <div className={className}>
        <div className="tw:px-4 tw:py-6 tw:text-center">
          <p className="tw:text-sm tw:font-semibold tw:text-slate-700">
            {t("noConnectedSellersFound", "No connected sellers found")}
          </p>
          <p className="tw:mt-0.5 tw:text-xs tw:text-slate-400">
            {t("trySearchDifferently", "Try a different search or location")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="tw:sticky tw:top-0 tw:z-10 tw:bg-slate-50 tw:px-4 tw:py-2 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-500">
        {t("connected", "Connected")} · {paginationRef.current.totalRecords}
      </div>

      {items.map((item) => (
        <SellerItem
          key={item._id}
          seller={item}
          active={item._id === activeSellerId}
          connected
          onClick={onSelect}
        />
      ))}

      {showLoadMore && hasMoreData && (
        <div className="tw:px-4 tw:py-2">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={items.length}
            loaderType="button"
            noMargin
          />
        </div>
      )}
    </div>
  );
};

export default ConnectedSellers;
