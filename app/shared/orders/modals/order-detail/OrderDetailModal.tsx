import { X } from "lucide-react";
import { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import { Drawer, DrawerContent, DrawerTitle } from "~/components/ui/drawer";
import useScreenView from "~/hooks/useScreenView";
import OrderDetailBody from "./components/OrderDetailBody";
import {
  downloadInvoice,
  getOrderDetail,
  type OrderDetailView,
} from "./helper";

type Props = {
  orderId: string;
  show: boolean;
  callback: (event: { action: string; data?: any }) => void;
};

/**
 * Minimal order detail — a right-hand drawer on desktop, a bottom sheet
 * (AppModal) on mobile. Fetches the order itself from `orderId`; the parent
 * only says which order and whether it is open.
 *
 * Callback actions: `close`.
 */
const OrderDetailModal = ({ orderId, show, callback }: Props) => {
  const { isMobile } = useScreenView();

  const [order, setOrder] = useState<OrderDetailView | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !orderId) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setOrder(null);
      try {
        const detail = await getOrderDetail(orderId);
        if (active) setOrder(detail);
      } catch (e) {
        if (active) setOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [show, orderId]);

  const close = () => callback({ action: "close" });

  const onDownloadInvoice = () =>
    downloadInvoice(order?.invoiceDocumentId || "");

  // The stage accent is set on the outer scope so the title bar's hairline
  // picks it up too, not just the scrolling body.
  const scopeClass = `od-scope od-accent-${order?.accent || "placed"}`;

  const body = (
    <OrderDetailBody
      order={order}
      loading={loading}
      onDownloadInvoice={onDownloadInvoice}
    />
  );

  if (isMobile) {
    return (
      <AppModal show={show} callback={close} noPadding className={scopeClass}>
        <AppModal.Title onClose={close}>
          <span className="tw:text-sm tw:font-bold">Order details</span>
        </AppModal.Title>
        <div className="od-titlebar-accent tw:shrink-0" />
        <AppModal.Content noPadding className="od-scroll">
          {body}
        </AppModal.Content>
      </AppModal>
    );
  }

  return (
    <Drawer
      open={show}
      direction="right"
      // No drag handle on desktop, so `handleOnly` leaves the body undraggable
      // — otherwise vaul swallows the pointer drag and text can't be selected.
      handleOnly
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      {/* `!` beats the direction-scoped w-3/4 / max-w-sm defaults in DrawerContent. */}
      <DrawerContent
        className={`${scopeClass} tw:w-full! tw:max-w-[580px]! tw:flex tw:flex-col`}
      >
        <div className="od-titlebar tw:shrink-0">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3">
            <div className="tw:min-w-0">
              <DrawerTitle className="tw:text-sm tw:font-bold tw:text-slate-900">
                Order details
              </DrawerTitle>
              {order?.refNo ? (
                <p className="tw:text-[11px] tw:text-slate-500 tw:tabular-nums">
                  {order.refNo}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={close}
              className="od-close"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
          <div className="od-titlebar-accent" />
        </div>
        <div className="od-drawer-scroll tw:flex-1 tw:overflow-y-auto">
          {body}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderDetailModal;
