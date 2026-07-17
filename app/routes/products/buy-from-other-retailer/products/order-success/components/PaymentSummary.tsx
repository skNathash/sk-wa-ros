import { Wallet } from "lucide-react";
import type { Order } from "../helper";

interface Props {
  orders: Order[];
}

const labelFor = (method?: string) => {
  if (!method) return "Cash";
  if (method === "COD") return "Cash on Delivery";
  if (method === "PREPAID") return "Paid Online";
  if (method === "POSTPAID" || method === "PAYLATER") return "Pay Later";
  return method;
};

const PaymentSummary = ({ orders }: Props) => {
  const methods = Array.from(
    new Set(orders.map((o) => o.paymentMethod).filter(Boolean) as string[]),
  );
  if (methods.length === 0) return null;

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:mt-3 tw:pt-3 tw:border-t tw:border-gray-100">
      <Wallet className="tw:w-4 tw:h-4 tw:text-gray-500" />
      <span className="tw:text-xs tw:text-gray-500">Payment:</span>
      <div className="tw:flex tw:flex-wrap tw:gap-1.5">
        {methods.map((m) => (
          <span
            key={m}
            className="tw:px-2 tw:py-0.5 tw:bg-primary/10 tw:text-primary tw:text-xs tw:font-semibold tw:rounded-full"
          >
            {labelFor(m)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PaymentSummary;
