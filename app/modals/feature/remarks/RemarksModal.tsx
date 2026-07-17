import React, { useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";

interface RemarksModalProps {
  show: boolean;
  title: string;
  callback: (a: { action: string; remarks?: string }) => void;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  show,
  title,
  callback,
}) => {
  const appToast = useAppToast();

  const { register, setValue, getValues } = useForm({
    defaultValues: {
      remarks: "",
    },
  });

  const handleClose = () => {
    callback({ action: "close" });
    setValue("remarks", "");
  };

  const handleSubmit = () => {
    const remarks = getValues("remarks") || "";
    if (!remarks.trim()) {
      appToast.show({ msg: "Remarks cannot be empty", color: "error" });
      return;
    }
    callback({ action: "submit", remarks });
    setValue("remarks", "");
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{title}</div>
        <div className="tw:text-sm tw:text-gray-500">
          Please provide your remarks below
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <AppTextarea
          placeholder="Enter remarks..."
          maxLength={500}
          rows={5}
          name="remarks"
          register={register}
          label="Enter Remarks"
          isRequired
          className="tw:mb-4"
        />
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton onClick={handleSubmit}>Submit</AppButton>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default RemarksModal;
