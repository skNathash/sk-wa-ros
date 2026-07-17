import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import { CheckCircle, X, IndianRupee, Calendar, FileText } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import PaylaterService from "~/services/PaylaterService";
import useAppToast from "~/hooks/useAppToast";
import { useState } from "react";

type FormData = {
  amount: number | null;
  reason: string;
  validity: string;
};

const validityOptions = PaylaterService.getValidityOptions();

const ApproveModal = ({
  show,
  callback,
  requestId,
  userName,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  requestId: string;
  userName?: string | null;
}) => {
  const appToast = useAppToast();

  const { register, setValue, getValues, control } = useForm<FormData>({
    defaultValues: {
      amount: 0,
      reason: "",
      validity: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleAmountChange = () => {
    const value = getValues("amount");
    if (value && value < 0) {
      setValue("amount", null);
    }
  };

  const validateForm = () => {
    const formData = getValues();
    let msg = "";

    if (!formData.amount) {
      msg = "Please enter amount";
    } else if (!formData.validity) {
      msg = "Please select validity period";
    } else if (formData.amount < 0) {
      msg = "Amount cannot be less than 0";
    } else if (!formData.reason?.trim()) {
      msg = "Please enter remarks";
    } else {
      msg = "";
    }

    return msg;
  };

  const handleSubmit = async () => {
    const msg = validateForm();
    if (msg) {
      appToast.show({
        msg,
        color: "error",
      });
      return;
    }

    const formData = getValues();

    try {
      setSubmitting(true);
      const resp = await PaylaterService.approveRequest(requestId, {
        action: "approve",
        approvedLimit: Number(formData.amount) || 0,
        kycStatus: "Approved",
        reason: formData.reason || "",
        validityPeriod: formData.validity || "",
      });
      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Request approved successfully",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to approve request",
          color: "error",
        });
      }
    } catch (error) {
      console.error(error);
      appToast.show({
        msg: "Failed to approve request",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      backdropDismiss={false}
      className="tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:bg-green-100 tw:p-2 tw:rounded-full">
            <CheckCircle className="tw:text-green-600" size={24} />
          </div>
          <div>
            <div className="tw:text-lg tw:font-bold tw:text-gray-800">
              Approve Paylater Request
            </div>
            <div className="tw:text-sm tw:text-gray-600 tw:mt-0.5">
              For: &quot;
              <span className="tw:font-semibold">{userName || "Customer"}</span>
              &quot;
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:space-y-4">
          {/* Credit Limit Section */}
          <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <IndianRupee className="tw:text-blue-600" size={18} />
              <span className="tw:font-semibold tw:text-gray-800">
                Credit Limit
              </span>
            </div>
            <AppInput
              label="Maximum Amount Customer Can Borrow"
              name="amount"
              type="number"
              register={register}
              onChange={handleAmountChange}
              isRequired
              placeholder="Enter amount (e.g., 5000)"
              inputClassName="tw:bg-white"
            />
            <p className="tw:text-xs tw:text-gray-600 tw:mt-1.5 tw:ml-1">
              💡 This is the maximum amount the customer can purchase on credit
            </p>
          </div>

          {/* Validity Period Section */}
          <div className="tw:bg-orange-50 tw:border tw:border-orange-200 tw:rounded-lg tw:p-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <Calendar className="tw:text-orange-600" size={18} />
              <span className="tw:font-semibold tw:text-gray-800">
                Valid Until
              </span>
            </div>
            <Controller
              control={control}
              name="validity"
              render={({ field }) => (
                <AppSelect
                  options={validityOptions}
                  label="How Long This Limit Will Last"
                  value={field.value}
                  onChange={field.onChange}
                  isRequired
                  inputClassName="tw:w-full tw:bg-white"
                  placeholder="Select time period"
                />
              )}
            />
            <p className="tw:text-xs tw:text-gray-600 tw:mt-1.5 tw:ml-1">
              💡 After this period, the credit limit will expire
            </p>
          </div>

          {/* Remarks Section */}
          <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <FileText className="tw:text-gray-600" size={18} />
              <span className="tw:font-semibold tw:text-gray-800">
                Your Notes
              </span>
            </div>
            <AppTextarea
              label="Why Are You Approving This Request?"
              name="reason"
              isRequired
              register={register}
              placeholder="E.g., Regular customer with good payment history"
            />
            <p className="tw:text-xs tw:text-gray-600 tw:mt-1.5 tw:ml-1">
              💡 Add reason for approval (for future reference)
            </p>
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:w-full">
          <AppButton
            onClick={handleClose}
            color="secondary"
            fill="outline"
            disabled={submitting}
            className="tw:flex-1 sm:tw:flex-none tw:justify-center"
          >
            <X size={16} />
            Cancel
          </AppButton>
          <AppButton
            onClick={handleSubmit}
            color="success"
            fill="solid"
            disabled={submitting}
            isLoading={submitting}
            className="tw:flex-1 sm:tw:flex-none tw:justify-center"
          >
            <CheckCircle size={16} />
            Approve Now
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ApproveModal;
