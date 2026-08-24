import { Star } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { EMPTY, getRating, type Retailer } from "../../helper";

type LegalTaxProps = {
  data: Retailer;
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500">
      {label}
    </div>
    <div className="tw:mt-0.5 tw:text-sm tw:font-medium tw:text-slate-800">
      {value}
    </div>
  </div>
);

const RatingStars = ({ value }: { value: number }) => {
  const fullStars = Math.min(5, Math.max(0, Math.floor(value)));
  return (
    <span className="tw:inline-flex tw:items-center tw:gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < fullStars
              ? "tw:fill-amber-400 tw:text-amber-400"
              : "tw:text-slate-200"
          }
        />
      ))}
    </span>
  );
};

const LegalTax = ({ data }: LegalTaxProps) => {
  const gst = data.gstNumber || EMPTY;
  const kycStatus = data.kycStatus?.overallStatus || data.status;
  const isVerified =
    String(kycStatus).toLowerCase() === "approved" ||
    String(data.isGSTVerified).toLowerCase() === "true";
  const rating = getRating(data);

  return (
    <AppCard title="Legal & Tax">
      <div className="tw:space-y-4">
        <Field label="GST" value={gst} />

        <Field
          label="Verification"
          value={
            <span
              className={`tw:inline-flex tw:items-center tw:gap-1.5 ${
                isVerified ? "tw:text-emerald-600" : "tw:text-slate-500"
              }`}
            >
              <span
                className={`tw:h-2 tw:w-2 tw:rounded-full ${
                  isVerified ? "tw:bg-emerald-500" : "tw:bg-slate-300"
                }`}
              />
              {isVerified ? "KYC verified" : kycStatus || EMPTY}
            </span>
          }
        />

        <Field
          label="Rating"
          value={
            <span className="tw:inline-flex tw:items-center tw:gap-2">
              <RatingStars value={rating.value} />
              <span className="tw:text-slate-700">
                {rating.value.toFixed(1)}/5
              </span>
            </span>
          }
        />
      </div>
    </AppCard>
  );
};

export default LegalTax;
