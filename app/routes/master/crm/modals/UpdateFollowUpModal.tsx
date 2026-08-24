import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import {
  CalendarClock,
  CheckCircle2,
  PencilLine,
  PhoneCall,
  StickyNote,
  UserRound,
} from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import LeadFollowupService from "~/services/LeadFollowupService";
import type { VariantColor } from "~/types/CommonTypes";
import CustomFieldsInput, {
  type CustomFieldRow,
  fromCustomFields,
  toCustomFields,
} from "~/shared/crm/components/CustomFieldsInput";
import type { FollowUpDetail, FollowUpRemarkLog } from "./FollowUpDetailsModal";

// A rescheduled follow-up is always set in the future.
const rescheduleDateConfig: DayPickerProps = {
  mode: "single",
  disabled: { before: new Date() },
};

// Interaction types offered when reclassifying a follow-up.
const followUpTypes = LeadFollowupService.getTypes();

interface UpdateFollowUpModalProps {
  show: boolean;
  followup: FollowUpDetail | null;
  callback: (payload: { action: string; data?: any }) => void;
}

interface UpdateForm {
  // One shared note field feeds both actions: an update logs it as the latest
  // remark, closing logs it as the closing remark.
  remarks: string;
  nextDate: Date | null;
  type: string;
  // Editable key/value pairs, seeded from the follow-up's existing customFields.
  customFields: CustomFieldRow[];
}

const defaultValues: UpdateForm = {
  remarks: "",
  nextDate: null,
  type: "",
  customFields: [],
};

// Section label for each field of the update slip. Sentence-case, sized as a
// real form label (not a decorative micro-eyebrow) so it stays legible.
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="tw:mb-1.5 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-gray-700">
    {children}
  </div>
);

const UpdateFollowUpModal = ({
  show,
  followup,
  callback,
}: UpdateFollowUpModalProps) => {
  const appToast = useAppToast();

  const close = () => callback({ action: "close" });

  // "update" appends a remark / reschedules / retypes; "close" wraps it up.
  const [submitting, setSubmitting] = useState<null | "update" | "close">(null);

  // Closing is irreversible, so gate it behind a confirmation dialog.
  const [confirmClose, setConfirmClose] = useState(false);

  const { register, handleSubmit, reset, control, getValues } =
    useForm<UpdateForm>({ defaultValues });

  // Reset the editable fields each time the modal (re)opens, seeding the type
  // chip from the follow-up's current classification.
  useEffect(() => {
    if (show) {
      reset({
        remarks: "",
        // Pre-fill the reschedule field with the currently scheduled follow-up
        // date so it isn't lost; treated as "unchanged" unless the user edits it.
        nextDate: followup?.followUpDateTime
          ? new Date(followup.followUpDateTime)
          : null,
        type: followup?.type || "",
        customFields: fromCustomFields((followup as any)?.customFields),
      });
    }
  }, [show, followup?._id, followup?.type, followup?.followUpDateTime, reset]);

  // The latest remark for context, so the user isn't updating blind.
  const lastRemark = useMemo(() => {
    const log = followup?.remarksLog;
    if (Array.isArray(log) && log.length) return log[log.length - 1];
    if (followup?.remarks) {
      return {
        remarks: followup.remarks,
        updatedOn: followup.createdAt,
        updatedBy: followup.employee,
      } as FollowUpRemarkLog;
    }
    return null;
  }, [followup]);

  // Save an update to an open follow-up: append the remark, reschedule the next
  // follow-up date and/or reclassify the type.
  const onSaveUpdate = async (form: UpdateForm) => {
    if (!followup?._id) {
      appToast.show({ msg: "Missing follow-up to update", color: "danger" });
      return;
    }

    const trimmedRemarks = form.remarks.trim();
    if (!trimmedRemarks) {
      appToast.show({ msg: "Add a remark before saving", color: "danger" });
      return;
    }
    if (!form.nextDate) {
      appToast.show({
        msg: "Pick the next follow-up date & time",
        color: "danger",
      });
      return;
    }
    // The calendar blocks past dates, but a past time on today's date must be
    // caught here.
    if (form.nextDate.getTime() < Date.now()) {
      appToast.show({
        msg: "Next follow-up time can't be in the past",
        color: "danger",
      });
      return;
    }

    const payload: Record<string, any> = {
      remarks: trimmedRemarks,
      customFields: toCustomFields(form.customFields),
      followUpDateTime: form.nextDate.toISOString(),
    };
    if (form.type) payload.type = form.type;

    setSubmitting("update");
    try {
      const res = await LeadFollowupService.update(followup._id, payload);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        appToast.show({ msg: "Follow-up updated", color: "success" });
        callback({ action: "updated", data: res.data });
      } else {
        appToast.show({
          msg: (res.data as any)?.message || "Failed to update follow-up",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to update follow-up",
        color: "danger",
      });
    } finally {
      setSubmitting(null);
    }
  };

  // Validate first, then ask for confirmation before the irreversible close.
  const onMarkClose = () => {
    if (!followup?._id) {
      appToast.show({ msg: "Missing follow-up to close", color: "danger" });
      return;
    }
    if (!getValues("remarks").trim()) {
      appToast.show({
        msg: "Please provide remarks to close",
        color: "danger",
      });
      return;
    }
    setConfirmClose(true);
  };

  const onConfirmClose = async () => {
    setConfirmClose(false);
    if (!followup?._id) return;
    const trimmedRemarks = getValues("remarks").trim();
    if (!trimmedRemarks) return;

    setSubmitting("close");
    try {
      const res = await LeadFollowupService.update(followup._id, {
        status: "Completed",
        closedRemarks: trimmedRemarks,
      });

      if (res.statusCode >= 200 && res.statusCode < 300) {
        appToast.show({ msg: "Follow-up closed", color: "success" });
        callback({ action: "closed", data: res.data });
      } else {
        appToast.show({
          msg: (res.data as any)?.message || "Failed to close follow-up",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to close follow-up",
        color: "danger",
      });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <>
    <AppModal show={show} callback={close} className="tw:max-h-[85vh]">
      <AppModal.Title onClose={close}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-indigo-100 tw:text-indigo-700">
            <PencilLine className="tw:h-4 tw:w-4" />
          </div>
          <div>
            <div className="tw:text-base tw:font-semibold tw:text-gray-900">
              Update follow-up
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              CRM ·{" "}
              {followup?.referenceId
                ? `Ref ${followup.referenceId}`
                : "Call log"}
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {!followup ? (
          <div className="tw:py-10 tw:text-center tw:text-sm tw:text-gray-500">
            No follow-up selected.
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-4 tw:pt-1">
            {/* Context header — who this is for, its state and current date. */}
            <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50/70 tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-xs tw:font-bold tw:text-gray-600 tw:ring-1 tw:ring-gray-200">
                  {followup.initial || "?"}
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                    {followup.franchiseName || "Retailer"}
                  </div>
                  <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:text-gray-500">
                    {followup.mobileNo && (
                      <span className="tw:flex tw:items-center tw:gap-1">
                        <PhoneCall className="tw:h-3 tw:w-3 tw:shrink-0 tw:text-gray-400" />
                        {followup.mobileNo}
                      </span>
                    )}
                  </div>
                </div>
                {followup.status && (
                  <AppBadge
                    variant={
                      (followup._statusColor as VariantColor) || "default"
                    }
                  >
                    {followup._statusLabel || followup.status}
                  </AppBadge>
                )}
              </div>

              {lastRemark && (
                <div className="tw:mt-3 tw:border-t tw:border-gray-200 tw:pt-2.5">
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                    <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-gray-600">
                      <StickyNote className="tw:h-3.5 tw:w-3.5 tw:text-gray-400" />
                      Latest remark
                    </span>
                    {(lastRemark.followedUpOn || lastRemark.updatedOn) && (
                      <span className="tw:text-[11px] tw:text-gray-400">
                        <DateFormat
                          value={
                            lastRemark.followedUpOn || lastRemark.updatedOn || null
                          }
                          formatStr="dd MMM yyyy, hh:mm a"
                        />
                      </span>
                    )}
                  </div>
                  <p className="tw:mt-1 tw:line-clamp-2 tw:whitespace-pre-wrap tw:break-words tw:text-[13px] tw:text-gray-700">
                    {lastRemark.remarks || "-"}
                  </p>
                  {lastRemark.updatedBy?.name && (
                    <span className="tw:mt-1 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-gray-400">
                      <UserRound className="tw:h-3 tw:w-3" />
                      by {lastRemark.updatedBy.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Update form — the reason this modal exists, front and centre. */}
            <div>
              <FieldLabel>
                <PencilLine className="tw:h-3 tw:w-3" />
                Add a remark
                <span className="tw:text-rose-400">*</span>
              </FieldLabel>
              <AppTextarea
                name="remarks"
                register={register}
                rows={3}
                maxLength={1000}
                placeholder="What happened on this follow-up?"
                inputClassName="tw:w-full"
              />

              <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-end tw:gap-3">
                <div className="tw:min-w-[220px] tw:flex-1">
                  <FieldLabel>
                    <CalendarClock className="tw:h-3 tw:w-3" />
                    Reschedule next follow-up
                    <span className="tw:text-rose-400">*</span>
                  </FieldLabel>
                  <Controller
                    name="nextDate"
                    control={control}
                    render={({ field }) => (
                      <AppDateInput
                        placeholder="Pick a new date & time"
                        value={field.value || undefined}
                        dateConfig={rescheduleDateConfig}
                        showTime
                        callback={(dt) =>
                          field.onChange(
                            Array.isArray(dt) ? (dt[0] ?? null) : dt,
                          )
                        }
                        size="sm"
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                </div>

                <div>
                  <FieldLabel>Type</FieldLabel>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                        {followUpTypes.map((t) => {
                          const selected = field.value === t.value;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() =>
                                field.onChange(selected ? "" : t.value)
                              }
                              className={
                                "tw:rounded-full tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-indigo-500/40 " +
                                (selected
                                  ? "tw:border tw:border-indigo-500 tw:bg-indigo-50 tw:text-indigo-700 tw:ring-1 tw:ring-indigo-500/20"
                                  : "tw:border tw:border-gray-200 tw:bg-white tw:text-gray-600 tw:hover:border-gray-300 tw:hover:bg-gray-50")
                              }
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="tw:mt-4">
                <FieldLabel>Custom fields</FieldLabel>
                <Controller
                  name="customFields"
                  control={control}
                  render={({ field }) => (
                    <CustomFieldsInput
                      rows={field.value}
                      onChange={field.onChange}
                      disabled={!!submitting}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:flex-row tw:items-center tw:justify-between tw:gap-3">
          {/* Closing is the secondary path — a quiet inline link, not a rival
              button — so "Save update" stays the clear primary action. */}
          <button
            type="button"
            onClick={onMarkClose}
            disabled={!!submitting || !followup}
            className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-md tw:text-left tw:text-sm tw:text-gray-500 tw:transition-colors tw:hover:text-gray-700 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-emerald-500/40 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
          >
            {submitting === "close" ? (
              <AppSpinner size="xs" />
            ) : (
              <CheckCircle2 className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-emerald-500" />
            )}
            <span>Done with this retailer?</span>
            <span className="tw:font-semibold tw:text-emerald-600 tw:underline tw:underline-offset-2">
              Mark as closed
            </span>
          </button>
          <AppButton
            color="primary"
            isLoading={submitting === "update"}
            disabled={!!submitting || !followup}
            onClick={handleSubmit(onSaveUpdate)}
          >
            Save update
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>

    <AppAlertDialog
      show={confirmClose}
      title="Mark follow-up as closed?"
      description="This will close the follow-up for this retailer and can't be undone."
      okText="Mark as closed"
      cancelText="Cancel"
      onConfirm={onConfirmClose}
      onCancel={() => setConfirmClose(false)}
    />
    </>
  );
};

export default UpdateFollowUpModal;
