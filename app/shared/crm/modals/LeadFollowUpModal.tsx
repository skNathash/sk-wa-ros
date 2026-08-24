import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { CalendarClock, MapPin, PhoneCall, StickyNote } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import LeadFollowupService from "~/services/LeadFollowupService";
import CustomFieldsInput, {
  type CustomFieldRow,
  toCustomFields,
} from "../components/CustomFieldsInput";

type LeadFollowUpMode = "create" | "close";

interface LeadFollowUpModalProps {
  show: boolean;
  franchiseId: string | null | undefined;
  // "create" logs a brand new follow-up; "close" marks an existing follow-up
  // (identified by `leadId`) as Closed and hides the type / next follow-up
  // fields since neither applies when wrapping one up.
  mode?: LeadFollowUpMode;
  leadId?: string | null;
  callback: (payload: { action: string; data?: any }) => void;
}

interface LeadFollowUpForm {
  type: string;
  status: string;
  remarks: string;
  followUpDateTime: Date | null;
}

// Follow-ups are always scheduled for a future date.
const followUpDateConfig: DayPickerProps = {
  mode: "single",
  disabled: { before: new Date() },
};

// Interaction types shown as quick-tap chips — sourced from the service so
// there's a single source of truth for the available follow-up types.
// Type selection is disabled for now; the type block below is commented out.
// const leadTypes = LeadFollowupService.getTypes();

// Small uppercase eyebrow used to label every section of the call slip.
const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="tw:mb-2 tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
    {children}
    {required && <span className="tw:text-rose-400">*</span>}
  </div>
);

// Initials for the retailer avatar (first two words, e.g. "Sri Mart" → "SM").
const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
};

const defaultValues: LeadFollowUpForm = {
  type: "",
  status: "Open",
  remarks: "",
  followUpDateTime: null,
};

const LeadFollowUpModal = ({
  show,
  franchiseId,
  mode = "create",
  leadId,
  callback,
}: LeadFollowUpModalProps) => {
  const appToast = useAppToast();

  const isCloseMode = mode === "close";

  const close = () => callback({ action: "close" });
  const [submitting, setSubmitting] = useState(false);
  const [loadingFranchise, setLoadingFranchise] = useState(false);
  const [franchise, setFranchise] = useState<any | null>(null);
  // Ad-hoc key/value pairs the user can attach to the follow-up; folded into a
  // `customFields` object on submit.
  const [customFields, setCustomFields] = useState<CustomFieldRow[]>([]);

  const { register, handleSubmit, control, reset } = useForm<LeadFollowUpForm>({
    defaultValues,
  });

  // The store's number comes straight from the franchise record — it isn't
  // editable here, only shown and sent along with the follow-up.
  const mobileNo = franchise?.mobileNo || franchise?.mobile || "";

  // Validate one field at a time and return the first problem as { msg } so the
  // caller can surface it in a toast. Returns null when everything checks out.
  const validateForm = (form: LeadFollowUpForm): { msg: string } | null => {
    if (!/^[0-9]{10}$/.test(mobileNo)) {
      return { msg: "This store has no valid contact number on file" };
    }
    // Type selection is disabled — follow-ups default to a "Followup" type.
    // if (!isCloseMode && !form.type) {
    //   return { msg: "Pick an interaction type" };
    // }
    if (!isCloseMode) {
      if (!form.followUpDateTime) {
        return { msg: "Pick the next follow-up date & time" };
      }
      // Only present/future times are allowed — the date picker already blocks
      // past dates, but a past time on today's date must be caught here.
      if (form.followUpDateTime.getTime() < Date.now()) {
        return { msg: "Next follow-up time can't be in the past" };
      }
    }
    if (!form.remarks?.trim()) {
      return { msg: "Add remarks describing the call" };
    }
    return null;
  };

  // Fetch the franchise details each time the modal opens for a franchise.
  useEffect(() => {
    if (!show || !franchiseId) return;

    let active = true;
    setLoadingFranchise(true);
    setFranchise(null);
    setCustomFields([]);
    reset(defaultValues);

    (async () => {
      try {
        const res = await FranchiseService.getFranchise(franchiseId);
        const data = res?.data?.data || null;
        if (!active) return;
        setFranchise(data);
        reset(defaultValues);
      } catch {
        if (active) {
          appToast.show({
            msg: "Failed to load franchise details",
            color: "danger",
          });
        }
      } finally {
        if (active) setLoadingFranchise(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [show, franchiseId, reset]);

  const onSubmit = async (form: LeadFollowUpForm) => {
    if (!franchise) return;

    const invalid = validateForm(form);
    if (invalid) {
      appToast.show({ msg: invalid.msg, color: "danger" });
      return;
    }

    const masterEmployee = AuthService.getLoggedMasterEmployee();
    if (!masterEmployee) {
      appToast.show({
        msg: "Master login required to log a follow-up",
        color: "danger",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Closing an existing follow-up: only the remarks and a Closed status are
      // sent through the update endpoint against the given leadId.
      if (isCloseMode) {
        if (!leadId) {
          appToast.show({
            msg: "Missing follow-up to close",
            color: "danger",
          });
          return;
        }

        const res = await LeadFollowupService.update(leadId, {
          status: "Completed",
          remarks: form.remarks?.trim(),
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
        return;
      }

      const payload = {
        franchiseId: franchise._id,
        franchiseRefId: franchise.franchiseId,
        franchiseName: franchise.name,
        state: franchise.state,
        district: franchise.district,
        town: franchise.town || franchise.city,
        pincode: franchise.pincode,
        mobileNo,
        type: "Followup",
        status: form.status,
        remarks: form.remarks?.trim(),
        followType: "FOLLOWUP",
        assetIds: [],
        assignedTo: {
          employeeId: masterEmployee.userId,
          email: masterEmployee.email,
          emailAddress: masterEmployee.email,
          name: masterEmployee.name,
        },
        loggedOn: new Date().toISOString(),
        followUpDateTime: form.followUpDateTime
          ? form.followUpDateTime.toISOString()
          : undefined,
        customFields: toCustomFields(customFields),
      };

      const res = await LeadFollowupService.add(payload);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        appToast.show({ msg: "Follow-up logged", color: "success" });
        callback({ action: "created", data: res.data });
      } else {
        appToast.show({
          msg: (res.data as any)?.message || "Failed to log follow-up",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to log follow-up",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const location =
    [franchise?.town || franchise?.city, franchise?.district, franchise?.state]
      .filter(Boolean)
      .join(", ") || "Location unavailable";

  return (
    <AppModal
      show={show}
      callback={close}
      className={isCloseMode ? "tw:h-auto" : "tw:h-[90vh]"}
    >
      <AppModal.Title onClose={close}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-100 tw:text-emerald-700">
            <PhoneCall className="tw:h-4 tw:w-4" />
          </div>
          <div>
            <div className="tw:text-base tw:font-semibold tw:text-gray-900">
              {isCloseMode ? "Mark as closed" : "Log a follow-up"}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              CRM · Call log
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className={isCloseMode ? "tw:h-auto" : "tw:h-[90vh]"}>
        {loadingFranchise ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-10">
            <AppSpinner />
          </div>
        ) : (
          <form
            id="lead-followup-form"
            onSubmit={handleSubmit(onSubmit)}
            className="tw:flex tw:flex-col tw:gap-5 tw:pt-1"
          >
            {/* Store — who this call is with. */}
            <div>
              <FieldLabel>Retailer Details</FieldLabel>
              <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-3">
                <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-sm tw:font-bold tw:text-gray-600 tw:ring-1 tw:ring-gray-200">
                  {getInitials(franchise?.franchiseName || franchise?.name)}
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                    {franchise?.franchiseName || franchise?.name || "Retailer"}
                  </div>
                  <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:text-gray-600">
                    <PhoneCall className="tw:h-3 tw:w-3 tw:shrink-0 tw:text-gray-400" />
                    <span>{mobileNo || "No number on file"}</span>
                    {franchise?.franchiseId && (
                      <>
                        <span className="tw:text-gray-300">•</span>
                        <span className="tw:font-medium tw:text-gray-600">
                          ID {franchise?.franchiseId}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-500">
                    <MapPin className="tw:h-3 tw:w-3 tw:shrink-0 tw:text-gray-400" />
                    <span className="tw:truncate">{location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction type — quick-tap chips (hidden when closing) */}
            {/* Type selection is disabled for now; follow-ups are logged with a
                hardcoded "Followup" type on submit.
            {!isCloseMode && (
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div>
                    <FieldLabel required>Interaction type</FieldLabel>
                    <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                      {leadTypes.map((type) => {
                        const selected = field.value === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              field.onChange(selected ? "" : type.value)
                            }
                            className={
                              "tw:rounded-full tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-colors " +
                              (selected
                                ? "tw:border tw:border-emerald-500 tw:bg-emerald-50 tw:text-emerald-700 tw:ring-1 tw:ring-emerald-500/20"
                                : "tw:border tw:border-gray-200 tw:bg-white tw:text-gray-600 hover:tw:border-gray-300 hover:tw:bg-gray-50")
                            }
                          >
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              />
            )}
            */}

            {/* Next follow-up (hidden when closing) */}
            {!isCloseMode && (
              <Controller
                control={control}
                name="followUpDateTime"
                render={({ field }) => (
                  <div>
                    <FieldLabel required>
                      <CalendarClock className="tw:h-3 tw:w-3" />
                      Next follow-up
                    </FieldLabel>
                    <AppDateInput
                      placeholder="Pick a date & time"
                      value={field.value || undefined}
                      dateConfig={followUpDateConfig}
                      showTime
                      callback={(dt) =>
                        field.onChange(Array.isArray(dt) ? (dt[0] ?? null) : dt)
                      }
                      size="sm"
                      inputClassName="tw:w-full"
                    />
                  </div>
                )}
              />
            )}

            {/* Notes */}
            <div>
              <FieldLabel required>
                <StickyNote className="tw:h-3 tw:w-3" />
                Notes
              </FieldLabel>
              <AppTextarea
                name="remarks"
                placeholder="What was discussed? Any commitments or next steps…"
                register={register}
                inputClassName="tw:w-full"
              />
            </div>

            {/* Custom fields — optional ad-hoc key/value pairs. */}
            {!isCloseMode && (
              <div>
                <FieldLabel>Custom fields</FieldLabel>
                <CustomFieldsInput
                  rows={customFields}
                  onChange={setCustomFields}
                  disabled={submitting}
                />
              </div>
            )}
          </form>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:gap-2">
        <AppButton
          type="submit"
          form="lead-followup-form"
          color="success"
          isLoading={submitting}
          disabled={submitting || loadingFranchise || !franchise}
        >
          Submit
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default LeadFollowUpModal;
