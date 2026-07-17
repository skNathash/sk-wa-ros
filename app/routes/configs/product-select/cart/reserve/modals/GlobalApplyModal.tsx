import { CircleCheck } from "lucide-react";
import React from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import { AppSelect } from "~/components/core/form";

type FormValues = {
  enableReserve: "yes" | "no" | "";
};

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
};

const reserveOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const GlobalApplyModal: React.FC<Props> = ({ show, callback }) => {
  const appToast = useAppToast();

  const formMethods = useForm<FormValues>({
    defaultValues: {
      enableReserve: "",
    },
  });

  const { reset, getValues, control } = formMethods;

  const handleClose = () => {
    callback({ action: "close" });
    reset();
  };

  const validateForm = () => {
    const values = getValues();
    if (values.enableReserve === "") {
      return "Please select Yes or No to enable reserve globally";
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
            <div className="tw:mb-4">
              <label className="tw:block tw:text-sm tw:font-medium tw:mb-1">
                Enable Reserve
              </label>
              <Controller
                control={control}
                name="enableReserve"
                render={({ field }) => {
                  return (
                    <AppSelect
                      size="sm"
                      options={reserveOptions}
                      value={field.value}
                      onChange={field.onChange}
                      inputClassName="tw:w-full"
                    />
                  );
                }}
              />
            </div>
          </form>
        </FormProvider>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:p-2 tw:gap-2">
          <AppButton fill="clear" onClick={handleClose} type="button">
            Cancel
          </AppButton>
          <AppButton type="submit" color="primary" onClick={onSubmit}>
            <CircleCheck size={16} />
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default GlobalApplyModal;
