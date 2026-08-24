import clsx from "clsx";
import { ChevronRight, CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import PaylaterManageWalletModal from "~/shared/accounts/modals/paylater/manage-wallet/PaylaterManageWalletModal";

/** The sanctioned limits a customer climbs through, smallest first. */
const LADDER = [200, 500, 1000, 5000];

/** On-time bills it takes to earn the next rung. */
const BILLS_PER_TIER = 5;

export interface PaylaterTierLadderProps {
  /** Customer the wallet belongs to — the component fetches it and the modal
   * reads it. */
  userId: string;
  /** Which network the holder sits in — B2C customers or B2B retailers. The
   * eligibility read and the manage-wallet modal are scoped by it. */
  type?: "b2c" | "b2b";
  /** Fired after the wallet changes so the host page can refetch too. */
  onRefresh?: () => void;
}

const money = (value: number) =>
  CommonService.formatCompact(value, { style: "short" });

const shellClass =
  "tw:flex tw:h-full tw:flex-col tw:overflow-clip tw:rounded-xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-violet-200";

/**
 * Paylater wallet header with the tier ladder underneath — what the customer
 * can draw today, and the rung they climb to next. It owns its own fetch, so
 * the host only says which customer it is. "Bump limit" opens the shared
 * manage-wallet modal, so the ladder never owns limit changes itself.
 */
const PaylaterTierLadder = ({
  userId,
  type = "b2c",
  onRefresh,
}: PaylaterTierLadderProps) => {
  // B2B wallets hang off the franchise record, B2C ones off the customer.
  const holderType = type === "b2b" ? "franchise" : "customer";
  const holderLabel = type === "b2b" ? "retailer" : "customer";

  const appNav = useAppNav();
  const [showManageWallet, setShowManageWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Record<string, any> | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const resp: any = await PaylaterService.validateEligibility({
        userInfo: { id: userId, type: holderType },
        franchiseInfo: { id: AuthService.getLoggedInUserId() },
      });
      setWallet(resp?.data?.data?.paylaterInfo || null);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [userId, holderType]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleModalCallback = () => {
    setShowManageWallet(false);
    fetchWallet();
    onRefresh?.();
  };

  const limit = wallet?.creditLimit || 0;
  const available = wallet?.creditAvailable ?? Math.max(limit, 0);
  const used = wallet?.totalPayableAmount ?? Math.max(limit - available, 0);
  const statusLabel = wallet?._statusLbl || wallet?.status;

  // The rung the current limit sits on; anything above it is still to earn.
  const currentIndex = LADDER.reduce(
    (acc, step, index) => (limit >= step ? index : acc),
    0,
  );
  const nextStep = LADDER[currentIndex + 1];

  const modal = (
    <PaylaterManageWalletModal
      show={showManageWallet}
      userId={userId}
      routeType={type}
      callback={handleModalCallback}
    />
  );

  if (loading) {
    return (
      <div
        className={clsx(
          shellClass,
          "tw:items-center tw:justify-center tw:py-8",
        )}
      >
        <AppSpinner className="tw:h-6 tw:w-6" />
      </div>
    );
  }

  // Opening the first wallet runs through the unlock desk — it captures KYC
  // and the sanctioned limit together — so the CTA hands off there with the
  // holder already selected, rather than opening the limit-only modal.
  const goToUnlockDesk = () =>
    appNav.to("/dashboard/paylater/unlock", {
      tab: "unlock",
      type,
      userId,
    });

  // No wallet yet — the ladder has nothing to show, so the card becomes the
  // invitation to open one instead of a row of empty rungs.
  if (!wallet) {
    return (
      <>
        <div
          className={clsx(
            shellClass,
            "tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:py-6 tw:text-center tw:ring-slate-200",
          )}
        >
          <span className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-violet-50 tw:text-violet-600">
            <CreditCard size={20} />
          </span>
          <p className="tw:text-sm tw:font-semibold tw:text-slate-800">
            No paylater wallet
          </p>
          <p className="tw:text-xs tw:text-slate-500">
            This {holderLabel} can&apos;t buy on credit yet. Open a wallet to
            set a limit and start the tier ladder.
          </p>
          <AppButton
            size="small"
            fill="solid"
            className="tw:mt-1"
            onClick={goToUnlockDesk}
          >
            Set up paylater
          </AppButton>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={shellClass}>
        {/* Header — the number the seller quotes at the counter. */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:bg-linear-to-r tw:from-violet-600 tw:to-violet-500 tw:px-4 tw:py-2.5">
          <div className="tw:min-w-0">
            <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
              Paylater{statusLabel ? ` · ${statusLabel}` : ""}
            </p>
            <p className="tw:mt-0.5 tw:truncate tw:text-base tw:font-bold tw:leading-tight tw:text-white">
              {money(available)} available · {money(used)} used
            </p>
          </div>

          <AppButton
            size="small"
            fill="solid"
            className="tw:shrink-0 tw:bg-white tw:text-violet-700 tw:hover:bg-violet-50"
            onClick={() => setShowManageWallet(true)}
          >
            Bump limit
          </AppButton>
        </div>

        {/* Ladder — where they are, and what the next on-time bills unlock. */}
        <div className="tw:flex tw:flex-1 tw:flex-col tw:bg-white tw:px-4 tw:py-3">
          <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
            Tier ladder
          </p>

          <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1">
            {LADDER.map((step, index) => (
              <div key={step} className="tw:flex tw:items-center tw:gap-1">
                <span
                  className={clsx(
                    "tw:rounded-md tw:px-2.5 tw:py-1 tw:text-xs tw:font-bold",
                    index === currentIndex
                      ? "tw:bg-violet-600 tw:text-white"
                      : index < currentIndex
                        ? "tw:bg-violet-100 tw:text-violet-700"
                        : index === currentIndex + 1
                          ? "tw:border tw:border-dashed tw:border-violet-300 tw:bg-violet-50/60 tw:text-violet-600"
                          : "tw:bg-slate-100 tw:text-slate-500",
                  )}
                >
                  {money(step)}
                </span>
                {index < LADDER.length - 1 ? (
                  <ChevronRight size={12} className="tw:text-slate-300" />
                ) : null}
              </div>
            ))}
          </div>

          <p className="tw:mt-auto tw:pt-2.5 tw:text-[11px] tw:text-slate-500">
            Each on-time bill → next tier.
            {nextStep
              ? ` ${money(nextStep)} unlocks in ~${BILLS_PER_TIER} bills.`
              : " Top tier reached."}
          </p>
        </div>
      </div>

      {modal}
    </>
  );
};

export default PaylaterTierLadder;
