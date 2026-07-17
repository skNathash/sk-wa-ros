import Amount from "~/components/core/amount/Amount";
import { useCallback } from "react";

type Props = {
  payment: any;
  callback?: (a: { action: string; data?: any }) => void;
};

const PaymentMethodList = ({ payment, callback }: Props) => {
  const onViewProofs = useCallback(() => {
    const proofs: string[] = payment?.proof || [];
    if (!proofs || proofs.length === 0) return;

    const images = proofs.map((id: string) => ({ id }));
    if (callback) {
      callback({
        action: "showImages",
        data: { images, initialImageId: images[0]?.id },
      });
    }
  }, [payment, callback]);
  return (
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-1.5 tw:px-2 tw:rounded-md tw:bg-gray-50/50 hover:tw:bg-gray-50 tw:transition-colors">
      <div className="tw:flex tw:flex-col tw:gap-0.5 tw:flex-1 tw:min-w-0">
        <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
          {payment.type}
        </span>
        {payment.paidVia && (
          <span className="tw:text-xs tw:text-gray-600 tw:truncate">
            via {payment.paidVia}
          </span>
        )}
        {payment.refNo && (
          <span className="tw:text-xs tw:text-gray-500 tw:truncate">
            Ref: {payment.refNo}
          </span>
        )}
      </div>
      <div className="tw:flex-shrink-0 tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
          <Amount value={payment.amount} />
        </span>

        {Array.isArray(payment?.proof) && payment.proof.length > 0 && (
          <button
            onClick={onViewProofs}
            className="tw:text-xs tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded tw:border tw:border-gray-200 tw-ml-2 tw-font-medium"
          >
            {payment.proof.length} proofs
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodList;
