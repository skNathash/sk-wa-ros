import { Calendar, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  show: boolean;
  userId: string | null;
  callback: (data: { action: string; data?: any }) => void;
};

const UserPendingHandoverModal: React.FC<Props> = ({
  show,
  userId,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, reset } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<any>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = async () => {
    if (!userId) return;
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
        { ...filterRef.current, userId },
        paginationRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      const countResult = await getCount(params);
      paginationRef.current.totalRecords = countResult.count || 0;
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData || !userId) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...filterRef.current, userId },
        paginationRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const debouncedSearch = useDebouncedCallback(
    () => {
      applyFilter();
    },
    500,
    { maxWait: 1000 },
  );

  const handleSearch = () => {
    filterRef.current = {
      ...filterRef.current,
      search: getValues("search"),
    };
    debouncedSearch();
  };

  useEffect(() => {
    if (show && userId) {
      filterRef.current = {};
      reset({ search: "" });
      applyFilter();
    }
  }, [show, userId]);

  const handleClose = () => callback({ action: "close" });

  const handleHandover = (row: any) => {
    callback({ action: "handover", data: row });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-sm tw:font-semibold">
          {t("pendingHandover") || "Pending Handover"}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:bg-white tw:sticky tw:top-0 tw:z-10">
          <AppInput
            name="search"
            placeholder={t("searchByOrderId") || "Search by Order ID"}
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
          <div className="tw:flex tw:justify-center tw:items-center tw:py-10">
            <AppSpinner />
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-10">
            <NoData />
          </div>
        )}

        <div className="tw:flex tw:flex-col tw:gap-2">
          {data.map((item, index) => (
            <AppCard key={item._id || index} noPadding>
              <div className="tw:p-3">
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                  <div>
                    <div className="tw:text-sm tw:font-semibold tw:mb-1">
                      {item.orderRefId}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {item.settlementId}
                    </div>
                  </div>
                  <AppBadge variant="warning">{item.status}</AppBadge>
                </div>

                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:flex tw:flex-col tw:gap-1">
                    <Amount
                      value={item.totalAmount}
                      decimalPlaces={2}
                      className="tw:font-semibold tw:text-primary"
                    />
                    {item.createdAt && (
                      <span className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        <Calendar size={12} className="tw:text-gray-500" />
                        <DateFormat value={item.createdAt} />
                      </span>
                    )}
                  </div>

                  <AppButton
                    size="small"
                    color="dark"
                    onClick={() => handleHandover(item)}
                  >
                    {t("handover") || "Handover"}
                  </AppButton>
                </div>
              </div>
            </AppCard>
          ))}
        </div>

        {!loading && hasMoreData && data.length > 0 && (
          <LoadMoreButton
            loading={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            noMargin={true}
          />
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default UserPendingHandoverModal;
