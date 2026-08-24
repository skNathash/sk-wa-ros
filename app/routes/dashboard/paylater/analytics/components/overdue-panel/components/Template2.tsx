import clsx from "clsx";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { avatarToneAt, initialsOf } from "../../high-exposure/helper";
import { tierToneOf } from "../../live-wallets/helper";
import { hasLastActivity, type OverdueAccount } from "../helper";

interface Template2Props {
  accounts: OverdueAccount[];
  loading: boolean;
  /** Account whose contact details are being fetched for the reminder. */
  remindingId: string;
  onRemind: (account: OverdueAccount) => void;
}

/**
 * Overdue recovery, mobile — one rose card per late account instead of the
 * desktop panel: avatar, name with its tier chip, what is overdue and for how
 * long, when the account was last seen, and a pill reminder on the right.
 */
const Template2 = ({
  accounts,
  loading,
  remindingId,
  onRemind,
}: Template2Props) => {
  const { t } = useTranslation();

  if (loading)
    return (
      <div className="tw:flex tw:justify-center tw:py-6">
        <AppSpinner className="tw:h-6 tw:w-6" />
      </div>
    );

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {accounts.map((account, index) => (
        <div
          key={`${account.userId}-${index}`}
          className="tw:flex tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:border-rose-200 tw:bg-rose-50 tw:p-3"
        >
          <div
            className={clsx(
              "tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-sm tw:font-bold tw:text-white",
              avatarToneAt(index),
            )}
          >
            {initialsOf(account.userName)}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            {/* Name + tier chip */}
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <AppLink
                href={account.profileUrl}
                asLink
                className="tw:truncate tw:text-[15px] tw:font-semibold tw:text-slate-800 tw:inline-block"
              >
                {account.userName}
              </AppLink>

              {account.userType && (
                <span
                  className={clsx(
                    "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                    tierToneOf(account.userType),
                  )}
                >
                  {account.userType}
                </span>
              )}
            </div>

            {/* What is late, and by how long */}
            <div className="tw:mt-0.5 tw:truncate tw:text-[13px] tw:text-rose-500">
              {account.overdueDays > 0 && (
                <>
                  Overdue ·{" "}
                  <span className="tw:font-bold">{account.overdueDays}d</span>{" "}
                  ·{" "}
                </>
              )}
              <Amount
                value={account.outstanding}
                decimalPlaces={0}
                className="tw:font-bold"
              />
            </div>

            {/* When the account last moved */}
            {hasLastActivity(account.lastActivityAt) && (
              <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-400">
                Last ·{" "}
                <DateFormat value={account.lastActivityAt} formatStr="dd MMM" />
              </div>
            )}
          </div>

          <AppButton
            size="small"
            color="primary"
            fill="solid"
            className="tw:shrink-0 tw:gap-1.5 tw:rounded-full tw:px-4"
            disabled={remindingId === account.userId}
            onClick={() => onRemind(account)}
          >
            {remindingId === account.userId ? (
              <AppSpinner className="tw:h-4 tw:w-4" />
            ) : (
              <MessageCircle size={16} />
            )}
            {t("remind")}
          </AppButton>
        </div>
      ))}
    </div>
  );
};

export default Template2;
