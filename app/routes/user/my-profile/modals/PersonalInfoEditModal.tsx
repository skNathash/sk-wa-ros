import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";

interface PersonalInfoEditModalProps {
  show: boolean;
  callback: (a: { action: string }) => void;
  data?: any;
}

interface FormValues {
  name: string;
  email: string;
  dob: Date | null;
}

const validatePersonalInfo = (values: FormValues) => {
  let msg = "";
  if (!values.name) {
    msg = "Name is required";
  } else if (!values.email) {
    msg = "Email is required";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    msg = "Invalid email address";
  } else if (!values.dob) {
    msg = "Date of Birth is required";
  }
  return { msg, status: !msg };
};

const PersonalInfoEditModal: React.FC<PersonalInfoEditModalProps> = ({
  show,
  callback,
  data,
}) => {
  const { register, handleSubmit, control, reset } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    if (show) {
      reset({
        name: data?.storeInfo?.name || "",
        email: data?.email || "",
        dob: data?.dob ? new Date(data.dob) : null,
      });
    }
  }, [show, data, reset]);

  const onSubmit = async (values: FormValues) => {
    const { msg, status } = validatePersonalInfo(values);
    if (!status) {
      toast.show({ msg, color: "danger" });
      return;
    }
    if (!data?._id) {
      toast.show({ msg: "Profile ID not found.", color: "danger" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        storeInfo: {
          name: values.name,
        },
        email: values.email,
        dob: values.dob ? values.dob.toISOString() : null,
      };
      const resp = await FranchiseService.updateFranchise(data._id, payload);
      if (resp && resp.statusCode === 200) {
        toast.show({
          msg: "Personal info updated successfully!",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update personal info.",
          color: "danger",
        });
      }
    } catch (e) {
      toast.show({
        msg: "Failed to update personal info. Please try again.",
        color: "danger",
      });
    }
    setSubmitting(false);
  };

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        Edit Personal Info
      </AppModal.Title>
      <AppModal.Content className="ion-padding modal-bg">
        <AppCard>
          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
            <AppInput
              label="Name"
              name="name"
              register={register}
              className="tw:w-full"
              isRequired
            />
            <AppInput
              label="Email"
              name="email"
              register={register}
              className="tw:w-full"
              isRequired
            />
            <Controller
              control={control}
              name="dob"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <AppDateInput
                  label="Date of Birth"
                  value={value || undefined}
                  callback={(dt) => {
                    if (Array.isArray(dt)) {
                      onChange(dt[0] || null);
                    } else {
                      onChange(dt);
                    }
                  }}
                  className="tw:w-full"
                  error={error?.message}
                  isRequired={true}
                />
              )}
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

export default PersonalInfoEditModal;
