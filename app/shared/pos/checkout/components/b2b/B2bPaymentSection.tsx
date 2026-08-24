import clsx from "clsx";
import { Building2, MapPin, Phone, QrCode, Wallet } from "lucide-react";
import UpiSection from "../upi/UpiSection";
import PaylaterSection, {
  type PaylaterWallet,
} from "../paylater/PaylaterSection";
import type { B2bPaymentMode } from "./helper";

type Props = {
  retailer: Record<string, any> | null;
  /** Rails the seller's policy allows this retailer. */
  modes: B2bPaymentMode[];
  mode: B2bPaymentMode;
  amount: number;
  /** UPI config the retailer paid into, by its `paymentMethod` value. */
  upiMethod?: string;
  /** UTR the retailer read back. */
  upiReference?: string;
  /**
   * Fires `{ action: "select", data: { mode } }` on a rail change,
   * `{ action: "upi", data }` on every UPI edit (including the loaded configs)
   * and `{ action: "eligibility", data: wallet }` once the credit line is read.
   */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
};

const MODE_META: Record<
  B2bPaymentMode,
  { label: string; icon: typeof Wallet }
> = {
  upi: { label: "UPI / QR", icon: QrCode },
  paylater: { label: "Paylater", icon: Wallet },
};

/**
 * The head of the B2B flow. A B2B cart already knows its buyer, so there is no
 * customer step to walk through — the retailer is stated once and the counter
 * goes straight to how the bill is settled.
 */
const B2bPaymentSection = ({
  retailer,
  modes,
  mode,
  amount,
  upiMethod,
  upiReference,
  callback,
  className,
}: Props) => (
  <div className={clsx("tw:space-y-2.5", className)}>
    {retailer && (
      <div className="tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-3 tw:py-2">
        <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-700 tw:text-white">
          <Building2 className="tw:size-4" strokeWidth={1.75} />
        </span>

        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
              {retailer.name || "-"}
            </span>
            {retailer.franchiseId && (
              <span className="tw:shrink-0 tw:text-[11px] tw:text-slate-500">
                ID: {retailer.franchiseId}
              </span>
            )}
          </div>
          <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2.5 tw:gap-y-0.5 tw:text-[11px] tw:text-slate-500">
            {retailer.mobile && (
              <span className="tw:flex tw:items-center tw:gap-1">
                <Phone size={11} className="tw:shrink-0" />
                <span className="tw:tabular-nums">{retailer.mobile}</span>
              </span>
            )}
            {retailer.formatAddress && (
              <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1">
                <MapPin size={11} className="tw:shrink-0" />
                <span className="tw:truncate">{retailer.formatAddress}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    )}

    {modes.length === 0 ? (
      <div className="tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-2.5 tw:text-xs tw:text-amber-900">
        <div className="tw:font-semibold">No payment mode available</div>
        <p className="tw:mt-0.5 tw:text-[11px] tw:text-amber-800">
          This retailer has neither prepaid collection nor a paylater limit
          enabled. Update their payment policy to raise an order here.
        </p>
      </div>
    ) : (
      <>
        <div className="tw:grid tw:grid-cols-2 tw:gap-1.5">
          {modes.map((key) => {
            const meta = MODE_META[key];
            const Icon = meta.icon;
            const active = mode === key;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  callback({ action: "select", data: { mode: key } })
                }
                className={clsx(
                  "tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:px-2.5 tw:py-2 tw:text-left tw:transition-colors",
                  active
                    ? "tw:border-emerald-600 tw:bg-emerald-50 tw:shadow-sm"
                    : "tw:border-slate-200 tw:bg-white tw:hover:border-slate-300 tw:hover:bg-slate-50",
                )}
              >
                <span
                  className={clsx(
                    "tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:transition-colors",
                    active
                      ? "tw:bg-emerald-700 tw:text-white"
                      : "tw:bg-slate-100 tw:text-slate-500",
                  )}
                >
                  <Icon className="tw:size-3.5" strokeWidth={1.75} />
                </span>
                <span
                  className={clsx(
                    "tw:truncate tw:text-xs tw:font-semibold",
                    active ? "tw:text-emerald-900" : "tw:text-slate-700",
                  )}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {mode === "upi" && (
          <UpiSection
            amount={amount}
            method={upiMethod}
            reference={upiReference}
            amountReadOnly
            callback={(payload) => callback({ action: "upi", data: payload })}
          />
        )}

        {mode === "paylater" && (
          <PaylaterSection
            amount={amount}
            user={retailer}
            type="b2b"
            callback={(payload) =>
              payload.action === "eligibility" &&
              callback({
                action: "eligibility",
                data: payload.data as PaylaterWallet,
              })
            }
          />
        )}
      </>
    )}
  </div>
);

export default B2bPaymentSection;
