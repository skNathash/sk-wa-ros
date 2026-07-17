import { CircleCheck } from "lucide-react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import PriceForm from "./components/PriceForm";

type FormValues = {
  offerDiscount: number | null;
  offerStartDate: string | null;
  offerEndDate: string | null;
  calculateOn: string;
};

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
};

const GlobalApplyModal: React.FC<Props> = ({ show, callback }) => {
  const appToast = useAppToast();

  const formMethods = useForm<FormValues>({
    defaultValues: {
      offerDiscount: null,
      offerStartDate: null,
      offerEndDate: null,
      calculateOn: "afterTax",
    },
  });

  const { reset, getValues } = formMethods;

  const handleClose = () => {
    callback({ action: "close" });
    reset();
  };

  const validateForm = () => {
    const values = getValues();
    const discount = values.offerDiscount;
    if (discount === null || discount === undefined) {
      return "Scheme discount is required";
    }
    if (isNaN(Number(discount)) || Number(discount) < 0) {
      return "Scheme discount must be a number >= 0";
    }
    if (Number(discount) > 100) {
      return "Scheme discount cannot exceed 100%";
    }
    if (!values.offerStartDate) {
      return "From date is required";
    }
    if (!values.offerEndDate) {
      return "To date is required";
    }
    try {
      const start = new Date(values.offerStartDate as string);
      const end = new Date(values.offerEndDate as string);
      if (end < start) {
        return "To date cannot be before From date";
      }
    } catch (e) {
      // ignore parse errors, but keep basic validation
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
              Apply selected pricing settings to all products in the cart.
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
            <PriceForm />
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
