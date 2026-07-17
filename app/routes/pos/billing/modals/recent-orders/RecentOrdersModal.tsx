import { debounce } from "lodash";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ClockIcon,
  SearchIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import Item from "./Item";
import {
  defaultFilter,
  type FilterFormData,
  getData,
  prepareParams,
} from "./helper";

interface RecentOrdersModalProps {
  show: boolean;
  pendingOrderCount?: number;
  callback: (args: { action: string; data?: any }) => void;
}

const RecentOrdersModal = ({
  show,
  pendingOrderCount = 0,
  callback,
}: RecentOrdersModalProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const formMethods = useForm<FilterFormData>({ defaultValues: defaultFilter });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 30,
    startSlNo: 1,
    endSlNo: 30,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "orderedDate",
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
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData(result || []);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, formMethods]);

  useEffect(() => {
    if (show) applyFilter();
  }, [show, applyFilter]);

  const debouncedSearch = useCallback(
    debounce(() => applyFilter(), 500),
    [applyFilter],
  );

  const handleClose = () => callback({ action: "close" });

  const handleViewAll = () => {
    appNav.to("/dashboard/orders/dashboard");
    handleClose();
  };

  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view-order") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
      handleClose();
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:flex-col">
          <span>Recent Orders</span>
          <span className="tw:text-xs tw:font-normal tw:text-slate-500">
            {t("View recently placed orders")}
          </span>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <FormProvider {...formMethods}>
          <div className="tw:mb-3 tw:mt-1">
            <AppInput
              name="search"
              register={formMethods.register}
              onChange={debouncedSearch}
              placeholder={t("Search by order ID, customer name or mobile")}
              className="tw:bg-white"
              leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
              inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
            />
          </div>
        </FormProvider>

        {pendingOrderCount > 0 && (
          <button
            type="button"
            onClick={handleViewAll}
            className="tw:group tw:mb-3 tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-gradient-to-r tw:from-amber-50 tw:to-orange-50 tw:px-3 tw:py-3 tw:text-left tw:transition-colors hover:tw:border-amber-300 hover:tw:from-amber-100 hover:tw:to-orange-100 tw:cursor-pointer"
          >
            <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-100 tw:text-amber-600">
              <ClockIcon size={20} />
            </span>
            <div className="tw:flex tw:flex-col tw:leading-tight">
              <span className="tw:text-base tw:font-semibold tw:text-amber-900">
                {pendingOrderCount} {pendingOrderCount === 1 ? "order" : "orders"}{" "}
                awaiting action
              </span>
              <span className="tw:text-xs tw:text-amber-700">
                Approve or process pending orders
              </span>
            </div>
            <ChevronRightIcon
              size={18}
              className="tw:ml-auto tw:shrink-0 tw:text-amber-500 tw:transition-transform group-hover:tw:translate-x-0.5"
            />
          </button>
        )}

        {loading && (
          <div className="tw:flex tw:flex-col tw:gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="tw:h-[88px] tw:bg-slate-100 tw:rounded-md tw:animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && (!data || data.length === 0) && <NoData />}

        {!loading && data.length > 0 && (
          <div className="tw:flex tw:flex-col tw:gap-2">
            <p className="tw:px-1 tw:text-xs tw:text-gray-500">
              Showing {data.length} most recent orders
            </p>
            {data.map((item) => (
              <Item
                key={item.orderId}
                item={item}
                callback={handleItemCallback}
              />
            ))}

            <AppButton
              type="button"
              fill="outline"
              color="primary"
              expand="full"
              onClick={handleViewAll}
              className="tw:mt-3 tw:flex tw:items-center tw:justify-center tw:gap-2"
            >
              {t("View all orders")}
              <ArrowRightIcon size={16} />
            </AppButton>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default RecentOrdersModal;
