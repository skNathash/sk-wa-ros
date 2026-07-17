import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import PageAccessService from "~/services/PageAccessService";
import type {
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import { Info } from "lucide-react";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import Filter from "./components/Filter";
import DesktopView from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import Summary from "./components/Summary";
import { getCount, getData, getSummary, prepareParams } from "./helper";
import CommonService from "~/services/CommonService";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const JoiningRequest = () => {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const filterRef = useRef<Record<string, any>>({ status: "Pending" });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    endSlNo: 10,
    rowsPerPage: 10,
    startSlNo: 1,
    totalRecords: 0,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "name",
    value: "asc",
  });

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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
      // fetch summary based on current filters
      const summaryData = await getSummary(filterRef.current || {});
      setSummary(summaryData || {});
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    applyFilter();
  }, []);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  const handleSort = useCallback(({ key, value }: SortProps) => {
    sortRef.current = { key, value: value || "asc" };
    applyFilter();
  }, []);

  return (
    <>
      <InfoBlock
        variant="info"
        size="sm"
        className="tw:mb-4 tw:flex tw:items-start tw:gap-2"
      >
        <Info size={16} className="tw:mt-0.5 tw:shrink-0" />
        <span>{t("joiningRequestInfo")}</span>
      </InfoBlock>

      <Summary summary={summary} />

      <Filter callback={onFilterChange} />

      <div className="tw:mb-4 tw:mt-4 tw:flex tw:md:flex-row tw:flex-col tw:md:justify-between tw:md:items-end tw:gap-2">
        <div className="tw:flex-1 tw:flex tw:flex-row tw:md:flex-col tw:gap-2 tw:justify-between tw:items-center tw:md:items-start">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>

        <div className="tw:flex tw:gap-2">
          <ViewToggle viewType={view} callback={setView} />
        </div>
      </div>

      {isMobile || view === "card" ? (
        <>
          <MobileView data={data} loading={loading} />

          {hasMoreData && !loading && (
            <div className="tw:text-center tw:mt-4">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </>
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            hasMoreData={hasMoreData}
          />
        </AppCard>
      )}
    </>
  );
};

export default JoiningRequest;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Joining Request"),
    },
  ];
}
