import { ArrowRight, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useScreenView from "~/hooks/useScreenView";
import ListSkeleton from "~/shared/accounts/components/list-skeleton/ListSkeleton";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";
import { useDebouncedCallback } from "use-debounce";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import {
  allLanes,
  emptySummary,
  getCount,
  getData,
  pageSize,
  prepareParams,
  type PaylaterCustomer,
  type PaylaterSummary,
} from "./helper";

type PaylaterBookProps = {
  /** Lane the book is read for; omit to list both. */
  lane?: string;
  /** Header's totals line; drop it where the page prints the totals itself. */
  showSummary?: boolean;
  /** Row and header actions bubble up; the page owns the paylater flows. */
  callback?: (payload: { action: string; data?: any }) => void;
};

// The shop's own credit book: who is allowed to buy on paylater, how much of
// their limit is drawn, and when the cycle collects.
const PaylaterBook = ({
  lane = allLanes,
  showSummary = true,
  callback,
}: PaylaterBookProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const [data, setData] = useState<PaylaterCustomer[]>([]);
  const [summary, setSummary] = useState<PaylaterSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({ lane });

  // Form for search
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  // Apply filter (initial load or filter change)
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const { list, summary: bookSummary } = await getData(params);
      setData(list);
      setSummary(bookSummary);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(list.length < totalRecords);
    } catch (e) {
      setData([]);
      setSummary(emptySummary());
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search function
  const handleSearchChange = useDebouncedCallback(() => {
    filterRef.current = {
      ...filterRef.current,
      search: getValues("search"),
    };
    applyFilter();
  }, 500);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const { list } = await getData(params);
      setData((prev) => {
        const next = [...prev, ...list];
        setHasMoreData(next.length < paginationRef.current.totalRecords);
        return next;
      });
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  /* The lane is read by the API, so switching lanes starts the book again from
     the first page. */
  useEffect(() => {
    filterRef.current = { ...filterRef.current, lane };
    applyFilter();
  }, [lane, applyFilter]);

  const emit = (action: string, item?: PaylaterCustomer) =>
    callback?.({ action, data: item });

  return (
    /* Mobile has no card shell — the rows bleed to the screen edges and the
       header sits on the page background. The card returns from md up. */
    <div className="tw:mb-3 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:border tw:md:border-emerald-200 tw:md:bg-white tw:md:shadow-sm">
      {/* One header for both widths: on mobile it sits bare on the page
          background so the sheet below reads as the block itself; from md up it
          gains the card's emerald plate. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:md:bg-emerald-50 tw:md:px-4 tw:md:py-3">
        <div className="tw:min-w-0">
          <div className="tw:text-sm tw:font-bold tw:text-gray-800 tw:md:text-emerald-800">
            {t("paylaterCreditBook")}
          </div>
          {showSummary && (
            <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-gray-600">
              {t("paylaterCustomerCount", { count: summary.customerCount })} · ₹
              {CommonService.formattedAmount(summary.outstanding, 0)}{" "}
              {t("outstanding")} · ₹
              {CommonService.formattedAmount(summary.totalLimit, 0)} {t("limit")}
            </div>
          )}
        </div>
        {/* <AppButton size="small" onClick={() => emit("openPaylater")}>
          <ArrowRight size={14} />
          <span className="tw:hidden tw:md:inline">
            {t("openPaylaterDesktop")}
          </span>
        </AppButton> */}
      </div>

      {/* The search band rides above the sheet: bare on mobile, inside the
          card's padding and hairline rule from md up. */}
      <div className="tw:pb-2 tw:md:border-b tw:md:border-gray-100 tw:md:px-4 tw:md:py-2.5">
        <AppInput
          name="search"
          placeholder="Search by customer name..."
          register={register}
          onChange={handleSearchChange}
          className="tw:w-full"
          leftIcon={<Search className="tw:text-gray-500" size={16} />}
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : (
        <>
          {/* Desktop prints the full book row — customer, code, limit, used,
              due; mobile folds code, limit and due date under the name. */}
          {isMobile ? (
            <MobileView data={data} emit={emit} />
          ) : (
            <DesktopView data={data} emit={emit} />
          )}

          {/* More customers are on the book than have been read so far. */}
          {hasMoreData && (
            <div className="tw:pt-3 tw:md:border-t tw:md:border-gray-100 tw:md:px-4 tw:md:pt-0 tw:md:pb-3">
              <LoadMoreButton
                loaderType="button"
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaylaterBook;
