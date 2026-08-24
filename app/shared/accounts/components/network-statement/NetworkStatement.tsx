import { useCallback, useEffect, useRef, useState } from "react";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import AccountService from "~/services/AccountService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import ShareService from "~/services/ShareService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Theme2MobileView from "./components/Theme2MobileView";
import StatementSummary from "./components/StatementSummary";
import Summary from "./components/Summary";
import {
  defaultFilter,
  defaultStatementSummary,
  defaultSummary,
  getAccountsSummary,
  getCount,
  getData,
  getStatementSummary,
  prepareParams,
  type FilterFormData,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-B2B-STATEMENT"]);
}

type Props = {
  id: string;
  title: string;
  /** Counterparty display name for the statement header / WhatsApp greeting. */
  partyName?: string;
  /** Counterparty mobile used when sharing the statement on WhatsApp. */
  partyPhone?: string;
};

const NetworkStatement = ({ id, title, partyName, partyPhone }: Props) => {
  const { isMobile } = useScreenView();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";
  const appToast = useAppToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [summary, setSummary] = useState(defaultSummary);
  const [statementSummary, setStatementSummary] = useState(
    defaultStatementSummary
  );
  const [totalCount, setTotalCount] = useState(0);
  const [busyloader, setBusyloader] = useState({ show: false, message: "" });

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

  const filterRef = useRef<FilterFormData & { retailerId?: string }>({
    ...defaultFilter,
  });

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
      setTotalCount(totalRecords);
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

  const handleFilter = (data: { formData: FilterFormData }) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  };

  const handleDownload = useCallback(async () => {
    setBusyloader({ show: true, message: "Downloading data..." });
    try {
      const { page, limit, ...params } = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current as any
      );
      const result = await getData({ ...params, outputType: "download" }, true);
      const fileName = result?.data?.fileName;
      if (fileName) {
        CommonService.windowOpenHandler(
          AccountService.downloadStatementUrl(fileName),
          () => {}
        );
      } else {
        appToast.show({
          msg: "Failed to download data",
          color: "danger",
        });
      }
    } catch (e) {
      appToast.show({
        msg: "Failed to download data",
        color: "danger",
      });
    } finally {
      setBusyloader({ show: false, message: "" });
    }
  }, [appToast]);

  // Builds a hosted statement link (outputType=downloadUrl) and opens WhatsApp
  // with the link, addressed to the counterparty when a phone is available.
  const handleSendWhatsApp = useCallback(async () => {
    setBusyloader({ show: true, message: "Preparing statement..." });
    try {
      const { page, limit, ...params } = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current as any
      );
      const result = await getData(
        { ...params, outputType: "downloadUrl" },
        true
      );

      const statementUrl = result?.data?.viewUrl;

      if (statementUrl) {
        // The link goes in the message itself: shareInWeb's absoluteUrl path
        // encodes the URL and then encodes the whole text again, which lands
        // in WhatsApp as an unclickable percent-escaped string.
        ShareService.shareInWeb({
          msg: `Hi${partyName ? ` ${partyName}` : ""}, please find the account statement here: ${statementUrl}`,
          phone: partyPhone,
        });
      } else {
        appToast.show({
          msg: "Failed to prepare statement",
          color: "danger",
        });
      }
    } catch (e) {
      appToast.show({
        msg: "Failed to prepare statement",
        color: "danger",
      });
    } finally {
      setBusyloader({ show: false, message: "" });
    }
  }, [appToast, partyName, partyPhone]);

  const loadSummary = useCallback(async () => {
    if (!id) return;
    try {
      const [summaryData, monthTotals] = await Promise.all([
        getAccountsSummary(id),
        getStatementSummary(id),
      ]);

      const closing = summaryData.closingBalance;
      setStatementSummary({
        // Derived: statement balanceBefore/After track the global account
        // running balance, not this counterparty's khata, so walk back from
        // the per-retailer closing using the month-to-date movement.
        opening: closing - monthTotals.purchases + monthTotals.paid,
        closing,
        purchases: monthTotals.purchases,
        paid: monthTotals.paid,
        notes: 0, // static placeholder until the notes data point is defined
        paylaterUsed: monthTotals.paylaterUsed ?? 0,
        periodStart: monthTotals.periodStart,
        loading: false,
      });
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
      setStatementSummary({ ...defaultStatementSummary, loading: false });
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
          {isTheme2 ? (
            <StatementSummary
              summary={statementSummary}
              partyName={partyName}
            />
          ) : (
            <Summary summary={summary} />
          )}
          <Filter
            callback={handleFilter}
            totalCount={totalCount}
            onDownload={handleDownload}
            onSendWhatsApp={handleSendWhatsApp}
          />
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
            className="tw:mb-4"
          />
          {isMobile ? (
            <>
              {isTheme2 ? (
                <Theme2MobileView
                  data={data}
                  loading={loading}
                  callback={handleItemCallback}
                />
              ) : (
                <MobileView
                  data={data}
                  loading={loading}
                  callback={handleItemCallback}
                />
              )}
              {hasMoreData && !loading && (
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
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
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
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
      <BusyLoader show={busyloader.show} message={busyloader.message} />
    </>
  );
};

export default NetworkStatement;
