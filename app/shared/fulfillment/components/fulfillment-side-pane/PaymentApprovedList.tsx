import { useEffect, useState } from "react";
import PaymentApprovalBlock from "./PaymentApprovalBlock";
import {
  getRecentlyApprovedOrders,
  type PaymentApprovalOrder,
} from "./paymentApprovalHelper";

interface PaymentApprovedListProps {
  /** Bumping this reloads the block — pass it after approving a payment. */
  refreshKey?: number | string;
  className?: string;
}

/**
 * Payments the store approved over the last week, newest first — the receipt
 * side of the pending block, so whoever verifies payments can see what has
 * just cleared without leaving the list.
 */
const PaymentApprovedList = ({
  refreshKey,
  className,
}: PaymentApprovedListProps) => {
  const [data, setData] = useState<PaymentApprovalOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getRecentlyApprovedOrders()
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
      label="Recently Approved"
      tone="green"
      data={data}
      loading={loading}
      secondary="date"
      emptyText="Nothing approved this week"
      className={className}
    />
  );
};

export default PaymentApprovedList;
