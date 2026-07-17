import { useEffect, useRef, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import PosService from "~/services/PosService";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import Item from "./components/Item";
import DepositOrdersModal from "./modals/DespositOrdersModal";
import UploadDepositModal from "./modals/UploadDepositModal";
import AuthService from "~/services/AuthService";
import AppButton from "~/components/core/button/AppButton";
import { Loader2 } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Club", redirect: { path: "/dashboard/club" } },
  { label: "Cash Deposit", redirect: { path: "/dashboard/club/cash-deposit" } },
];

const prepareFilterParams = (filter: any, pagination: PaginationState) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      franchiseId: AuthService.getLoggedInUserId(),
    },
  };
  if (filter.search && filter.search.trim() !== "") {
    params.filter.$or = [
      { depositorName: { $regex: filter.search.trim(), $options: "gi" } },
      { _id: { $regex: filter.search.trim(), $options: "gi" } },
    ];
  }
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange[0] &&
    filter.dateRange[1]
  ) {
    params.filter.createdAt = {
      $gte: filter.dateRange[0],
      $lte: filter.dateRange[1],
    };
  }

  if (filter.status && filter.status.trim() !== "") {
    params.filter.status = filter.status;
  }
  if (filter.paymentModes && filter.paymentModes.trim() !== "") {
    params.filter.paymentMode = filter.paymentModes;
  }

  return params;
};

const getData = async (params: Record<string, any>) => {
  const r = await PosService.getPosCashDeposit(params);
  return Array.isArray(r.data) ? r.data : [];
};

const getCount = async (params: Record<string, any>) => {
  const p = {
    ...params,
    outputType: "count",
  };
  const r = await PosService.getPosCashDeposit(p);
  return { count: r.data?.[0]?.total || 0 };
};

const CashDepositList = () => {
  const appNav = useAppNav();

  const [deposits, setDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [uploadModal, setUploadModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const [depositOrdersModal, setDepositOrdersModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const filterRef = useRef({
    dateRange: [],
    search: "",
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 50,
  });

  useEffect(() => {
    applyFilter();
  }, []);

  const applyFilter = async () => {
    setIsLoading(true);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    const params = prepareFilterParams(
      filterRef.current,
      paginationRef.current
    );
    const countResp = await getCount(params);
    paginationRef.current.totalRecords = countResp.count;
    const data = await getData(params);
    setDeposits(data);
    setHasMore(data.length < countResp.count);
    setIsLoading(false);
  };

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareFilterParams(
      filterRef.current,
      paginationRef.current
    );
    const data = await getData(params);
    setDeposits((prev) => [...prev, ...data]);
    const totalLoaded =
      (paginationRef.current.activePage - 1) *
        paginationRef.current.rowsPerPage +
      data.length;
    setHasMore(totalLoaded < paginationRef.current.totalRecords);
    setIsLoading(false);
  };

  const filterCallback = (payload: { action: string; formData: any }) => {
    if (payload.action === "submit") {
      filterRef.current = {
        ...filterRef.current,
        ...payload.formData,
      };
      applyFilter();
    }
  };

  const uploadModalCallback = (payload: { action: string; data?: any }) => {
    setUploadModal({ show: false, data: null });
  };

  const depositOrdersModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    setDepositOrdersModal({ show: false, data: null });
    if (payload.action === "redirect" && payload.data?.orderId) {
      appNav.to(`/dashboard/pos/orders/view/${payload.data.orderId}`);
    }
  };

  const itemCallback = (payload: { action: string; data?: any }) => {
    if (payload.action === "viewOrders") {
      setDepositOrdersModal({ show: true, data: payload.data });
    } else if (payload.action === "uploadReceipt") {
      setUploadModal({ show: true, data: payload.data });
    }
  };

  return (
    <>
      <AppHeader title="Cash Deposit List" />
      <div className="page-bg p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
          <InfoBlock size="sm" className="tw:mb-4" shadow>
            <div className="tw:text-xs">
              View and manage all cash deposits made by club members. Filter by
              date or search by depositor or deposit ID.
            </div>
          </InfoBlock>

          <Filter callback={filterCallback} />

          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={isLoading}
            className="tw:mb-4"
            fwSize="sm"
            loadedCount={deposits.length}
          />
          {isLoading && deposits.length === 0 ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <span className="tw-mx-auto">Loading...</span>
            </div>
          ) : null}
          {!isLoading && deposits.length === 0 ? (
            <AppCard>
              <NoData />
            </AppCard>
          ) : null}
          {!isLoading && deposits.length > 0 ? (
            <>
              {deposits.map((item) => (
                <Item
                  key={item._id || item.referenceId}
                  item={item}
                  callback={itemCallback}
                />
              ))}
              {hasMore && (
                <div className="tw:flex tw:justify-center tw:mt-6">
                  <AppButton
                    onClick={loadMore}
                    disabled={isLoading}
                    fill="outline"
                    color="primary"
                    size="default"
                    className="tw:px-6"
                    isLoading={isLoading}
                  >
                    {isLoading ? <AppSpinner /> : "Load More"}
                  </AppButton>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      <UploadDepositModal
        show={uploadModal.show}
        callback={uploadModalCallback}
        data={uploadModal.data}
      />
      <DepositOrdersModal
        show={depositOrdersModal.show}
        callback={depositOrdersModalCallback}
        data={depositOrdersModal.data}
      />
    </>
  );
};

export default CashDepositList;
