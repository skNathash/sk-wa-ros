import { ArrowRight, FileDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import RecordPaymentSuccessModal from "~/shared/accounts/modals/record-payment/success/RecordPaymentSuccessModal";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import Alerts from "./components/Alerts";
import PaymentPending from "./components/PaymentPending";
// import PayLater from "./components/PayLater";
import {
  fetchMoneySummary,
  fetchMoneySummaryPdfUrl,
  // payLater,
  type MoneySummary,
} from "./helper";

const rbacRoles = {
  recordPayment: ["ACCOUNTS.RECORD-PAYMENT"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

/**
 * Vendor Money tab — a single WhatsApp-styled view of everything money-related
 * for a vendor: action alerts, payables owed to the vendor, and the paylater
 * credit the vendor extends back. Driven by the purchase money summary API
 * (see ./helper); only the paylater card is static until the API covers it.
 */
const VendorMoneyPage = () => {
  const { id } = useParams();
  const [summary, setSummary] = useState<MoneySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [recordPaymentSuccessModal, setRecordPaymentSuccessModal] = useState({
    show: false,
    data: {
      name: "",
      isPayout: false,
      amount: 0,
    },
  });

  const loadSummary = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetchMoneySummary(id)
      .then((data) => setSummary(data))
      .finally(() => setLoading(false));
  }, [id]);

  // Record Payment — opened from the footer "Pay all"; on success the money
  // summary is refreshed so dues reflect the new payment immediately.
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
      loadSummary();
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

  const handleDownloadPdf = async () => {
    if (!id || downloading) return;

    setDownloading(true);
    const url = await fetchMoneySummaryPdfUrl(id);
    if (url) CommonService.windowOpenHandler(url, () => {});
    setDownloading(false);
  };

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  if (loading) return null;

  // Nothing owed and nothing to action — the whole tab would render blank, so
  // show the shared empty state instead.
  const isEmpty =
    !summary ||
    (!summary.alerts.items.length && summary.paymentPending.totalDue <= 0);

  if (isEmpty) {
    return (
      <NoData
        title="No money activity"
        description="This vendor has no pending dues or alerts right now."
      />
    );
  }

  return (
    <>
      <div className="tw:space-y-4">
        <Alerts alerts={summary.alerts} />

        {summary.paymentPending.totalDue > 0 && (
          <PaymentPending
            pending={summary.paymentPending}
            invoices={summary.invoices}
          />
        )}

        {/* <PayLater info={payLater} /> */}
      </div>

      {summary.totals.totalDue > 0 && (
      <footer className="app-footer app-footer-fixed tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div className="tw:flex tw:flex-col">
          <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
            Total due
          </span>
          <span className="tw:text-lg tw:font-bold tw:text-slate-800">
            <Amount value={summary.totals.totalDue} decimalPlaces={0} />
          </span>
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          {summary.actions.exportPdf.enabled && (
            <AppButton
              color="light"
              fill="outline"
              size="small"
              disabled={downloading}
              onClick={handleDownloadPdf}
            >
              <FileDown className="tw:size-4" />
              {summary.actions.exportPdf.label}
            </AppButton>
          )}
          {summary.actions.payAll.enabled && (
            <Rbac roles={rbacRoles.recordPayment}>
              <AppButton
                color="primary"
                size="small"
                onClick={() => setShowRecordPayment(true)}
              >
                Pay <Amount value={summary.actions.payAll.amount} decimalPlaces={0} />
                <ArrowRight className="tw:size-4" />
              </AppButton>
            </Rbac>
          )}
        </div>
      </footer>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        show={showRecordPayment}
        callback={handleRecordPaymentModalCallback}
        entityId={id || ""}
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
    </>
  );
};

export default VendorMoneyPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Money"),
    },
  ];
}
