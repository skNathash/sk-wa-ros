import { useFormContext } from "react-hook-form";
import { Delete, IndianRupee } from "lucide-react";
import CommonService from "~/services/CommonService";
import { MAX_PAYMENT_AMOUNT } from "../../helper";
import type {
  RecordPaymentAmountDetails,
  RecordPaymentFlow,
} from "../../types";

type Props = {
  flow: RecordPaymentFlow;
};

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"];

const AmountStep = ({ flow }: Props) => {
  const { setValue, getValues } =
    useFormContext<RecordPaymentAmountDetails>();

  const amount = getValues("amount");

  const setAmount = (nextAmount?: number) => {
    if (nextAmount !== undefined && nextAmount > MAX_PAYMENT_AMOUNT) return;
    setValue("amount", nextAmount, { shouldValidate: true });
  };

  const handleKey = (key: string) => {
    const current = getValues("amount") ? String(getValues("amount")) : "";

    if (key === "back") {
      const next = current.slice(0, -1);
      setAmount(next ? Number(next) : undefined);
      return;
    }

    const candidate = Number(current + key);
    if (!Number.isFinite(candidate) || candidate > MAX_PAYMENT_AMOUNT) return;
    setAmount(candidate || undefined);
  };

  const handleTypedAmount = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setAmount(undefined);
      return;
    }
    const next = Number(digits);
    if (!Number.isFinite(next) || next > MAX_PAYMENT_AMOUNT) return;
    setAmount(next || undefined);
  };

  return (
    <div>
      <div className="tw:mb-1 tw:text-xs tw:font-medium tw:text-gray-600">
        Amount to {flow === "in" ? "receive" : "pay"}{" "}
        <span className="tw:text-red-500">*</span>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:border tw:border-gray-300 tw:px-3 tw:py-2 tw:mb-4 tw:focus-within:border-teal-600">
        <IndianRupee size={18} className="tw:text-gray-500" />
        <input
          type="text"
          inputMode="numeric"
          aria-label={`Amount to ${flow === "in" ? "receive" : "pay"}`}
          value={amount ? CommonService.commaSeparated(Number(amount)) : ""}
          onChange={(e) => handleTypedAmount(e.target.value)}
          placeholder="0"
          className="tw:w-full tw:text-xl tw:font-semibold tw:outline-none tw:bg-transparent"
        />
      </div>

      <div className="tw:grid tw:grid-cols-3 tw:gap-2">
        {KEYPAD.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={key === "back" ? "Backspace" : key}
            onClick={() => handleKey(key)}
            className="tw:py-3 tw:rounded-md tw:border tw:border-gray-200 tw:bg-gray-50 tw:text-base tw:font-medium tw:hover:bg-gray-100 tw:active:bg-gray-200 tw:flex tw:items-center tw:justify-center"
          >
            {key === "back" ? <Delete size={18} /> : key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AmountStep;
