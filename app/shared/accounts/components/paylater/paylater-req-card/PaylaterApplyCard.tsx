import React from "react";
import { CreditCard, ArrowRight } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppNav from "~/hooks/useAppNav";

export const PaylaterApplyCard = () => {
  const appNav = useAppNav();

  const onApply = () => {
    appNav.to("/dashboard/paylater/request");
  };

  return (
    <AppCard className="tw:border-l-4 tw:border-l-green-600 tw:py-3">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-md tw:bg-blue-50 tw:shrink-0">
            <CreditCard className="tw:text-blue-600" size={18} />
          </div>

          <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0 tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-tight">
              Apply for Pay Later
            </div>
            <div className="tw:text-xs tw:text-gray-600 tw:leading-relaxed tw:line-clamp-2">
              Apply for short-term credit to buy now and pay later. Fast
              approval and flexible repayment options.
            </div>
          </div>
        </div>

        <div className="tw:shrink-0">
          <AppButton onClick={onApply} color="success" size="small">
            Apply Now
            <ArrowRight size={14} />
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default PaylaterApplyCard;
