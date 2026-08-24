import type { UseFormRegister } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import { getLimitPresets, type DecisionFormData } from "../helper";

type Props = {
  request: any;
  register: UseFormRegister<DecisionFormData>;
  /** Current limit in the field — drives which preset reads as selected. */
  limit: number | null;
  onPresetClick: (value: number) => void;
};

/** Step 3 — the limit, the note the buyer sees, and what approval sets off. */
const DecisionStep = ({ request, register, limit, onPresetClick }: Props) => {
  const presets = getLimitPresets(Number(request?.creditLimit) || 0);
  const buyerName = request?.userInfo?.name || "The buyer";
  const bank =
    request?.userInfo?.bankInfo?.bankName ||
    request?.userInfo?.bankDetails?.bankName ||
    "";
  const tenure = request?.validityPeriod || "";

  const nextSteps = [
    {
      title: "Buyer notified",
      detail: `${buyerName} sees the approval in-app + WhatsApp instantly.`,
    },
    {
      title: "Auto-debit set up",
      detail: `Their ${bank || "linked"} account is linked for on-tenure repayment${
        tenure ? ` (${tenure})` : ""
      }.`,
    },
    {
      title: "Credit live",
      detail: "They can place PayLater orders on your catalog immediately.",
    },
  ];

  return (
    <div className="tw:space-y-5">
      <section>
        <h3 className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
          YOUR DECISION
        </h3>
        <p className="tw:mb-3 tw:text-xs tw:text-gray-500">
          Approve the request, adjust the limit, or reject with a reason
        </p>

        <label className="tw:mb-1 tw:block tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-gray-500">
          CREDIT LIMIT TO APPROVE
        </label>
        <AppInput
          name="approvedLimit"
          type="number"
          register={register}
          isRequired
          placeholder="Enter amount"
          leftIcon={<span className="tw:font-serif tw:text-gray-500">₹</span>}
          inputClassName="tw:text-lg tw:font-bold"
        />

        {presets.length > 0 && (
          <div className="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onPresetClick(preset.value)}
                className={`tw:cursor-pointer tw:rounded-md tw:border tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:transition-colors ${
                  Number(limit) === preset.value
                    ? "tw:border-emerald-500 tw:bg-emerald-50 tw:text-emerald-700"
                    : "tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:hover:border-gray-400"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <label className="tw:mb-1 tw:block tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-gray-500">
          NOTE TO THE BUYER (OPTIONAL)
        </label>
        <p className="tw:mb-1.5 tw:text-xs tw:text-gray-500">
          Explain your decision — visible to them
        </p>
        <AppTextarea
          name="note"
          register={register}
          rows={3}
          maxLength={300}
          placeholder="e.g. Starting at 50% — will increase after 3 on-time repayments"
        />
      </section>

      <section>
        <h3 className="tw:mb-2 tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
          WHAT HAPPENS NEXT
        </h3>
        <ol className="tw:space-y-3">
          {nextSteps.map((step, idx) => (
            <li key={step.title} className="tw:flex tw:gap-2.5">
              <span className="tw:mt-0.5 tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-[10px] tw:font-bold tw:text-gray-600">
                {idx + 1}
              </span>
              <div className="tw:min-w-0">
                <div className="tw:text-xs tw:font-semibold tw:text-gray-900">
                  {step.title}
                </div>
                <div className="tw:text-[11px] tw:text-gray-500">
                  {step.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default DecisionStep;
