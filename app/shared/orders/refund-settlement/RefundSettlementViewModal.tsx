import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import OmsService from "~/services/OmsService";

interface Props {
  show: boolean;
  refundSettlementId?: string | number;
  callback: (data: { action: string; data?: any }) => void;
}

interface PaymentMode {
  type?: string;
  paidVia?: string;
  refNo?: string;
  proof?: string[];
  amount?: number;
}

interface RefundSettlementData {
  _id?: string;
  status?: string;
  amount?: number;
  paymentMode?: PaymentMode[];
  paymentRemarks?: string;
  orderRefNo?: string;
  paidAt?: string;
  createdAt?: string;
  submittedAt?: string;
}

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <div className="tw:text-xs tw:text-gray-500">{label}</div>
    <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:break-words">
      {value || "-"}
    </div>
  </div>
);

const RefundSettlementViewModal: React.FC<Props> = ({
  show,
  refundSettlementId,
  callback,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RefundSettlementData | null>(null);

  useEffect(() => {
    if (!show || !refundSettlementId) return;

    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp: any = await OmsService.getRefundSettlement(
          String(refundSettlementId),
        );
        const fetched = resp?.data?.data || resp?.data || null;
        if (mounted) setData(fetched);
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [show, refundSettlementId]);

  const handleClose = () => {
    setData(null);
    callback({ action: "close" });
  };

  const handleViewStatement = () => {
    if (!data?.orderRefNo) return;
    const params = new URLSearchParams({ search: data.orderRefNo });
    if (data.submittedAt) {
      const date = format(new Date(data.submittedAt), "yyyy-MM-dd");
      params.set("dateFrom", date);
      params.set("dateTo", date);
    }
    handleClose();
    navigate(`/dashboard/accounts/overall-statement?${params.toString()}`);
  };

  const payment = data?.paymentMode?.[0];
  const proofs: string[] = payment?.proof || [];

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        Refund Settlement Details
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-32">
            <AppSpinner />
          </div>
        ) : !data ? (
          <div className="tw:text-center tw:py-4 tw:text-sm tw:text-gray-500">
            No refund settlement data found.
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-4">
            <div className="tw:p-3 tw:bg-red-50 tw:border tw:border-red-200 tw:rounded">
              <div className="tw:text-xs tw:text-gray-700 tw:mb-1">
                Refund Amount
              </div>
              <div className="tw:text-2xl tw:font-bold tw:text-red-700">
                <Amount value={data.amount || payment?.amount || 0} />
              </div>
              {data.status ? (
                <div className="tw:text-xs tw:text-gray-600 tw:mt-2">
                  Status:{" "}
                  <span className="tw:font-semibold">{data.status}</span>
                </div>
              ) : null}
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-3">
              <Field
                label="Refunded Date"
                value={
                  data.createdAt ? (
                    <DateFormat
                      value={data.createdAt}
                      formatStr="dd MMM yyyy, hh:mm a"
                    />
                  ) : (
                    "-"
                  )
                }
              />
              <Field label="Payment Type" value={payment?.type} />
              <Field label="Paid Via" value={payment?.paidVia} />
              <Field label="Payment Reference No." value={payment?.refNo} />
              <Field
                label="Paid Amount"
                value={
                  payment?.amount != null ? (
                    <Amount value={payment.amount} />
                  ) : (
                    "-"
                  )
                }
              />
            </div>

            <div>
              <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                Payment Proof
              </div>
              {proofs.length ? (
                <div className="tw:flex tw:flex-wrap tw:gap-2">
                  {proofs.map((id) => (
                    <div
                      key={id}
                      className="tw:border tw:border-gray-300 tw:rounded-md tw:p-2 tw:w-28"
                    >
                      <ImgRender
                        assetId={id}
                        alt="Proof"
                        className="tw:w-20 tw:h-20 tw:object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw:text-sm tw:text-gray-500">
                  No proof uploaded
                </div>
              )}
            </div>

            <Field label="Remarks" value={data.paymentRemarks} />
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:justify-end tw:gap-2 tw:px-4 tw:pb-3">
          <AppButton color="dark" fill="outline" onClick={handleClose}>
            Close
          </AppButton>
          {data?.status === "Submitted" && data?.orderRefNo ? (
            <AppButton color="primary" onClick={handleViewStatement}>
              <ExternalLink />
              View Statement
            </AppButton>
          ) : null}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RefundSettlementViewModal;
