import { CircleCheck } from "lucide-react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import CaseForm from "./components/CaseForm";

type FormValues = {
  packageQty: number | null;
  allowPackageOverride: boolean;
  packageType: string;
};

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
};

const GlobalApplyModal: React.FC<Props> = ({ show, callback }) => {
  const appToast = useAppToast();

  const formMethods = useForm<FormValues>({
    defaultValues: {
      packageQty: null,
      allowPackageOverride: false,
      packageType: "Choose",
    },
  });

  const { reset, getValues } = formMethods;

  const handleClose = () => {
    callback({ action: "close" });
    reset();
  };

  const validateForm = () => {
    const values = getValues();
    if (!values.packageType || values.packageType === "Choose") {
      return "Sell In is required";
    }
    if (values.packageType !== "Unit" && (!values.packageQty || values.packageQty <= 0)) {
      return "Package quantity is required and must be greater than 0";
    }
  };

  const onSubmit = () => {
    const error = validateForm();
    if (error) {
      appToast.show({ msg: error, color: "danger" });
      return;
    }

    callback({ action: "submit", data: getValues() });
    reset();
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-start tw:gap-2">
          <div className="tw:mt-0.5 tw:text-primary-600">
            <CircleCheck size={18} />
          </div>
          <div>
            <div className="tw:font-semibold">Apply Global</div>
            <div className="tw:text-xs tw:text-gray-500">
              Apply selected settings to all products in the cart.
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <FormProvider {...formMethods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <CaseForm />
          </form>
        </FormProvider>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:p-2 tw:gap-2">
          <AppButton fill="clear" onClick={handleClose} type="button">
            Cancel
          </AppButton>
          <AppButton type="submit" color="primary" onClick={onSubmit}>
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default GlobalApplyModal;
