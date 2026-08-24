import clsx from "clsx";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import SellerCatalogService from "~/services/SellerCatalogService";

export interface TrendingSearchItem {
  /** Search-log id. */
  id: string;
  /** The search term as the buyer would type it. */
  term: string;
  /** How many times it was searched. */
  count: number;
  /** Results the term returned last time it ran; 0 marks a dead end. */
  lastResultCount: number;
}

interface TrendingSearchesProps {
  /** Pre-resolved rows. When omitted the search-logs API is queried. */
  items?: TrendingSearchItem[];
  /** Maximum number of rows to show. */
  limit?: number;
  /** Narrows the counts to a single seller's catalogue. */
  sellerId?: string;
  /** Matches the logged term (server-side search on the log). */
  search?: string;
  /** Browse distance carried into the search page. */
  distance?: string | number;
  /** Handle the tap yourself; when omitted the row runs the network search. */
  onSelect?: (item: TrendingSearchItem) => void;
  className?: string;
}

/**
 * Trending search terms for the catalog side pane, backed by the top
 * search-logs aggregation unless the caller supplies `items`. Each row runs the
 * term through the network product search unless the caller handles the tap.
 */
const TrendingSearches: React.FC<TrendingSearchesProps> = ({
  items,
  limit = 5,
  sellerId,
  search,
  distance,
  onSelect,
  className,
}) => {
  const appNav = useAppNav();
  const [fetched, setFetched] = useState<TrendingSearchItem[]>([]);
  const [loading, setLoading] = useState(!items);

  useEffect(() => {
    if (items) return;

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await SellerCatalogService.getTopSearchLogs({
          page: 1,
          limit,
          ...(search ? { search } : {}),
          ...(sellerId ? { filter: { sellerId } } : {}),
        });
        if (active) {
          setFetched(
            SellerCatalogService.formatTopSearchLogs(response.data.data),
          );
        }
      } catch (error) {
        console.error("Error fetching trending searches:", error);
        if (active) setFetched([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [items, limit, sellerId, search]);

  const handleSelect = (item: TrendingSearchItem) => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    appNav.to("/products/buy-from-other-retailer/products/search", {
      search: item.term,
      ...(distance !== undefined ? { distance } : {}),
    });
  };

  const rows = (items ?? fetched).slice(0, limit);

  if (loading && !rows.length) {
    return (
      <div
        className={clsx(
          "tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-100 tw:bg-white",
          className,
        )}
      >
        {Array.from({ length: Math.min(limit, 5) }).map((_, index) => (
          <div
            key={index}
            className="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-100 tw:px-2.5 tw:py-2 tw:last:border-b-0"
          >
            <div className="tw:size-3 tw:shrink-0 tw:animate-pulse tw:rounded-full tw:bg-slate-100" />
            <div className="tw:h-2.5 tw:flex-1 tw:animate-pulse tw:rounded tw:bg-slate-100" />
            <div className="tw:h-2.5 tw:w-6 tw:animate-pulse tw:rounded tw:bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) return null;

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-100 tw:bg-white",
        className,
      )}
    >
      {rows.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleSelect(item)}
          className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:border-b tw:border-slate-100 tw:px-2.5 tw:py-1.5 tw:text-left tw:transition-colors tw:last:border-b-0 tw:hover:bg-slate-50"
        >
          <TrendingUp className="tw:size-3 tw:shrink-0 tw:text-primary" />
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-xs tw:text-slate-700">
            {item.term}
          </span>
          <span className="tw:shrink-0 tw:text-[11px] tw:text-slate-400">
            {item.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default TrendingSearches;
