import { format, isValid, parse } from "date-fns";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Banknote,
  Landmark,
  PenLine,
  Smartphone,
} from "lucide-react";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import CommonService from "~/services/CommonService";
import { PAYMENT_METHOD_LABELS } from "../../helper";
import type {
  RecordPaymentAmountDetails,
  RecordPaymentFlow,
} from "../../types";

type Props = {
  flow: RecordPaymentFlow;
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "bank_transfer", label: "Bank", icon: Landmark },
  { value: "cheque", label: "Cheque", icon: PenLine },
];

const ModeStep = ({ flow }: Props) => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<RecordPaymentAmountDetails>();

  const amount = useWatch({ name: "amount" });
  const paymentMethod = useWatch({ name: "paymentMethod" });
  const outstanding = useWatch({ name: "outstanding" });

  const outstandingValue = outstanding || 0;
  const amountExceedsOutstanding =
    Number(amount || 0) > 0 && Number(amount) > outstandingValue;

  const setPaymentMethod = (method: string) =>
    setValue("paymentMethod", method, { shouldValidate: true });

  return (
    <div>
      {outstandingValue > 0 ? (
        <div className="tw:mb-3 tw:text-xs tw:text-gray-500">
          {flow === "in" ? "They owe" : "You owe"}: ₹
          {CommonService.commaSeparated(outstandingValue)}. Any extra amount will
          be recorded as an advance.
        </div>
      ) : null}

      {amountExceedsOutstanding && outstandingValue > 0 ? (
        <div className="tw:mb-3 tw:text-xs tw:text-amber-600">
          Amount greater than the due will be recorded as an advance.
        </div>
      ) : null}

      <div className="tw:mb-1 tw:text-xs tw:font-medium tw:text-gray-600">
        Payment format <span className="tw:text-red-500">*</span>
      </div>
      <div className="tw:grid tw:grid-cols-4 tw:gap-2 tw:mb-4">
        {PAYMENT_METHODS.map((m) => {
          const active = paymentMethod === m.value;
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={active}
              onClick={() => setPaymentMethod(m.value)}
              className={`tw:flex tw:flex-col tw:items-center tw:gap-1 tw:rounded-md tw:border tw:py-3 tw:text-xs ${
                active
                  ? "tw:border-teal-700 tw:bg-teal-50 tw:text-teal-800 tw:font-semibold"
                  : "tw:border-gray-200 tw:hover:bg-gray-50"
              }`}
            >
              <m.icon size={18} />
              {m.label}
            </button>
          );
        })}
      </div>

      {paymentMethod ? (
        <div className="tw:mb-4 tw:text-xs tw:text-gray-500">
          {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
        </div>
      ) : null}

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3 tw:mb-3">
        <AppInput
          name="referenceId"
          label="Transaction / reference ID"
          placeholder="e.g. TXN-771182299"
          register={register}
          error={errors.referenceId?.message}
        />
        <Controller
          control={control}
          name="paidOn"
          rules={{ required: "Paid on is required" }}
          render={({ field }) => {
            const parsed = field.value
              ? parse(field.value, "yyyy-MM-dd", new Date())
              : undefined;
            return (
              <AppDateInput
                label="Paid on"
                isRequired
                value={parsed && isValid(parsed) ? parsed : undefined}
                callback={(dt) => {
                  const picked = Array.isArray(dt) ? dt[0] : dt;
                  field.onChange(
                    picked instanceof Date && isValid(picked)
                      ? format(picked, "yyyy-MM-dd")
                      : ""
                  );
                }}
                error={errors.paidOn?.message}
              />
            );
          }}
        />
      </div>

      <AppTextarea
        name="notes"
        label="Notes"
        placeholder="Optional notes"
        register={register}
        rows={2}
        error={errors.notes?.message}
      />
    </div>
  );
};

export default ModeStep;
