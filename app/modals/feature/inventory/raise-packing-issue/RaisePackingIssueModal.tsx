import { AlertTriangle } from "lucide-react";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import RackBinService from "~/services/RackBinService";

type Props = {
  show: boolean;
  callback: (p: { action: string; data?: any }) => void;
  dealId?: string | number;
  dealRefId?: string | number;
  dealName?: string;
  pickedQty?: number;
  scannedQty?: number;
  pickingId: string;
  snapshots?: Array<any>;
};

const reasons = [
  { value: "Damaged", label: "Damaged" },
  { value: "Missing", label: "Missing" },
  { value: "WrongItem", label: "Wrong item" },
  { value: "Other", label: "Other" },
];

const RaisePackingIssueModal: React.FC<Props> = ({
  show,
  callback,
  dealId,
  dealName,
  dealRefId,
  pickedQty = 0,
  scannedQty = 0,
  pickingId,
  snapshots: propSnapshots,
}) => {
  const { show: showToast } = useAppToast();

  const { register, control, getValues, setValue, handleSubmit } = useForm({
    defaultValues: {
      reason: "",
      units: pickedQty - scannedQty || 0,
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    callback?.({ action: "close", data: {} });
  };

  const onSubmit = async (data: any) => {
    // validate on submit and surface errors via toast
    const reasonVal = data.reason || "";
    const units = Number(data.units || 0);

    if (!reasonVal || String(reasonVal).trim() === "") {
      showToast({ msg: "Please select a reason", color: "error" });
      return;
    }

    if (Number.isNaN(units) || units === 0) {
      showToast({
        msg: "Please enter a quantity greater than zero",
        color: "error",
      });
      return;
    }

    if (units < 0) {
      showToast({ msg: "Quantity cannot be negative", color: "error" });
      return;
    }

    setSubmitting(true);

    const payload: Record<string, any> = {
      remarks: data.reason || "",
      dealId: String(dealId || ""),
      quantity: units,
    };

    // if parent provided snapshots array, compute consumed snapshots based on units
    if (Array.isArray(propSnapshots) && propSnapshots.length > 0) {
      let remainingToTake = units;
      const consumed: Array<Record<string, any>> = [];

      // iterate snapshots in order and consume quantities
      for (const s of propSnapshots) {
        if (remainingToTake <= 0) break;
        const sid = s.snapshotId;
        let avail = Number(s.quantity ?? 0) || 0;
        if (!sid || avail <= 0) continue;

        const take = Math.min(avail, remainingToTake);
        if (take > 0) {
          consumed.push({ id: String(sid), quantity: take });
          remainingToTake -= take;
        }
      }

      // if we couldn't cover requested units from snapshots, show error
      if (remainingToTake > 0) {
        showToast({
          msg: "Not enough snapshot quantity available",
          color: "error",
        });
        setSubmitting(false);
        return;
      }

      // attach consumed snapshots to payload
      if (consumed.length > 0) payload.snapshots = consumed;
    }

    try {
      if (pickingId) {
        const resp = await RackBinService.removePickedItem(pickingId, payload);
        if (resp?.statusCode === 200) {
          showToast({
            msg: "Issue raised and item removed from picking",
            color: "success",
          });
          callback?.({ action: "raise", data: payload });
        } else {
          showToast({
            msg: resp?.data?.message || "Failed to remove picked item",
            color: "danger",
          });
        }
      } else {
        // fallback: just forward payload
        callback?.({ action: "raise", data: payload });
      }
    } catch (err: any) {
      showToast({
        msg: err?.message || "Error while removing picked item",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnitsChange = () => {
    const value = getValues("units");
    const max = pickedQty - scannedQty;
    if (value > max) {
      setValue("units", max);
    } else if (value < 0) {
      setValue("units", 0);
    }
  };

  // location input removed

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-2xl">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:flex-shrink-0 tw:self-center">
            <AlertTriangle size={18} />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-lg tw:font-medium">Raise packing issue</div>
            <div className="tw:text-xs tw:text-red-600 tw:mt-1"></div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:text-sm tw:mb-3 tw:bg-gray-100 tw:p-4 tw:rounded-lg">
          <div className="tw:font-medium tw:mb-1">{dealName}</div>
          <div className="tw:text-xs tw:text-slate-600 tw:mb-2">
            Deal ID: {dealRefId}
          </div>
          <div className="tw:text-xs tw:text-slate-600 tw:mt-1 tw:flex tw:gap-4">
            <span className="tw:font-medium tw:text-red-600">
              Picked: {pickedQty}
            </span>
            <span className="tw:font-medium tw:text-emerald-600">
              Packed: {scannedQty}
            </span>
          </div>
        </div>

        <div className="tw:space-y-3">
          <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:items-end">
            <div>
              <Controller
                control={control}
                name="reason"
                render={({ field }) => (
                  <AppSelect
                    label="Reason"
                    options={reasons}
                    placeholder="Select reason"
                    inputClassName="tw:w-full"
                    onChange={field.onChange}
                    value={field.value}
                    isRequired={true}
                  />
                )}
              />
            </div>

            <div>
              <AppInput
                name="units"
                label="Units to raise"
                type="number"
                inputClassName="tw:w-full"
                register={register}
                onChange={handleUnitsChange}
                isRequired={true}
              />
            </div>
          </div>

          {/* location input removed */}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-2">
          <AppButton fill="clear" onClick={handleClose} disabled={submitting}>
            Cancel
          </AppButton>
          <AppButton onClick={handleSubmit(onSubmit)} disabled={submitting}>
            Submit
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RaisePackingIssueModal;
