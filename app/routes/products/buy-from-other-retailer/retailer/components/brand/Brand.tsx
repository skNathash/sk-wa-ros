import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Filter from "./Filter";
import Item from "./Item";

type Props = {
  retailerId: string;
  callback?: (p: { action: string; data?: any }) => void;
};

type FormData = {
  search: string;
  alpha: string;
  retailerId: string;
};

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const Brand = ({ retailerId, callback }: Props) => {
  const formMethods = useForm<FormData>({
    defaultValues: { search: "", alpha: "", retailerId },
  });
  const { getValues, setValue } = formMethods;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setItems([]);
    try {
      const params = prepareParams(
        { ...getValues(), retailerId },
        paginationRef.current,
      );
      const result = await getData(params);
      const data = (result && result.data) || [];
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setItems([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [getValues, retailerId]);

  useEffect(() => {
    setValue("retailerId", retailerId);
    if (retailerId) {
      applyFilter();
    } else {
      setItems([]);
      setHasMoreData(false);
    }
  }, [retailerId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...getValues(), retailerId },
        paginationRef.current,
      );
      const result = await getData(params);
      const data = (result && result.data) || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterCallback = (a: { action: string; data?: any }) => {
    if (a.action === "apply" && a.data) {
      const formData = a.data;
      setValue("search", formData.search || "");
      setValue("alpha", formData.alpha || "");
      applyFilter();
    }
  };

  const onItemCallback = (p: { action: string; data?: any }) => {
    if (p.action === "view") {
      callback && callback({ action: "view", data: p.data });
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Filter retailerId={retailerId} callback={handleFilterCallback} />

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && items.length === 0 ? <NoData /> : null}

      {!loading && items.length > 0 ? (
        <>
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={items.length}
              fwSize="sm"
              className="tw:mb-2"
            />
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-3">
            {items.map((it) => (
              <div key={it._id}>
                <Item
                  id={it._id}
                  name={it._displayName || it.name}
                  image={it._displayImg}
                  totalDeals={it.dealsCount || it.totalDeals}
                  callback={onItemCallback}
                />
              </div>
            ))}
          </div>

          {hasMoreData && !loading && (
            <div className="tw:flex tw:justify-center tw:mt-2">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={items.length}
              />
            </div>
          )}
        </>
      ) : null}
    </FormProvider>
  );
};

export default Brand;
