import clsx from "clsx";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { avatarToneAt, initialsOf } from "../../high-exposure/helper";
import { hasLastActivity, type OverdueAccount } from "../helper";

interface Template1Props {
  accounts: OverdueAccount[];
  loading: boolean;
  /** Account whose contact details are being fetched for the reminder. */
  remindingId: string;
  onRemind: (account: OverdueAccount) => void;
}

/**
 * Overdue recovery, desktop — the late accounts laid out two-up as white tiles
 * inside the rose panel, each with a one-tap WhatsApp reminder.
 */
const Template1 = ({
  accounts,
  loading,
  remindingId,
  onRemind,
}: Template1Props) => {
  const { t } = useTranslation();

  if (loading)
    return (
      <div className="tw:flex tw:justify-center tw:py-6">
        <AppSpinner className="tw:h-6 tw:w-6" />
      </div>
    );

  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:p-3 tw:md:grid-cols-2 tw:md:p-4">
      {accounts.map((account, index) => (
        <div
          key={`${account.userId}-${index}`}
          className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-white tw:p-3 tw:shadow-sm"
        >
          <div
            className={clsx(
              "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-sm tw:font-bold tw:text-white",
              avatarToneAt(index),
            )}
          >
            {initialsOf(account.userName)}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <AppLink
                href={account.profileUrl}
                asLink
                className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800 tw:inline-block"
              >
                {account.userName}
              </AppLink>
              {account.userType && (
                <AppBadge variant="warning" size="sm">
                  {account.userType.toUpperCase()}
                </AppBadge>
              )}
            </div>

            <div className="tw:mt-0.5 tw:text-xs tw:font-semibold tw:text-rose-500">
              {account.overdueDays > 0
                ? `Overdue · ${account.overdueDays}d · `
                : ""}
              <Amount value={account.outstanding} decimalPlaces={0} />
            </div>

            {hasLastActivity(account.lastActivityAt) && (
              <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
                Last activity{" "}
                <DateFormat value={account.lastActivityAt} formatStr="dd MMM" />
              </div>
            )}
          </div>

          <AppButton
            size="small"
            color="primary"
            fill="solid"
            className="tw:shrink-0 tw:gap-1.5"
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

export default Template1;
