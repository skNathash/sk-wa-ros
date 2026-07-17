import { FileTextIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import Filter from "./components/Filter";

const StatementOfAccounts = () => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    applyFilter();
  }, []);

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
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const data = await getData(params);
      setData(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const data = await getData(params);
      setData((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const handleFilterChange = useCallback((data: { formData: any }) => {
    filterRef.current = { ...filterRef.current, ...data.formData };
    applyFilter();
  }, []);

  return (
    <AppCard
      title="Statement of Accounts"
      icon={<FileTextIcon />}
      noContentPadding={true}
    >
      <div className="tw:px-6">
        <Filter callback={handleFilterChange} />
        <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
          <div className="tw:flex-1">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>
          <div>
            <ViewToggle viewType={viewType} callback={setViewType} />
          </div>
        </div>
      </div>
      {isMobile || viewType === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
        />
      ) : (
        <DesktopView
          data={data}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          hasMoreData={hasMoreData}
        />
      )}
    </AppCard>
  );
};

export default StatementOfAccounts;
