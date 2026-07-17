import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import Item from "./components/Item";
import Filter from "./components/Filter";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const BoxesView = ({ formData }: { formData?: Record<string, any> }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const methods = useForm({ defaultValues: formData || {} });

  const applyFilter = async () => {
    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      const total = await getCount(params);

      paginationRef.current.totalRecords = total;
      setHasMoreData(total > result.length);
      setData(result || []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (payload: { formData: Record<string, any> }) => {
    // update filterRef and re-apply filter
    filterRef.current = { ...(payload?.formData || {}) };
    // reset pagination
    paginationRef.current = { ...defaultPagination };
    applyFilter();
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    // initialize form values and filters
    methods.reset(formData || {});
    filterRef.current = methods.getValues();
    applyFilter();
  }, []);

  return (
    <div>
      <AppCard noPadding className="tw:mb-3">
        <div className="tw:p-4">
          <FormProvider {...methods}>
            <Filter callback={handleFilterChange} />
          </FormProvider>
        </div>
      </AppCard>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8 tw:min-h-72">
          <AppSpinner />
        </div>
      ) : null}

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        fwSize="sm"
        loadedCount={data.length}
        className="tw:mb-2"
      />

      {!loading && data.length === 0 ? <NoData /> : null}

      {data.map((d: any, idx: number) => (
        <Item key={idx} item={d} />
      ))}

      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-3">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
          />
        </div>
      )}
    </div>
  );
};

export default BoxesView;
