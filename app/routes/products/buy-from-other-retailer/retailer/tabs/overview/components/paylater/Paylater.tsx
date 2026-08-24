import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppProgress from "~/components/core/progress/AppProgress";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import { getPaylaterWallet, utilisationTone, type PaylaterWallet } from "./helper";

type PaylaterProps = {
  retailerId?: string;
  retailerName?: string;
  className?: string;
};

const Paylater = ({ retailerId, retailerName, className }: PaylaterProps) => {
  const [loading, setLoading] = useState(!!retailerId);
  const [wallet, setWallet] = useState<PaylaterWallet | null>(null);

  useEffect(() => {
    if (!retailerId) {
      setWallet(null);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getPaylaterWallet(retailerId);
        if (active) setWallet(data);
      } catch (err) {
        if (active) setWallet(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [retailerId]);

  if (loading) {
    return (
      <AppCard
        className={clsx("tw:mb-4", className)}
        noPadding
        noContentPadding
      >
        <div className="tw:p-3 tw:flex tw:justify-center">
          <AppSpinner className="tw:w-6 tw:h-6" />
        </div>
      </AppCard>
    );
  }

  // No paylater with this retailer — nothing to show. A request still awaiting
  // approval (or one that was rejected/stopped) is not a credit line either.
  if (!wallet || wallet.status !== "Approved") return null;

  const seller = retailerName || wallet.sellerName || "-";
  const { utilisedPercentage, creditUsed, isExpired } = wallet;

  // Expired wallets cannot be drawn against, so the card leads with what is
  // still owed rather than with headroom that is no longer spendable.
  if (isExpired) {
    return (
      <AppCard className={clsx("tw:mb-4", className)} noPadding noContentPadding>
        <div className="tw:p-3">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-2">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-500">
              Paylater · {seller}
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-red-600">
              Expired
            </div>
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:!font-mono">
            {creditUsed > 0 ? (
              <>
                <Amount value={creditUsed} className="tw:!font-serif" /> still
                due · no fresh credit
              </>
            ) : (
              "Settled · no fresh credit"
            )}
          </div>
        </div>
      </AppCard>
    );
  }

  const usedTextColor =
    utilisedPercentage >= 80
      ? "tw:text-red-600"
      : utilisedPercentage >= 50
        ? "tw:text-amber-600"
        : "tw:text-emerald-700";

  return (
    <AppCard className={clsx("tw:mb-4", className)} noPadding noContentPadding>
      <div className="tw:p-3">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-500">
            Paylater · {seller}
          </div>
          <div className={clsx("tw:text-sm tw:font-bold", usedTextColor)}>
            {utilisedPercentage}% used
          </div>
        </div>

        <AppProgress
          value={utilisedPercentage}
          color={utilisationTone(utilisedPercentage)}
          className="tw:mb-3"
        />

        <div className="tw:text-xs tw:text-gray-500 tw:!font-mono">
          Available{" "}
          <Amount value={wallet.creditAvailable} className="tw:!font-serif" /> of{" "}
          <Amount value={wallet.creditLimit} className="tw:!font-serif" />
          {wallet.expiryStatus ? ` · ${wallet.expiryStatus}` : ""}
        </div>
      </div>
    </AppCard>
  );
};

export default Paylater;
export type { PaylaterProps };
