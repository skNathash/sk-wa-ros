import { Calendar, BadgeDollarSign, FileText, ArrowRight } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";

type Props = {
  data: any;
  callback: (a: { action: string; data: any }) => void;
};

const MobileViewItem = ({ data, callback }: Props) => {
  return (
    <div
      onClick={() => callback({ action: "view", data })}
      className="tw:cursor-pointer"
    >
      <div className="tw:border tw:border-gray-200 tw:rounded-md tw:p-4 tw:text-sm tw:h-full tw:mb-4">
        {/* Block 1: Payment Date, PO ID, Amount */}
        <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
          <div>
            {/* PO ID */}
            <div className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-1">
              <AppLink onClick={(e) => e.stopPropagation()}>
                {data.poId || data._id}
              </AppLink>
            </div>
            {/* Payment Date */}
            <div className="tw:text-sm tw:text-gray-500 tw:flex tw:items-center tw:gap-2">
              <Calendar size={16} className="tw:text-gray-400" />
              <DateFormat value={data.paymentDate} />
            </div>
          </div>
          {/* Payment Method */}
          <AppBadge variant="light">{data.paymentMethod || "-"}</AppBadge>
        </div>

        {/* Block 2: Amount, Reference, Status */}
        <div className="tw:mb-3">
          <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-1">
            Payment Details
          </div>
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
            {/* Amount */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <BadgeDollarSign size={16} className="tw:text-gray-400" />
              <span className="tw:font-semibold">
                <Amount value={data.poAmount ?? data.invoiceAmount ?? 0} />
              </span>
            </div>
            {/* Reference */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <FileText size={16} className="tw:text-gray-400" />
              <span className="tw:text-sm tw:font-medium">
                {data.refNo || "-"}
              </span>
            </div>
          </div>
          {/* Status */}
          <div className="tw:flex tw:items-center tw:gap-2">
            {data.status ? (
              <AppBadge
                variant={data.status === "Paid" ? "success" : "danger"}
                className="tw:flex tw:items-center tw:gap-1"
              >
                {data.status === "Paid" && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tw:text-green-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                )}
                {data.status === "Paid"
                  ? "Paid"
                  : data.status === "UnPaid"
                  ? "UnPaid"
                  : data.status}
              </AppBadge>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>

        {/* Block 3: Action Buttons */}
        <div className="tw:flex tw:gap-2">
          <AppButton
            size="small"
            color="light"
            noShadow={true}
            onClick={(e) => {
              e.stopPropagation();
              callback({ action: "view", data });
            }}
            className="tw:flex-1"
            fill="outline"
          >
            View Details
            <ArrowRight size={16} className="tw:ml-2" />
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default MobileViewItem;
