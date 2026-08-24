import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import useScreenView from "~/hooks/useScreenView";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import {
  buildReminderModalData,
  buildReminderModalDataFromRequest,
} from "../../helper";
import { getReminderRequest } from "../high-exposure/helper";
import Template1 from "./components/Template1";
import Template2 from "./components/Template2";
import { getOverdueFeed, type OverdueAccount } from "./helper";

/** How many overdue accounts the strip shows before the full list takes over. */
const VISIBLE_COUNT = 4;

/**
 * Overdue recovery strip — the money that is already late, with the accounts
 * carrying it and a one-tap WhatsApp reminder each.
 *
 * Reads the portfolio dashboard's `type=overdue` feed, which carries the rows,
 * the overdue count, and the amount still to recover in one response. Renders
 * as the boxed rose panel on desktop and as stacked rose cards on mobile.
 */
const OverduePanel = () => {
  const { isMobile } = useScreenView();

  const [accounts, setAccounts] = useState<OverdueAccount[]>([]);
  const [amount, setAmount] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  /** Account whose contact details are being fetched for the reminder. */
  const [remindingId, setRemindingId] = useState("");

  const [reminderModal, setReminderModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: {} });

  useEffect(() => {
    const fetchOverdue = async () => {
      setLoading(true);

      try {
        const feed = await getOverdueFeed({ page: 1, limit: VISIBLE_COUNT });

        setAmount(feed.amount);
        setCount(feed.count);
        setAccounts(feed.accounts);
      } catch (e) {
        setAmount(0);
        setCount(0);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdue();
  }, []);

  /**
   * One-tap nudge — the overdue feed carries the mobile, but the PayLater
   * request row also brings nominees, so prefer it and fall back to the feed.
   */
  const handleRemind = useCallback(async (account: OverdueAccount) => {
    setRemindingId(account.userId);

    let data = buildReminderModalData({
      customerName: account.userName,
      customerId: account.userId,
      mobile: account.mobile,
      amount: account.outstanding,
      dueDate: account.dueDate,
      userCategory: account.userType,
    });

    try {
      const request = await getReminderRequest(account.userId);
      if (request) data = buildReminderModalDataFromRequest(request);
    } catch (error) {
      // Fall back to what the feed gave us.
    } finally {
      setRemindingId("");
    }

    setReminderModal({ show: true, data });
  }, []);

  const handleReminderModalCallback = useCallback(
    (payload: { action: string }) => {
      if (["close", "send", "send_error"].includes(payload.action)) {
        setReminderModal({ show: false, data: {} });
      }
    },
    [],
  );

  if (!loading && !accounts.length) return null;

  /**
   * The count and the money still to recover. Rose inside the desktop panel,
   * muted on mobile where it sits on the page background above the cards.
   */
  const summary = (
    <div
      className={clsx(
        "tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:text-sm tw:font-semibold",
        isMobile ? "tw:text-slate-500" : "tw:text-rose-600",
      )}
    >
      <AlertTriangle size={16} className="tw:shrink-0" />
      <span className="tw:truncate">
        {count} overdue · <Amount value={amount} decimalPlaces={0} /> to recover
      </span>
    </div>
  );

  const reminderProps = {
    accounts,
    loading,
    remindingId,
    onRemind: handleRemind,
  };

  return (
    <>
      {isMobile ? (
        <div>
          {/* Header sits above the cards on mobile — no boxed panel. */}
          <div className="tw:mb-2">{summary}</div>
          <Template2 {...reminderProps} />
        </div>
      ) : (
        <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-rose-400 tw:bg-rose-50">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-rose-400 tw:p-3 tw:md:p-4">
            {summary}
          </div>

          <Template1 {...reminderProps} />
        </div>
      )}

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

export default OverduePanel;
