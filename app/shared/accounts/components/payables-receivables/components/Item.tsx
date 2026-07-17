import clsx from "clsx";
import { Calendar } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";

const Item = ({
  data,
  callback,
}: {
  data: Record<string, any>;
  callback: (data: { action: string; data?: any }) => void;
}) => {
  return (
    <div
      key={data._id}
      className="tw:p-3 tw:border tw:border-gray-200 tw:rounded-lg tw:mb-4 tw:cursor-pointer"
      onClick={() => callback({ action: "viewPayment", data: data })}
    >
      <div className="tw:flex tw:items-center tw:gap-3">
        {/* Middle: title/description */}
        <div className="tw:flex-1">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div>
              <div className="tw:text-sm tw:text-gray-800 tw:mt-1">
                {data.description || "-"}
              </div>
              <div className="tw:text-xs tw:text-slate-500 tw:mt-1 tw:flex tw:items-center tw:gap-1">
                <Calendar size={12} />
                <DateFormat value={data.dateTime} />
              </div>
            </div>
            {/* Right: Amount and date stacked */}
            <div className="tw:text-right tw:ml-4 tw:flex tw:flex-col tw:items-end">
              <div
                className={clsx("tw:text-lg tw:font-semibold", {
                  "tw:text-green-600": data?.paymentType === "credit",
                  "tw:text-red-600": data?.paymentType !== "credit",
                  "tw:text-gray-700": !(data.amount || 0),
                })}
              >
                <Amount value={data.amount} decimalPlaces={2} />
              </div>
              <div
                className={clsx(
                  "tw:inline-block tw:text-xs tw:font-semibold tw:border tw:rounded-sm tw:px-2 tw:py-1",
                  {
                    "tw:text-green-600 tw:border-green-200 tw:bg-green-50":
                      data?.paymentType === "credit",
                    "tw:text-red-600 tw:border-red-200 tw:bg-red-50":
                      data?.paymentType !== "credit",
                  }
                )}
              >
                {data?.paymentType === "credit" ? "Received" : "Paid Out"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Item;
