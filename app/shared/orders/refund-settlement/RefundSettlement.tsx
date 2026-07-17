import { AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import RefundSettlementModal from "./RefundSettlementModal";

interface Settlement {
  id?: string | number;
  refundSettlementId?: string;
  refundSettlementRefId?: string;
  _id?: string;
  status?: string;
  amount?: number;
}

const getSettlementId = (s: Settlement) => s.refundSettlementId ?? null;

interface Props {
  orderId: string | number;
  refundSettlements?: Settlement[];
  callback: (data: { action: string; data?: any }) => void;
  className?: string;
}

const RefundSettlement: React.FC<Props> = ({
  orderId,
  refundSettlements,
  callback,
  className,
}) => {
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const pending = (refundSettlements || []).filter(
    (s) => s.status === "Pending",
  );

  if (pending.length === 0) return null;

  const totalPending = pending.reduce((a, s) => a + (s.amount || 0), 0);
  const active = pending.find((s) => getSettlementId(s) === activeId) || null;

  const handleModalCallback = (data: { action: string; data?: any }) => {
    setActiveId(null);
    if (data.action === "submit") {
      callback({ action: "submit", data: data.data });
    }
  };

  const isMulti = pending.length > 1;

  return (
    <>
      <AppCard
        className={`tw:bg-red-50 tw:border tw:border-red-200 ${className || ""}`}
        noPadding
      >
        <div className="tw:flex tw:flex-col tw:gap-2 tw:p-3">
          <div className="tw:flex tw:flex-wrap tw:items-start tw:gap-3">
            <div className="tw:mt-0.5 tw:text-red-600">
              <AlertTriangle className="tw:w-5 tw:h-5" />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:text-sm tw:font-bold tw:text-red-700 tw:mb-0.5">
                {isMulti ? (
                  <>
                    Refund{" "}
                    <Amount value={totalPending} /> to customer ({pending.length}{" "}
                    pending)
                  </>
                ) : (
                  <>
                    Refund <Amount value={pending[0].amount || 0} /> to customer
                  </>
                )}
              </div>
              <p className="tw:text-xs tw:text-gray-700 tw:leading-snug tw:m-0">
                {isMulti
                  ? "Give this money back to the customer by cash or UPI. Then upload payment photo for each."
                  : "Give this money back to the customer by cash or UPI. Then upload the payment photo here."}
              </p>
            </div>
            {!isMulti ? (
              <AppButton
                color="danger"
                size="small"
                onClick={() => setActiveId(getSettlementId(pending[0]))}
                className="tw:w-full tw:md:w-auto tw:md:shrink-0"
              >
                Record Refund Paid
              </AppButton>
            ) : null}
          </div>

          {isMulti ? (
            <div className="tw:flex tw:flex-col tw:gap-1.5 tw:pl-0 tw:md:pl-8">
              {pending.map((s, idx) => (
                <div
                  key={String(getSettlementId(s) ?? idx)}
                  className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:bg-white tw:border tw:border-red-200 tw:rounded tw:px-3 tw:py-2"
                >
                  <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                    <span className="tw:text-xs tw:font-semibold tw:text-gray-500">
                      #{idx + 1}
                    </span>
                    <span className="tw:font-bold tw:text-red-700 tw:text-sm">
                      <Amount value={s.amount || 0} />
                    </span>
                  </div>
                  <AppButton
                    color="danger"
                    size="small"
                    onClick={() => setActiveId(getSettlementId(s))}
                    className="tw:shrink-0"
                  >
                    Submit
                  </AppButton>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </AppCard>

      <RefundSettlementModal
        show={!!active}
        orderId={orderId}
        refundSettlementId={getSettlementId(active || {}) || undefined}
        pendingRefundAmount={active?.amount}
        callback={handleModalCallback}
      />
    </>
  );
};

export default RefundSettlement;
