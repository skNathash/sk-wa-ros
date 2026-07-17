import { Clock, Package, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { useState } from "react";

type Slab = {
  from: number;
  to: number;
  ordersLimit: number;
  _fromHour?: number;
  _fromMins?: number;
  _toHour?: number;
  _toMins?: number;
};

type Props = {
  slabs: Slab[];
  isDefaultEnabled: boolean;
  onAddSlot?: () => void;
  onEditSlot?: (slab: Slab, index: number) => void;
  onRemoveSlot?: (index: number) => void;
};

const SlabsDisplay = ({
  slabs,
  isDefaultEnabled,
  onAddSlot,
  onEditSlot,
  onRemoveSlot,
}: Props) => {
  const { t } = useTranslation(["common"]);

  const [alertDialog, setAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Don't render if default is not enabled
  if (!isDefaultEnabled) {
    return null;
  }

  const formatTime = (hour: number, minutes: number = 0) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  const formatSlabTime = (slab: Slab) => {
    // Use the processed time values if available, otherwise calculate from decimal
    if (slab._fromHour !== undefined && slab._toHour !== undefined) {
      return `${formatTime(slab._fromHour, slab._fromMins || 0)} - ${formatTime(
        slab._toHour,
        slab._toMins || 0
      )}`;
    }

    // Fallback to decimal time conversion
    const fromHour = Math.floor(slab.from);
    const fromMinutes = Math.round((slab.from % 1) * 100); // .3 = 30 minutes
    const toHour = Math.floor(slab.to);
    const toMinutes = Math.round((slab.to % 1) * 100); // .3 = 30 minutes

    return `${formatTime(fromHour, fromMinutes)} - ${formatTime(
      toHour,
      toMinutes
    )}`;
  };

  const handleAddSlot = () => {
    onAddSlot?.();
  };

  const handleEditSlot = (slab: Slab, index: number) => {
    onEditSlot?.(slab, index);
  };

  const handleRemoveSlot = (index: number) => {
    setAlertDialog({
      show: true,
      title: t("removeTimeSlot"),
      description: t("removeTimeSlotConfirmation"),
      onConfirm: async () => {
        setAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, 300));
        onRemoveSlot?.(index);
      },
      onCancel: () => {
        setAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  return (
    <AppCard className="tw:mb-6">
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:mb-4 tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
          <div className="tw:p-2 tw:bg-green-100 tw:rounded-lg tw:flex-shrink-0">
            <Calendar size={20} className="tw:text-green-600" />
          </div>
          <div className="tw:flex-1 tw:min-w-0">
            <h3 className="tw:text-lg tw:font-medium tw:text-gray-900 tw:truncate">
              {t("defaultDeliverySlots")}
            </h3>
            <p className="tw:text-sm tw:text-gray-600 tw:line-clamp-2">
              {t("defaultSlotsDescription")}
            </p>
          </div>
        </div>
        <AppButton
          onClick={handleAddSlot}
          color="primary"
          fill="outline"
          size="small"
          className="tw:w-full tw:sm:w-auto tw:flex-shrink-0"
        >
          <Plus size={16} className="tw:mr-1" />
          {t("addTimeSlot")}
        </AppButton>
      </div>

      {slabs.length === 0 ? (
        <div className="tw:text-center tw:py-8 tw:text-gray-500">
          <Package size={48} className="tw:mx-auto tw:mb-3 tw:text-gray-300" />
          <p className="tw:text-sm">{t("noSlotsConfigured")}</p>
        </div>
      ) : (
        <div className="tw:space-y-3">
          {slabs.map((slab, index) => (
            <div
              key={index}
              className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:gap-3"
            >
              <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:items-center tw:gap-2 tw:flex-1 tw:min-w-0">
                  <Clock
                    size={16}
                    className="tw:text-gray-500 tw:flex-shrink-0"
                  />
                  <span className="tw:text-sm tw:font-medium tw:text-gray-700 tw:break-words">
                    {formatSlabTime(slab)}
                  </span>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2 tw:flex-shrink-0">
                  <Package size={16} className="tw:text-gray-500" />
                  <span className="tw:text-sm tw:text-gray-600">
                    {t("maxOrders")}:
                  </span>
                  <span className="tw:bg-blue-100 tw:text-blue-800 tw:px-2 tw:py-1 tw:rounded tw:text-sm tw:font-medium">
                    {slab.ordersLimit}
                  </span>
                </div>
              </div>

              <div className="tw:flex tw:items-center tw:justify-end tw:gap-1">
                <AppButton
                  onClick={() => handleEditSlot(slab, index)}
                  color="light"
                  fill="outline"
                  size="small"
                  className="tw:p-1 tw:h-8 tw:w-8"
                >
                  <Edit size={14} />
                </AppButton>
                <AppButton
                  onClick={() => handleRemoveSlot(index)}
                  color="danger"
                  fill="outline"
                  size="small"
                  className="tw:p-1 tw:h-8 tw:w-8"
                >
                  <Trash2 size={14} />
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tw:mt-4 tw:p-3 tw:bg-green-50 tw:rounded-lg tw:border tw:border-green-200">
        <p className="tw:text-sm tw:text-green-800">
          <strong>{t("status")}:</strong> {t("defaultSlotsActive")}
        </p>
      </div>

      <AppAlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        description={alertDialog.description}
        onConfirm={alertDialog.onConfirm}
        onCancel={alertDialog.onCancel}
        type="confirm"
        okText={t("remove")}
        cancelText={t("cancel")}
      />
    </AppCard>
  );
};

export default SlabsDisplay;
