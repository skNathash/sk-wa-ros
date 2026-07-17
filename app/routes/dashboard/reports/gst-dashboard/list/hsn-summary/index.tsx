import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import AppButton from "~/components/core/button/AppButton";
import { Download } from "lucide-react";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import type { HsnRow } from "./helper";
import { getCount, getData, prepareParams } from "./helper";
import { Search } from "lucide-react";

const defaultFilter = {
  search: "",
};

const HsnSummary = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const { register, getValues } = useForm();

  const [searchParams, setSearchParams] = useSearchParams();
  const dateFrom = searchParams?.get("dateFrom");
  const dateTo = searchParams?.get("dateTo");
  const search = searchParams?.get("search") || "";

  const [data, setData] = useState<HsnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const [view, setView] = useState<ViewToggleType>("list");

  const sortRef = useRef<{ key: string; value: "asc" | "desc" } | undefined>(
    undefined,
  );

  useEffect(() => {
    if (dateFrom || dateTo || search) {
      filterRef.current = {
        ...filterRef.current,
        startDate: dateFrom ? new Date(dateFrom) : undefined,
        endDate: dateTo ? new Date(dateTo) : undefined,
        search: search || "",
      };
      applyFilter();
    }
  }, [dateFrom, dateTo, search]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const total = await getCount(params as any);
      paginationRef.current.totalRecords = total;
      const rows = await getData(params as any);
      setData(rows);
      setHasMoreData(rows.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const rows = await getData(params as any);
      setData((prev) => [...prev, ...rows]);
      setHasMoreData(rows.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleSort = useCallback(
    ({ key, value }: { key: string; value: any }) => {
      sortRef.current = { key, value };
      // fire-and-forget the async filter
      void applyFilter();
    },
    [applyFilter],
  );

  const onSearch = useCallback(
    debounce(() => {
      const search = getValues("search");
      setSearchParams(
        (prev) => {
          prev.set("search", search);
          return prev;
        },
        {
          replace: true,
        },
      );
    }, 500),
    [],
  );

  const handleDownload = useCallback(() => {
    const fid = AuthService.getLoggedInUserId();
    const params = prepareParams(filterRef.current, {}, sortRef.current);

    ReportService.getGstDashboardHsnSummaryDownload(fid, params);
  }, []);

  return (
    <>
      <AppInput
        register={register}
        name="search"
        placeholder="Search by HSN"
        onChange={onSearch}
        className="tw:mb-4"
        leftIcon={<Search size={15} className="tw:text-gray-500" />}
        size="sm"
      />

      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          {data.length > 0 && (
            <AppButton
              size="small"
              color="light"
              fill="outline"
              onClick={handleDownload}
            >
              <Download />
              <span className="tw:hidden tw:md:inline">Download</span>
            </AppButton>
          )}

          <ViewToggle viewType={view} callback={setView} />
        </div>
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          showLoadMore={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            sortKey={sortRef.current?.key || ""}
            sortValue={sortRef.current?.value}
            onSort={handleSort}
            showLoadMore={hasMoreData && !loading}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </AppCard>
      )}
    </>
  );
};

export default HsnSummary;
