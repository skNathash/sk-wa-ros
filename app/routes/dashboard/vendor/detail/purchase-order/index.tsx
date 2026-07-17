import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type {
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { getData, getCount, prepareFilterParams } from "./helper";
import useScreenView from "~/hooks/useScreenView";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Filter from "./components/Filter";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";

interface FilterState {
  search?: string;
  dateRange?: Date[] | null;
  status?: string;
  feature?: string;
  vendorId?: string;
}

const defaultFilter: FilterState = {
  search: "",
  dateRange: null,
  status: "",
  feature: "purchase",
  vendorId: "",
};

const defaultSort: SortProps = {
  key: "createdAt",
  value: "desc",
};

const VendorPurchaseOrderPage = () => {
  const { id } = useParams();
  const vendorId = id || "";
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);

  const [orders, setOrders] = useState<any[]>([]);
  const [view, setView] = useState<ViewToggleType>("list");
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterRef = useRef<FilterState>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const sortRef = useRef<SortProps>({ ...defaultSort });

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setOrders([]);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const ordersData = await getData(params);
      setOrders(ordersData);
      setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more data for infinite scroll
  const loadMore = useCallback(
    async (event?: any) => {
      if (loadingMore || !hasMoreData) {
        if (event?.target) event.target.complete();
        return;
      }
      setLoadingMore(true);
      try {
        paginationRef.current = {
          ...paginationRef.current,
          activePage: paginationRef.current.activePage + 1,
        };
        const params = prepareFilterParams(
          filterRef.current,
          paginationRef.current,
          sortRef.current
        );
        const ordersData = await getData(params);
        setOrders((prev) => [...prev, ...ordersData]);
        setHasMoreData(ordersData.length >= paginationRef.current.rowsPerPage);
      } finally {
        setLoadingMore(false);
        if (event?.target) event.target.complete();
      }
    },
    [loadingMore, hasMoreData]
  );

  useEffect(() => {
    filterRef.current = { ...defaultFilter, vendorId };
    applyFilter();
  }, [applyFilter, vendorId]);

  const sortCb = (data: SortProps) => {
    sortRef.current = data;
    applyFilter();
  };

  const filterCb = (data: { formData: any; action: string }) => {
    if (data.action === "apply") {
      filterRef.current = { ...filterRef.current, ...data.formData };
    }
    applyFilter();
  };

  const callback = (a: { action: string; data: any }) => {
    if (a.action === "view") {
      appNav.to(`/dashboard/purchase-order/view/${a.data._id}`);
    }
  };

  return (
    <div>
      <Filter callback={filterCb} />
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div>
          <PaginationSummary
            loadingTotalRecords={loading}
            paginationConfig={paginationRef.current}
            fwSize="sm"
            loadedCount={orders.length}
          />
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>
      {isMobile || view === "card" ? (
        <MobileView
          data={orders}
          callback={callback}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={orders.length}
          showLoadMore={hasMoreData}
        />
      ) : (
        <>
          <AppCard noPadding>
            <DesktopView
              data={orders}
              callback={callback}
              sortKey={sortRef.current.key}
              sortValue={sortRef.current.value}
              sortCb={sortCb}
              loading={loading}
              loadedCount={orders.length}
              totalCount={paginationRef.current.totalRecords}
              loadingMore={loadingMore}
              loadMore={loadMore}
              showLoadMore={hasMoreData}
            />
          </AppCard>
        </>
      )}
    </div>
  );
};

export default VendorPurchaseOrderPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Purchase Order"),
    },
  ];
}
