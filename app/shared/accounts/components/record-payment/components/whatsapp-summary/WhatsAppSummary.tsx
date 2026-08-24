import { format, isValid, parse } from "date-fns";
import { CheckCheck, Clock } from "lucide-react";
import CommonService from "~/services/CommonService";
import { PAYMENT_METHOD_LABELS } from "../../helper";
import type {
  RecordPaymentEntity,
  RecordPaymentFlow,
} from "../../types";

type Props = {
  flow: RecordPaymentFlow;
  amount?: number;
  paymentMethod?: string;
  referenceId?: string;
  paidOn?: string;
  notes?: string;
  entity?: RecordPaymentEntity | null;
  outstanding?: number;
};

const WhatsAppSummary = ({
  flow,
  amount,
  paymentMethod,
  referenceId,
  paidOn,
  notes,
  entity,
  outstanding,
}: Props) => {
  const outstandingValue = typeof outstanding === "number" ? outstanding : 0;
  const remaining = Math.max(outstandingValue - Number(amount || 0), 0);
  const showRemaining = outstandingValue > 0;

  const paidOnDate = paidOn
    ? parse(paidOn, "yyyy-MM-dd", new Date())
    : undefined;
  const paidOnLabel =
    paidOnDate && isValid(paidOnDate) ? format(paidOnDate, "dd MMM yyyy") : "";

  const methodLabel = paymentMethod
    ? PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod
    : "Cash";
  const showAmount = Number(amount || 0) > 0;
  const hasAnyData = showAmount || entity?.value || paymentMethod || notes || paidOnLabel;

  return (
    <div className="tw:bg-[#efeae2] tw:rounded-lg tw:p-3 tw:md:p-4 tw:h-48 tw:sm:h-56 tw:md:h-72 tw:overflow-y-auto tw:flex tw:flex-col tw:gap-2 tw:md:gap-3 tw:shadow-inner tw:max-w-md tw:mx-auto">
      {!hasAnyData ? (
        <div className="tw:flex-1 tw:flex tw:items-center tw:justify-center">
          <div className="tw:text-xs tw:text-gray-400">Payment preview will appear here</div>
        </div>
      ) : null}

      {/* Amount bubble — sent (right) */}
      {showAmount ? (
        <div className="tw:flex tw:justify-end">
          <div className="tw:bg-[#d9fdd3] tw:text-gray-800 tw:rounded-2xl tw:rounded-tr-sm tw:px-3 tw:md:px-4 tw:py-2 tw:max-w-[85%] tw:shadow-sm">
            <div className="tw:text-sm tw:font-semibold">
              {flow === "in" ? "+" : "-"}₹
              {CommonService.commaSeparated(Number(amount))}
            </div>
            <div className="tw:text-[11px] tw:text-gray-500 tw:uppercase tw:tracking-wide">
              MONEY {flow === "in" ? "IN" : "OUT"}
            </div>
            <div className="tw:flex tw:items-center tw:justify-end tw:gap-1 tw:mt-1 tw:text-[10px] tw:text-gray-400">
              Now <Clock size={10} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Party bubble — received (left) */}
      {entity?.value ? (
        <div className="tw:flex tw:justify-start">
          <div className="tw:bg-white tw:text-gray-800 tw:rounded-2xl tw:rounded-tl-sm tw:px-3 tw:md:px-4 tw:py-2 tw:max-w-[85%] tw:shadow-sm tw:border-l-4 tw:border-teal-600">
            <div className="tw:text-sm tw:font-semibold">
              {entity.value.name}
            </div>
            <div className="tw:text-[11px] tw:text-gray-500">
              {entity.value.type === "customer"
                ? "B2C"
                : entity.value.type === "franchise"
                ? "B2B"
                : "Vendor"}
              {entity.value.mobile ? ` · ${entity.value.mobile}` : ""}
            </div>
            <div className="tw:flex tw:items-center tw:justify-end tw:mt-1 tw:text-[10px] tw:text-gray-400">
              Now
            </div>
          </div>
        </div>
      ) : null}

      {/* Mode bubble — sent (right) */}
      {paymentMethod ? (
        <div className="tw:flex tw:justify-end">
          <div className="tw:bg-[#d9fdd3] tw:text-gray-800 tw:rounded-2xl tw:rounded-tr-sm tw:px-3 tw:md:px-4 tw:py-2 tw:max-w-[85%] tw:shadow-sm">
            <div className="tw:text-sm tw:font-semibold">Mode · {methodLabel}</div>
            {referenceId ? (
              <div className="tw:text-[11px] tw:text-gray-500">
                Ref: {referenceId}
              </div>
            ) : (
              <div className="tw:text-[11px] tw:text-gray-500">Cash counter</div>
            )}
            <div className="tw:flex tw:items-center tw:justify-end tw:gap-1 tw:mt-1 tw:text-[10px] tw:text-gray-400">
              Now <CheckCheck size={10} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Notes bubble — received (left) */}
      {notes ? (
        <div className="tw:flex tw:justify-start">
          <div className="tw:bg-white tw:text-gray-800 tw:rounded-2xl tw:rounded-tl-sm tw:px-3 tw:md:px-4 tw:py-2 tw:max-w-[85%] tw:shadow-sm">
            <div className="tw:text-[11px] tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-0.5">
              Notes
            </div>
            <div className="tw:text-sm tw:text-gray-700">{notes}</div>
          </div>
        </div>
      ) : null}

      {/* Paid on bubble — received (left) */}
      {paidOnLabel ? (
        <div className="tw:flex tw:justify-start">
          <div className="tw:bg-white tw:text-gray-800 tw:rounded-2xl tw:rounded-tl-sm tw:px-3 tw:md:px-4 tw:py-2 tw:max-w-[85%] tw:shadow-sm">
            <div className="tw:text-xs tw:text-gray-500">Paid on {paidOnLabel}</div>
          </div>
        </div>
      ) : null}

      {/* Remaining balance footer */}
      {showRemaining ? (
        <div className="tw:mt-auto tw:rounded-md tw:bg-teal-50 tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between tw:border tw:border-teal-100">
          <div>
            <div className="tw:text-sm tw:font-semibold tw:text-teal-800">
              Remaining balance after this payment
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              Was ₹{CommonService.commaSeparated(outstandingValue)} · will be ₹
              {CommonService.commaSeparated(remaining)}
            </div>
          </div>
          <div className="tw:text-lg tw:font-bold tw:text-teal-800">
            ₹{CommonService.commaSeparated(remaining)}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WhatsAppSummary;
