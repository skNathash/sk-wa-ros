import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  getPaylaterWallet,
  type PaylaterWallet,
} from "~/shared/accounts/paylater/my-wallet";
import { fetchPayableAmount, fetchPoStats, type PoStats } from "./helper";

/**
 * Vendor overview summary — 2×2 stat cards matching the shared theme-2 mock:
 * "You owe" (outstanding payable), "PayLater limit" (with used/free bar),
 * "POs this month" and "Fill rate".
 *
 * Wired to the same APIs as the buy-from-other-retailer retailer summary
 * (accounts payables + paylater); orders come from the purchase-order list
 * API. Fill rate stays static — no API for it yet.
 */

type SummaryCardsProps = {
  vendorId?: string;
};

const spinner = <AppSpinner className="tw:w-5 tw:h-5" />;

const SummaryCards = ({ vendorId }: SummaryCardsProps) => {
  const [payable, setPayable] = useState(0);
  const [paylater, setPaylater] = useState<PaylaterWallet | null>(null);
  const [poStats, setPoStats] = useState<PoStats>({
    count: 0,
    value: 0,
    pendingInward: 0,
  });
  const [loading, setLoading] = useState(!!vendorId);

  useEffect(() => {
    if (!vendorId) {
      setPayable(0);
      setPaylater(null);
      setPoStats({ count: 0, value: 0, pendingInward: 0 });
      setLoading(false);
      return;
    }
    let active = true;
    const fetchSummaryData = async () => {
      setLoading(true);
      try {
        const [amount, paylaterData, stats] = await Promise.all([
          fetchPayableAmount(vendorId),
          getPaylaterWallet(vendorId).catch(() => null),
          fetchPoStats(vendorId),
        ]);
        if (active) {
          setPayable(amount);
          setPaylater(paylaterData);
          setPoStats(stats);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSummaryData();
    return () => {
      active = false;
    };
  }, [vendorId]);

  const creditLimit = paylater?.creditLimit || 0;
  const usedPercentage = paylater?.utilisedPercentage || 0;
  const usedAmount = paylater?.creditUsed || 0;
  const freeAmount = Math.max(0, creditLimit - usedAmount);

  return (
    <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-4 tw:gap-2 tw:mb-3">
      <AppCard className="tw:mb-0" noPadding bodyClassName="tw:p-3">
        <div className="app-label tw:text-gray-500">You owe</div>
        <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-red-600">
          {loading ? spinner : <Amount value={payable} decimalPlaces={0} />}
        </div>
      </AppCard>

      {/* <AppCard className="tw:mb-0" noPadding bodyClassName="tw:p-3">
        <div className="app-label tw:text-gray-500">PayLater limit</div>
        <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-green-700">
          {loading ? (
            spinner
          ) : paylater ? (
            <Amount value={creditLimit} decimalPlaces={0} />
          ) : (
            <span>-</span>
          )}
        </div>
        {!loading && paylater ? (
          <>
            <div className="tw:mt-1 tw:h-1.5 tw:rounded-full tw:bg-gray-200 tw:overflow-hidden">
              <div
                className="tw:h-full tw:rounded-full tw:bg-green-600"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
              <Amount value={usedAmount} decimalPlaces={0} /> used ·{" "}
              <Amount value={freeAmount} decimalPlaces={0} /> free
            </div>
          </>
        ) : null}
        {!loading && !paylater ? (
          <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
            Not active
          </div>
        ) : null}
      </AppCard> */}

      <AppCard className="tw:mb-0" noPadding bodyClassName="tw:p-3">
        <div className="app-label tw:text-gray-500">POs this month</div>
        <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-gray-900">
          {loading ? (
            spinner
          ) : (
            <>
              {poStats.count} ·{" "}
              <Amount value={poStats.value} decimalPlaces={0} />
            </>
          )}
        </div>
        {!loading && poStats.pendingInward > 0 ? (
          <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
            {poStats.pendingInward} pending inward
          </div>
        ) : null}
      </AppCard>

      {/* No API available for fill rate yet — static placeholder. */}
      {/* <AppCard className="tw:mb-0" noPadding bodyClassName="tw:p-3">
        <div className="app-label tw:text-gray-500">Fill rate · 90 d</div>
        <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-green-700">
          94%
        </div>
        <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
          6 short-shipments
        </div>
      </AppCard> */}
    </div>
  );
};

export default SummaryCards;
