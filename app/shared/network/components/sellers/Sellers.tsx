import { Search } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { AppInput } from "~/components/core/form/AppInput";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import type { PaginationState } from "~/types/CommonTypes";
import SellerPaneChips, {
  type SellerPaneChipKey,
} from "../seller-pane-chips/SellerPaneChips";
import SellerItem from "./SellerItem";
import ConnectedSellers from "./ConnectedSellers";
import PaylaterNetwork from "../paylater-network/PaylaterNetwork";
import { getCount, getData, prepareParams } from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

const DEFAULT_COUNT = 20;

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: DEFAULT_COUNT,
  startSlNo: 1,
  endSlNo: DEFAULT_COUNT,
  totalRecords: 0,
};

interface SellersProps {
  /** Seller (franchise) id currently open in the main pane — highlighted row. */
  activeSellerId?: string;
  /** Distance filter carried from the URL so the list matches Discover. */
  distance?: string | number;
  className?: string;
}

/**
 * Compact seller list for the theme-2 split-layout side pane on the retailer
 * page (matches the "Sellers" screenshot).
 *
 * Same data source as the Discover Sellers page (see ./helper). Renders a
 * searchable, chip-filtered list grouped by connected sellers first, then
 * "Other sellers".
 */
const Sellers: React.FC<SellersProps> = ({
  activeSellerId,
  distance,
  className = "",
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [connectedCount, setConnectedCount] = useState(0);
  /** Debounced search text — also drives the connected list. */
  const [searchKey, setSearchKey] = useState("");

  const { register } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [activeChip, setActiveChip] = useState<SellerPaneChipKey>("all");

  // This list is the "other sellers" half — connected sellers are fetched
  // separately by <ConnectedSellers />.
  const filterRef = useRef<Record<string, any>>({
    search: "",
    connected: false,
  });
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const resolvedDistance =
    distance != null && distance !== "" ? distance : DEFAULT_BROWSE_DISTANCE;

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
      console.error("Error loading sellers", err);
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
      console.error("Error loading more sellers", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Refetch on distance change; search refetches via the debounced handler.
  useEffect(() => {
    filterRef.current = { ...filterRef.current, distance: resolvedDistance };
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedDistance]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    filterRef.current.search = value;
    setSearchKey(value);
    applyFilter();
  }, 400);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.trim()) {
      debouncedSearch.cancel();
      filterRef.current.search = "";
      setSearchKey("");
      applyFilter();
      return;
    }
    debouncedSearch(value);
  };

  const handleChipChange = ({ data: chip }: { action: string; data: any }) => {
    const key = chip.key as SellerPaneChipKey;
    setActiveChip(key);

    // PayLater is a server-side filter — the API narrows the list with
    // `hasPaylater` instead of us sifting the fetched page client-side.
    filterRef.current.hasPaylater = key === "paylater";

    // For top rated we sort by rating descending.
    if (key === "topRated") {
      filterRef.current.sort = {
        key: "ratingsSummary.avgRating",
        value: "desc",
      };
    } else if (filterRef.current.sort?.key === "ratingsSummary.avgRating") {
      filterRef.current.sort = null;
    }

    applyFilter();
  };

  const openSeller = (item: any) => {
    if (!item?._id || item._id === activeSellerId) return;
    appNav.to(`/products/buy-from-other-retailer/retailer/${item._id}`, {
      distance: String(resolvedDistance),
    });
  };

  // Client-side chip filtering on the already-fetched list (PayLater is
  // filtered by the API, so it needs no case here).
  const filteredItems = items.filter((item) => {
    switch (activeChip) {
      case "skSeller":
        return (item.networkType || "").toUpperCase() === "SKSELLER";
      case "skRetailer":
        return (item.networkType || "").toUpperCase() === "SKRETAILER";
      case "connected":
      case "topRated":
      case "all":
      default:
        return true;
    }
  });

  /** "Connected" chip shows only the connected block — hide the other list. */
  const showOthers = activeChip !== "connected";
  /** Connected block only makes sense on the unfiltered / connected views. */
  const showConnected = activeChip === "all" || activeChip === "connected";

  const paylaterCount = items.filter((item) =>
    Boolean(item.paylaterInfo),
  ).length;

  // This list is fetched with `isConnected: false`, so no row is connected.
  const renderSellerRow = (item: any) => (
    <SellerItem
      key={item._id}
      seller={item}
      active={item._id === activeSellerId}
      onClick={openSeller}
    />
  );

  return (
    <div className={className}>
      {/* Pane header */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1 tw:mb-3">
        <PaneTitle title={t("sellers", "Sellers")} />
        <span className="tw:text-sm tw:text-slate-400">
          {/* Both halves of the split are counted here. */}
          {paginationRef.current.totalRecords || connectedCount
            ? `${paginationRef.current.totalRecords + connectedCount} ${t("inNetwork", "in network")}`
            : ""}
          {connectedCount > 0
            ? ` · ${connectedCount} ${t("connected", "connected")}`
            : ""}
        </span>
      </div>

      {/* Search */}
      <AppInput
        name="search"
        placeholder={t(
          "searchSellersByNameIdPhone",
          "Search by name, ID or phone",
        )}
        register={register}
        onChange={handleSearchChange}
        leftIcon={<Search size={14} className="tw:text-slate-400" />}
        className="tw:bg-white"
        inputClassName="tw:rounded-lg tw:border-slate-200 tw:text-sm"
      />

      {/* Chips */}
      <SellerPaneChips
        activeKey={activeChip}
        counts={{ connected: connectedCount, paylater: paylaterCount }}
        callback={handleChipChange}
        className="tw:mt-3"
      />

      {/* Aggregate PayLater position across the network */}
      <PaylaterNetwork className="tw:mt-3" />

      {/* Flat, full-bleed list — no card ring or rounding, rows run edge to
          edge across the pane (the -mx-4 cancels the pane's 1rem gutter). */}
      <div className="tw:-mx-4 tw:mt-3 tw:border-t tw:border-slate-100">
        {showConnected && (
          <ConnectedSellers
            searchKey={searchKey}
            distance={resolvedDistance}
            activeSellerId={activeSellerId}
            showLoadMore={activeChip === "connected"}
            showEmpty={activeChip === "connected"}
            onCountChange={setConnectedCount}
            onSelect={openSeller}
          />
        )}

        {!showOthers ? null : loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`seller-skeleton-${index}`}
              className="tw:flex tw:items-center tw:gap-2.5 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5"
            >
              <div className="skeleton-loader tw:size-9 tw:shrink-0 tw:rounded-full" />
              <div className="tw:min-w-0 tw:flex-1">
                <div className="skeleton-loader tw:h-3.5 tw:w-28 tw:rounded" />
                <div className="skeleton-loader tw:mt-1 tw:h-3 tw:w-36 tw:rounded" />
              </div>
            </div>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="tw:px-4 tw:py-6 tw:text-center">
            <p className="tw:text-sm tw:font-semibold tw:text-slate-700">
              {connectedCount > 0
                ? t("noOtherSellersFound", "No other sellers found")
                : t("noSellersFound", "No sellers found")}
            </p>
            <p className="tw:mt-0.5 tw:text-xs tw:text-slate-400">
              {t("trySearchDifferently", "Try a different search or location")}
            </p>
          </div>
        ) : (
          <>
            {activeChip === "all" && connectedCount > 0 && (
              <div className="tw:sticky tw:top-0 tw:z-10 tw:px-4 tw:py-2 tw:bg-slate-50 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-500">
                {t("otherSellers", "Other sellers")} · {filteredItems.length}
              </div>
            )}

            {filteredItems.map(renderSellerRow)}
          </>
        )}
      </div>

      {showOthers && !loading && hasMoreData && filteredItems.length > 0 && (
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

export default Sellers;
