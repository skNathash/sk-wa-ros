import React from "react";
import { CheckCircle, ArrowRight, Wallet, UserCheck } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import KeyValue from "~/components/core/key-value/KeyValue";
import Divider from "~/components/core/divider/Divider";

interface SuccessStepProps {
  onClose: () => void;
  franchiseName: string;
  limit: number;
  validity: string;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ 
  onClose, 
  franchiseName, 
  limit, 
  validity 
}) => {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:py-8 tw:animate-in tw:fade-in tw:zoom-in tw:duration-300">
      <div className="tw:relative">
        <div className="tw:absolute tw:inset-0 tw:bg-green-200 tw:rounded-full tw:animate-ping tw:opacity-20" />
        <div className="tw:bg-green-100 tw:p-4 tw:rounded-full tw:relative">
           <CheckCircle className="tw:text-green-600" size={60} />
        </div>
      </div>

      <h2 className="tw:text-2xl tw:font-bold tw:text-gray-900 tw:mt-6">PayLater Created Successfully!</h2>
      <p className="tw:text-gray-500 tw:mt-2">
        PayLater has been assigned and approved for <span className="tw:font-semibold tw:text-gray-800">{franchiseName}</span>.
      </p>

      <div className="tw:w-full tw:max-w-sm tw:mt-8 tw:bg-gray-50 tw:rounded-2xl tw:p-6 tw:border tw:border-gray-100">
        <div className="tw:grid tw:grid-cols-2 tw:gap-6">
          <div className="tw:flex tw:flex-col tw:items-center">
            <div className="tw:bg-blue-100 tw:p-2 tw:rounded-lg tw:mb-2">
              <Wallet className="tw:text-blue-600" size={20} />
            </div>
            <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:font-bold tw:tracking-wider">Credit Limit</div>
            <div className="tw:text-lg tw:font-bold tw:text-gray-900">₹{limit.toLocaleString()}</div>
          </div>
          <div className="tw:flex tw:flex-col tw:items-center">
            <div className="tw:bg-orange-100 tw:p-2 tw:rounded-lg tw:mb-2">
              <UserCheck className="tw:text-orange-600" size={20} />
            </div>
            <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:font-bold tw:tracking-wider">Validity</div>
            <div className="tw:text-lg tw:font-bold tw:text-gray-900">{validity}</div>
          </div>
        </div>

        <Divider className="tw:my-6" />

        <div className="tw:flex tw:items-center tw:justify-between tw:text-sm">
          <span className="tw:text-gray-500">Status</span>
          <span className="tw:bg-green-100 tw:text-green-700 tw:px-2 tw:py-0.5 tw:rounded-full tw:font-bold tw:text-xs">
            ACTIVE
          </span>
        </div>
      </div>

      <div className="tw:mt-10 tw:w-full tw:max-w-sm">
        <AppButton 
          onClick={onClose}
          color="success"
          fill="solid"
          className="tw:w-full tw:h-12 tw:rounded-xl tw:text-lg tw:font-bold tw:shadow-lg tw:shadow-green-100"
        >
          Done
          <ArrowRight size={20} className="tw:ml-2" />
        </AppButton>
      </div>
    </div>
  );
};

export default SuccessStep;
