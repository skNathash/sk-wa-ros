import { useEffect, useState } from "react";
import PaymentApprovalBlock from "./PaymentApprovalBlock";
import {
  getPaymentPendingOrders,
  type PaymentApprovalOrder,
} from "./paymentApprovalHelper";

interface PaymentPendingListProps {
  /** Bumping this reloads the block — pass it after approving a payment. */
  refreshKey?: number | string;
  className?: string;
}

/**
 * Orders whose payment the store still has to verify. Loads its own data (the
 * same filter the `payment-approval` tab lists on) so any surface can drop the
 * block in without wiring an API.
 */
const PaymentPendingList = ({
  refreshKey,
  className,
}: PaymentPendingListProps) => {
  const [data, setData] = useState<PaymentApprovalOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getPaymentPendingOrders()
      .then((orders) => {
        if (cancelled) return;
        setData(orders);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <PaymentApprovalBlock
      label="Payment Pending"
      tone="amber"
      data={data}
      loading={loading}
      secondary="paidVia"
      emptyText="No payments waiting on you"
      className={className}
    />
  );
};

export default PaymentPendingList;
