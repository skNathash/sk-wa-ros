import { Check, Copy, Eye, FileText, MessageCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import SendInvoiceWhatsApp from "./SendInvoiceWhatsApp";

interface OrderPlacedModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  orderId?: string | number;
  orderRefNo?: string | number;
  reserveOrderId?: string | number;
  reserveOrderRefNo?: string | number;
  isB2b?: boolean;
  isAssisted?: boolean;
  showInvoicePrint?: boolean;
}

const OrderPlacedModal: React.FC<OrderPlacedModalProps> = ({
  show,
  callback,
  orderId,
  orderRefNo,
  reserveOrderId,
  reserveOrderRefNo,
  isB2b = false,
  isAssisted = false,
  showInvoicePrint = false,
}) => {
  const [order, setOrder] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => callback({ action: "close" });

  useEffect(() => {
    if (!show || !orderId) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    const MAX_ATTEMPTS = 6;
    const RETRY_DELAY = 2500;

    const fetchOrder = async (attempt: number) => {
      try {
        const resp = await OmsService.getSellerOrderDetail(String(orderId));
        const data = resp?.data?.data || null;
        const formatted = data
          ? OmsService.formatOrderResponse([data])[0] || data
          : null;
        if (!mounted) return;
        setOrder(formatted);

        // The invoice PDF (invoiceDocumentId) is generated server-side and may
        // not be ready immediately after placement; retry until it appears.
        const hasInvoiceDoc = !!formatted?.invoices?.[0]?.invoiceDocumentId;
        if (showInvoicePrint && !hasInvoiceDoc && attempt < MAX_ATTEMPTS) {
          timer = setTimeout(() => fetchOrder(attempt + 1), RETRY_DELAY);
        }
      } catch {
        if (mounted) setOrder(null);
      }
    };

    fetchOrder(1);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [show, orderId, showInvoicePrint]);

  const displayId = orderRefNo ?? orderId ?? "-";
  const reserveDisplayId = reserveOrderRefNo ?? reserveOrderId ?? null;
  const hasReserve = !!reserveOrderId;

  const invoiceDocumentId = order?.invoices?.[0]?.invoiceDocumentId;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(displayId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const handleViewOrder = () => {
    callback({ action: "view-order", data: { orderId } });
  };

  const handleViewReserveOrder = () => {
    callback({ action: "view-order", data: { orderId: reserveOrderId } });
  };

  const handlePrintInvoice = () => {
    if (!invoiceDocumentId) return;
    CommonService.assetDownload(invoiceDocumentId, true);
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose} toolbarClassName="tw:!pt-2 tw:!pb-0">
        &nbsp;
      </AppModal.Title>
      <AppModal.Content noPadding className="tw:px-2 tw:pb-4">
        <div className="tw:relative tw:flex tw:flex-col tw:items-center">
          <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:h-20 tw:w-20">
            <span className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-green-500/10 tw:motion-safe:animate-in tw:motion-safe:zoom-in tw:motion-safe:duration-500" />
            <span className="tw:absolute tw:inset-2 tw:rounded-full tw:bg-green-500/15" />
            <span className="tw:relative tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-green-500 tw:text-white tw:shadow-lg tw:shadow-green-500/30 tw:motion-safe:animate-in tw:motion-safe:zoom-in tw:motion-safe:duration-500">
              <Check size={30} strokeWidth={3} />
            </span>
          </div>

          <div className="tw:w-full tw:text-center tw:mt-3">
            <div className="tw:text-xl tw:font-bold tw:text-foreground tw:tracking-tight">
              Order placed successfully
            </div>
            <div className="tw:text-xs tw:text-muted-foreground tw:mt-1">
              Print the receipt or share it on WhatsApp.
            </div>

            <div className="tw:w-full tw:mt-5">
              <div className="tw:text-[11px] tw:tracking-[0.18em] tw:text-muted-foreground tw:font-semibold tw:mb-2 tw:text-left">
                {hasReserve ? "REGULAR ORDER ID" : "ORDER ID"}
              </div>

              <div className="tw:flex tw:items-center tw:gap-2 tw:border tw:border-border tw:bg-card tw:rounded-xl tw:py-2.5 tw:pl-3.5 tw:pr-2">
                <span className="tw:flex-1 tw:min-w-0 tw:text-left tw:font-semibold tw:text-[15px] tw:tracking-wide tw:tabular-nums tw:text-foreground tw:truncate">
                  {displayId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  aria-label={copied ? "Copied" : "Copy order ID"}
                  className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-muted-foreground tw:hover:text-foreground tw:hover:bg-muted tw:transition-colors"
                >
                  {copied ? (
                    <Check size={16} className="tw:text-green-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                {orderId && (
                  <button
                    type="button"
                    onClick={handleViewOrder}
                    className="tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-lg tw:bg-primary/10 tw:text-primary tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:hover:bg-primary/15 tw:transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </button>
                )}
              </div>

              {orderId &&
                !isAssisted &&
                (!isB2b || (showInvoicePrint && invoiceDocumentId)) && (
                  <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2.5">
                    {!isB2b && (
                      <div className="tw:flex-1">
                        <PrintReceipt
                          orderId={String(orderId)}
                          variant="outline"
                          size="default"
                          color="primary"
                          onlyIcon={false}
                          className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2"
                        />
                      </div>
                    )}
                    {showInvoicePrint && invoiceDocumentId && (
                      <div className="tw:flex-1">
                        <AppButton
                          fill="outline"
                          color="primary"
                          onClick={handlePrintInvoice}
                          className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2"
                        >
                          <FileText size={16} />
                          Print Invoice
                        </AppButton>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {hasReserve && (
              <div className="tw:w-full tw:mt-3">
                <div className="tw:text-xs tw:text-yellow-700 tw:font-medium tw:mb-2 tw:text-center">
                  RESERVE ORDER ID
                </div>
                <div className="tw:border tw:border-yellow-200 tw:bg-yellow-50 tw:rounded-lg tw:py-3 tw:px-4 tw:flex tw:justify-center tw:items-center tw:gap-2">
                  <span className="tw:font-bold tw:text-sm">
                    {reserveDisplayId}
                  </span>
                  <button
                    type="button"
                    onClick={handleViewReserveOrder}
                    className="tw:text-xs tw:text-primary tw:underline"
                  >
                    View
                  </button>
                </div>
                {!isB2b && !isAssisted && (
                  <div className="tw:mt-3 tw:flex tw:justify-center tw:items-center tw:gap-2">
                    <PrintReceipt
                      orderId={String(reserveOrderId)}
                      variant="outline"
                      size="default"
                      color="primary"
                      onlyIcon={false}
                    />
                  </div>
                )}
                <div className="tw:text-[11px] tw:text-muted-foreground tw:text-center tw:mt-1">
                  Some items are out of stock. We've created a separate order
                  for them and will deliver once available.
                </div>
              </div>
            )}

            {orderId &&
              !isB2b &&
              !isAssisted &&
              order?.customerInfo?.mobile && (
                <div className="tw:w-full tw:mt-4 tw:border tw:border-border tw:rounded-xl tw:p-3 tw:bg-muted">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2.5">
                    <span className="tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
                      <MessageCircle size={13} />
                    </span>
                    <span className="tw:text-xs tw:font-semibold tw:text-foreground">
                      Send invoice on WhatsApp
                    </span>
                  </div>
                  <SendInvoiceWhatsApp
                    orderId={orderId}
                    orderRefNo={orderRefNo}
                    defaultPhone={order?.customerInfo?.mobile}
                    customerName={order?.customerInfo?.name}
                    storeName={AuthService.getLoggedInUser()?.name}
                  />
                </div>
              )}

            {isB2b && (
              <div className="tw:mt-3 tw:text-xs tw:text-yellow-700 tw:text-center tw:px-2">
                Next Steps: pick, pack and ship this order.
              </div>
            )}
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default OrderPlacedModal;
