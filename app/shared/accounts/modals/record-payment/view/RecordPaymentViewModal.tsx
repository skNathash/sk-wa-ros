import clsx from "clsx";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";

const cleanedTransactionReference = (ref?: string | null) => {
  if (!ref) return "--";
  return ref.replace(/(_DR|_CR)$/, "");
};

const RecordPaymentViewModal = ({
  show,
  callback,
  transactionId,
}: {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
  transactionId: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (show) {
      const fetchPaymentDetails = async () => {
        setLoading(true);
        const response = await AccountService.getFranchisePaymentTransactions({
          filter: {
            transactionId: cleanedTransactionReference(transactionId),
          },
        });
        if (!mounted) return;
        setPaymentDetails(response?.data?.data?.[0] || null);
        setLoading(false);
      };
      fetchPaymentDetails();
    }
    return () => {
      mounted = false;
    };
  }, [show, transactionId]);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(null), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold tw:flex tw:items-center tw:gap-2">
          <FileText className="tw:w-5 tw:h-5 tw:text-gray-700" />
          Payment Details
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:!px-0">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && paymentDetails ? (
          <>
            <div
              className={clsx("tw:text-center tw:py-6 tw:rounded-lg tw:mb-4", {
                "tw:bg-green-100": paymentDetails?.paymentType === "credit",
                "tw:bg-red-100": paymentDetails?.paymentType === "debit",
              })}
            >
              <Amount
                value={paymentDetails?.amount}
                decimalPlaces={2}
                className="tw:text-4xl tw:font-bold"
              />
              <div className="tw:mt-2 tw:text-sm tw:font-semibold">
                {paymentDetails?.paymentType === "credit"
                  ? "Amount Received from"
                  : "Amount Paid to"}{" "}
                &quot;{paymentDetails?.counterPartyName} (
                <span className="tw:uppercase tw:text-xs">
                  {paymentDetails?.counterPartyType})
                </span>
                &quot;
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <div className="tw:col-span-2">
                <KeyValue label="Remarks" size="sm">
                  {paymentDetails?.description}
                </KeyValue>
              </div>
              <Divider className="tw:col-span-2 tw:!my-1" />

              <KeyValue label="Created At" size="sm">
                <DateFormat value={paymentDetails?.dateTime} />
              </KeyValue>

              <KeyValue label="Payment Method" size="sm">
                <span className="tw:uppercase">
                  {paymentDetails?.paymentMethod || "--"}
                </span>
              </KeyValue>

              <KeyValue label="Transaction Reference" size="sm">
                {cleanedTransactionReference(
                  paymentDetails?.transactionReference
                )}
              </KeyValue>
            </div>
          </>
        ) : null}

        {!loading && !paymentDetails ? <NoData /> : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default RecordPaymentViewModal;
