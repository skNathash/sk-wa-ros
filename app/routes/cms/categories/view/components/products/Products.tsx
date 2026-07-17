import { useEffect, useState } from "react";

import { useRef } from "react";
import type {
  PaginationState,
  SortProps,
  SortValue,
} from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppButton from "~/components/core/button/AppButton";
import Filter from "./components/Filter";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { FormProvider, useForm } from "react-hook-form";
import { defaultFilter } from "./helper";

const Products = ({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) => {
  const { isMobile } = useScreenView();

  const formMethods = useForm({
    defaultValues: defaultFilter,
  });

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
  const filterRef = useRef<Record<string, any>>({});
  const sortRef = useRef<SortProps>({
    key: "dealName",
    value: "asc",
  });

  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      categoryId,
    };
    applyFilter();
  }, [categoryId]);

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      sortRef.current
    );
    const result = await getData(params);
    setData(result || []);

    const totalRecords = await getCount(params);
    paginationRef.current.totalRecords = totalRecords;

    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    // advance page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // swallow - keep previous data
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  };

  const handleSortChange = (data: { key: string; value: SortValue }) => {
    sortRef.current = data;
    formMethods.setValue("globalSort", "all");
    applyFilter();
  };

  return (
    <>
      <AppCard
        title="Products"
        subtitle={`All products under the ${categoryName} category.`}
      >
        <FormProvider {...formMethods}>
          <Filter callback={handleFilterChange} />
        </FormProvider>

        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
          className="tw:mb-4"
        />

        {isMobile ? (
          <MobileView data={data} loading={loading} />
        ) : (
          <DesktopView
            data={data}
            loading={loading}
            onSort={handleSortChange}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
          />
        )}

        {hasMoreData && !loading && (
          <div className="tw:flex tw:justify-center tw:mt-4">
            <AppButton
              onClick={loadMore}
              disabled={loadingMore}
              size="small"
              color="light"
              fill="outline"
            >
              {loadingMore ? "Loading" : "Load More"} ({data.length}/
              {paginationRef.current.totalRecords})
            </AppButton>
          </div>
        )}
      </AppCard>
    </>
  );
};

export default Products;
