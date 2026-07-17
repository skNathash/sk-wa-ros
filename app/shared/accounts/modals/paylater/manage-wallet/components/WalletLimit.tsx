import { useEffect, useState } from "react";
import { AppInput, AppSelect } from "~/components/core/form";
import PaylaterService from "~/services/PaylaterService";
import useAppToast from "~/hooks/useAppToast";
import AppButton from "~/components/core/button/AppButton";
import { Save, DollarSign, Calendar, IndianRupee } from "lucide-react";
import AppTextarea from "~/components/core/form/AppTextarea";
import { Controller, useForm } from "react-hook-form";
import AuthService from "~/services/AuthService";

type WalletLimitProps = {
  limit: number;
  validityPeriod: string;
  userId: string;
  requestId: string;
  callback: (args: { action: "submit" | "close"; data?: any }) => void;
  routeType?: string;
};

type FormData = {
  limit: number | null;
  validityPeriod: string;
  remarks: string;
};

const VALIDITY_PERIOD_OPTIONS = PaylaterService.getValidityOptions();

const WalletLimit = ({
  limit,
  validityPeriod,
  userId,
  requestId,
  callback,
  routeType,
}: WalletLimitProps) => {
  const appToast = useAppToast();

  const { control, register, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      limit: limit || null,
      validityPeriod: validityPeriod || "",
      remarks: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValue("limit", limit);
    setValue("validityPeriod", validityPeriod);
  }, [limit, validityPeriod]);

  const handleSubmit = async () => {
    const formData = getValues();

    const { limit, validityPeriod, remarks } = formData;

    if (!limit) {
      appToast.show({
        msg: "Credit limit is required",
        color: "error",
      });
      return;
    }

    if (limit <= 0) {
      appToast.show({
        msg: "Credit limit must be greater than 0",
        color: "error",
      });
      return;
    }

    if (!validityPeriod) {
      appToast.show({
        msg: "Validity period is required",
        color: "error",
      });
      return;
    }

    if (!remarks?.trim()) {
      appToast.show({
        msg: "Please enter remarks",
        color: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        userInfo: {
          id: userId,
          type: routeType === "b2b" ? "franchise" : "customer",
        },
        franchiseInfo: {
          id: AuthService.getLoggedInUserId(),
        },
        newLimit: limit,
        reason: remarks,
        validityPeriod: validityPeriod,
      };

      const res = await PaylaterService.updateLimit(requestId, payload);

      setSubmitting(false);

      if (res.statusCode === 200) {
        appToast.show({
          msg: "Wallet limit updated successfully",
          color: "success",
        });
        callback({
          action: "submit",
          data: {
            limit: limit,
            validityPeriod: validityPeriod,
            remarks: remarks,
          },
        });
      } else {
        appToast.show({
          msg: res.data?.message || "Failed to update wallet limit",
          color: "error",
        });
      }
    } catch (error) {
      appToast.show({
        msg: "Failed to update wallet limit",
        color: "error",
      });
    }
  };

  const handleLimitChange = () => {
    const value = getValues("limit");

    if (value && value < 0) {
      setValue("limit", null);
    }

    if (value && value > 1000000) {
      setValue("limit", 1000000);
    }
  };

  return (
    <div className="tw:space-y-3">
      {/* Header Section */}
      <div className="tw:bg-linear-to-r tw:from-blue-50 tw:to-indigo-50 tw:border tw:border-blue-200 tw:rounded-md tw:p-3">
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
          <IndianRupee className="tw:text-blue-600" size={18} />
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800">
            Credit Limit Configuration
          </h3>
        </div>
        <p className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
          Define the maximum credit amount and validity period for this account
        </p>
      </div>

      {/* Compact Input Grid */}
      <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-md tw:p-3">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
          {/* Credit Limit Input */}
          <div className="tw:space-y-1">
            <label className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-gray-700">
              <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-5 tw:h-5 tw:rounded-full tw:bg-green-100 tw:text-green-700 tw:text-[10px] tw:font-semibold">
                ₹
              </span>
              Credit Limit <span className="tw:text-red-500">*</span>
            </label>
            <AppInput
              name="limit"
              type="number"
              register={register}
              isRequired
              placeholder="Enter amount (e.g., 50000)"
              onChange={handleLimitChange}
              className="tw:text-sm"
            />
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-gray-500">
              <span className="tw:inline-block tw:w-1 tw:h-1 tw:rounded-full tw:bg-gray-400"></span>
              Max credit in Rs. (up to 10,00,000)
            </div>
          </div>

          {/* Validity Period Select */}
          <Controller
            name="validityPeriod"
            control={control}
            render={({ field }) => (
              <div className="tw:space-y-1">
                <label className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-gray-700">
                  <Calendar className="tw:text-purple-600" size={14} />
                  Validity Period <span className="tw:text-red-500">*</span>
                </label>
                <AppSelect
                  options={VALIDITY_PERIOD_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  isRequired
                  placeholder="Select duration"
                  inputClassName="tw:w-full tw:text-sm"
                />
                <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-gray-500">
                  <span className="tw:inline-block tw:w-1 tw:h-1 tw:rounded-full tw:bg-gray-400"></span>
                  How long this limit stays active
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Remarks Section - Compact */}
      <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-md tw:p-3">
        <label className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-1.5">
          <span className="tw:text-base">📝</span>
          Justification / Reason <span className="tw:text-red-500">*</span>
        </label>
        <AppTextarea
          name="remarks"
          isRequired
          register={register}
          rows={2}
          maxLength={300}
          placeholder="Why is this credit limit being set? Provide business justification..."
          className="tw:text-sm"
          inputClassName="tw:bg-white"
        />
        <div className="tw:flex tw:items-center tw:justify-between tw:mt-1.5">
          <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-amber-700">
            <span className="tw:inline-block tw:w-1 tw:h-1 tw:rounded-full tw:bg-amber-500"></span>
            Recorded in audit log for compliance
          </div>
          <span className="tw:text-[11px] tw:text-gray-500">Max 300 chars</span>
        </div>
      </div>

      {/* Action Button - Prominent */}
      <div className="tw:flex tw:justify-end tw:pt-1">
        <AppButton
          onClick={handleSubmit}
          type="button"
          color="success"
          isLoading={submitting}
          className="tw:px-5 tw:shadow-sm"
        >
          <Save size={16} />
          <span className="tw:font-medium">Update Credit Limit</span>
        </AppButton>
      </div>
    </div>
  );
};

export default WalletLimit;
