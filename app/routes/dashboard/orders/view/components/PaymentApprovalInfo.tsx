import { AlertTriangle, CheckCircle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import { useState } from "react";
import PaymentVerifyModal from "../modals/PaymentVerifyModal";

type Payment = {
  type: string;
  paidVia: string;
  proof: string[];
  amount: number;
  paidAmount: number;
  change: number;
  approvalStatus: string;
};

const PaymentApprovalInfo = ({
  payments,
  orderAmount,
  orderId,
  groupTransactionId,
  linkedOrder,
  currentOrderRefNo,
  isCurrentOrderReserve,
  callback,
}: {
  payments: Payment[];
  orderAmount: number;
  orderId: string;
  groupTransactionId?: string;
  linkedOrder?: any;
  currentOrderRefNo?: string;
  isCurrentOrderReserve?: boolean;
  callback: (params: { action: string; data?: any }) => void;
}) => {
  const [verifyModal, setVerifyModal] = useState({
    show: false,
    data: null,
  });

  const handlePaymentVerifyModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    setVerifyModal({ show: false, data: null });
    if (params.action === "approved" || params.action === "rejected") {
      callback(params);
    }
  };

  return (
    <div className="tw:sticky tw:top-20 tw:z-10">
      <InfoBlock
        size="sm"
        className="tw:mb-4 tw:border tw:border-yellow-200 tw:shadow-none"
        bordered
        variant="warning"
      >
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex tw:items-start tw:gap-2 tw:flex-1">
            <div className="tw:rounded-full tw:bg-yellow-500 tw:text-white tw:p-1.5 tw:flex-shrink-0 tw:mt-0.5">
              <AlertTriangle size={16} aria-hidden />
            </div>
            <div className="tw:min-w-0">
              <h3 className="tw:text-sm tw:font-semibold tw:text-yellow-800 tw:leading-5">
                Check payment first
              </h3>
              <p className="tw:text-xs tw:text-yellow-700 tw:leading-5">
                Verify the full order payment before you approve.
              </p>
            </div>
          </div>

          <AppButton
            color="primary"
            size="small"
            onClick={() => setVerifyModal({ show: true, data: null })}
            className="tw:w-full tw:sm:w-auto tw:flex-shrink-0 tw:px-3"
          >
            <CheckCircle size={15} aria-hidden />
            Verify Payment
          </AppButton>
        </div>
      </InfoBlock>

      <PaymentVerifyModal
        show={verifyModal.show}
        callback={handlePaymentVerifyModalCallback}
        payments={payments}
        orderAmount={orderAmount}
        orderId={orderId}
        groupTransactionId={groupTransactionId}
        linkedOrder={linkedOrder}
        currentOrderRefNo={currentOrderRefNo}
        isCurrentOrderReserve={isCurrentOrderReserve}
      />
    </div>
  );
};

export default PaymentApprovalInfo;
