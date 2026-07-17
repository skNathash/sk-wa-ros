import { useState } from "react";
import { Phone, Send } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import PosService from "~/services/PosService";
import ShareService from "~/services/ShareService";

interface SendInvoiceWhatsAppProps {
  orderId: string | number;
  defaultPhone?: string;
  orderRefNo?: string | number;
  customerName?: string;
  storeName?: string;
}

const SendInvoiceWhatsApp = ({
  orderId,
  defaultPhone,
  orderRefNo,
  customerName,
  storeName,
}: SendInvoiceWhatsAppProps) => {
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    const digits = String(defaultPhone || "").replace(/\D+/g, "");

    if (!CommonService.isValidMobileNo(digits)) {
      toast.show({ msg: "Customer mobile number is invalid", color: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await OmsService.getSellerOrderDetail(String(orderId));
      const data = response?.data?.data || null;
      const order = OmsService.formatOrderResponse([data])[0] || null;
      const invoiceId = order?.invoices?.[0]?.id;

      let total = order?.orderAmount;
      let invoiceNo: string | number | undefined = invoiceId;
      let invoiceUrl = "";

      if (invoiceId) {
        invoiceUrl = PosService.getThermalInvoiceUrl(invoiceId);
        const invResp = await OmsService.getSellerOrderInvoiceDetail(invoiceId);
        const invoiceData = invResp?.data?.data || null;
        if (invoiceData) {
          total = invoiceData.total ?? total;
          invoiceNo = invoiceData.refId || invoiceData.invoiceNumber || invoiceId;
        }
      }

      const greetName = customerName ? ` ${customerName}` : "";
      const fromStore = storeName ? ` from *${storeName}*` : "";
      const orderNo = orderRefNo ?? orderId;
      const dateStr = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const summary = [
        `Order No: ${orderNo}`,
        invoiceNo ? `Invoice No: ${invoiceNo}` : null,
        `Date: ${dateStr}`,
        total != null ? `Total Amount: ₹${total}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const sections = [
        `Hello${greetName},`,
        `Thank you for your purchase${fromStore}. Your order has been placed successfully.`,
        `*Order Summary*\n${summary}`,
        invoiceUrl ? `Download your invoice here:\n${invoiceUrl}` : null,
        "For any queries, reply to this message.",
        storeName ? `— Team ${storeName}` : "Thank you!",
      ].filter(Boolean);

      ShareService.share({
        msg: sections.join("\n\n"),
        phone: digits,
      });
    } catch (err: any) {
      toast.show({
        msg: err?.message || "Failed to send invoice",
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawDigits = String(defaultPhone || "").replace(/\D+/g, "");
  const last10 = rawDigits.slice(-10);
  const formattedPhone = last10.length === 10
    ? `${last10.slice(0, 5)} ${last10.slice(5)}`
    : rawDigits || "—";
  const hasValidPhone = CommonService.isValidMobileNo(last10);

  return (
    <div className="tw:w-full tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-lg tw:border tw:border-border tw:bg-card tw:px-3 tw:py-2">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:min-w-0">
        <span className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-muted tw:border tw:border-border tw:text-muted-foreground tw:shrink-0">
          <Phone size={14} />
        </span>
        <div className="tw:flex tw:flex-col tw:min-w-0">
          <span className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-muted-foreground tw:font-medium">
            Sending to
          </span>
          <span className="tw:text-sm tw:font-semibold tw:text-foreground tw:tabular-nums tw:truncate">
            {hasValidPhone ? `+91 ${formattedPhone}` : "No valid number"}
          </span>
        </div>
      </div>
      <AppButton
        type="button"
        color="primary"
        size="small"
        onClick={onSubmit}
        disabled={isSubmitting || !hasValidPhone}
        isLoading={isSubmitting}
      >
        <div className="tw:flex tw:items-center tw:gap-2">
          <Send size={14} />
          <span>Send</span>
        </div>
      </AppButton>
    </div>
  );
};

export default SendInvoiceWhatsApp;
