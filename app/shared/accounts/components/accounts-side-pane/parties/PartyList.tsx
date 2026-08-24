import { Phone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { tintAt } from "~/components/core/tint/tints";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getParties,
  pageSize,
  prepareParams,
  statusToneClass,
  tagClass,
  type PartyRow,
  type PartyVariant,
} from "./helper";

interface PartyListProps {
  /** `payers` = parties who owe us, `vendors` = parties we owe. */
  variant: PartyVariant;
  /** Rows read per page and per load-more step. */
  limit?: number;
}

const titles: Record<PartyVariant, string> = {
  payers: "Parties who owe",
  vendors: "Vendors",
};

const Row = ({
  item,
  expanded,
  onToggle,
}: {
  item: PartyRow;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const tint = tintAt(item._tintIndex);

  return (
    <div className="tw:border-b tw:border-gray-100 tw:last:border-b-0">
      <div
        onClick={onToggle}
        aria-expanded={expanded}
        className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-4 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
      >
        <span
          className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold"
          style={{ background: tint.background, color: tint.ink }}
        >
          {item._initial}
        </span>

        {/* The name opens the party page; the rest of the row expands it. */}
        <AppLink
          asLink
          noUnderline
          href={item.link}
          className="tw:min-w-0 tw:flex-1"
          onClick={(e: any) => e.stopPropagation()}
        >
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
              {item.name}
            </span>
            {item.tags.map((tag) => (
              <span
                key={tag}
                className={`tw:shrink-0 tw:rounded tw:border tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase ${tagClass[tag]}`}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="tw:flex tw:items-center tw:gap-1 tw:truncate tw:text-[11px] tw:text-gray-500">
            {item.mobile && (
              <>
                <Phone size={11} className="tw:shrink-0" />
                <span className="tw:shrink-0">{item.mobile}</span>
              </>
            )}
            {item.mobile && item.meta && (
              <span className="tw:mx-0.5 tw:text-gray-300">·</span>
            )}
            <span className="tw:truncate">{item.meta}</span>
          </div>
        </AppLink>

        <div className="tw:shrink-0 tw:text-right">
          <div
            className={`tw:text-[11px] tw:font-semibold ${statusToneClass[item.statusTone]}`}
          >
            {item.status}
          </div>
          {item.amount > 0 && (
            <Amount
              value={item.amount}
              decimalPlaces={0}
              className="tw:text-sm tw:font-bold tw:text-slate-900"
            />
          )}
        </div>
      </div>

      {expanded && item.details.length > 0 && (
        <div className="tw:bg-slate-50/70 tw:px-4 tw:pb-2.5 tw:pl-16">
          {item.details.map((detail) => (
            <div
              key={detail.label}
              className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-0.5 tw:text-[11px]"
            >
              <span className="tw:truncate tw:text-gray-500">
                {detail.label}
              </span>
              {detail.amount !== undefined ? (
                <Amount
                  value={detail.amount}
                  decimalPlaces={0}
                  className="tw:shrink-0 tw:font-semibold tw:text-slate-700"
                />
              ) : (
                <span className="tw:shrink-0 tw:font-semibold tw:text-slate-700">
                  {detail.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Party list block for the accounts side pane. One row per counter-party with
 * the amount and its status; tapping a row expands the supporting detail
 * (open bills, next due, last transaction) in place.
 *
 * Reads the same dashboard endpoints as the money-in / money-out pages, a page
 * at a time.
 */
const PartyList = ({ variant, limit = pageSize }: PartyListProps) => {
  const [rows, setRows] = useState<PartyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: limit,
    startSlNo: 1,
    endSlNo: limit,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setRows([]);
    setExpandedId(null);
    paginationRef.current = {
      ...paginationRef.current,
      rowsPerPage: limit,
      activePage: 1,
      startSlNo: 1,
      endSlNo: limit,
    };

    try {
      const params = prepareParams(variant, paginationRef.current);
      const result = await getParties(variant, params);
      setRows(result);
      paginationRef.current.totalRecords = await getCount(variant, params);
      setHasMoreData(result.length < paginationRef.current.totalRecords);
    } catch (error) {
      setRows([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [variant, limit]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(variant, paginationRef.current);
      const result = await getParties(variant, params);
      setRows((prev) => {
        const next = [...prev, ...result];
        setHasMoreData(next.length < paginationRef.current.totalRecords);
        return next;
      });
    } catch (error) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [variant, loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <div>
      <p className="tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        {titles[variant]}
      </p>

      {/* Bled out of the pane gutter so the rows read as a list, not a card. */}
      <div className="app-bleed-x tw:border-y tw:border-gray-100 tw:bg-white">
        {loading ? (
          <div className="tw:flex tw:h-32 tw:items-center tw:justify-center">
            <AppSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="tw:py-8 tw:text-center tw:text-xs tw:text-gray-400">
            Nothing outstanding.
          </p>
        ) : (
          // No nested scroll area: the pane itself scrolls (see AppPaneSide),
          // so the list flows with the rest of the blocks.
          <>
            {rows.map((item) => (
              <Row
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === item.id ? null : item.id))
                }
              />
            ))}

            {hasMoreData && (
              <div className="tw:py-2">
                <LoadMoreButton
                  loaderType="button"
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={rows.length}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PartyList;
