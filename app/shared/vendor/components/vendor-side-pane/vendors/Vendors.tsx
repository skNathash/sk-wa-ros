import clsx from "clsx";
import { Search } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import Alpha from "~/components/core/alpha/Alpha";
import Amount from "~/components/core/amount/Amount";
import { AppInput } from "~/components/core/form/AppInput";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useAppNav from "~/hooks/useAppNav";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getAvatarColor,
  getCount,
  getData,
  getInitials,
  prepareParams,
} from "./helper";

const DEFAULT_COUNT = 20;

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: DEFAULT_COUNT,
  startSlNo: 1,
  endSlNo: DEFAULT_COUNT,
  totalRecords: 0,
};

interface VendorsProps {
  /** Vendor id currently open in the main pane — highlighted row. */
  activeVendorId?: string;
  className?: string;
}

/**
 * Compact vendor list for the theme-2 split-layout side pane on the vendor
 * detail page (WhatsApp-style "chats" column). Same data source as the
 * Vendors list page (see ./helper); rows navigate to the picked vendor's
 * detail page. Mirrors the retailer page's Sellers pane.
 */
const Vendors: React.FC<VendorsProps> = ({
  activeVendorId,
  className = "",
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const { register } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [alpha, setAlpha] = useState<string>("");

  const filterRef = useRef<Record<string, any>>({
    search: "",
  });
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = async () => {
    setLoading(true);
    setItems([]);

    paginationRef.current = { ...defaultPagination };

    const params = prepareParams(filterRef.current, paginationRef.current);

    try {
      const data = await getData(params);
      const total = await getCount(params);

      setItems(data || []);

      paginationRef.current.totalRecords = total || 0;
      const rowsPerPage = paginationRef.current.rowsPerPage || DEFAULT_COUNT;
      setHasMoreData((data || []).length >= rowsPerPage);
    } catch (err) {
      console.error("Error loading vendors", err);
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
        prepareParams(filterRef.current, paginationRef.current),
      );
      setItems((prev) => [...prev, ...(data || [])]);
      setHasMoreData((data || []).length >= paginationRef.current.rowsPerPage);
    } catch (err) {
      console.error("Error loading more vendors", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Initial load.
  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    filterRef.current.search = value;
    applyFilter();
  }, 400);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.trim()) {
      // Clearing the input refetches immediately, like the old 0ms path.
      debouncedSearch.cancel();
      filterRef.current.search = "";
      applyFilter();
      return;
    }
    debouncedSearch(value);
  };

  const handleAlphaChange = (value: string) => {
    setAlpha(value);
    filterRef.current.alpha = value;
    applyFilter();
  };

  const openVendor = (item: any) => {
    if (!item?._id || item._id === activeVendorId) return;
    appNav.to(`/dashboard/vendor/view/${item._id}`);
  };

  return (
    <div className={className}>
      {/* Search — same API as the Vendors list page. */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <AppInput
          name="search"
          placeholder={t("searchVendors", "Search vendors")}
          register={register}
          onChange={handleSearchChange}
          leftIcon={<Search size={14} className="tw:text-slate-400" />}
          className="tw:min-w-0 tw:flex-1 tw:bg-white"
          inputClassName="tw:rounded-full tw:border-slate-200 tw:text-sm"
        />
      </div>

      {/* Alpha strip — first-letter filter, same behaviour as the Vendors
          list page ("123" matches names starting with a digit). */}
      <Alpha
        selected={alpha}
        callback={handleAlphaChange}
        className="tw:mt-2"
      />

      {/* Flat, full-bleed list — no card ring or rounding, rows run edge to
          edge across the pane (the -mx-4 cancels the pane's 1rem gutter). */}
      <div className="tw:-mx-4 tw:mt-3 tw:border-t tw:border-slate-100">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`vendor-skeleton-${index}`}
              className="tw:flex tw:items-center tw:gap-2.5 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5"
            >
              <div className="skeleton-loader tw:size-9 tw:shrink-0 tw:rounded-full" />
              <div className="tw:min-w-0 tw:flex-1">
                <div className="skeleton-loader tw:h-3.5 tw:w-28 tw:rounded" />
                <div className="skeleton-loader tw:mt-1 tw:h-3 tw:w-36 tw:rounded" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="tw:px-4 tw:py-6 tw:text-center">
            <p className="tw:text-sm tw:font-semibold tw:text-slate-700">
              {t("noVendorsFound", "No vendors found")}
            </p>
            <p className="tw:mt-0.5 tw:text-xs tw:text-slate-400">
              {t("trySearchDifferently", "Try a different search")}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const active = item._id === activeVendorId;
            const location =
              item.address?.town ||
              item.address?.city ||
              item.address?.district ||
              "-";

            // Money column — pending due from vendors-with-stats.
            const pending =
              item.orderStatistics?.paymentBreakdown?.Pending || {};
            const unpaidValue = pending.totalValue || 0;
            const unpaidInvoices = pending.count || 0;
            const hasDue = unpaidValue > 0;

            return (
              <button
                key={item._id}
                type="button"
                onClick={() => openVendor(item)}
                className={clsx(
                  "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors",
                  active ? "app-list-row-active" : "tw:hover:bg-slate-50",
                )}
              >
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold tw:text-white",
                    getAvatarColor(item.name),
                  )}
                >
                  {getInitials(item.name)}
                </span>

                <span className="tw:min-w-0 tw:flex-1">
                  <span
                    className={clsx(
                      "tw:block tw:min-w-0 tw:truncate tw:text-sm tw:font-medium",
                      // The tint + left rule carry the selection; the label
                      // stays dark like the rest of the list.
                      active ? "tw:text-slate-900" : "tw:text-slate-800",
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500">
                    {item.vendorId ? (
                      <>
                        <span className="tw:shrink-0 tw:whitespace-nowrap">
                          #{item.vendorId}
                        </span>
                        <span className="tw:text-slate-300">•</span>
                      </>
                    ) : null}
                    <span className="tw:truncate">{location}</span>
                  </span>
                </span>

                {/* Money column — outstanding payable from
                    orderStatistics.paymentBreakdown.Pending. */}
                <span className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:text-right">
                  <span
                    className={clsx(
                      "app-label",
                      hasDue ? "tw:text-red-600" : "tw:text-slate-400",
                    )}
                  >
                    {hasDue
                      ? unpaidInvoices > 0
                        ? `${unpaidInvoices} ${t("unpaid")}`
                        : t("due")
                      : t("nil")}
                  </span>
                  {hasDue ? (
                    <Amount
                      value={unpaidValue}
                      decimalPlaces={0}
                      className="tw:text-sm tw:font-bold tw:text-red-600"
                    />
                  ) : (
                    <span className="tw:text-sm tw:font-bold tw:text-slate-400">
                      --
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      {!loading && hasMoreData && items.length > 0 && (
        <div className="tw:mt-3 tw:flex tw:justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={items.length}
          />
        </div>
      )}
    </div>
  );
};

export default Vendors;
