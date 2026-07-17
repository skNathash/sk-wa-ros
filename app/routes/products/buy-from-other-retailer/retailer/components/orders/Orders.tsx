import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type {
  PaginationState,
  SortValue,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppCard from "~/components/core/card/AppCard";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  type FilterFormData,
} from "./helper";

type Props = {
  retailerId: string;
};

const Orders = ({ retailerId }: Props) => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [busyloader, setBusyloader] = useState<{ show: boolean }>({
    show: false,
  });

  const [view, setView] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "createdAt",
    value: "desc",
  });

  const filterRef = useRef<FilterFormData>(defaultFilter);

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

      const result = await getData(params, filterRef.current.retailerId);

      setData(result || []);

      const countResult = await getCount(params, filterRef.current.retailerId);
      paginationRef.current.totalRecords = countResult.totalOrders;

      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
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
        sortRef.current
      );
      const result = await getData(params, filterRef.current.retailerId);
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

  useEffect(() => {
    if (retailerId) {
      filterRef.current = {
        ...filterRef.current,
        retailerId,
      };
      applyFilter();
    }
  }, [retailerId, applyFilter]);

  return (
    <>
      <div className="tw:space-y-4">
        {/* Single controls block (pagination summary + view toggle) placed after filter */}
        <div className="tw:flex tw:items-center tw:mt-2 tw:mx-0 tw:mb-4">
          <div className="tw:flex-1">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data?.length || 0}
              fwSize="sm"
            />
          </div>
          <ViewToggle viewType={view} callback={setView} />
        </div>

        {/* Controls and list: show without AppCard for mobile/card view. For desktop/table view render with AppCard. */}
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
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              hasMoreData={hasMoreData}
            />
          </AppCard>
        )}
      </div>

      <BusyLoader show={busyloader.show} />
    </>
  );
};

export default Orders;
