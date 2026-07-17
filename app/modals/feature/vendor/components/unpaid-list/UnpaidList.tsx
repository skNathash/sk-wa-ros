import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import NoData from "~/components/core/no-data/NoData";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, mapSelectedOrders, prepareParams } from "./helper";
import { produce } from "immer";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import { AppInput } from "~/components/core/form/AppInput";

type Props = {
  callback: (a: { action: string; data: any }) => void;
  vendorId?: string;
};

const UnpaidList = ({ callback, vendorId }: Props) => {
  // State and refs
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
  const filterRef = useRef<any>({});

  const selectedOrdersRef = useRef<any[]>([]);

  // React Hook Form for search input
  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  // Debounced search handler (updates filterRef then applies filter)
  const onSearchChange = useCallback(
    debounce((event: React.ChangeEvent<HTMLInputElement>) => {
      const value = getValues("search");
      filterRef.current.search = value;
      applyFilter();
    }, 400),
    []
  );

  // Apply filter (initial load or filter change)
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
      const result = await getData(params);
      setData(mapSelectedOrders(result || [], selectedOrdersRef.current));
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData((prev) => [
        ...prev,
        ...mapSelectedOrders(result || [], selectedOrdersRef.current),
      ]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      vendorId,
    };
    applyFilter();
  }, [applyFilter, vendorId]);

  const handleSelectOrder = (
    order: any,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.checked) {
      selectedOrdersRef.current.push(order);
    } else {
      selectedOrdersRef.current = selectedOrdersRef.current.filter(
        (x) => x._id !== order._id
      );
    }

    setData(
      produce((draft) => {
        const index = draft.findIndex((x) => x._id === order._id);
        if (index !== -1) {
          draft[index].isSelected = e.target.checked;
        }
      })
    );

    callback({
      action: "select-order",
      data: selectedOrdersRef.current,
    });
  };

  return (
    <div className="tw:p-4 tw:bg-white tw:rounded-lg tw:border tw:border-gray-200">
      <div className="tw:font-semibold tw:text-lg tw:mb-2 tw:flex tw:items-center">
        <span className="tw:mr-2">
          <i className="fa fa-file-text-o" />
        </span>
        Unpaid Purchase Orders ({data.length})
      </div>
      <div className="tw:mb-3">
        <AppInput
          name="search"
          placeholder="Search by order id or vendor..."
          register={register}
          onChange={onSearchChange}
        />
      </div>
      <AppScrollArea className="tw:h-[62vh]">
        {!loading && data.length === 0 ? (
          <NoData>
            <div className="tw:text-slate-500 tw:text-sm tw:font-medium">
              No payment records found
            </div>
          </NoData>
        ) : (
          <>
            <div className="tw:space-y-4">
              {data.map((item, idx) => (
                <div
                  className="tw:flex tw:items-center tw:justify-between tw:rounded-lg tw:p-4 tw:border tw:border-gray-200"
                  key={idx}
                >
                  <div className="tw:flex tw:items-start tw:gap-4">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={(e) => handleSelectOrder(item, e)}
                      className="tw:mt-1 tw:w-4 tw:h-4"
                    />
                    <div>
                      <span className="tw:bg-gray-100 tw:rounded-lg tw:px-2 tw:py-1 tw:text-xs tw:text-gray-700">
                        <code>{item.orderId}</code>
                      </span>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                        <DateFormat value={item.createdAt} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Amount
                      value={item.payableAmount}
                      decimalPlaces={2}
                      className="tw:text-base tw:font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
            {hasMoreData && !loading && (
              <div className="tw:text-center tw:mt-4">
                <AppButton
                  color="light"
                  fill="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="small"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </AppButton>
              </div>
            )}
          </>
        )}
      </AppScrollArea>
    </div>
  );
};

export default UnpaidList;
