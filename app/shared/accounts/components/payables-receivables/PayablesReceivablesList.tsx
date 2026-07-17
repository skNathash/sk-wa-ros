import { CreditCard } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import type {
  PaginationState,
  PayableReceivableEntityType,
  SortValue,
} from "~/types/CommonTypes";
import Filter from "./components/Filter";
import Item from "./components/Item";
import { getCount, getData, prepareParams } from "./helper";
import RecordPaymentViewModal from "../../modals/record-payment/view/RecordPaymentViewModal";

const defaultFilter = {};

const PayablesReceivablesList = ({
  entityId,
  entityType,
  paymentType,
}: {
  entityId: string;
  entityType: PayableReceivableEntityType;
  paymentType: "receivePayment" | "makePayout";
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  const [paymentViewModal, setPaymentViewModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    ...defaultFilter,
  });

  const sortRef = useRef<{ key: string; value: SortValue }>({
    key: "date",
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
        filterRef.current,
        paginationRef.current,
        sortRef.current as any
      );
      const result = await getData(params);
      setData(result || []);
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

  useEffect(() => {
    if (entityId) {
      filterRef.current = {
        ...filterRef.current,
        customerId: entityId,
      };
      applyFilter();
    }
  }, [entityId, applyFilter]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current as any
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(result?.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleRecordPaymentModal = (data: { action: string; data?: any }) => {
    setShowRecordPaymentModal(false);
    if (data.action === "success") {
      applyFilter();
    }
  };

  const handleFilter = (data: { formData: any }) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  };

  const handlePaymentView = (data: { action: string; data?: any }) => {
    if (data.action === "viewPayment") {
      setPaymentViewModal({
        show: true,
        data: data.data,
      });
    }
  };

  const handleRecordPaymentViewModalCallback = (data: {
    action: string;
    data?: any;
  }) => {
    setPaymentViewModal({
      show: false,
      data: null,
    });
  };

  return (
    <>
      <AppCard>
        <Filter callback={handleFilter} />
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>
          <div>
            <AppButton
              color="success"
              onClick={() => setShowRecordPaymentModal(true)}
              size="small"
            >
              <CreditCard size={16} />
              Record Payment
            </AppButton>
          </div>
        </div>

        {loading ? (
          <div className="tw:text-center tw:mt-4">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && data.length === 0 ? <NoData /> : null}

        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
          {data.map((item) => (
            <Item key={item._id} data={item} callback={handlePaymentView} />
          ))}
        </div>

        {hasMoreData && !loading && (
          <div className="tw:text-center tw:mt-4">
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
            />
          </div>
        )}
      </AppCard>
      <RecordPaymentModal
        show={showRecordPaymentModal}
        callback={handleRecordPaymentModal}
        entityId={entityId || ""}
        entityType={entityType}
        paymentType={paymentType}
        hideTabs={true}
      />

      <RecordPaymentViewModal
        show={paymentViewModal.show}
        callback={handleRecordPaymentViewModalCallback}
        transactionId={paymentViewModal.data?.transactionId}
      />
    </>
  );
};

export default PayablesReceivablesList;
