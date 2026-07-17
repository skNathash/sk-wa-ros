import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import AppButton from "~/components/core/button/AppButton";
import AuthService from "~/services/AuthService";
import AppCard from "~/components/core/card/AppCard";
import GenericUpdateModal from "./GenericUpdateModal";

interface StoreInfoEditModalProps {
  show: boolean;
  callback: (a: { action: string }) => void;
  data?: any;
}

interface FormValues {
  gstNo: string;
  panNo: string;
  addressLine1: string;
  addressLine2: string;
  primaryBusiness: string;
  secondaryBusiness: string;
}

const validateStoreInfo = (values: FormValues) => {
  let msg = "";
  if (values.gstNo && !CommonService.isValidGst(values.gstNo)) {
    msg = "Invalid GST No";
  } else if (values.panNo && !CommonService.isValidPan(values.panNo)) {
    msg = "Invalid PAN No";
  } else if (!values.addressLine1) {
    msg = "Address Line 1 is required";
  } else if (!values.primaryBusiness) {
    msg = "Primary Business is required";
  } else if (!values.secondaryBusiness) {
    msg = "Secondary Business is required";
  }
  return { msg, status: !msg };
};

const StoreInfoEditModal: React.FC<StoreInfoEditModalProps> = ({
  show,
  callback,
  data,
}) => {
  const toast = useAppToast();

  const { register, handleSubmit, setValue, reset } = useForm<FormValues>();
  const [businessOptions, setBusinessOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const [genericModal, setGenericModal] = useState<{
    show: boolean;
    callback: (data: { action: string; data?: any }) => void;
    inputs: Array<string>;
  }>({
    show: false,
    callback: () => {},
    inputs: [],
  });

  useEffect(() => {
    if (show) {
      const fetchBusinessTypes = async () => {
        const res = await FranchiseService.getDocs("businessType");
        const opts = (res?.data || []).map((item: any) => ({
          value: item.name,
          label: item.name,
        }));
        setBusinessOptions(opts);

        if (data) {
          reset({
            gstNo: data.gstNo || "",
            panNo: data.panNo || "",
            addressLine1: data.addressLine1 || "",
            addressLine2: data.addressLine2 || "",
            primaryBusiness: data.primary_business || "",
            secondaryBusiness: data.secondary_business || "",
          });
        }
      };
      fetchBusinessTypes();
    }
  }, [show, data, reset]);

  const onSubmit = async (values: FormValues) => {
    const { msg, status } = validateStoreInfo(values);
    if (!status) {
      toast.show({ msg, color: "danger" });
      return;
    }
    if (!data?._id || !data.sk_franchise_details) {
      toast.show({ msg: "Profile ID not found.", color: "danger" });
      return;
    }
    setSubmitting(true);
    try {
      const user = AuthService.getLoggedInUser();

      const payload = {
        finance_details: {
          ...(user.finance_details || {}),
          gstNo: values.gstNo,
          pan_no: values.panNo,
        },
        address: {
          ...(user.address || {}),
          line1: values.addressLine1,
          line2: values.addressLine2,
        },
        primary_business: values.primaryBusiness,
        secondary_business: values.secondaryBusiness,
      };
      const resp = await FranchiseService.updateFranchise(data._id, payload);
      if (resp && resp.statusCode === 200) {
        toast.show({
          msg: "Store info updated successfully!",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update store info.",
          color: "danger",
        });
      }
    } catch (e) {
      toast.show({
        msg: "Failed to update store info. Please try again.",
        color: "danger",
      });
    }
    setSubmitting(false);
  };

  return (
    <>
      <AppModal show={show} callback={callback} className="offcanvas-modal">
        <AppModal.Title onClose={() => callback({ action: "close" })}>
          Edit Store Info
        </AppModal.Title>
        <AppModal.Content className="ion-padding modal-bg">
          <AppCard>
            <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
              <AppInput
                label="GST No"
                name="gstNo"
                register={register}
                className="tw:w-full"
              />
              <AppInput
                label="PAN No"
                name="panNo"
                register={register}
                className="tw:w-full"
              />
              <AppInput
                label="Address Line 1"
                name="addressLine1"
                register={register}
                className="tw:w-full"
                isRequired
              />
              <AppInput
                label="Address Line 2"
                name="addressLine2"
                register={register}
                className="tw:w-full"
              />
              <AppSelect
                label="Primary Business"
                name="primaryBusiness"
                options={[
                  { value: "", label: "Select Primary Business" },
                  ...businessOptions,
                ]}
                register={register}
                className="tw:w-full"
                isRequired
              />
              <AppSelect
                label="Secondary Business"
                name="secondaryBusiness"
                options={[
                  { value: "", label: "Select Secondary Business" },
                  ...businessOptions,
                ]}
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

      <GenericUpdateModal
        show={genericModal.show}
        callback={genericModal.callback}
        inputs={genericModal.inputs}
      />
    </>
  );
};

export default StoreInfoEditModal;
