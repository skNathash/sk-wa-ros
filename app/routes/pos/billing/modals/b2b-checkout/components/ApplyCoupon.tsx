import React from "react";
import AppButton from "~/components/core/button/AppButton";

const ApplyCoupon: React.FC = () => {
  return (
    <div className="tw:border tw:rounded tw:p-4 tw:bg-white">
      <h4 className="tw:text-md tw:font-medium tw:mb-2">Apply Coupon</h4>
      <div className="tw:flex tw:space-x-2">
        <input
          className="tw:flex-1 tw:border tw:px-2 tw:py-1 tw:rounded"
          placeholder="Enter coupon code"
        />
        <AppButton>Apply</AppButton>
      </div>
    </div>
  );
};

export default ApplyCoupon;
