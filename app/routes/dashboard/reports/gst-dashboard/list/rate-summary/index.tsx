import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useForm, Controller } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import type { RateRow } from "./helper";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import { AppSelect } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import { Download } from "lucide-react";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";

const defaultFilter = {
  search: "",
};

const gstOptions = CommonService.getGstOptions();

const RateSummary = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const { control } = useForm({
    defaultValues: {
      gstRate: "all",
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const dateFrom = searchParams?.get("dateFrom");
  const dateTo = searchParams?.get("dateTo");
  const gstRate = searchParams?.get("gstRate") || "all";

  const [data, setData] = useState<RateRow[]>([]);
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

  const sortRef = useRef<{ key: string; value: "asc" | "desc" } | undefined>({
    key: "gstRate",
    value: "asc",
  });

  const [view, setView] = useState<ViewToggleType>("list");

  useEffect(() => {
    filterRef.current = {
      startDate: dateFrom ? new Date(dateFrom) : undefined,
      endDate: dateTo ? new Date(dateTo) : undefined,
      gstRate: gstRate,
    };
    applyFilter();
  }, [dateFrom, dateTo, gstRate]);

  const handleDownload = useCallback(() => {
    const fid = AuthService.getLoggedInUserId();
    const params = prepareParams(filterRef.current, {}, undefined);

    ReportService.getGstDashboardRateSummaryDownload(fid, params);
  }, []);

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
      void applyFilter();
    },
    [applyFilter],
  );

  const handleGstRateChange = (chngFn: any) => (value: string) => {
    chngFn(value);
    setSearchParams({
      ...Object.fromEntries(searchParams),
      gstRate: value,
    });
  };

  return (
    <>
      <div className="tw:mb-4 tw:grid tw:grid-cols-2 tw:md:grid-cols-3">
        <Controller
          name="gstRate"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={gstOptions}
              placeholder="Select GST Rate"
              value={gstRate}
              onChange={handleGstRateChange(field.onChange)}
              size="sm"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>

      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div className="tw:flex-1">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>

        <div className="tw:flex tw:items-center tw:gap-4">
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
          />
        </AppCard>
      )}
    </>
  );
};

export default RateSummary;
