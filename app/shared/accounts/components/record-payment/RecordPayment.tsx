import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import RecordPaymentService from "~/services/RecordPaymentService";
import Users from "./components/users/Users";
import AmountStep from "./components/amount/AmountStep";
import ModeStep from "./components/mode/ModeStep";
import Confirm from "./components/confirm/Confirm";
import WhatsAppSummary from "./components/whatsapp-summary/WhatsAppSummary";
import { getEntityTypeLabel } from "./helper";
import type {
  RecordPaymentAmountDetails,
  RecordPaymentEntityType,
  RecordPaymentFlow,
  RecordPaymentStep,
} from "./types";

export type {
  RecordPaymentFlow,
  RecordPaymentEntityType,
  RecordPaymentEntity,
  RecordPaymentAmountDetails,
} from "./types";

type Props = {
  /** "in" = receive payment, "out" = make payout */
  flow: RecordPaymentFlow;
  /** kind of party being paid / paying */
  entityType: RecordPaymentEntityType;
  /** pre-selected party id — skips the user-picking step */
  entityId?: string;
  /** called after the payment is successfully recorded */
  onSubmit?: (payload: Record<string, any>) => void;
  /** called when the user cancels / goes back from the first step */
  onCancel?: () => void;
};

const buildDefaultValues = (entityId?: string): RecordPaymentAmountDetails => ({
  entity: null,
  step: "amount",
  outstanding: undefined,
  amount: undefined,
  paymentMethod: "",
  referenceId: "",
  paidOn: new Date().toISOString().slice(0, 10),
  notes: "",
});

const RecordPayment = ({
  flow,
  entityType,
  entityId,
  onSubmit,
  onCancel,
}: Props) => {
  const appToast = useAppToast();

  const methods = useForm<RecordPaymentAmountDetails>({
    defaultValues: buildDefaultValues(entityId),
  });
  const { setValue } = methods;

  const [
    amount,
    paymentMethod,
    entity,
    step,
    referenceId,
    paidOn,
    notes,
    outstanding,
  ] = useWatch({
    control: methods.control,
    name: [
      "amount",
      "paymentMethod",
      "entity",
      "step",
      "referenceId",
      "paidOn",
      "notes",
      "outstanding",
    ],
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingEntity, setLoadingEntity] = useState(!!entityId);
  const [entityError, setEntityError] = useState(false);

  // Load pre-selected entity
  useEffect(() => {
    if (!entityId) return;

    let cancelled = false;

    const loadEntity = async () => {
      setLoadingEntity(true);
      setEntityError(false);
      try {
        const e = await RecordPaymentService.getEntityById(
          entityType,
          entityId,
        );
        if (cancelled) return;
        if (e) setValue("entity", e, { shouldValidate: true });
        else setEntityError(true);
      } catch (error) {
        if (cancelled) return;
        setEntityError(true);
        // eslint-disable-next-line no-console
        console.error("Failed to load entity:", error);
      } finally {
        if (!cancelled) setLoadingEntity(false);
      }
    };

    loadEntity();

    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, setValue]);

  const entityTypeLabel = getEntityTypeLabel(entityType);

  const stepOrder = useMemo<RecordPaymentStep[]>(
    () =>
      entityId
        ? ["amount", "mode", "confirm"]
        : ["amount", "party", "mode", "confirm"],
    [entityId],
  );

  const steps = useMemo(
    () =>
      (
        [
          { key: "amount", title: "Amount" },
          { key: "party", title: "Party" },
          { key: "mode", title: "Mode" },
          { key: "confirm", title: "Confirm" },
        ] as { key: RecordPaymentStep; title: string }[]
      ).filter((s) => stepOrder.includes(s.key)),
    [stepOrder],
  );

  // `step` can briefly be out of the current order when `entityId` flips, so
  // fall back to the first step instead of leaving the index at -1.
  const activeIndex = Math.max(stepOrder.indexOf(step), 0);
  const activeStep = stepOrder[activeIndex];

  const hasAmount = Number(amount) > 0;
  const hasMode = !!paymentMethod;
  const hasParty = !!entity;
  const canContinue =
    (activeStep === "amount" && hasAmount) ||
    (activeStep === "party" && hasParty) ||
    (activeStep === "mode" && hasParty && hasMode) ||
    (activeStep === "confirm" && hasParty && hasAmount && hasMode);

  const setStep = (nextStep: RecordPaymentStep) =>
    setValue("step", nextStep, { shouldValidate: true });

  const handleBack = () => {
    if (activeIndex <= 0) {
      onCancel?.();
      return;
    }
    setStep(stepOrder[activeIndex - 1]);
  };

  const handleContinue = () => {
    if (activeStep === "confirm") {
      doSubmit();
      return;
    }
    setStep(stepOrder[activeIndex + 1]);
  };

  const buildPayload = () => {
    const details = methods.getValues();
    const loggedInUser = AuthService.getLoggedInUser();
    const self = {
      id: AuthService.getLoggedInUserId(),
      type: "franchise",
      name: loggedInUser.name,
      refId: loggedInUser.franchiseId,
    };
    const party = {
      id: details.entity?.value?.id,
      type: details.entity?.value?.type || entityType,
      name: details.entity?.value?.name,
      refId: details.entity?.value?.refId,
    };

    return {
      paymentType: flow === "in" ? "credit" : "debit",
      amount: Number(details.amount),
      fromInfo: flow === "in" ? party : self,
      toInfo: flow === "in" ? self : party,
      paymentMethod: details.paymentMethod,
      description: details.notes,
      transactionReference: details.referenceId,
      // paidOn: details.paidOn,
    };
  };

  const doSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const resp = await AccountService.submitPayment(payload);

      if (resp?.statusCode === 200) {
        appToast.show({
          msg: "Payment recorded successfully.",
          color: "success",
        });
        // Clear the wizard so the recorded payment can't be submitted twice.
        methods.reset(buildDefaultValues(entityId));
        onSubmit?.(payload);
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to record payment.",
          color: "error",
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("RecordPayment submit error:", error);
      appToast.show({ msg: "Error recording payment.", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div>
        {/* Stepper */}
        <div className="tw:flex tw:items-center tw:justify-center tw:py-4 tw:border-b tw:border-gray-100">
          {steps.map((s, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            const isLast = i === steps.length - 1;
            return (
              <div key={s.key} className="tw:flex tw:items-center tw:min-w-0">
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-1.5 tw:min-w-0">
                  <span
                    className={`tw:w-7 tw:h-7 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-xs tw:font-semibold tw:shrink-0 ${
                      done || active
                        ? "tw:bg-teal-700 tw:text-white"
                        : "tw:bg-white tw:text-gray-500 tw:border tw:border-gray-300"
                    }`}
                  >
                    {done ? <Check size={14} /> : i + 1}
                  </span>
                  <div
                    className={`tw:text-[10px] tw:md:text-xs tw:text-center tw:whitespace-nowrap ${
                      active
                        ? "tw:text-teal-700 tw:font-semibold"
                        : done
                          ? "tw:text-teal-700"
                          : "tw:text-gray-400"
                    }`}
                  >
                    {s.title}
                  </div>
                </div>
                {!isLast ? (
                  <div
                    className={`tw:w-10 tw:md:w-20 tw:h-px tw:mx-2 tw:mb-4 ${
                      done ? "tw:bg-teal-700" : "tw:bg-gray-200"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* WhatsApp-style live preview — mobile only; desktop reviews the
            details in the confirm step instead. */}
        <div className="tw:pt-4 tw:md:hidden">
          <WhatsAppSummary
            flow={flow}
            amount={amount}
            paymentMethod={paymentMethod}
            referenceId={referenceId}
            paidOn={paidOn}
            notes={notes}
            entity={entity}
            outstanding={outstanding}
          />
        </div>

        {/* Body */}
        <div className="tw:py-4 tw:md:py-6">
          {loadingEntity ? (
            <div className="tw:text-sm tw:text-gray-500 tw:py-6 tw:text-center">
              Loading {entityTypeLabel.toLowerCase()} details…
            </div>
          ) : entityError ? (
            <div className="tw:text-sm tw:text-red-600 tw:py-6 tw:text-center">
              Could not load the {entityTypeLabel.toLowerCase()} details. Please
              try again.
            </div>
          ) : (
            <>
              {activeStep === "amount" ? <AmountStep flow={flow} /> : null}

              {activeStep === "party" ? (
                <Users entityType={entityType} flow={flow} />
              ) : null}

              {activeStep === "mode" ? <ModeStep flow={flow} /> : null}

              {activeStep === "confirm" ? <Confirm flow={flow} /> : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="tw:flex tw:items-center tw:justify-between tw:py-4 tw:border-t tw:border-gray-100">
          <AppButton
            type="button"
            fill="outline"
            disabled={submitting}
            onClick={handleBack}
          >
            <ArrowLeft size={14} /> Back
          </AppButton>

          <AppButton
            type="button"
            color="primary"
            disabled={!canContinue || loadingEntity || submitting}
            isLoading={submitting}
            onClick={handleContinue}
          >
            {activeStep === "confirm" ? (
              <>
                <Check size={14} /> Record payment
              </>
            ) : (
              <>
                Continue <ArrowRight size={14} />
              </>
            )}
          </AppButton>
        </div>
      </div>
    </FormProvider>
  );
};

export default RecordPayment;
