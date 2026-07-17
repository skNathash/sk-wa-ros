import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import useAppToast from "~/hooks/useAppToast";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import PosService from "~/services/PosService";
import AuthService from "~/services/AuthService";

interface Props {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  locationName?: string;
  location?: string;
  rack?: string;
  bin?: string;
  binItemsCapacity?: number;
  binUnitsCapacity?: number;
  locationId?: string;
  configId?: string;
  rackId?: string;
  binId?: string;
}

type FormValues = {
  binUnitsCapacity: number;
  binItemsCapacity: number;
};

const ManageRackBinModal = ({
  show,
  callback,
  locationName,
  location,
  rack,
  rackId,
  bin,
  binItemsCapacity,
  binUnitsCapacity,
  locationId,
  configId,
  binId,
}: Props) => {
  const { show: showToast } = useAppToast();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      binUnitsCapacity: binUnitsCapacity ?? 0,
      binItemsCapacity: binItemsCapacity ?? 0,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      reset({
        binUnitsCapacity: binUnitsCapacity ?? 0,
        binItemsCapacity: binItemsCapacity ?? 0,
      });
    }
  }, [show, binUnitsCapacity, binItemsCapacity, reset]);

  const onSubmit = async (data: FormValues) => {
    if (data.binUnitsCapacity <= 0 || data.binItemsCapacity <= 0) {
      showToast({ msg: "Both limits must be greater than 0", color: "danger" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        location: locationName,
        code: locationId,
        configId: configId,
        rackId: rackId,
        binId: binId,
        remarks: "",
        qtyLimit: Number(data.binUnitsCapacity),
        itemsLimit: Number(data.binItemsCapacity),
      };
      const response = await PosService.updateBinDetails(payload);
      if (response.statusCode === 200) {
        showToast({ msg: "Bin updated successfully", color: "success" });
        callback({ action: "save", data });
      } else {
        showToast({
          msg: response.data?.message || "Failed to update bin",
          color: "danger",
        });
      }
    } catch (error) {
      showToast({ msg: "Failed to update bin", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title noShadow onClose={() => callback({ action: "close" })}>
        Manage Bin Limits
      </AppModal.Title>
      <AppModal.Content className="modal-bg ion-padding">
        <AppCard>
          <div className="tw:mb-4">
            <div className="tw:grid tw:grid-cols-3 tw:gap-4">
              <div className="tw:bg-gray-50 tw:p-2 tw:rounded">
                <div className="tw:text-xs tw:text-gray-500">Location</div>
                <div className="tw:text-lg tw:font-semibold">
                  {locationName || location}
                </div>
              </div>
              <div className="tw:bg-gray-50 tw:p-2 tw:rounded">
                <div className="tw:text-xs tw:text-gray-500">Rack</div>
                <div className="tw:text-lg tw:font-semibold">{rack ?? "-"}</div>
              </div>
              <div className="tw:bg-gray-50 tw:p-2 tw:rounded">
                <div className="tw:text-xs tw:text-gray-500">Bin</div>
                <div className="tw:text-lg tw:font-semibold">{bin ?? "-"}</div>
              </div>
            </div>
            <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mt-4">
              <div className="tw:bg-gray-50 tw:p-2 tw:rounded">
                <div className="tw:text-xs tw:text-gray-500">
                  Bin Items Capacity
                </div>
                <div className="tw:text-lg tw:font-semibold">
                  {binItemsCapacity ?? "-"}
                </div>
              </div>
              <div className="tw:bg-gray-50 tw:p-2 tw:rounded">
                <div className="tw:text-xs tw:text-gray-500">
                  Bin Units Capacity
                </div>
                <div className="tw:text-lg tw:font-semibold">
                  {binUnitsCapacity ?? "-"}
                </div>
              </div>
            </div>
          </div>
        </AppCard>
        <AppCard>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AppInput
              name="binUnitsCapacity"
              label="Bin Stock Limit"
              type="number"
              register={register}
              rules={{
                required: "Required",
                min: { value: 1, message: "Must be > 0" },
              }}
              error={errors.binUnitsCapacity?.message}
              className="tw:mb-4"
              isRequired
            />
            <AppInput
              name="binItemsCapacity"
              label="Bin Items Limit"
              type="number"
              register={register}
              rules={{
                required: "Required",
                min: { value: 1, message: "Must be > 0" },
              }}
              error={errors.binItemsCapacity?.message}
              className="tw:mb-4"
              isRequired
            />
            <div className="tw:flex tw:justify-end tw:gap-2">
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

export default ManageRackBinModal;
