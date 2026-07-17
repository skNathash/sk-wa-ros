import { Printer } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import OmsService from "~/services/OmsService";
import PosService from "~/services/PosService";

const PrintReceipt = ({
  orderId,
  className,
  variant = "outline",
  size = "default",
  color = "primary",
  onlyIcon = false,
}: {
  orderId: string;
  className?: string;
  variant?: "outline" | "solid" | "clear";
  size?: "small" | "large" | "default" | "icon";
  color?:
    | "danger"
    | "dark"
    | "light"
    | "medium"
    | "primary"
    | "secondary"
    | "success"
    | "tertiary"
    | "warning";
  onlyIcon?: boolean;
}) => {
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    const response = await OmsService.getSellerOrderDetail(orderId);
    const data = response?.data?.data || null;
    const order = OmsService.formatOrderResponse([data])[0] || null;
    const invoiceId = order.invoices[0].id;
    if (invoiceId) {
      PosService.printThermalInvoice(invoiceId);
      // const invoiceResponse = await OmsService.getSellerOrderInvoiceDetail(
      //   invoiceId
      // );
      //   const invoiceData = invoiceResponse?.data?.data || null;
      //   const invProducts = invoiceData.products || [];
      //   const orderItems = order.items || [];
      //   let items: any[] = [];
      //   invProducts.forEach((product: any) => {
      //     const orderItem = orderItems.find(
      //       (item: any) => item.dealId === product.deal.id
      //     );
      //     if (orderItem) {
      //       items.push({
      //         ...orderItem,
      //         fulfilledQty: product.qty,
      //         mrp: product.mrp,
      //         price: product.sellerPrice,
      //         finalPrice: product.total,
      //       });
      //     }
      //   });
      //   order.items = items;
      //   order.orderAmount = invoiceData.total;
      //   order._payableAmt = invoiceData.subTotal;
      //   if (order.coinsRedeemedValue > 0) {
      //     order._payableAmt -= order.coinsRedeemedValue;
      //   }
      // }
    }

    // PrintPosOrderService.prepareTemplateData(order);
    setPrinting(false);
  };

  return (
    <AppButton
      onClick={handlePrint}
      disabled={printing}
      isLoading={printing}
      className={className}
      fill={variant}
      size={size}
      color={color}
    >
      <Printer />
      {onlyIcon ? null : "Print Receipt"}
    </AppButton>
  );
};

export default PrintReceipt;
