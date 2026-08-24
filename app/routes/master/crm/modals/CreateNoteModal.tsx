import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, PhoneCall, StickyNote } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import LeadFollowupService from "~/services/LeadFollowupService";

// The follow-up "type" used to distinguish a note from a real follow-up. Notes
// are logged through the same add endpoint, tagged with this type.
const NOTE_TYPE = "NOTE";

interface CreateNoteModalProps {
  show: boolean;
  franchiseId: string | null | undefined;
  callback: (payload: { action: string; data?: any }) => void;
}

interface NoteForm {
  remarks: string;
}

// Small uppercase eyebrow used to label every section of the note slip.
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

const defaultValues: NoteForm = {
  remarks: "",
};

const CreateNoteModal = ({
  show,
  franchiseId,
  callback,
}: CreateNoteModalProps) => {
  const appToast = useAppToast();

  const close = () => callback({ action: "close" });
  const [submitting, setSubmitting] = useState(false);
  const [loadingFranchise, setLoadingFranchise] = useState(false);
  const [franchise, setFranchise] = useState<any | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<NoteForm>({
    defaultValues,
  });
  const remarks = watch("remarks");

  // The store's number comes straight from the franchise record — it isn't
  // editable here, only shown and sent along with the note.
  const mobileNo = franchise?.mobileNo || franchise?.mobile || "";

  // Fetch the franchise details each time the modal opens for a franchise.
  useEffect(() => {
    if (!show || !franchiseId) return;

    let active = true;
    setLoadingFranchise(true);
    setFranchise(null);
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

  const onSubmit = async (form: NoteForm) => {
    if (!franchise) return;

    if (!form.remarks?.trim()) {
      appToast.show({ msg: "Add a note before saving", color: "danger" });
      return;
    }

    // const masterEmployee = AuthService.getLoggedMasterEmployee();
    // if (!masterEmployee) {
    //   appToast.show({
    //     msg: "Master login required to add a note",
    //     color: "danger",
    //   });
    //   return;
    // }

    setSubmitting(true);
    try {
      // Notes reuse the follow-up add endpoint; the NOTE type is what sets them
      // apart from scheduled follow-ups, and no follow-up date is attached.
      const payload = {
        franchiseId: franchise._id,
        franchiseRefId: franchise.franchiseId,
        franchiseName: franchise.name,
        state: franchise.state,
        district: franchise.district,
        town: franchise.town || franchise.city,
        pincode: franchise.pincode,
        mobileNo,
        type: "Activation",
        followupType: NOTE_TYPE,
        status: "Completed",
        remarks: form.remarks?.trim(),
        assetIds: [],
        // assignedTo: {
        //   employeeId: masterEmployee.userId,
        //   email: masterEmployee.email,
        //   emailAddress: masterEmployee.email,
        //   name: masterEmployee.name,
        // },
        loggedOn: new Date().toISOString(),
      };

      const res = await LeadFollowupService.add(payload);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        appToast.show({ msg: "Note added", color: "success" });
        callback({ action: "created", data: res.data });
      } else {
        appToast.show({
          msg: (res.data as any)?.message || "Failed to add note",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to add note",
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
    <AppModal show={show} callback={close} className="tw:h-auto">
      <AppModal.Title onClose={close}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-100 tw:text-emerald-700">
            <StickyNote className="tw:h-4 tw:w-4" />
          </div>
          <div>
            <div className="tw:text-base tw:font-semibold tw:text-gray-900">
              Add store note
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              CRM · Note
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-auto">
        {loadingFranchise ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-10">
            <AppSpinner />
          </div>
        ) : (
          <form
            id="create-note-form"
            onSubmit={handleSubmit(onSubmit)}
            className="tw:flex tw:flex-col tw:gap-5 tw:pt-1"
          >
            {/* Store — who this note is about. */}
            <div>
              <FieldLabel>Retailer Details</FieldLabel>
              <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-3">
                <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-sm tw:font-bold tw:text-gray-600 tw:ring-1 tw:ring-gray-200">
                  {getInitials(franchise?.name)}
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                    {franchise?.name || "Retailer"}
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

            {/* Note */}
            <div>
              <FieldLabel required>
                <StickyNote className="tw:h-3 tw:w-3" />
                Note
              </FieldLabel>
              <AppTextarea
                name="remarks"
                placeholder="What was discussed with the retailer?"
                register={register}
                rows={5}
                inputClassName="tw:w-full"
              />
            </div>
          </form>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:gap-2">
        <AppButton
          type="submit"
          form="create-note-form"
          color="success"
          isLoading={submitting}
          disabled={
            submitting || loadingFranchise || !franchise || !remarks?.trim()
          }
        >
          Save note
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CreateNoteModal;
