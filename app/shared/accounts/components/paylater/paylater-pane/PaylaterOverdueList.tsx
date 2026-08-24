import clsx from "clsx";
import { differenceInCalendarDays, endOfDay, format, parseISO } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
const AVATAR_TONES = [
  "tw:bg-rose-800",
  "tw:bg-fuchsia-600",
  "tw:bg-amber-600",
  "tw:bg-sky-600",
];

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** How many days a wallet has been past its validity, if it is past it. */
const daysOverdue = (validityEndDate?: string) => {
  if (!validityEndDate) return 0;
  try {
    return Math.max(
      0,
      differenceInCalendarDays(new Date(), parseISO(validityEndDate)),
    );
  } catch (e) {
    return 0;
  }
};

interface PaylaterOverdueListProps {
  /** How many overdue wallets the list shows. */
  limit?: number;
  className?: string;
}

/**
 * The wallets that are already late, each with a one-tap WhatsApp reminder —
 * the pane's version of the analytics overdue strip.
 *
 * Same query the analytics Collect list runs: paylater requests carrying a
 * payable amount whose validity has lapsed, newest page first.
 */
const PaylaterOverdueList = ({
  limit = 4,
  className,
}: PaylaterOverdueListProps) => {
  const appNav = useAppNav();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [reminderModal, setReminderModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: {} });

  useEffect(() => {
    const fetchOverdue = async () => {
      setLoading(true);
      try {
        const resp: any = await PaylaterService.getRequests({
          page: 1,
          count: limit,
          filter: {
            totalPayableAmount: { $gt: 0 },
            validityEndDate: { $lte: endOfDay(new Date()) },
          },
          isMyNetwork: true,
        });

        const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
        setAccounts(PaylaterService.formatPaylaterRequest(rows) || []);
      } catch (e) {
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdue();
  }, [limit]);

  const handleRemind = useCallback((item: any) => {
    setReminderModal({
      show: true,
      data: {
        data: {
          dynamicData: {
            customerName: item.userInfo?.name || "",
            franchiseName: AuthService.getLoggedInUser()?.name,
            amount: CommonService.formattedAmount(item.totalPayableAmount || 0),
            dueDate: item.validityEndDate
              ? format(new Date(item.validityEndDate), "dd MMM yyyy")
              : "",
            franchiseId: AuthService.getLoggedInUserId(),
            customerId: item.userInfo?._id,
          },
        },
        users: [
          {
            name: item.userInfo?.name || "",
            mobile: item.userInfo?.mobile || "",
            type: "Customer",
          },
        ],
        categories: ["payLater"],
        templateFor: [item.userCategory === "B2B" ? "B2B" : "B2C"],
      },
    });
  }, []);

  const handleReminderModalCallback = useCallback(
    (payload: { action: string }) => {
      if (["close", "send", "send_error"].includes(payload.action)) {
        setReminderModal({ show: false, data: {} });
      }
    },
    [],
  );

  const handleSeeAll = () =>
    appNav.to("/dashboard/paylater/wallets/b2c", {
      tab: "b2c-wallets",
      status: "Overdue",
    });

  if (!loading && !accounts.length) return null;

  return (
    <>
      <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
        <p
          className="tw:px-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Overdue · needs a nudge
        </p>

        {loading ? (
          <div className="tw:flex tw:justify-center tw:py-6">
            <AppSpinner className="tw:h-6 tw:w-6" />
          </div>
        ) : (
          <>
            {accounts.map((item, index) => {
              const days = daysOverdue(item.validityEndDate);
              return (
                <div
                  key={item._id || index}
                  className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:border-rose-200 tw:bg-rose-50 tw:p-2.5"
                >
                  <div
                    className={clsx(
                      "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                      AVATAR_TONES[index % AVATAR_TONES.length],
                    )}
                  >
                    {initialsOf(item.userInfo?.name)}
                  </div>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                      {item.userInfo?.name || "-"}
                    </div>
                    <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:font-medium tw:text-rose-500">
                      {item.expiryStatus || "Overdue"}
                      {days ? ` · ${days}d` : ""} ·{" "}
                      <Amount
                        value={item.totalPayableAmount}
                        decimalPlaces={0}
                      />
                    </div>
                  </div>

                  <AppButton
                    size="small"
                    color="danger"
                    fill="solid"
                    className="tw:shrink-0 tw:gap-1.5"
                    onClick={() => handleRemind(item)}
                  >
                    <MessageCircle size={14} />
                    Remind
                  </AppButton>
                </div>
              );
            })}

            <AppButton
              size="small"
              color="light"
              fill="outline"
              className="tw:w-full"
              onClick={handleSeeAll}
            >
              See all overdue wallets
            </AppButton>
          </>
        )}
      </div>

      <WhatsappTemplateModal
        show={reminderModal.show}
        callback={handleReminderModalCallback}
        data={reminderModal.data.data}
        users={reminderModal.data.users}
        categories={reminderModal.data.categories}
        templateFor={reminderModal.data.templateFor}
      />
    </>
  );
};

export default PaylaterOverdueList;
