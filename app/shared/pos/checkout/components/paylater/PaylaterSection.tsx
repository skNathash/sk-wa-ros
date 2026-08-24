import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Info, Loader2, Plus, ShieldCheck } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import { Button } from "~/components/ui/button";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import PaylaterKycModal from "~/shared/accounts/paylater/kyc-form/PaylaterKycModal";

/** What the eligibility call tells us about this buyer's credit line. */
export type PaylaterWallet = {
  /** A wallet exists for this buyer at this store. */
  configured: boolean;
  eligible: boolean;
  balance: number;
  creditLimit: number;
  message: string;
};

const EMPTY_WALLET: PaylaterWallet = {
  configured: false,
  eligible: false,
  balance: 0,
  creditLimit: 0,
  message: "",
};

type Props = {
  /** Amount that would be debited from the credit line. */
  amount: number;
  /** Buyer the credit line belongs to — customer (b2c) or retailer (b2b). */
  user: Record<string, any> | null;
  type?: "b2c" | "b2b";
  /** Fires `{ action: "eligibility", data: wallet }` on every wallet read. */
  callback?: (payload: { action: string; data?: any }) => void;
  className?: string;
};

/**
 * The paylater rail: what the buyer has, what this bill takes, what is left
 * after. Three figures in that order, because the only question at the counter
 * is whether the bill clears the line.
 *
 * With no wallet on the buyer there is nothing to debit, so the block becomes
 * a note and a way to start the KYC that creates one.
 */
const PaylaterSection = ({
  amount = 0,
  user,
  type = "b2c",
  callback,
  className,
}: Props) => {
  const [wallet, setWallet] = useState<PaylaterWallet>(EMPTY_WALLET);
  const [loading, setLoading] = useState(false);
  const [showKyc, setShowKyc] = useState(false);

  const userId = user?._id || user?.id || user?.customerId || "";

  const loadWallet = useCallback(async () => {
    if (!userId) {
      setWallet(EMPTY_WALLET);
      callback?.({ action: "eligibility", data: EMPTY_WALLET });
      return;
    }

    setLoading(true);
    try {
      const resp: any = await PaylaterService.validateEligibility({
        userInfo: {
          id: userId,
          type: type === "b2b" ? "franchise" : "customer",
        },
        franchiseInfo: { id: AuthService.getLoggedInUserId() },
      });

      const info = resp.data?.data?.paylaterInfo ?? {};
      const next: PaylaterWallet = {
        configured: resp?.statusCode === 200 && Object.keys(info).length > 0,
        eligible: resp.data?.data?.eligible ?? false,
        balance: Number(info.creditAvailable ?? 0) || 0,
        creditLimit: Number(info.creditLimit ?? 0) || 0,
        message: resp.data?.data?.reason ?? "",
      };

      setWallet(next);
      callback?.({ action: "eligibility", data: next });
    } catch (e) {
      console.error("Error checking paylater eligibility:", e);
      setWallet(EMPTY_WALLET);
      callback?.({ action: "eligibility", data: EMPTY_WALLET });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  if (loading) {
    return (
      <div
        className={clsx(
          "tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-slate-50 tw:p-4 tw:text-xs tw:text-slate-500",
          className,
        )}
      >
        <Loader2 className="tw:size-3.5 tw:animate-spin" />
        Checking credit line…
      </div>
    );
  }

  if (!wallet.configured) {
    return (
      <>
        <div
          className={clsx(
            "tw:space-y-2 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-2.5",
            className,
          )}
        >
          <div className="tw:flex tw:items-start tw:gap-2">
            <Info className="tw:mt-0.5 tw:size-3.5 tw:shrink-0 tw:text-amber-600" />
            <div className="tw:text-xs tw:text-amber-900">
              <div className="tw:font-semibold">No paylater account</div>
              <p className="tw:mt-0.5 tw:text-[11px] tw:text-amber-800">
                {user
                  ? "This buyer has no credit line at your store yet. Complete the KYC to create one."
                  : "Select a customer first to check their credit line."}
              </p>
            </div>
          </div>

          {user && (
            <Button
              type="button"
              variant="outline"
              className="tw:h-9 tw:w-full tw:bg-white tw:text-xs"
              onClick={() => setShowKyc(true)}
            >
              <Plus size={16} />
              Create paylater account
            </Button>
          )}
        </div>

        {user && (
          <PaylaterKycModal
            show={showKyc}
            onClose={() => setShowKyc(false)}
            user={{
              _id: userId,
              id: userId,
              userId: user?.userId || userId,
              name: user?.name,
              mobile: user?.mobile,
              email: user?.email,
              subType: user?.subType,
              franchiseId: user?.franchiseId,
              refNo: user?.refNo,
            }}
            type={type}
            title={`PayLater KYC - ${user?.name || "Customer"}`}
            onSuccess={() => {
              setShowKyc(false);
              loadWallet();
            }}
          />
        )}
      </>
    );
  }

  const balanceAfter = wallet.balance - (amount || 0);
  const isShort = balanceAfter < 0;

  return (
    <div
      className={clsx(
        "tw:space-y-2 tw:rounded-xl tw:bg-slate-50 tw:p-2.5",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-600">
        <ShieldCheck className="tw:size-3.5 tw:shrink-0 tw:text-emerald-600" />
        Credit line
        {wallet.creditLimit > 0 && (
          <span className="tw:ml-auto tw:text-[11px] tw:text-slate-500">
            Limit <Amount value={wallet.creditLimit} decimalPlaces={0} />
          </span>
        )}
      </div>

      <div className="tw:divide-y tw:divide-slate-200 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white">
        <Row label="Available balance" value={wallet.balance} />
        <Row label="Debiting for this bill" value={-(amount || 0)} negative />
        <Row label="Balance after debit" value={balanceAfter} strong />
      </div>

      {isShort ? (
        <p className="tw:text-[11px] tw:font-semibold tw:text-red-600">
          Short by <Amount value={Math.abs(balanceAfter)} /> — collect the
          balance in cash or UPI.
        </p>
      ) : (
        !wallet.eligible &&
        wallet.message && (
          <p className="tw:text-[11px] tw:text-amber-700">{wallet.message}</p>
        )
      )}
    </div>
  );
};

const Row = ({
  label,
  value,
  negative,
  strong,
}: {
  label: string;
  value: number;
  negative?: boolean;
  strong?: boolean;
}) => (
  <div className="tw:flex tw:items-center tw:justify-between tw:px-3 tw:py-1.5">
    <span
      className={clsx(
        "tw:text-xs",
        strong ? "tw:font-semibold tw:text-slate-800" : "tw:text-slate-600",
      )}
    >
      {label}
    </span>
    <span
      className={clsx(
        "tw:tabular-nums",
        strong ? "tw:text-base tw:font-bold" : "tw:text-xs tw:font-semibold",
        negative
          ? "tw:text-slate-700"
          : value < 0
            ? "tw:text-red-600"
            : "tw:text-emerald-700",
      )}
    >
      {negative && "−"}
      <Amount value={Math.abs(value)} />
    </span>
  </div>
);

export default PaylaterSection;
