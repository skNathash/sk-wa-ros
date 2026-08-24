import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import useAppNav from "~/hooks/useAppNav";
import ReceiveBoxModal from "~/shared/orders/receive-box/modals/receive-box/ReceiveBoxModal";

/** A package row as returned by `PurchaseOrderService.formatPoDashboardSummary`. */
export interface ReceivableBox extends Record<string, any> {
  refNo?: string;
  orderData?: { id?: string; refId?: string };
  /** Non-SK vendor packages are received on the process page, not in a modal. */
  isNonSkVendor?: boolean;
  /** Order ref the receive modal loads the box contents from. */
  orderIdToProcess?: string;
}

interface ReceiveBoxFlowProps {
  /** The trigger — clicking anywhere inside it starts receiving {@link data}. */
  children: ReactNode;
  /** The package to receive. */
  data: ReceivableBox;
  /** Row position in the caller's list; handed back on {@link onReceived}. */
  index?: number;
  /** Fired once the package is actually received; reload the list here. */
  onReceived?: (a: { row: ReceivableBox; index: number }) => void;
  /** Blocks the trigger, e.g. while the list is refreshing. */
  disabled?: boolean;
  /** Wrapper class. Defaults to `display: contents` so layout is untouched. */
  className?: string;
}

/**
 * Owns the "receive a package" flow so every surface that lists yet-to-receive
 * packages behaves identically: SK and seller packages open the box receive
 * modal in place, non-SK vendor packages redirect to the purchase-order process
 * page. Callers wrap their own receive button and react to {@link onReceived}.
 */
const ReceiveBoxFlow = ({
  children,
  data,
  index = -1,
  onReceived,
  disabled,
  className = "tw:contents",
}: ReceiveBoxFlowProps) => {
  const appNav = useAppNav();

  const [show, setShow] = useState(false);
  // Stays true after the first open so the modal isn't mounted for rows the
  // user never touches, while a closed modal still keeps its exit animation.
  const [mounted, setMounted] = useState(false);

  const handleTrigger = (e: MouseEvent<HTMLSpanElement>) => {
    // Receiving is a terminal action — never let it also fire the row/card
    // click the trigger usually sits inside.
    e.stopPropagation();
    if (disabled) return;

    if (data?.isNonSkVendor) {
      appNav.to(`/dashboard/purchase-order/process/${data?.orderData?.id}`);
      return;
    }

    setMounted(true);
    setShow(true);
  };

  const handleModalCallback = (a: { action: string; data?: any }) => {
    setShow(false);

    if (a?.action === "success" || a?.action === "received") {
      onReceived?.({ row: data, index });
    }
  };

  return (
    <>
      {/* Click is caught on the way up, so the child keeps its own onClick. */}
      <span className={className} onClick={handleTrigger}>
        {children}
      </span>

      {mounted && (
        <ReceiveBoxModal
          show={show}
          callback={handleModalCallback}
          orderId={data?.orderIdToProcess || ""}
          boxNo={data?.refNo || ""}
        />
      )}
    </>
  );
};

export default ReceiveBoxFlow;
