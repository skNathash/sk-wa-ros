import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  FileText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import PaylaterService from "~/services/PaylaterService";
import KycStep from "./components/KycStep";
import DocumentsStep from "./components/DocumentsStep";
import NomineeStep from "./components/NomineeStep";
import {
  buildKycPrefill,
  buildPaylaterKycPayload,
  fetchPaylaterUserDetails,
  getDefaultKycFormValues,
  validateKycStep,
  type PaylaterApproval,
  type PaylaterKycFormData,
  type PaylaterKycUser,
  type PaylaterStorePhoto,
  type PaylaterUserType,
} from "./helper";

const STEPS = [
  { key: "kyc", title: "KYC", icon: ShieldCheck },
  { key: "documents", title: "Documents", icon: FileText },
  { key: "nominee", title: "Nominee", icon: Users },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

type Props = {
  show: boolean;
  onClose: () => void;
  /** Customer (b2c) or retailer/franchise (b2b) the KYC belongs to */
  user: PaylaterKycUser;
  type?: PaylaterUserType;
  /** Approval fields to merge into the payload when the caller already has them */
  approval?: PaylaterApproval;
  /**
   * `api` (default) — the modal creates the PayLater request itself.
   * `data` — no request is sent; the captured KYC is handed back through
   * `onSubmit` so the caller can submit it with the rest of its own payload.
   */
  mode?: "api" | "data";
  /**
   * Receives the built payload and the raw form values on submit. Required in
   * `data` mode, optional in `api` mode where it takes over the submission.
   * Return false to keep the modal open.
   */
  onSubmit?: (
    payload: Record<string, any>,
    values: PaylaterKycFormData,
  ) => boolean | void | Promise<boolean | void>;
  onSuccess?: () => void;
  title?: string;
  submitLabel?: string;
};

const PaylaterKycModal: React.FC<Props> = ({
  show,
  onClose,
  user,
  type = "b2b",
  approval,
  mode = "api",
  onSubmit,
  onSuccess,
  title = "PayLater KYC",
  submitLabel = "Submit",
}) => {
  const toast = useAppToast();
  const [activeStep, setActiveStep] = useState<StepKey>("kyc");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [storePhotos, setStorePhotos] = useState<PaylaterStorePhoto[]>([]);

  const methods = useForm<PaylaterKycFormData>({
    mode: "onChange",
    defaultValues: getDefaultKycFormValues(),
  });

  const userId = user?._id || user?.id || "";

  useEffect(() => {
    if (!show) return;

    setActiveStep("kyc");
    setLoadError("");
    setStorePhotos([]);
    methods.reset(getDefaultKycFormValues());

    if (!userId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const details = await fetchPaylaterUserDetails(userId, type);
        if (cancelled) return;
        const prefill = buildKycPrefill(details, type);
        methods.reset(prefill.values);
        setStorePhotos(prefill.storePhotos);
      } catch {
        if (!cancelled) {
          // Details are only a convenience — the user can still fill manually
          setLoadError(
            `Could not fetch ${type === "b2c" ? "customer" : "retailer"} details. Please fill the form manually.`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, userId, type]);

  const currentIndex = STEPS.findIndex((s) => s.key === activeStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEPS.length - 1;

  const goNext = () => {
    const error = validateKycStep(activeStep, methods.getValues());
    if (error) {
      toast.show({ msg: error, color: "danger" });
      return;
    }
    setActiveStep(STEPS[currentIndex + 1].key);
  };

  const goPrev = () => setActiveStep(STEPS[currentIndex - 1].key);

  const handleSubmit = async () => {
    if (submitting) return;

    const values = methods.getValues();
    for (const step of STEPS) {
      const error = validateKycStep(step.key, values);
      if (error) {
        setActiveStep(step.key);
        toast.show({ msg: error, color: "danger" });
        return;
      }
    }

    const payload = buildPaylaterKycPayload(user, type, values, approval || {});

    setSubmitting(true);
    try {
      // Data mode — hand the captured KYC back to the caller, no request here.
      if (mode === "data" || onSubmit) {
        const result = await onSubmit?.(payload, values);
        if (result === false) return;
        onSuccess?.();
        onClose();
        return;
      }

      const resp: any = await PaylaterService.createRequest(payload);
      if (resp?.statusCode === 200) {
        toast.show({ msg: "PayLater KYC submitted", color: "success" });
        onSuccess?.();
        onClose();
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to submit PayLater KYC",
          color: "danger",
        });
      }
    } catch {
      toast.show({
        msg: "Something went wrong. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      show={show}
      backdropDismiss={false}
      className="tw:h-[95vh] tw:md:max-w-2xl"
    >
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:bg-blue-100 tw:p-1.5 tw:rounded-full">
            <ShieldCheck className="tw:text-blue-600" size={16} />
          </div>
          <div>
            <div className="tw:text-sm tw:font-bold tw:text-gray-800">
              {title}
            </div>
            <div className="tw:text-[10px] tw:text-gray-500">
              KYC · Documents · Nominee
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[95vh] tw:p-0">
        <div className="tw:flex tw:flex-col tw:h-full">
          {/* Step indicator */}
          <div className="tw:px-6 tw:pt-3 tw:pb-2 tw:bg-gray-50 tw:border-b tw:border-gray-100">
            <div className="tw:flex tw:items-center tw:justify-between">
              {STEPS.map((step, i) => {
                const isActive = activeStep === step.key;
                const isCompleted = currentIndex > i;
                return (
                  <React.Fragment key={step.key}>
                    <div className="tw:flex tw:flex-col tw:items-center tw:z-10">
                      <div
                        className={clsx(
                          "tw:w-6 tw:h-6 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:transition-all tw:duration-300",
                          isActive
                            ? "tw:bg-blue-600 tw:text-white tw:scale-110 tw:shadow-sm"
                            : isCompleted
                              ? "tw:bg-green-500 tw:text-white"
                              : "tw:bg-gray-200 tw:text-gray-400",
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle size={12} />
                        ) : (
                          <step.icon size={12} />
                        )}
                      </div>
                      <span
                        className={clsx(
                          "tw:text-[9px] tw:mt-1 tw:font-bold",
                          isActive ? "tw:text-blue-600" : "tw:text-gray-400",
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="tw:flex-1 tw:h-px tw:bg-gray-200 tw:mx-1 tw:-mt-4">
                        <div
                          className="tw:h-full tw:bg-blue-600 tw:transition-all tw:duration-500"
                          style={{ width: isCompleted ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="tw:flex-1 tw:overflow-y-auto tw:p-3">
            {loading ? (
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:space-y-4">
                <AppSpinner size="lg" />
                <p className="tw:text-gray-500 tw:text-sm tw:animate-pulse">
                  Fetching {type === "b2c" ? "customer" : "retailer"} details...
                </p>
              </div>
            ) : (
              <FormProvider {...methods}>
                {/* User context */}
                <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-2 tw:mb-3 tw:flex tw:items-center tw:gap-3">
                  <div className="tw:w-10 tw:h-10 tw:bg-blue-600 tw:text-white tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:text-xs tw:font-bold tw:shrink-0">
                    {user?.initials || (user?.name || "U")[0]?.toUpperCase()}
                  </div>
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:truncate">
                        {user?.name || "-"}
                      </div>
                      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-emerald-50 tw:text-emerald-700 tw:text-[10px] tw:font-semibold tw:px-1.5 tw:py-0.5 tw:rounded tw:border tw:border-emerald-200 tw:shrink-0">
                        <BadgeCheck size={10} />
                        {type === "b2b" ? "B2B" : "B2C"}
                      </span>
                    </div>
                    <div className="tw:text-[11px] tw:text-gray-500 tw:truncate">
                      {user?.mobile || "-"}
                      {user?.franchiseId || user?.refNo
                        ? ` · ${user.franchiseId || user.refNo}`
                        : ""}
                    </div>
                  </div>
                </div>

                {loadError && (
                  <div className="tw:flex tw:items-start tw:gap-2 tw:bg-amber-50 tw:border tw:border-amber-100 tw:text-amber-700 tw:rounded-lg tw:px-3 tw:py-2 tw:mb-3 tw:text-[11px]">
                    <X size={12} className="tw:mt-0.5 tw:shrink-0" />
                    <span>{loadError}</span>
                  </div>
                )}

                {activeStep === "kyc" && (
                  <KycStep type={type} storePhotos={storePhotos} />
                )}
                {activeStep === "documents" && <DocumentsStep />}
                {activeStep === "nominee" && <NomineeStep />}
              </FormProvider>
            )}
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:bg-white tw:border-t tw:p-3">
        <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
          {isFirstStep ? (
            <AppButton
              onClick={onClose}
              color="secondary"
              fill="outline"
              className="tw:justify-center tw:h-10 tw:px-5"
            >
              Cancel
            </AppButton>
          ) : (
            <AppButton
              onClick={goPrev}
              color="secondary"
              fill="outline"
              className="tw:justify-center tw:h-10 tw:px-5"
            >
              <ArrowLeft size={16} className="tw:mr-2" />
              Back
            </AppButton>
          )}

          {isLastStep ? (
            <AppButton
              onClick={handleSubmit}
              color="success"
              disabled={submitting || loading}
              isLoading={submitting}
              className="tw:justify-center tw:h-10 tw:px-6 tw:font-bold"
            >
              <CheckCircle size={16} className="tw:mr-2" />
              {submitting ? "Submitting..." : submitLabel}
            </AppButton>
          ) : (
            <AppButton
              onClick={goNext}
              color="primary"
              disabled={loading}
              className="tw:justify-center tw:h-10 tw:px-8 tw:font-bold"
            >
              Next
              <ArrowRight size={16} className="tw:ml-2" />
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PaylaterKycModal;
