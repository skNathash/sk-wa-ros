import { CircleCheck } from "lucide-react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
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
  callback: (args: { action: string; data?: any }) => void;
  data?: any;
};

const EditModal = ({ show, callback, data }: Props) => {
  const { show: showToast } = useAppToast();
  const formMethods = useForm<FormValues>({
    defaultValues: {
      packageQty: null,
      allowPackageOverride: false,
      packageType: "Choose",
    },
  });

  const { reset, getValues, setValue } = formMethods;

  useEffect(() => {
    if (show && data) {
      const fd = data.formData || {};
      reset({
        packageQty: fd.packageQty ?? null,
        allowPackageOverride: fd.allowPackageQtyOverride === true,
        packageType: fd.packageType ?? "Choose",
      });
    }
    if (!show) {
      reset();
    }
  }, [show, data, reset]);

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
      showToast({ msg: error, color: "error" });
      return;
    }
    // include original id so parent can find the product
    callback({ action: "submit", data: { _id: data?._id, ...getValues() } });
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
            <div className="tw:font-semibold">Edit Product</div>
            <div className="tw:text-xs tw:text-gray-500">
              Update the configuration for the selected product.
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
            {data?.dealInfo && (
              <div className="tw:mb-3 tw:p-2 tw:border tw:rounded tw:bg-gray-50">
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div className="tw:w-16 tw:h-16 tw:shrink-0">
                    <ImgRender
                      assetId={
                        (data.dealInfo.images && data.dealInfo.images[0]) ||
                        undefined
                      }
                      alt={data.dealInfo.dealName || data.dealInfo.name}
                      className="tw:w-full tw:h-full tw:object-contain"
                      size="200x200"
                    />
                  </div>
                  <div className="tw:flex-1">
                    <div className="tw:font-medium">
                      {data.dealInfo.dealName || data.dealInfo.name}
                    </div>
                    <div className="tw:text-xs tw:text-gray-600">
                      {data.dealInfo.dealRefId || data.dealInfo.dealId}
                      {data.dealInfo.mrp ? ` • MRP: ₹${data.dealInfo.mrp}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditModal;
