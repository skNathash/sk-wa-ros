import { CreditCard, FileDown, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import Rbac from "~/components/core/rbac/Rbac";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AccountService from "~/services/AccountService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import RecordPaymentSuccessModal from "~/shared/accounts/modals/record-payment/success/RecordPaymentSuccessModal";
import RecordPaymentViewModal from "~/shared/accounts/modals/record-payment/view/RecordPaymentViewModal";
import ShareService from "~/services/ShareService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { useVendorCtx } from "../layout/layout";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
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
  return PageAccessService.canAccessPage(["VENDOR.VIEW-STATEMENT"]);
}

const rbacRoles = {
  recordPayment: ["ACCOUNTS.RECORD-PAYMENT"],
};

const defaultSort: SortProps = {
  key: "paymentDate",
  value: "desc",
};

const VendorStatementPage = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const { id } = useParams();
  const vendorId = id || "";
  const { vendorType, vendorName, vendorPhone } = useVendorCtx();

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([...defaultSummary]);
  const [statementSummary, setStatementSummary] = useState(
    defaultStatementSummary,
  );

  const [loadingData, setLoadingData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [busyloader, setBusyloader] = useState({ show: false, message: "" });

  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [recordPaymentSuccessModal, setRecordPaymentSuccessModal] = useState({
    show: false,
    data: {
      name: "",
      isPayout: false,
      amount: 0,
    },
  });

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

  const applyFilter = useCallback(async () => {
    setLoadingData(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    loadSummary();

    try {
      const params = prepareParams(
        { ...formMethods.getValues(), vendorId },
        paginationRef.current,
        defaultSort,
      );

      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoadingData(false);
    }
  }, [formMethods, vendorId]);

  const handleDownload = useCallback(
    async (type: string) => {
      setBusyloader({ show: true, message: "Downloading data..." });
      try {
        const { page, limit, ...params } = prepareParams(
          { ...formMethods.getValues(), vendorId },
          paginationRef.current,
          defaultSort,
        );
        const result = await getData({ ...params, outputType: type }, true);

        const fileName = result?.data?.fileName;
        if (fileName) {
          CommonService.windowOpenHandler(
            AccountService.downloadStatementUrl(fileName),
            () => {},
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
    },
    [formMethods, vendorId, appToast],
  );

  // Same endpoint as the download, with outputType=downloadUrl: the response
  // carries a hosted "viewUrl" which is shared on WhatsApp, addressed to the
  // vendor's number when one is on record.
  const handleSendWhatsApp = useCallback(async () => {
    setBusyloader({ show: true, message: "Preparing statement..." });
    try {
      const { page, limit, ...params } = prepareParams(
        { ...formMethods.getValues(), vendorId },
        paginationRef.current,
        defaultSort,
      );
      const result = await getData(
        { ...params, outputType: "downloadUrl" },
        true,
      );

      const statementUrl = result?.data?.viewUrl;
      if (statementUrl) {
        // The link goes in the message itself: shareInWeb's absoluteUrl path
        // encodes the URL and then encodes the whole text again, which lands
        // in WhatsApp as an unclickable percent-escaped string.
        ShareService.shareInWeb({
          msg: `Hi${vendorName ? ` ${vendorName}` : ""}, please find the account statement here: ${statementUrl}`,
          phone: vendorPhone,
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
  }, [formMethods, vendorId, vendorName, vendorPhone, appToast]);

  const loadSummary = useCallback(async () => {
    setSummary(
      defaultSummary.map((item) => ({
        ...item,
        loading: true,
      })),
    );
    setStatementSummary({ ...defaultStatementSummary, loading: true });
    try {
      const [response, monthTotals] = await Promise.all([
        getAccountsSummary(vendorId),
        getStatementSummary(vendorId),
      ]);

      const closing = response.closingBalance;
      setStatementSummary({
        // Derived: statement balanceBefore/After track the global account
        // running balance, not this vendor's khata, so walk back from the
        // per-vendor closing using the month-to-date movement.
        opening: closing - monthTotals.purchases + monthTotals.paid,
        closing,
        purchases: monthTotals.purchases,
        paid: monthTotals.paid,
        notes: 0, // static placeholder until the notes data point is defined
        periodStart: monthTotals.periodStart,
        loading: false,
      });
      setSummary(
        defaultSummary.map((item) => ({
          ...item,
          value: response[item.apiKey as keyof typeof response] || 0,
          loading: false,
        })),
      );
    } catch (e) {
      setStatementSummary({ ...defaultStatementSummary, loading: false });
      setSummary(
        defaultSummary.map((item) => ({
          ...item,
          loading: false,
        })),
      );
    }
  }, [vendorId]);

  // Re-run the filter whenever the Filter component reports a change (search,
  // source-type chips, or the advanced filter modal). The form context is
  // shared with the Filter, so applyFilter reads the latest values directly.
  const handleFilterCallback = useCallback(
    (_args: { action: string; data: FilterFormData }) => {
      applyFilter();
    },
    [applyFilter],
  );

  // Initial load and vendor switch.
  useEffect(() => {
    applyFilter();
  }, [vendorId, applyFilter]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...formMethods.getValues(), vendorId },
        paginationRef.current,
        defaultSort,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, formMethods, vendorId]);

  const handleItemCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "viewPayment" && data.data.sourceType === "PAYMENT") {
        setPaymentViewModal({
          show: true,
          data: data.data,
        });
      }
    },
    [],
  );

  const handleRecordPaymentViewModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      setPaymentViewModal({
        show: false,
        data: null,
      });
    },
    [],
  );

  // Record Payment — moved here from the vendor info card; on success the
  // statement is refreshed so the new payment shows up immediately.
  const handleRecordPaymentModalCallback = (args: {
    action: string;
    data?: any;
  }) => {
    const { action, data } = args;

    setShowRecordPayment(false);
    if (action === "success") {
      setRecordPaymentSuccessModal({
        show: true,
        data: {
          name: data.name,
          isPayout: data.isPayout,
          amount: data.amount,
        },
      });
      applyFilter();
    }
  };

  const handleRecordPaymentSuccessModalCallback = () => {
    setRecordPaymentSuccessModal({
      show: false,
      data: {
        name: "",
        isPayout: false,
        amount: 0,
      },
    });
  };

  return (
    <>
      <div className="tw:space-y-4">
        <FormProvider {...formMethods}>
          <Filter callback={handleFilterCallback} />
        </FormProvider>

        <Summary
          summary={summary}
          statementSummary={statementSummary}
          recordPaymentAction={
            vendorType !== "OWN" ? (
              <Rbac roles={rbacRoles.recordPayment}>
                <AppButton
                  color="primary"
                  fill="outline"
                  size="small"
                  onClick={() => setShowRecordPayment(true)}
                >
                  <CreditCard className="tw:size-4" />
                  {t("recordPayment")}
                </AppButton>
              </Rbac>
            ) : undefined
          }
        />

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:min-w-0">
            <PaginationSummary
              loadingTotalRecords={loadingData}
              paginationConfig={paginationRef.current}
              fwSize="sm"
              loadedCount={data.length}
            />
          </div>
        </div>

        {isMobile ? (
          <>
            <MobileView
              data={data}
              loading={loadingData}
              callback={handleItemCallback}
            />
            {hasMoreData && !loadingData && (
              <div className="tw:text-center tw:mt-4 tw:pb-4">
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
              loading={loadingData}
              callback={handleItemCallback}
            />
            {hasMoreData && !loadingData && (
              <div className="tw:text-center tw:mt-4 tw:pb-4">
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

        <RecordPaymentViewModal
          show={paymentViewModal.show}
          callback={handleRecordPaymentViewModalCallback}
          transactionId={paymentViewModal.data?.transactionId}
        />

        {/* Record Payment Modal */}
        <RecordPaymentModal
          show={showRecordPayment}
          callback={handleRecordPaymentModalCallback}
          entityId={vendorId}
          entityType={"vendor"}
          hideTabs={true}
          paymentType="makePayout"
        />

        <RecordPaymentSuccessModal
          show={recordPaymentSuccessModal.show}
          callback={handleRecordPaymentSuccessModalCallback}
          counterpartyName={recordPaymentSuccessModal.data?.name}
          isPayout={recordPaymentSuccessModal.data?.isPayout}
          amount={recordPaymentSuccessModal.data?.amount}
        />

        <BusyLoader show={busyloader.show} message={busyloader.message} />
      </div>

      <footer className="app-footer app-footer-fixed tw:flex tw:justify-end tw:gap-2 tw:px-4 tw:py-3">
        <AppButton
          color="light"
          fill="outline"
          size="small"
          onClick={() => handleDownload("download")}
        >
          <FileDown className="tw:size-4" />
          {t("downloadPdf", { defaultValue: "Download PDF" })}
        </AppButton>
        <AppButton
          color="primary"
          size="small"
          onClick={handleSendWhatsApp}
        >
          <MessageCircle className="tw:size-4" />
          {t("sendViaWhatsApp", { defaultValue: "Send via WhatsApp" })}
        </AppButton>
      </footer>
    </>
  );
};

export default VendorStatementPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Statement"),
    },
  ];
}
