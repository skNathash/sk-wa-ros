import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { CheckCircle2, Phone, Send, Store, User } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AppInput, AppSelect } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import PaylaterService from "~/services/PaylaterService";

/**
 * Buyer → seller paylater request, in a WhatsApp-flavoured theme (theme-2
 * look: `--primary` green header, `--wa-cream` floor tint) but as a plain
 * form sheet, not a chat. A stripped-down alternative to the full
 * `dashboard/paylater/request` page — seller + nominee only, no documents.
 * Same API: `PaylaterService.createRequest`.
 *
 * Reports through `callback`: `{ action: "close" }` when dismissed and
 * `{ action: "success", data: { requestId? } }` once the request is created
 * (fired when the success bubble appears; the sheet stays open for Done).
 */

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: { requestId?: string } }) => void;
  /** Seller franchise id. Defaults to the logged-in buyer's linkedFranchise. */
  fid?: string;
};

type NomineeForm = {
  name: string;
  mobile: string;
  relationship: string;
};

type Seller = {
  _id?: string;
  refNo?: string;
  name?: string;
  mobile?: string;
};

type ApiResp<T> = {
  statusCode?: number;
  data?: { data?: T; message?: string } & Record<string, unknown>;
};

const relationshipOptions = [
  { label: "Father", value: "father" },
  { label: "Mother", value: "mother" },
  { label: "Spouse", value: "spouse" },
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Other", value: "other" },
];

// WhatsApp palette, resolved through theme-2 vars with hex fallbacks so the
// sheet still reads correctly under theme-1.
const WA = {
  header: "var(--primary, #075e54)",
  accent: "var(--primary-2, #00a884)",
};



const PaylaterRequestModal: React.FC<Props> = ({
  show,
  callback,
  fid,
}) => {
  const toast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NomineeForm>({
    defaultValues: { name: "", mobile: "", relationship: "" },
  });

  useEffect(() => {
    if (!show) return;

    setSent(false);
    reset({ name: "", mobile: "", relationship: "" });

    const fetchSeller = async () => {
      setLoading(true);
      try {
        if (fid) {
          const resp = (await FranchiseService.getFranchise(
            fid,
          )) as ApiResp<Seller>;
          setSeller(resp?.data?.data || null);
        } else {
          setSeller(AuthService.getLoggedInUser()?.linkedFranchise || null);
        }
      } catch (err) {
        console.error("PaylaterRequestModal: fetch seller error:", err);
        setSeller(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [show, fid]);

  const onSubmit = async (data: NomineeForm) => {
    if (submitting) return;

    if (!seller?._id) {
      toast.show({ msg: "Seller details not available", color: "danger" });
      return;
    }

    // Nominee is optional, but a half-filled nominee is rejected.
    const touched = !!(
      data.name?.trim() ||
      data.mobile?.trim() ||
      data.relationship
    );
    if (touched) {
      if (!data.name?.trim()) {
        toast.show({ msg: "Nominee name is required", color: "error" });
        return;
      }
      if (!/^\d{10}$/.test(String(data.mobile || "").trim())) {
        toast.show({
          msg: "Enter a valid 10-digit nominee mobile",
          color: "error",
        });
        return;
      }
    }

    const user = AuthService.getLoggedInUser() || {};
    const payload = {
      userInfo: {
        type: "franchise",
        subType: "SKBUYER",
        id: AuthService.getLoggedInUserId(),
        refId: user?.franchiseId || "",
      },
      franchiseInfo: {
        type: "franchise",
        subType: "SKSELLER",
        id: seller._id,
        refId: seller.refNo || "",
      },
      otherDocuments: [],
      NomineeDetails: touched
        ? [
            {
              name: String(data.name).trim(),
              mobile: String(data.mobile).trim(),
              relationShip: String(data.relationship || "").trim(),
            },
          ]
        : [],
    };

    setSubmitting(true);
    try {
      const resp = (await PaylaterService.createRequest(
        payload,
      )) as ApiResp<{ _id?: string; requestId?: string }>;
      if (resp?.statusCode === 200) {
        setSent(true);
        const d = resp.data?.data;
        callback({
          action: "success",
          data: { requestId: d?._id || d?.requestId || undefined },
        });
      } else {
        toast.show({
          msg: resp?.data?.message || "Request failed",
          color: "danger",
        });
      }
    } catch (err) {
      console.error("PaylaterRequestModal: createRequest error:", err);
      toast.show({ msg: "Failed to submit request", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const requester = AuthService.getLoggedInUser() || {};
  const requesterName =
    requester?.name ||
    requester?.ownerDetails?.name ||
    requester?.sk_franchise_details?.name ||
    "";
  const requesterMobile =
    requester?.mobile ||
    requester?.ownerDetails?.mobile ||
    requester?.sk_franchise_details?.mobile ||
    "";

  const sellerName = seller?.name || "Seller";

  return (
    <AppModal
      show={show}
      callback={() => callback({ action: "close" })}
      noPadding
      overFlowHidden
    >
      {/* Header — WhatsApp-green accent bar, but a plain sheet header. */}
      <div
        className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3.5 tw:text-white"
        style={{ background: WA.header }}
      >
        <div className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15">
          <Store size={17} />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-sm tw:font-semibold">
            Request Paylater
          </div>
          <div className="tw:truncate tw:text-[11px] tw:text-white/75">
            {loading ? "Loading…" : `to ${sellerName}`}
          </div>
        </div>
      </div>

      {/* Body — clean light sheet. */}
      <div className="tw:bg-gray-50 tw:px-4 tw:py-4">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:py-10">
            <AppSpinner />
          </div>
        ) : sent ? (
          /* Success state. */
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:py-8 tw:text-center">
            <CheckCircle2 size={44} style={{ color: WA.accent }} />
            <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
              Request sent
            </div>
            <div className="tw:max-w-[280px] tw:text-xs tw:text-gray-500">
              Your paylater request has been sent to <b>{sellerName}</b>.
              You'll be notified once it's reviewed.
            </div>
          </div>
        ) : (
          <div className="tw:space-y-3">
            {/* Summary card */}
            <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2.5">
              <p className="tw:text-xs tw:leading-relaxed tw:text-gray-600">
                You're requesting paylater credit from{" "}
                <b className="tw:text-gray-800">{sellerName}</b>. They'll
                review and approve your credit limit.
              </p>
              {(requesterName || requesterMobile) && (
                <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-0.5 tw:border-t tw:border-gray-100 tw:pt-2 tw:text-xs tw:text-gray-500">
                  <span className="tw:flex tw:items-center tw:gap-1 tw:font-medium tw:text-gray-700">
                    <User size={11} style={{ color: WA.accent }} />
                    {requesterName}
                  </span>
                  {requesterMobile && (
                    <span className="tw:flex tw:items-center tw:gap-1">
                      <Phone size={11} style={{ color: WA.accent }} />
                      {requesterMobile}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Nominee card */}
            <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2.5">
              <div className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-500">
                Nominee{" "}
                <span className="tw:font-normal tw:normal-case tw:text-gray-400">
                  (optional)
                </span>
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:gap-2 tw:md:grid-cols-3">
                <AppInput
                  name="name"
                  register={register}
                  placeholder="Nominee name"
                  size="sm"
                  error={errors.name?.message}
                />
                <AppInput
                  name="mobile"
                  register={register}
                  placeholder="Mobile number"
                  size="sm"
                  type="number"
                  maxLength={10}
                  error={errors.mobile?.message}
                />
                <Controller
                  control={control}
                  name="relationship"
                  render={({ field }) => (
                    <AppSelect
                      options={relationshipOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Relation"
                      inputClassName="tw:w-full"
                      size="sm"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions. */}
      <div className="tw:flex tw:items-center tw:gap-2 tw:border-t tw:border-gray-100 tw:bg-white tw:px-4 tw:py-3">
        {sent ? (
          <AppButton
            color="primary"
            className="tw:w-full"
            onClick={() => callback({ action: "close" })}
            type="button"
            noShadow
          >
            Done
          </AppButton>
        ) : (
          <>
            <AppButton
              color="primary"
              fill="clear"
              className="tw:flex-1"
              onClick={() => callback({ action: "close" })}
              type="button"
              noShadow
            >
              Cancel
            </AppButton>
            <AppButton
              color="primary"
              className="tw:flex-1"
              onClick={handleSubmit(onSubmit)}
              isLoading={submitting}
              disabled={loading || !seller}
              type="button"
              noShadow
            >
              <Send size={14} className="tw:mr-1.5" />
              Send request
            </AppButton>
          </>
        )}
      </div>
    </AppModal>
  );
};

export default PaylaterRequestModal;
