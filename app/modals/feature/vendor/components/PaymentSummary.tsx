import { IndianRupee } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import Divider from "~/components/core/divider/Divider";

type PaymentSummaryProps = {
  selectedOrders: number;
  totalOrders: number;
  totalAmount: number;
};

const PaymentSummary = ({
  selectedOrders,
  totalOrders,
  totalAmount,
}: PaymentSummaryProps) => {
  return (
    <div className="tw:border tw:rounded tw:p-6 tw:bg-white">
      <div className="tw:font-semibold tw:text-sm tw:mb-4 tw:flex tw:items-center tw:gap-2">
        <IndianRupee className="tw:w-5 tw:h-5" />
        Payment Summary
      </div>
      <div className="tw:mb-2 tw:text-sm tw:text-gray-700 tw:flex tw:items-center tw:gap-2 tw:justify-between">
        <span>Selected Orders:</span>
        <span>
          {selectedOrders || 0} of {totalOrders || 0}
        </span>
      </div>
      <Divider />
      <div className="tw:flex tw:justify-between tw:items-center">
        <span className="tw:font-bold tw:text-base">Total Amount:</span>
        <span className="tw:text-xl tw:font-bold tw:text-black">
          <Amount value={totalAmount} />
        </span>
      </div>
    </div>
  );
};

export default PaymentSummary;
