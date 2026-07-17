import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";

type Props = {
  show: boolean;
  callback: (a: { action: string }) => void;
};

type FormValues = {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
};

const validateBankDetails = (values: FormValues) => {
  let msg = "";
  if (!values.bankName) {
    msg = "Bank name is required";
  } else if (!values.accountHolderName) {
    msg = "Account holder name is required";
  } else if (!values.accountNumber) {
    msg = "Account number is required";
  } else if (!/^\d{6,18}$/.test(values.accountNumber)) {
    msg = "Invalid account number";
  } else if (!values.ifscCode) {
    msg = "IFSC code is required";
  }
  return { msg, status: !msg };
};

const BankDetailModal: React.FC<Props> = ({ show, callback }) => {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    if (show) {
      const user = AuthService.getLoggedInUser() || {};
      const bd = user.bankList?.[0] || {};
      reset({
        bankName: bd.bank_name || "",
        accountHolderName: bd.accountHolderName || "",
        accountNumber: bd.accountNumber || "",
        ifscCode: bd.ifsc || "",
      });
    }
  }, [show, reset]);

  const onSubmit = async (values: FormValues) => {
    const { msg, status } = validateBankDetails(values);
    if (!status) {
      toast.show({ msg, color: "danger" });
      return;
    }

    const user = AuthService.getLoggedInUser();
    if (!user?._id) {
      toast.show({ msg: "Profile ID not found.", color: "danger" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bankList: [
          {
            bank_name: values.bankName,
            accountHolderName: values.accountHolderName,
            accountNumber: values.accountNumber,
            ifsc: values.ifscCode.toUpperCase(),
          },
        ],
      };

      const resp = await FranchiseService.updateFranchise(payload);
      if (resp && resp.statusCode === 200) {
        toast.show({
          msg: "Bank details updated successfully!",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update bank details.",
          color: "danger",
        });
      }
    } catch (e) {
      toast.show({
        msg: "Failed to update bank details. Please try again.",
        color: "danger",
      });
    }
    setSubmitting(false);
  };

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        Edit Bank Details
      </AppModal.Title>
      <AppModal.Content className="modal-bg">
        <AppCard className="tw:mt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
            <AppInput
              label="Bank Name"
              name="bankName"
              register={register}
              className="tw:w-full"
              isRequired
            />
            <AppInput
              label="Account Holder Name"
              name="accountHolderName"
              register={register}
              className="tw:w-full"
              isRequired
            />
            <AppInput
              label="Account Number"
              name="accountNumber"
              register={register}
              className="tw:w-full"
              isRequired
            />
            <AppInput
              label="IFSC Code"
              name="ifscCode"
              register={register}
              className="tw:w-full"
              isRequired
            />
            <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4">
              <AppButton
                type="button"
                color="medium"
                onClick={() => callback({ action: "close" })}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" color="primary" isLoading={submitting}>
                Save
              </AppButton>
            </div>
          </form>
        </AppCard>
      </AppModal.Content>
    </AppModal>
  );
};

export default BankDetailModal;
