import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  CheckCircle,
  Calendar,
  IndianRupee,
  FileText,
  Info,
} from "lucide-react";
import { AppInput, AppSelect } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import PaylaterService from "~/services/PaylaterService";

const validityOptions = PaylaterService.getValidityOptions();

const Limit: React.FC = () => {
  const { register, control, getValues, setValue } = useFormContext();

  const handleAmountChange = () => {
    const value = getValues("approvalAmount");
    if (value && Number(value) < 0) {
      setValue("approvalAmount", null);
    }
  };

  return (
    <div className="tw:space-y-3">
      {/* Section Header */}
      <div className="tw:flex tw:items-center tw:gap-2 tw:bg-green-50 tw:border tw:border-green-100 tw:rounded-lg tw:px-3 tw:py-2">
        <CheckCircle className="tw:text-green-600 tw:shrink-0" size={16} />
        <div>
          <div className="tw:text-sm tw:font-bold tw:text-gray-800">
            Set Credit Limit & Approval
          </div>
          <div className="tw:text-[10px] tw:text-gray-500">
            Configure the PayLater credit terms for this user
          </div>
        </div>
      </div>

      {/* Credit Limit & Validity */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        {/* Credit Limit */}
        <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-white">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:w-6 tw:h-6 tw:bg-blue-100 tw:rounded-full tw:flex tw:items-center tw:justify-center">
              <IndianRupee className="tw:text-blue-600" size={12} />
            </div>
            <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
              Credit Limit
            </span>
          </div>
          <AppInput
            label="Credit Limit"
            name="approvalAmount"
            type="number"
            register={register}
            onChange={handleAmountChange}
            placeholder="Enter amount (e.g. 5000)"
            inputClassName="tw:bg-gray-50 tw:h-9"
            size="sm"
            isRequired
          />
          <p className="tw:text-[10px] tw:text-gray-400 tw:mt-1 tw:flex tw:items-center tw:gap-1">
            <Info size={10} />
            Maximum amount the user can purchase on credit
          </p>
        </div>

        {/* Validity Period */}
        <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-white">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:w-6 tw:h-6 tw:bg-orange-100 tw:rounded-full tw:flex tw:items-center tw:justify-center">
              <Calendar className="tw:text-orange-600" size={12} />
            </div>
            <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
              Validity Period
            </span>
          </div>
          <Controller
            control={control}
            name="approvalValidity"
            render={({ field }) => (
              <AppSelect
                options={validityOptions}
                label="Validity Period"
                value={field.value}
                onChange={field.onChange}
                inputClassName="tw:w-full tw:bg-gray-50 tw:h-9"
                placeholder="Select duration"
                size="sm"
                isRequired
              />
            )}
          />
          <p className="tw:text-[10px] tw:text-gray-400 tw:mt-1 tw:flex tw:items-center tw:gap-1">
            <Info size={10} />
            Credit facility will expire after this period
          </p>
        </div>
      </div>

      {/* Remarks */}
      <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-white">
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
          <div className="tw:w-6 tw:h-6 tw:bg-gray-100 tw:rounded-full tw:flex tw:items-center tw:justify-center">
            <FileText className="tw:text-gray-600" size={12} />
          </div>
          <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
            Justification / Reason
          </span>
        </div>
        <AppTextarea
          label="Justification / Reason"
          name="approvalReason"
          register={register}
          placeholder="Enter reason for approving this credit (e.g. Verified customer, good repayment history)"
          className="tw:text-xs"
          rows={2}
          isRequired
        />
      </div>
    </div>
  );
};

export default Limit;
