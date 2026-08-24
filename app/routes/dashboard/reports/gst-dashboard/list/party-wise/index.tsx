import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import { StateWiseSplit } from "./components/StateWiseSplit";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import type { Lane, LaneSummary, PartyFilter, PartyRow } from "./helper";
import {
  defaultLaneSummary,
  getAllData,
  getCount,
  getData,
  getListTitle,
  laneOf,
  prepareParams,
  sortRows,
} from "./helper";

const defaultFilter = {
  type: "b2b",
};

const PartyWise = () => {
  const { isMobile } = useScreenView();

  const [searchParams] = useSearchParams();
  const dateFrom = searchParams?.get("dateFrom");
  const dateTo = searchParams?.get("dateTo");

  const [data, setData] = useState<PartyRow[]>([]);
  // Every party in the lane — the state-wise split and the mismatch tile
  // describe the whole period, so they cannot read off the table's page.
  const [allRows, setAllRows] = useState<PartyRow[]>([]);
  // The B2B lane in full, kept aside so the mismatch tile and its table keep
  // their answer while the user is looking at the B2C lane.
  const [b2bRows, setB2bRows] = useState<PartyRow[]>([]);
  const [count, setCount] = useState<LaneSummary>({ ...defaultLaneSummary });
  const [b2cCount, setB2cCount] = useState<LaneSummary>({
    ...defaultLaneSummary,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Which tile is driving the table — the tiles double as the lane filter.
  const [filter, setFilter] = useState<PartyFilter>("b2b");
  // The card leads with "top by taxable value", so that is the opening order.
  const [sort, setSort] = useState<{ key: string; value: SortValue }>({
    key: "totalTaxableAmount",
    value: "desc",
  });

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    // Six rows fill the table's fixed height exactly — the rest arrives on
    // demand through loadMore.
    rowsPerPage: 6,
    startSlNo: 1,
    endSlNo: 6,
    totalRecords: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  // The whole lane, for the blocks that describe the period rather than the
  // table's page. B2B doubles as the source for the mismatch filter.
  const loadAllRows = useCallback(async (lane: Lane) => {
    setLoadingAll(true);
    try {
      const rows = await getAllData({ type: lane });
      setAllRows(rows);
      if (lane === "b2b") setB2bRows(rows);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setPage(1);

    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const lane: Lane = filterRef.current.type;

      // The tiles describe the whole lane, so each lane is asked for its own
      // totals — one count call per lane, independent of the table's page.
      const [b2b, b2c, list] = await Promise.all([
        getCount({ type: "b2b" }),
        getCount({ type: "b2c" }),
        getData(params),
      ]);

      setCount(b2b);
      setB2cCount(b2c);
      paginationRef.current.totalRecords =
        list.pagination?.totalItems ||
        (lane === "b2c" ? b2c.orders : b2b.parties);

      setData(list.rows);
      loadAllRows(lane);
      setHasMore(
        list.pagination
          ? list.pagination.hasNextPage
          : list.rows.length >= paginationRef.current.rowsPerPage,
      );
    } finally {
      setLoading(false);
    }
  }, [loadAllRows]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = paginationRef.current.activePage + 1;
      paginationRef.current = {
        ...paginationRef.current,
        activePage: nextPage,
      };
      setPage(nextPage);

      const params = prepareParams(filterRef.current, paginationRef.current);
      const list = await getData(params);

      setData((prev) => [...prev, ...list.rows]);
      if (list.pagination?.totalItems) {
        paginationRef.current.totalRecords = list.pagination.totalItems;
      }
      setHasMore(
        list.pagination
          ? list.pagination.hasNextPage
          : list.rows.length >= paginationRef.current.rowsPerPage,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const handleSort = useCallback(({ key, value }: { key: string; value: SortValue }) => {
    setSort({ key, value });
  }, []);

  // Tapping a tile re-points the table at it. B2B and mismatch share a lane, so
  // moving between those two costs nothing — the rows are already here.
  const handleFilter = useCallback(
    (next: PartyFilter) => {
      if (next === filter) return;

      const laneChanged = laneOf(next) !== laneOf(filter);
      setFilter(next);

      if (laneChanged) {
        filterRef.current = { ...filterRef.current, type: laneOf(next) };
        loadData();
      }
    },
    [filter, loadData],
  );

  const mismatchRows = useMemo(
    () => b2bRows.filter((item) => !item.matched),
    [b2bRows],
  );

  // The mismatch view is cut out of the rows we already hold, so it is complete
  // as soon as they land — nothing left to page in.
  const isMismatch = filter === "mismatch";
  const rows = isMismatch ? mismatchRows : data;

  const sortedData = useMemo(
    () => sortRows(rows, sort as { key: string; value: "asc" | "desc" }),
    [rows, sort],
  );

  const periodLabel = dateTo ? format(new Date(dateTo), "MMM yyyy") : undefined;

  const mismatches = mismatchRows.length;
  const mismatchCaption =
    mismatches > 0 && dateTo
      ? `follow up before ${format(new Date(dateTo), "d MMM")}`
      : undefined;

  const listLoading = isMismatch ? loadingAll : loading;
  const totalCount = isMismatch ? mismatches : paginationRef.current.totalRecords;
  const paginationConfig = isMismatch
    ? {
        ...paginationRef.current,
        startSlNo: mismatches ? 1 : 0,
        endSlNo: mismatches,
        totalRecords: mismatches,
      }
    : paginationRef.current;

  return (
    <>
      <Summary
        b2b={count}
        b2c={b2cCount}
        mismatches={mismatches}
        mismatchCaption={mismatchCaption}
        loading={loading}
        active={filter}
        onSelect={handleFilter}
      />

      <PaginationSummary
        paginationConfig={paginationConfig}
        loadingTotalRecords={listLoading}
        loadedCount={sortedData.length}
        fwSize="sm"
        className="tw:mb-2"
      />

      {isMobile ? (
        <MobileView
          data={sortedData}
          loading={listLoading}
          showLoadMore={hasMore && !isMismatch}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={totalCount}
          loadedCount={sortedData.length}
          periodLabel={periodLabel}
          title={getListTitle(filter)}
        />
      ) : (
        <DesktopView
          data={sortedData}
          loading={listLoading}
          sortKey={sort.key}
          sortValue={sort.value}
          onSort={handleSort}
          showLoadMore={hasMore && !isMismatch && !listLoading}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={totalCount}
          loadedCount={sortedData.length}
          periodLabel={periodLabel}
          title={getListTitle(filter)}
        />
      )}

      <StateWiseSplit
        data={isMismatch ? mismatchRows : allRows}
        loading={loadingAll}
      />
    </>
  );
};

export default PartyWise;
