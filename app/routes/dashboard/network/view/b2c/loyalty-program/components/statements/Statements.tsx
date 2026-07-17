import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import Item from "./components/Item";
import { defaultFilter, getCount, getData, prepareParams } from "./helper";
import AppButton from "~/components/core/button/AppButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type StatementsProps = {
  customerId?: string;
};

const Statements = ({ customerId }: StatementsProps) => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    ...defaultFilter,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "createdAt",
    value: "desc",
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
        sortRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (customerId) {
      filterRef.current = {
        ...filterRef.current,
        ownerId: customerId,
      };
      applyFilter();
    }
  }, [customerId, applyFilter]);

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
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilter = useCallback(
    ({ formData }: { formData: any }) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter],
  );

  return (
    <AppCard title="Statements" subtitle="King Coins statements">
      <Filter callback={handleFilter} />

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={data.length}
        fwSize="sm"
        className="tw:mb-4"
      />

      {loading ? (
        <div className="tw:text-center tw:py-8 tw:flex tw:justify-center">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && data.length === 0 ? <NoData /> : null}

      <div>
        {data.map((item, idx) => (
          <Item key={idx} item={item} />
        ))}
      </div>

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <AppButton
            onClick={loadMore}
            disabled={loadingMore}
            size="small"
            fill="outline"
            color="light"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </AppButton>
        </div>
      )}
    </AppCard>
  );
};

export default Statements;
