import { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { debounce } from "lodash";
import { Award, Loader2 } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import LoyaltyPointService from "~/services/LoyaltyPointService";

type Props = {
  customerId: string;
  /** Coin balance on the customer's loyalty account. */
  points: number;
  /** Bill the coins are redeemed against — total less any cart discount. */
  redeemableAmount: number;
  coins: number | "";
  /** Rupee value the loyalty service allowed for `coins`. */
  redemptionValue: number;
  /** Fires `{ action: "change", data: { coins, redemptionValue } }`. */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
};

/**
 * KingCoins redemption. One coin is one rupee, but the bill can never be
 * settled entirely in coins — at least ₹1 has to stay payable — so both the cap
 * and the "Max" shortcut stop a rupee short of the bill.
 *
 * The rupee value is never assumed locally: every change re-prices with the
 * loyalty service (without blocking the coins), and the modal blocks them for
 * real only at submit.
 */
const RedeemSection = ({
  customerId,
  points,
  redeemableAmount,
  coins,
  redemptionValue,
  callback,
  className,
}: Props) => {
  const appToast = useAppToast();
  const [pricing, setPricing] = useState(false);
  const latestRequest = useRef(0);

  const canRedeem = redeemableAmount > 1;
  const maxRedeemable = useMemo(
    () => Math.max(0, Math.min(points || 0, Math.floor(redeemableAmount - 1))),
    [points, redeemableAmount],
  );

  const priceCoins = useCallback(
    debounce(async (value: number) => {
      const requestId = ++latestRequest.current;

      if (!value) {
        setPricing(false);
        callback({ action: "change", data: { coins: "", redemptionValue: 0 } });
        return;
      }

      setPricing(true);
      try {
        const resp = await LoyaltyPointService.redeemAtStorePoints({
          customerId,
          franchiseId: AuthService.getLoggedInUserId(),
          initialCartValue: redeemableAmount,
          coinsIntendedToRedeem: value,
          orderType: "STORE_ORDER",
          orderAmount: redeemableAmount,
          blockCoin: false,
        });

        // A slower earlier response must not overwrite a newer one.
        if (requestId !== latestRequest.current) return;

        if (resp.statusCode === 200) {
          callback({
            action: "change",
            data: {
              coins: value,
              redemptionValue:
                Number(resp.data?.data?.redemptionValue ?? 0) || 0,
            },
          });
        } else {
          appToast.show({
            msg: resp.data?.message || "Failed to redeem coins",
            color: "danger",
          });
          callback({
            action: "change",
            data: { coins: "", redemptionValue: 0 },
          });
        }
      } catch (e) {
        console.error("Error pricing coin redemption", e);
        if (requestId === latestRequest.current) {
          callback({
            action: "change",
            data: { coins: "", redemptionValue: 0 },
          });
        }
      } finally {
        if (requestId === latestRequest.current) setPricing(false);
      }
    }, 700),
    [customerId, redeemableAmount],
  );

  const applyCoins = (value: number | "") => {
    // Show the typed value straight away; the rupee value follows from the API.
    callback({ action: "change", data: { coins: value, redemptionValue: 0 } });
    priceCoins(Number(value) || 0);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      applyCoins("");
      return;
    }
    applyCoins(Math.min(parseInt(raw, 10), maxRedeemable));
  };

  return (
    <div
      className={clsx(
        "tw:space-y-2 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-2.5",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:flex tw:size-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:bg-amber-500 tw:text-white">
          <Award className="tw:size-3.5" strokeWidth={1.75} />
        </span>
        <div className="tw:min-w-0 tw:flex-1 tw:text-xs">
          <span className="tw:font-semibold tw:text-amber-900">
            Redeem KingCoins
          </span>
          <span className="tw:ml-1.5 tw:text-amber-700">
            Bal{" "}
            <span className="tw:font-semibold tw:tabular-nums">{points}</span> ·
            1 coin = ₹1
          </span>
        </div>
        {redemptionValue > 0 && (
          <span className="tw:shrink-0 tw:rounded-full tw:bg-emerald-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:tabular-nums tw:text-emerald-700">
            −<Amount value={redemptionValue} />
          </span>
        )}
      </div>

      <div className="tw:flex tw:items-center tw:gap-1.5">
        <div className="tw:relative tw:flex-1">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={!canRedeem}
            value={coins === "" ? "" : String(coins)}
            onChange={handleInput}
            placeholder={`Coins to redeem (max ${maxRedeemable})`}
            className="tw:h-9 tw:w-full tw:min-w-0 tw:rounded-lg tw:border tw:border-amber-200 tw:bg-white tw:px-3 tw:text-sm tw:font-semibold tw:tabular-nums tw:text-slate-800 tw:outline-none tw:placeholder:text-xs tw:placeholder:font-normal tw:placeholder:text-slate-400 tw:disabled:opacity-60"
          />
          {pricing && (
            <Loader2 className="tw:absolute tw:right-2.5 tw:top-1/2 tw:size-3.5 tw:-translate-y-1/2 tw:animate-spin tw:text-amber-500" />
          )}
        </div>

        <button
          type="button"
          disabled={!canRedeem || !maxRedeemable}
          onClick={() => applyCoins(maxRedeemable)}
          className="tw:h-9 tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:bg-amber-600 tw:px-3 tw:text-xs tw:font-semibold tw:text-white tw:transition-colors hover:tw:bg-amber-700 tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
        >
          Max
        </button>
      </div>

      {!canRedeem && (
        <p className="tw:text-[11px] tw:text-amber-700">
          Coins can't be redeemed when the payable amount is ₹1 or less.
        </p>
      )}
    </div>
  );
};

export default RedeemSection;
