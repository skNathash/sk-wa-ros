import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import PaylaterService from "~/services/PaylaterService";
import BuyerPanel from "./components/BuyerPanel";
import DecisionStep from "./components/DecisionStep";
import KycTrustStep from "./components/KycTrustStep";
import RequestSummaryStep from "./components/RequestSummaryStep";
import ReviewSteps, {
  REVIEW_STEPS,
  type ReviewStepKey,
} from "./components/ReviewSteps";
import {
  computeTrustScore,
  EMPTY_CREDITS,
  EMPTY_STORY,
  formatTenure,
  getActiveCreditsElsewhere,
  getBuyerStory,
  getRequestDocuments,
  getReviewRequest,
  type ActiveCreditsElsewhere,
  type BuyerStory,
  type DecisionFormData,
} from "./helper";

export type { DecisionFormData };

type Props = {
  requestId: string;
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
};

const LAST_STEP = REVIEW_STEPS.length as ReviewStepKey;

/**
 * The seller-side review of an incoming PayLater request: read the ask, check
 * the KYC and the credit already outstanding elsewhere, then set a limit and
 * decide — all without leaving the queue the request was opened from.
 *
 * Emits `{action: "close"}` when dismissed and
 * `{action: "submit", data: {decision, ...}}` once a decision lands, so the
 * caller can refresh its list.
 */
const PaylaterReviewRequestModal = ({ requestId, show, callback }: Props) => {
  const toast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [story, setStory] = useState<BuyerStory>(EMPTY_STORY);
  const [credits, setCredits] = useState<ActiveCreditsElsewhere>(EMPTY_CREDITS);
  const [step, setStep] = useState<ReviewStepKey>(1);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(
    null,
  );

  const { register, control, setValue, getValues, reset } =
    useForm<DecisionFormData>({
      defaultValues: { approvedLimit: null, validityPeriod: "", note: "" },
    });

  // The limit chips highlight against whatever is currently typed.
  const limit = useWatch({ control, name: "approvedLimit" });

  // A slow response for a request the user has already moved past must not
  // overwrite the one they are looking at now.
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!show || !requestId) return;

    const fetchId = ++fetchIdRef.current;

    const load = async () => {
      setLoading(true);
      setStep(1);
      setStory(EMPTY_STORY);
      setCredits(EMPTY_CREDITS);

      try {
        const data = await getReviewRequest(requestId);
        if (fetchId !== fetchIdRef.current) return;

        setRequest(data);
        reset({
          approvedLimit: Number(data?.creditLimit) || null,
          validityPeriod: data?.validityPeriod || "",
          note: "",
        });

        const userId = data?.userInfo?.id;
        if (!userId) return;

        // Secondary panels fill in behind the request — neither one should
        // hold up the ask the seller opened the modal to read.
        const [storyData, creditsData] = await Promise.all([
          getBuyerStory(userId),
          getActiveCreditsElsewhere(userId, data?._id),
        ]);
        if (fetchId !== fetchIdRef.current) return;

        setStory(storyData);
        setCredits(creditsData);
      } catch (e) {
        if (fetchId === fetchIdRef.current) {
          setRequest(null);
        }
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    };

    load();
  }, [show, requestId, reset]);

  // Leaving the modal clears the decision so a reopened request starts clean.
  useEffect(() => {
    if (!show) {
      setRequest(null);
      setStep(1);
      setSubmitting(null);
      reset({ approvedLimit: null, validityPeriod: "", note: "" });
    }
  }, [show, reset]);

  const documents = useMemo(() => getRequestDocuments(request), [request]);
  const trust = useMemo(
    () => computeTrustScore(request, story, credits),
    [request, story, credits],
  );

  const handleClose = () => {
    if (submitting) return;
    callback({ action: "close" });
  };

  const validate = (decision: "approve" | "reject") => {
    const { approvedLimit, note } = getValues();

    // Rejecting still owes the buyer a reason; the note on an approval is
    // theirs to add or skip.
    if (decision === "reject") {
      return note?.trim() ? "" : "Please enter a reason for rejecting";
    }

    if (!approvedLimit || Number(approvedLimit) <= 0) {
      return "Please enter a credit limit greater than 0";
    }
    return "";
  };

  const handleDecision = async (decision: "approve" | "reject") => {
    const msg = validate(decision);
    if (msg) {
      toast.show({ msg, color: "error" });
      return;
    }

    const { approvedLimit, validityPeriod, note } = getValues();

    setSubmitting(decision);
    try {
      const resp: any =
        decision === "approve"
          ? await PaylaterService.approveRequest(requestId, {
              action: "approve",
              approvedLimit: Number(approvedLimit) || 0,
              kycStatus: "Approved",
              reason: note.trim(),
              validityPeriod,
            })
          : await PaylaterService.rejectRequest(requestId, {
              action: "reject",
              reason: note.trim(),
            });

      if (resp?.statusCode === 200) {
        toast.show({
          msg:
            decision === "approve"
              ? "Request approved successfully"
              : "Request rejected successfully",
          color: "success",
        });
        callback({
          action: "submit",
          data: {
            decision,
            requestId,
            approvedLimit:
              decision === "approve" ? Number(approvedLimit) || 0 : 0,
            validityPeriod: decision === "approve" ? validityPeriod : "",
            note: note.trim(),
          },
        });
      } else {
        toast.show({
          msg:
            resp?.data?.message ||
            `Failed to ${decision === "approve" ? "approve" : "reject"} request`,
          color: "error",
        });
      }
    } catch (e) {
      toast.show({
        msg: `Failed to ${decision === "approve" ? "approve" : "reject"} request`,
        color: "error",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const askedLimit = Number(request?.creditLimit) || 0;
  const tenure = formatTenure(request?.validityPeriod);

  const renderStep = () => {
    if (step === 1)
      return <RequestSummaryStep request={request} story={story} />;
    if (step === 2)
      return <KycTrustStep request={request} documents={documents} />;
    return (
      <DecisionStep
        request={request}
        register={register}
        limit={limit ?? null}
        onPresetClick={(value) => setValue("approvedLimit", value)}
      />
    );
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      backdropDismiss={false}
      noPadding
      className="tw:h-[92vh] tw:max-h-[92vh] tw:md:max-w-3xl tw:lg:max-w-5xl"
    >
      <AppModal.Title onClose={handleClose} toolbarClassName="tw:pb-3">
        <div className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:hidden tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-blue-600 tw:sm:flex">
            <Eye size={18} className="tw:text-white" />
          </div>
          <div className="tw:min-w-0">
            <div className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
              PAYLATER · INCOMING REQUEST
            </div>
            <div className="tw:truncate tw:text-base tw:font-bold tw:text-gray-900 tw:sm:text-lg">
              {request?.userInfo?.name
                ? `Review request from ${request.userInfo.name}`
                : "Review request"}
            </div>
            {request && (
              <div className="tw:mt-0.5 tw:text-[11px] tw:font-normal tw:text-gray-500 tw:sm:text-xs">
                {request.createdAt && (
                  <>
                    Submitted{" "}
                    <DateFormat
                      value={request.createdAt}
                      formatStr="dd MMM yyyy"
                    />
                  </>
                )}
                {askedLimit > 0 && (
                  <>
                    {" · "}asking{" "}
                    <Amount value={askedLimit} decimalPlaces={0} />
                    {tenure ? ` at ${tenure} tenure` : ""}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </AppModal.Title>

      {!loading && request && (
        <div className="tw:shrink-0 ">
          <ReviewSteps activeStep={step} onStepClick={setStep} />
        </div>
      )}

      <AppModal.Content noPadding>
        {loading ? (
          <div className="tw:flex tw:h-60 tw:flex-col tw:items-center tw:justify-center tw:gap-3">
            <AppSpinner size="lg" />
            <p className="tw:text-xs tw:text-gray-500">
              Fetching request details…
            </p>
          </div>
        ) : !request ? (
          <div className="tw:py-10">
            <NoData
              title="Request not found"
              description="This PayLater request could not be loaded. It may have been withdrawn or already decided."
            />
          </div>
        ) : (
          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:px-4 tw:pb-4 tw:lg:grid-cols-[1fr_300px] tw:lg:gap-0 tw:lg:px-0 tw:lg:pb-0">
            {/* Buyer panel sits first on phones — who they are frames the ask —
                and moves to the right rail once there is room for both. */}
            <div className="tw:lg:order-2 tw:lg:border-l tw:lg:border-gray-200">
              <BuyerPanel
                request={request}
                story={story}
                credits={credits}
                trust={trust}
                documents={documents}
                collapsible
              />
            </div>
            <div className="tw:lg:order-1 tw:lg:p-5">{renderStep()}</div>
          </div>
        )}
      </AppModal.Content>

      {!loading && request && (
        <AppModal.Footer className="tw:border-t tw:border-gray-200">
          <div className="tw:flex tw:w-full tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center">
            {step > 1 && (
              <AppButton
                onClick={() => setStep((prev) => (prev - 1) as ReviewStepKey)}
                color="secondary"
                fill="outline"
                disabled={!!submitting}
                className="tw:justify-center tw:sm:w-auto"
              >
                <ChevronLeft size={16} />
                Back
              </AppButton>
            )}

            <span className="tw:hidden tw:flex-1 tw:text-xs tw:text-gray-500 tw:sm:block tw:sm:text-right">
              Step {step} of {REVIEW_STEPS.length}
            </span>

            {step < LAST_STEP ? (
              <AppButton
                onClick={() => setStep((prev) => (prev + 1) as ReviewStepKey)}
                color="success"
                className="tw:justify-center tw:sm:w-auto"
              >
                Continue
                <ChevronRight size={16} />
              </AppButton>
            ) : (
              <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row">
                <AppButton
                  onClick={() => handleDecision("reject")}
                  color="danger"
                  fill="outline"
                  disabled={!!submitting}
                  isLoading={submitting === "reject"}
                  className="tw:justify-center"
                >
                  <XCircle size={16} />
                  Reject request
                </AppButton>
                <AppButton
                  onClick={() => handleDecision("approve")}
                  color="success"
                  disabled={!!submitting}
                  isLoading={submitting === "approve"}
                  className="tw:justify-center"
                >
                  <CheckCircle2 size={16} />
                  Approve
                  {Number(limit) > 0 ? (
                    <>
                      {" "}
                      <Amount value={Number(limit)} decimalPlaces={0} />
                    </>
                  ) : null}
                </AppButton>
              </div>
            )}
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default PaylaterReviewRequestModal;
