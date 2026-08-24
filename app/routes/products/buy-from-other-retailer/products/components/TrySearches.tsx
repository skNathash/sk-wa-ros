import clsx from "clsx";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import { useSearchParams } from "react-router";
import SellerCatalogService from "~/services/SellerCatalogService";

type Props = {
  /** Maximum number of chips to show. */
  limit?: number;
  /** Narrows the counts to a single seller's catalogue. */
  sellerId?: string;
  /** Matches the logged term (server-side search on the log). */
  search?: string;
  className?: string;
};

/**
 * Horizontal "TRY" suggestion chips that jump into the network product search.
 * Terms come from the top search-logs aggregation; the row renders nothing
 * until they arrive, and stays hidden when the API has none.
 */
const TrySearches = ({ limit = 6, sellerId, search, className }: Props) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const currentDistance = searchParams.get("distance");
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const response = await SellerCatalogService.getTopSearchLogs({
          page: 1,
          limit,
          ...(search ? { search } : {}),
          ...(sellerId ? { filter: { sellerId } } : {}),
        });
        if (!active) return;
        setTerms(
          SellerCatalogService.formatTopSearchLogs(response.data.data)
            .map((log) => log.term)
            .filter(Boolean),
        );
      } catch (error) {
        console.error("Error fetching try searches:", error);
        if (active) setTerms([]);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [limit, sellerId, search]);

  const goToSearch = (term: string) => {
    appNav.to("/products/buy-from-other-retailer/products/search", {
      search: term,
      ...(currentDistance ? { distance: currentDistance } : {}),
    });
  };

  const chips = terms.slice(0, limit);

  if (!chips.length) return null;

  return (
    <div
      className={clsx(
        "hide-scrollbar tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto tw:pb-0.5",
        className,
      )}
    >
      <span className="search-try-label tw:shrink-0 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-gray-500">
        TRY
      </span>
      {chips.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => goToSearch(term)}
          className="search-try-chip tw:shrink-0 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-transparent tw:px-2.5 tw:py-1 tw:text-[12px] tw:text-gray-600 tw:hover:border-gray-400 tw:hover:text-gray-800 tw:transition-colors"
        >
          {term}
        </button>
      ))}
    </div>
  );
};

export default TrySearches;
