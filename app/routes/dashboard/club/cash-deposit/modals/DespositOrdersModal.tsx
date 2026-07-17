import { useEffect, useRef, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import PosService from "~/services/PosService";
import type { PaginationState } from "~/types/CommonTypes";
import DepositOrdersTable from "./DepositOrdersTable";

type Props = {
  show: boolean;
  data: any;
  callback: (payload: { action: string; data?: any }) => void;
};

const DepositOrdersModal = ({ show, data, callback }: Props) => {
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 50,
  });

  useEffect(() => {
    if (show) {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: 1,
      };
      setOrders([]);
      setHasMore(true);
      setLoading(true);
      applyFilter();
    }
    // eslint-disable-next-line
  }, [show]);

  const prepareParams = (pagination = paginationRef.current) => {
    const params: any = {
      filter: {
        cashDepositId: data?._id,
      },
      page: pagination.activePage,
      count: pagination.rowsPerPage,
      sort: { createdAt: -1 },
    };
    return params;
  };

  const applyFilter = async () => {
    setLoading(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };
    try {
      const params = prepareParams(paginationRef.current);
      const res = await getData(params);
      setOrders(res.data || []);
      setHasMore((res.data?.length || 0) === paginationRef.current.rowsPerPage);
    } catch (e) {
      appToast.show({ msg: "Failed to fetch orders", color: "danger" });
    }
    setLoading(false);
  };

  const loadMore = async (event?: any) => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(paginationRef.current);
      const res = await getData(params);
      setOrders((prev) => [...prev, ...(res.data || [])]);
      setHasMore((res.data?.length || 0) === paginationRef.current.rowsPerPage);
      if (event && event.target) event.target.complete();
    } catch (e) {
      appToast.show({ msg: "Failed to load more orders", color: "danger" });
      if (event && event.target) event.target.complete();
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOrderClick = (order: any) => {
    callback({ action: "redirect", data: order });
  };

  // Infinite scroll UI logic can be added here if needed, e.g. IonInfiniteScroll

  const onClose = () => {
    callback({ action: "close" });
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="offcanvas-modal">
        <AppModal.Content>
          <AppModal.Title noShadow onClose={onClose}>
            Deposit Orders
          </AppModal.Title>
          <AppModal.Content className="modal-bg ion-padding">
            <DepositOrdersTable
              orders={orders}
              hasMore={hasMore}
              onLoadMore={loadMore}
              loading={loading}
              loadingMore={loadingMore}
              onOrderClick={handleOrderClick}
            />
          </AppModal.Content>
        </AppModal.Content>
      </AppModal>
    </>
  );
};

const getData = async (params: Record<string, any>) => {
  return await PosService.getCashCollectFromDelivery(params);
};

export default DepositOrdersModal;
