import React from "react";
import AppButton from "~/components/core/button/AppButton";
import { Package, ArrowRight } from "lucide-react";

const Attention: React.FC = () => {
  return (
    <div className="tw:bg-gray-50 tw:rounded tw:p-6 tw:flex tw:items-center tw:justify-between tw:gap-6">
      <div>
        <div className="tw:font-semibold tw:text-lg tw:mb-1">
          Need Attention
        </div>
        <div className="tw:text-gray-600 tw:text-base">
          28 orders in processing stage require fulfillment
        </div>
      </div>
      <div className="tw:flex tw:gap-3">
        <AppButton color="success" className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:inline-flex tw:items-center">
            <Package className="tw:w-5 tw:h-5 tw:mr-1" />
            Manage Fulfillment
          </span>
        </AppButton>
        <AppButton
          color="light"
          fill="outline"
          className="tw:font-semibold tw:flex tw:items-center tw:gap-1"
        >
          View Processing Orders
          <span className="tw:ml-1 tw:inline-flex tw:items-center">
            <ArrowRight className="tw:w-4 tw:h-4" />
          </span>
        </AppButton>
      </div>
    </div>
  );
};

export default Attention;
