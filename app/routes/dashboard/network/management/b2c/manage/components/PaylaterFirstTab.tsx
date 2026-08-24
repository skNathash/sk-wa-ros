import clsx from "clsx";
import { Phone, Sparkles, Unlock, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import { Slider } from "~/components/ui/slider";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import { validatePaylaterForm } from "../helper";

interface PaylaterFirstTabProps {
  /** Creates the customer; resolves true when the API accepted it. */
  onCreate: (data: Record<string, any>) => Promise<boolean>;
  submitting: boolean;
}

/** Quick picks along the credit ladder — each on-time bill unlocks more. */
const TIERS = [200, 500, 1000, 5000];

/** Same tenures the PayLater assign flow offers, so both paths stay in sync. */
const VALIDITY_OPTIONS = PaylaterService.getValidityOptions();
const DEFAULT_VALIDITY = "30 Days";

const MIN_LIMIT = 0;
const MAX_LIMIT = 5000;
const STEP = 100;

/** Average bill the suggestion is derived from — replace once billing data lands. */
const AVG_BILL = 900;
const SUGGESTED_LIMIT = 1100;

/**
 * Route D — the sign-up is a side effect of unlocking credit. The retailer
 * picks a starter limit, the customer consents over WhatsApp, and the profile
 * is created around that credit — the create call carries the paylater block,
 * so the customer lands with the limit already attached.
 */
const PaylaterFirstTab = ({ onCreate, submitting }: PaylaterFirstTabProps) => {
  const { register, handleSubmit, setValue, getValues, reset } = useForm({
    defaultValues: { name: "", mobile: "" },
  });

  const { t } = useTranslation("common");
  const appToast = useAppToast();

  const [limit, setLimit] = useState(SUGGESTED_LIMIT);
  const [isCustom, setIsCustom] = useState(false);
  const [validity, setValidity] = useState(DEFAULT_VALIDITY);
  // Plain state, not a form field — the box unmounts whenever Custom is off,
  // and a registered input loses whatever was seeded before it mounted.
  const [customAmount, setCustomAmount] = useState("");

  const billMultiple = (limit / AVG_BILL).toFixed(1);

  const pickTier = (amount: number) => {
    setIsCustom(false);
    setCustomAmount("");
    setLimit(amount);
  };

  /** Tapping Custom reveals the box seeded with the current limit, ready to type. */
  const openCustom = () => {
    setCustomAmount(String(limit));
    // The box mounts with autoFocus, so it's ready to type straight away.
    setIsCustom(true);
  };

  const changeCustom = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(digits);
    // No ceiling here — the slider's max is only a shortcut range, not a rule.
    // An empty box shouldn't blank the hero — hold the last limit until they type.
    if (digits) setLimit(Number(digits));
  };

  const changeMobile = () => {
    setValue("mobile", getValues("mobile").replace(/[^0-9]/g, ""));
  };

  const submit = async ({ name, mobile }: { name: string; mobile: string }) => {
    // The limit and tenure live in state, not in the form, so every field is
    // checked in one place — same `{ status, msg }` contract the page uses.
    const validation = validatePaylaterForm(
      { name, mobile, limit, validity },
      t,
    );
    if (!validation.status) {
      appToast.show({ msg: validation.msg, color: "danger" });
      return;
    }

    const created = await onCreate({
      name,
      mobile,
      paylater: {
        approvedLimit: limit,
        reason: "verified customer",
        kycStatus: "Approved",
        validityPeriod: validity,
        paymentTerms: "Net 30",
        notes: "enabled at customer creation",
      },
    });

    if (created) {
      reset();
      setLimit(SUGGESTED_LIMIT);
      setIsCustom(false);
      setCustomAmount("");
      setValidity(DEFAULT_VALIDITY);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="tw:overflow-hidden tw:rounded-xl tw:bg-white tw:ring-1 tw:ring-slate-100"
    >
      <div className="tw:relative tw:overflow-hidden tw:bg-linear-to-br tw:from-violet-600 tw:to-purple-500 tw:px-4 tw:py-6 tw:text-white tw:sm:px-6">
        <div className="tw:relative">
          <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-amber-300">
            <Sparkles size={12} />
            Auto-suggested limit
          </span>

          <div className="tw:mt-2 tw:flex tw:items-baseline tw:gap-3">
            <span className="tw:text-4xl tw:font-extrabold tw:leading-none">
              ₹{limit}
            </span>
            <span className="tw:text-sm tw:text-violet-200">
              ≈ {billMultiple}× avg bill
            </span>
          </div>

          <Slider
            min={MIN_LIMIT}
            max={MAX_LIMIT}
            step={STEP}
            value={[limit]}
            onValueChange={([value]) => {
              setIsCustom(true);
              setCustomAmount(String(value));
              setLimit(value);
            }}
            aria-label="Starter credit limit"
            className="tw:mt-5 tw:**:data-[slot=slider-range]:bg-amber-500 tw:**:data-[slot=slider-thumb]:size-5 tw:**:data-[slot=slider-thumb]:border-amber-500 tw:**:data-[slot=slider-thumb]:bg-amber-500 tw:**:data-[slot=slider-track]:h-2 tw:**:data-[slot=slider-track]:bg-black/40"
          />

          <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-violet-200">
            <span>{CommonService.formatCompact(MIN_LIMIT)}</span>
            <span>{CommonService.formatCompact(MAX_LIMIT)}</span>
          </div>

          {/* Mobile can't fit five columns without clipping the labels, so the
              tiers take a row and Custom spans the one below. */}
          <div className="tw:mt-4 tw:grid tw:grid-cols-4 tw:gap-2 tw:sm:grid-cols-5">
            {TIERS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => pickTier(amount)}
                className={clsx(
                  "tw:cursor-pointer tw:rounded-lg tw:px-2 tw:py-2.5 tw:text-center tw:text-sm tw:font-bold tw:transition-colors tw:sm:px-3",
                  !isCustom && limit === amount
                    ? "tw:bg-amber-400 tw:text-violet-900"
                    : "tw:bg-white/15 tw:text-white tw:hover:bg-white/25",
                )}
              >
                {CommonService.formatCompact(amount)}
              </button>
            ))}
            <button
              type="button"
              onClick={openCustom}
              className={clsx(
                "tw:col-span-4 tw:cursor-pointer tw:rounded-lg tw:px-2 tw:py-2.5 tw:text-center tw:text-sm tw:font-bold tw:ring-1 tw:transition-colors tw:sm:col-span-1 tw:sm:px-3",
                isCustom
                  ? "tw:bg-amber-400 tw:text-violet-900 tw:ring-amber-400"
                  : "tw:text-white tw:ring-white/40 tw:hover:bg-white/15",
              )}
            >
              Custom
            </button>
          </div>

          {/* The ₹ sits inside the pill so the whole 48px surface is one
              field — clicking anywhere in it lands the caret. */}
          {isCustom && (
            <label className="tw:mt-3 tw:flex tw:h-12 tw:cursor-text tw:items-center tw:gap-1.5 tw:rounded-xl tw:bg-black/25 tw:px-4 tw:ring-1 tw:ring-white/30 tw:focus-within:ring-2 tw:focus-within:ring-amber-400">
              <span className="tw:text-lg tw:font-bold tw:text-white">₹</span>
              <input
                type="tel"
                inputMode="numeric"
                value={customAmount}
                onChange={changeCustom}
                maxLength={7}
                autoFocus
                placeholder="Enter amount"
                aria-label="Custom credit limit"
                className="tw:w-full tw:min-w-0 tw:bg-transparent tw:text-lg tw:font-bold tw:text-white tw:outline-none tw:placeholder:text-base tw:placeholder:font-normal tw:placeholder:text-violet-200"
              />
            </label>
          )}
        </div>
      </div>

      <div className="tw:p-5">
        <p
          className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Customer · all fields required
        </p>

        <AppInput
          name="name"
          register={register}
          placeholder="Customer name"
          className="tw:mt-2"
          leftIcon={<User size={18} className="tw:text-slate-400" />}
          inputClassName="tw:h-12! tw:rounded-xl tw:border-slate-200 tw:text-base tw:md:text-base tw:font-medium tw:text-slate-800 tw:shadow-none tw:placeholder:font-normal tw:placeholder:text-slate-300"
        />

        {/* Mobile stacks the two fields; both keep the same 48px height. */}
        <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center">
          <AppInput
            name="mobile"
            register={register}
            onChange={changeMobile}
            type="tel"
            maxLength={10}
            placeholder="98765 43210"
            className="tw:min-w-0 tw:sm:flex-1"
            leftIcon={
              <span className="tw:flex tw:items-center tw:gap-3">
                <Phone size={18} className="tw:text-emerald-600" />
                <span className="tw:text-base tw:font-medium tw:text-slate-400">
                  +91
                </span>
              </span>
            }
            rightIcon={
              <span className="tw:rounded tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-emerald-700">
                NEW
              </span>
            }
            inputClassName="tw:h-12! tw:rounded-xl tw:border-slate-200 tw:pl-19! tw:pr-14! tw:text-lg tw:font-semibold tw:tracking-wide tw:text-slate-800 tw:shadow-none tw:placeholder:font-normal tw:placeholder:text-slate-300"
          />

          {/* Tenure shares the assign flow's options so both paths stay in sync. */}
          <AppSelect
            options={VALIDITY_OPTIONS}
            value={validity}
            onChange={setValidity}
            placeholder="Validity"
            className="tw:shrink-0"
            inputClassName="tw:h-12! tw:w-full tw:sm:w-36 tw:rounded-xl tw:border-slate-200 tw:text-sm tw:font-semibold tw:text-slate-700 tw:shadow-none"
          />
        </div>

        <div className="tw:mt-4 tw:rounded-xl tw:border tw:border-dashed tw:border-violet-300 tw:bg-violet-50/50 tw:p-4">
          <p
            className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-violet-600"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            No paperwork
          </p>
          <p className="tw:mt-1 tw:text-sm tw:text-slate-600">
            Customer taps a WhatsApp link to consent. That&rsquo;s the KYC. Bill
            history becomes the credit score.
          </p>
        </div>

        <AppButton
          type="submit"
          size="large"
          expand="block"
          isLoading={submitting}
          disabled={submitting}
          className="tw:mt-5 tw:h-auto! tw:w-full tw:gap-2 tw:rounded-xl tw:bg-violet-600! tw:py-3.5 tw:text-sm! tw:font-semibold tw:text-white tw:hover:bg-violet-700!"
        >
          <Unlock size={18} />
          Send unlock link on WhatsApp
        </AppButton>
      </div>
    </form>
  );
};

export default PaylaterFirstTab;
