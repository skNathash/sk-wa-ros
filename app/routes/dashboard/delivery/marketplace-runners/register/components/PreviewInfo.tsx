import clsx from "clsx";
import { BadgeCheck, Bike, Landmark, LockKeyhole, MapPin, Phone, Wallet } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import WhatsAppGlyph from "~/components/core/icons/WhatsAppGlyph";
import {
  VEHICLE_TYPE_OPTIONS,
  type RunnerForm,
} from "../helper";

/** One read-only tile in the review grid — tiny uppercase label over a value. */
const Stat = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "tw:rounded-lg tw:bg-white tw:px-3 tw:py-3 tw:shadow-sm tw:ring-1 tw:ring-slate-100",
      className,
    )}
  >
    <div className="tw:flex tw:items-center tw:gap-1.5">
      <Icon size={13} className="tw:text-slate-400" />
      <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-400">
        {label}
      </span>
    </div>
    <div className="tw:mt-1.5 tw:text-sm tw:font-semibold tw:leading-snug tw:text-slate-900">
      {value || "—"}
    </div>
  </div>
);

/** Label for a vehicle-type value, falling back to the raw value. */
const vehicleTypeLabel = (value: string) =>
  VEHICLE_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;

/**
 * Review step — a read-only recap of everything collected across the three
 * earlier steps before the single create call fires. Nothing is editable here;
 * going Back reopens the step that owns the field. The identity card up top is
 * the runner at a glance, the grid beneath spells out the commercial details
 * (rate, payout account, trust bond) that the store will confirm on activation.
 */
const PreviewInfo = () => {
  const { control } = useFormContext();
  const data = useWatch({ control }) as RunnerForm;

  const name = data.name || "—";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const kycComplete = Boolean(data.aadhaarNo && data.photo?.id);
  const vehicleSubtitle = [data.vehicleNo, "Kumbalgudu - New"]
    .filter(Boolean)
    .join(" · ");

  /** Commercial terms the form does not collect — the store's running defaults
      for a fresh runner. Swap for store config once the create call carries it. */
  const rateLabel = "₹35 + ₹6/km";
  const payoutLabel = `${name
    .split(" ")[0]
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase()}@ybl`;
  const trustBondLabel = "₹500 escrow";

  return (
    <div className="tw:grid tw:gap-4">
      {/* Identity card — the runner at a glance. */}
      <div className="tw:rounded-2xl tw:border tw:border-emerald-200 tw:bg-gradient-to-br tw:from-emerald-50 tw:to-lime-50 tw:p-4">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-orange-500 tw:text-base tw:font-bold tw:text-white">
            {initials || "?"}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <h2 className="tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
              {name}
            </h2>
            <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:truncate tw:text-xs tw:text-emerald-700">
              <MapPin size={12} className="tw:shrink-0" />
              <span className="tw:truncate">{vehicleSubtitle || "—"}</span>
            </p>
          </div>

          <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:rounded-full tw:border tw:border-emerald-400 tw:bg-white tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-emerald-600">
            Online
          </span>
        </div>
      </div>

      {/* Commercial details behind the hire.*/}
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        <Stat icon={Phone} label="Phone" value={data.mobile} />
        <Stat
          icon={BadgeCheck}
          label="KYC"
          value={kycComplete ? "Complete" : "Pending"}
        />
        <Stat
          icon={Bike}
          label="Vehicle"
          value={vehicleTypeLabel(data.vehicleType)}
        />
        <Stat icon={Wallet} label="Rate" value={rateLabel} />
        <Stat icon={Landmark} label="Payout" value={payoutLabel} className="tw:col-span-1" />
        <Stat icon={LockKeyhole} label="Trust bond" value={trustBondLabel} />
      </div>

      {/* Activation note — what lands on the runner's phone. */}
      <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-amber-50 tw:px-4 tw:py-3">
        <span className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-800 tw:text-white">
          <WhatsAppGlyph size={14} />
        </span>
        <p className="tw:text-[13px] tw:leading-relaxed tw:text-slate-700">
          Welcome message + rate card will be sent on WhatsApp on activate.
        </p>
      </div>
    </div>
  );
};

export default PreviewInfo;
