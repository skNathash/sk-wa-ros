import React from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import PickerDeviceService from "~/services/PickerDeviceService";

interface ManagePickerDeviceProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  data?: { _id?: string; status?: string; name?: string; refNo?: string };
}

interface FormValues {
  deviceName: string;
  deviceRefNo: string;
}

function validateDeviceForm(values: FormValues) {
  if (!values.deviceName?.trim()) {
    return { msg: "Device name is required", status: false };
  }
  if (!values.deviceRefNo?.trim()) {
    return { msg: "Device reference number is required", status: false };
  }
  return { msg: "", status: true };
}

const ManagePickerDevice: React.FC<ManagePickerDeviceProps> = ({
  show,
  callback,
  data,
}) => {
  const {
    register,
    handleSubmit,

    reset,
  } = useForm<FormValues>({
    defaultValues: {
      deviceName: data?.name || "",
      deviceRefNo: data?.refNo || "",
    },
  });
  const toast = useAppToast();
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (show) {
      reset({
        deviceName: data?.name || "",
        deviceRefNo: data?.refNo || "",
      });
    }
  }, [show, data, reset]);

  const onSubmit = async (values: FormValues) => {
    const validation = validateDeviceForm(values);
    if (!validation.status) {
      toast.show({ msg: validation.msg, color: "danger" });
      return;
    }
    setSubmitting(true);

    const payload = {
      name: values.deviceName,
      refNo: values.deviceRefNo,
      franchiseId: AuthService.getLoggedInUserId(),
      remarks: "",
      status: data ? data.status : "Active",
    };

    try {
      let res;
      if (data && data._id) {
        // Update
        res = await PickerDeviceService.updatePickerDevice(data._id, payload);
      } else {
        // Create
        res = await PickerDeviceService.createPickerDevice(payload);
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        callback({ action: "success", data: res.data });
      } else {
        toast.show({
          msg: res.data?.message || "Something went wrong",
          color: "danger",
        });
      }
    } catch (e) {
      toast.show({ msg: "Network error", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title noShadow={true} onClose={handleClose}>
        Manage Picker Device
      </AppModal.Title>
      <AppModal.Content className="modal-bg ion-padding">
        <AppCard>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AppInput
              name="deviceName"
              label="Device Name"
              register={register}
              isRequired
              className="tw:mb-4"
            />
            <AppInput
              name="deviceRefNo"
              label="Device Reference Number"
              register={register}
              isRequired
              className="tw:mb-4"
            />
            <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-6">
              <AppButton
                type="button"
                onClick={handleClose}
                fill="outline"
                color="medium"
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                isLoading={submitting}
                disabled={submitting}
              >
                Save
              </AppButton>
            </div>
          </form>
        </AppCard>
      </AppModal.Content>
    </AppModal>
  );
};

export default ManagePickerDevice;
