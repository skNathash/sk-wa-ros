import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import PageAccessService from "~/services/PageAccessService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";
import Summary from "./components/Summary";
import {
  defaultSummary,
  getAccountsSummary,
  getCount,
  getData,
  prepareParams,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-B2B-STATEMENT"]);
}

const NetworkStatement = ({ id, title }: { id: string; title: string }) => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [summary, setSummary] = useState(defaultSummary);

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

  const filterRef = useRef<any>({});

  const sortRef = useRef<{ key: string; value: SortProps["value"] }>({
    key: "paymentDate",
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

  const handleFilter = (data: { formData: any }) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  };

  const loadSummary = useCallback(async () => {
    if (!id) return;
    try {
      const summaryData = await getAccountsSummary(id);
      setSummary([
        {
          label: "Total Debits",
          value: summaryData.debits,
          apiKey: "debits",
          loading: false,
          color: "tw:text-red-600",
        },
        {
          label: "Total Credits",
          value: summaryData.credits,
          apiKey: "credits",
          loading: false,
          color: "tw:text-green-600",
        },
        {
          label: "Current Balance",
          value: summaryData.closingBalance,
          apiKey: "closingBalance",
          loading: false,
          color: "tw:text-red-600",
        },
      ]);
    } catch (e) {
      // handle error
    }
  }, [id]);

  const handleItemCallback = (payload: { action: string; data?: any }) => {
    if (
      payload.action === "viewPayment" &&
      payload.data?.sourceType === "PAYMENT"
    ) {
      setPaymentViewModal({ show: true, data: payload.data });
    }
  };

  const handleRecordPaymentViewModalCallback = (p: {
    action: string;
    data?: any;
  }) => {
    setPaymentViewModal({ show: false, data: null });
  };

  useEffect(() => {
    if (id) {
      filterRef.current = {
        ...filterRef.current,
        retailerId: id,
      };
      applyFilter();
      loadSummary();
    }
  }, [id, applyFilter, loadSummary]);

  return (
    <>
      {id ? (
        <>
          <Summary summary={summary} />
          <Filter callback={handleFilter} />
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
            className="tw:mb-4"
          />
          {isMobile ? (
            <>
              <MobileView
                data={data}
                loading={loading}
                callback={handleItemCallback}
              />
              {hasMoreData && !loading && (
                <div className="tw:text-center tw:mt-4">
                  <AppButton
                    onClick={loadMore}
                    disabled={loadingMore}
                    size="small"
                    color="light"
                    fill="outline"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </AppButton>
                </div>
              )}
            </>
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                callback={handleItemCallback}
              />
              {hasMoreData && !loading && (
                <div className="tw:text-center tw:mt-4">
                  <AppButton
                    onClick={loadMore}
                    disabled={loadingMore}
                    size="small"
                    color="light"
                    fill="outline"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </AppButton>
                </div>
              )}
            </AppCard>
          )}
        </>
      ) : null}
      <RecordPaymentViewModal
        show={paymentViewModal.show}
        callback={handleRecordPaymentViewModalCallback}
        transactionId={paymentViewModal.data?.transactionId}
      />
    </>
  );
};

export default NetworkStatement;
