import { CheckCircle2Icon, ShieldCheck } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";

const DeclarationSignedBlock = ({
  name,
  date,
  showViewDeclaration = false,
  callback,
}: {
  name: string;
  date: Date;
  showViewDeclaration?: boolean;
  callback?: (a: { action: string; data?: any }) => void;
}) => {
  return (
    <div className="tw:border-2 tw:border-blue-300 tw:bg-blue-50 tw:rounded-lg tw:p-6 tw:shadow-md">
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:justify-between">
        <div>
          {/* Digital Signature Header */}
          <div className="tw:flex tw:items-center tw:gap-3 tw:mb-4">
            <ShieldCheck className="tw:w-6 tw:h-6 tw:text-blue-600" />
            <h3 className="tw:text-lg tw:font-bold tw:text-blue-900 tw:uppercase tw:tracking-wide">
              Digital Signature
            </h3>
          </div>

          {/* Signature Details */}
          <div className="tw:flex tw:gap-8 tw:items-center">
            <div>
              <label className="tw:block tw:text-xs tw:font-semibold tw:text-gray-600 tw:uppercase tw:tracking-wide tw:mb-1">
                Signer Name
              </label>
              <div className="tw:text-sm tw:font-medium tw:text-gray-900">
                {name || ""}
              </div>
            </div>
            <div>
              <label className="tw:block tw:text-xs tw:font-semibold tw:text-gray-600 tw:uppercase tw:tracking-wide tw:mb-1">
                Date & Time
              </label>
              <div className="tw:text-sm tw:font-medium tw:text-gray-900">
                <DateFormat value={date} />{" "}
              </div>
            </div>
          </div>
        </div>

        <div className="tw:md:self-center">
          <div className="tw:mt-8 tw:md:mt-0 tw:border-2 tw:border-emerald-500 tw:bg-emerald-50 tw:border-dashed tw:px-8 tw:py-2 tw:rounded-md tw:text-center tw:text-emerald-500 tw:font-bold tw:inline-block">
            <div className="tw:flex tw:items-center tw:gap-2 tw:font-bold">
              <CheckCircle2Icon className="tw:w-5 tw:h-5 tw:text-emerald-600" />
              <span className="tw:text-sm tw:text-emerald-700">VERIFIED</span>
            </div>
          </div>

          {showViewDeclaration ? (
            <div className="tw:text-center">
              <span
                className="tw:text-xs tw:text-blue-600 tw:underline tw:cursor-pointer"
                onClick={() => callback?.({ action: "viewDeclaration" })}
              >
                View Declaration
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DeclarationSignedBlock;
