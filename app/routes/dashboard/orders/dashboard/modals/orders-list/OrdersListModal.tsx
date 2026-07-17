import { Calendar, Eye, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, prepareParams } from "./helper";
import { merge } from "lodash";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import NoData from "~/components/core/no-data/NoData";

type Props = {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  defaultFilter: any;
  title?: string;
};

const OrdersListModal: React.FC<Props> = ({
  show,
  callback,
  defaultFilter,
  title,
}) => {
  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debouncedSearch = useDebouncedCallback(
    () => {
      applyFilter();
    },
    500,
    {
      maxWait: 1000,
    },
  );

  const filterRef = useRef<any>({});

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const handleClose = () => {
    callback({ action: "close" });
  };

  const getParams = () => {
    const params = prepareParams(filterRef.current, paginationRef.current);
    return merge({}, defaultFilter, params);
  };

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = getParams();
      const result = await getData(params);
      setData(result.data || []);
      paginationRef.current = {
        ...paginationRef.current,
        totalRecords: result.count || 0,
      };
      setTotalRecords(result.count || 0);
      setHasMoreData(result.data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMoreData) return;

    setLoadingMore(true);

    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = getParams();
      const result = await getData(params);

      setData((prev) => [...prev, ...(result?.data || [])]);
      setHasMoreData(
        result?.data?.length || 0 >= paginationRef.current.rowsPerPage,
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    callback({ action: "viewOrder", data: { orderId } });
  };

  useEffect(() => {
    if (show) {
      filterRef.current = {};
      applyFilter();
    }
  }, [show]);

  const handleSearch = () => {
    filterRef.current = {
      ...filterRef.current,
      search: getValues("search"),
    };
    debouncedSearch();
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {title || "Orders List"}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:bg-white tw:sticky tw:top-0 tw:z-10">
          <AppInput
            name="search"
            placeholder="Search by Order ID"
            register={register}
            onChange={handleSearch}
            inputClassName="tw:w-full tw:mb-2 tw:mt-2"
            leftIcon={<Search size={16} className="tw:text-gray-500" />}
          />
        </div>

        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
          className="tw:mb-2"
        />

        {loading && (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <NoData />
          </div>
        )}

        {data.map((item, index) => (
          <AppCard key={item.orderId + index} noPadding>
            <div className="tw:p-4">
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                <div>
                  <div className="tw:text-sm tw:font-semibold tw:mb-1">
                    {item.orderId}
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <Calendar size={14} className="tw:text-gray-500" />
                    <DateFormat
                      value={item.createdAt}
                      className="tw:text-xs tw:text-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <AppBadge variant={item.statusColor || "secondary"}>
                    {item.displayStatus}
                  </AppBadge>
                </div>
              </div>

              <div className="tw:flex tw:items-center tw:justify-between">
                <KeyValue label="Total Value" size="sm">
                  <Amount
                    value={item.value}
                    decimalPlaces={2}
                    className="tw:font-semibold tw:text-primary"
                  />
                </KeyValue>

                <AppButton
                  size="small"
                  color="light"
                  noShadow
                  fill="outline"
                  onClick={() => handleViewOrder(item._id)}
                >
                  <Eye />
                  View Order
                </AppButton>
              </div>
            </div>
          </AppCard>
        ))}

        {!loading && hasMoreData && data.length > 0 && (
          <LoadMoreButton
            loading={loadingMore}
            loadMore={loadMore}
            totalCount={totalRecords}
            loadedCount={data.length}
            noMargin={true}
          />
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default OrdersListModal;
