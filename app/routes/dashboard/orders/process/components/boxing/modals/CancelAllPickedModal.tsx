import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Package, AlertTriangle } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppCard from "~/components/core/card/AppCard";
import RackBinService from "~/services/RackBinService";
import useAppToast from "~/hooks/useAppToast";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

interface CancelAllPickedModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  products: any[];
  activePickingId?: string;
}

interface FormData {
  remarks: string;
}

const CancelAllPickedModal: React.FC<CancelAllPickedModalProps> = ({
  show,
  callback,
  products,
  activePickingId,
}) => {
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useAppToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      remarks: "",
    },
  });

  // Calculate summary data
  const totalProducts = products?.length || 0;
  const totalUnits =
    products?.reduce((sum, product) => {
      return sum + (Number(product.pickedQty) || 0);
    }, 0) || 0;

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const onSubmit = async (data: FormData) => {
    if (!data.remarks.trim()) {
      showToast({
        msg: "Remarks cannot be empty",
        color: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch picking for this order and cancel using the first picking id
      const pickingResp = await RackBinService.getPickingDetail(
        activePickingId || ""
      );

      if (pickingResp?.statusCode === 200 && pickingResp.data?.data?._id) {
        const pickId = pickingResp.data.data._id;
        const cancelResp = await RackBinService.cancelPicking(
          pickId,
          data.remarks
        );

        if (cancelResp?.statusCode === 200) {
          showToast({
            msg: "All picked items cancelled successfully",
            color: "success",
          });
          callback({ action: "submit", data: { success: true } });
        } else {
          showToast({
            msg: cancelResp.data?.message || "Failed to cancel picked items",
            color: "error",
          });
        }
      } else {
        showToast({
          msg: "No active picking found for this order",
          color: "error",
        });
      }
    } catch (err) {
      console.error("Error cancelling picked items:", err);
      showToast({
        msg: "Error cancelling picked items",
        color: "error",
      });
    } finally {
      setLoading(false);
      reset();
    }
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <AlertTriangle className="tw:w-5 tw:h-5 tw:text-red-500" />
          <div className="tw:font-semibold tw:text-red-700">
            Cancel All Picked Items
          </div>
        </div>
        <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
          This action will cancel all picked items for this order
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-4">
          {/* Summary Card */}
          <AppCard className="tw:bg-red-50 tw:border-red-200">
            <div className="tw:space-y-3">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                <Package className="tw:w-4 tw:h-4 tw:text-red-600" />
                <div className="tw:font-medium tw:text-red-800">Summary</div>
              </div>

              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <div className="tw:bg-white tw:rounded-lg tw:p-3 tw:border tw:border-red-200">
                  <div className="tw:text-sm tw:text-gray-600 tw:mb-1">
                    Total Products
                  </div>
                  <div className="tw:text-2xl tw:font-bold tw:text-red-700">
                    {totalProducts}
                  </div>
                </div>

                <div className="tw:bg-white tw:rounded-lg tw:p-3 tw:border tw:border-red-200">
                  <div className="tw:text-sm tw:text-gray-600 tw:mb-1">
                    Total Units
                  </div>
                  <div className="tw:text-2xl tw:font-bold tw:text-red-700">
                    {totalUnits}
                  </div>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Remarks Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="tw:mb-4">
              <AppTextarea
                label="Cancellation Remarks"
                placeholder="Please provide a reason for cancelling all picked items..."
                rows={4}
                isRequired
                error={errors.remarks?.message}
                maxLength={500}
                className="tw:mb-2"
                name="remarks"
                register={register}
                rules={{
                  required: "Remarks are required",
                  minLength: {
                    value: 10,
                    message: "Remarks must be at least 10 characters long",
                  },
                }}
              />
              <div className="tw:text-xs tw:text-gray-500">
                Please provide a detailed reason for cancelling all picked items
                (minimum 10 characters)
              </div>
            </div>
          </form>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:justify-end">
          <AppButton
            color="light"
            fill="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </AppButton>
          <AppButton
            color="danger"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <div className="tw:flex tw:items-center tw:gap-2">
                <AppSpinner />
                <span>Cancelling...</span>
              </div>
            ) : (
              <div className="tw:flex tw:items-center tw:gap-2">
                <X className="tw:w-4 tw:h-4" />
                <span>Cancel All Picked</span>
              </div>
            )}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CancelAllPickedModal;
