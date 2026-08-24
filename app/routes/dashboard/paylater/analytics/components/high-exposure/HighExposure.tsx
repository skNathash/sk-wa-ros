import clsx from "clsx";
import { Bell, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AppLink from "~/components/core/link/AppLink";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import type { PaginationState } from "~/types/CommonTypes";
import {
  buildReminderModalData,
  buildReminderModalDataFromRequest,
} from "../../helper";
import {
  avatarToneAt,
  formatDueLabel,
  getCount,
  getData,
  getReminderRequest,
  initialsOf,
  prepareParams,
  type HighExposureAccount,
} from "./helper";

interface HighExposureProps {
  /** Rows fetched per page. Defaults to 10. */
  pageSize?: number;
  /** Row taps and the "Remind all" action are handed back here. */
  callback?: (payload: { action: string; data?: any }) => void;
}

/**
 * PayLater "High exposure · to nudge" card — the accounts carrying the most
 * risk, each showing what is owed against the sanctioned limit, how much of
 * that limit is used, and whether they are already late.
 *
 * Reads `type=nudge_targets` off the insights dashboard and pages in place the
 * same way the rest of the analytics lists do: a page of rows, one count call
 * for the total, then load-more from there.
 */
const HighExposure = ({ pageSize = 10, callback }: HighExposureProps) => {
  const { t } = useTranslation();
  const appToast = useAppToast();

  const [accounts, setAccounts] = useState<HighExposureAccount[]>([]);
  const [reminderModal, setReminderModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: {} });
  /** Account whose contact details are being fetched for the reminder. */
  const [remindingId, setRemindingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    paginationRef.current = {
      ...paginationRef.current,
      rowsPerPage: pageSize,
      activePage: 1,
      startSlNo: 1,
      endSlNo: pageSize,
    };

    try {
      const params = prepareParams(paginationRef.current);
      const result = await getData(params);
      setAccounts(result);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);

      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      setTotalRecords(total || result.length);
    } catch (error) {
      setAccounts([]);
      setHasMoreData(false);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(paginationRef.current);
      const result = await getData(params);
      setAccounts((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  /**
   * One-tap nudge — the same PayLater template flow the due-collection list
   * uses, pre-filled with this account's dues.
   */
  const handleRemind = useCallback(
    async (account: HighExposureAccount) => {
      callback?.({ action: "remind", data: account });
      setRemindingId(account.userId);

      // The nudge feed has no contact details, so prefer the PayLater request
      // row — same payload the Collect / overdue lists send.
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
    },
    [callback],
  );

  const handleReminderModalCallback = useCallback(
    (payload: { action: string }) => {
      if (["close", "send", "send_error"].includes(payload.action)) {
        setReminderModal({ show: false, data: {} });
      }
    },
    [],
  );

  // The template modal sends to one contact at a time, so there is no bulk
  // path yet — keep the action visible and say so.
  const handleRemindAll = () => {
    callback?.({ action: "remind-all", data: accounts });
    appToast.show({ msg: "Coming soon", color: "info" });
  };

  return (
    <>
      <div className="tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
        {/* Header — the section title beside the bulk chase action. */}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-slate-100 tw:px-5 tw:py-4">
          <div className="tw:text-base tw:font-semibold tw:text-slate-800">
            High exposure · to nudge
          </div>
          {/* <AppButton
            size="small"
            color="light"
            fill="outline"
            disabled={!accounts.length}
            onClick={handleRemindAll}
          >
            <MessageCircle size={16} />
            Remind all
          </AppButton> */}
        </div>

        {loading ? (
          <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:py-12">
            <AppSpinner className="tw:h-6 tw:w-6" />
          </div>
        ) : !accounts.length ? (
          <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center">
            <NoData />
          </div>
        ) : (
          <div className="tw:flex tw:flex-1 tw:flex-col">
            <div className="tw:flex tw:flex-col tw:divide-y tw:divide-slate-100">
              {accounts.map((account, index) => {
                const isLate = account.overdueDays > 0;

                return (
                  <div
                    key={`${account.userId}-${index}`}
                    className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-5 tw:py-4 tw:text-left tw:hover:bg-slate-50"
                  >
                    <div
                      className={clsx(
                        "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                        avatarToneAt(index),
                      )}
                    >
                      {initialsOf(account.userName)}
                    </div>

                    <div className="tw:min-w-0 tw:flex-1">
                      <AppLink
                        href={account.profileUrl}
                        asLink
                        className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800 tw:inline-block"
                      >
                        {account.userName}
                      </AppLink>
                      <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-400">
                        <Amount value={account.outstanding} decimalPlaces={0} />
                        {account.creditLimit > 0 && (
                          <>
                            {" / "}
                            <Amount
                              value={account.creditLimit}
                              decimalPlaces={0}
                            />
                          </>
                        )}
                      </p>
                    </div>

                    {/* Utilisation — how much of the limit is already drawn. */}
                    <div className="tw:hidden tw:w-32 tw:shrink-0 tw:sm:block">
                      <div className="tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                        <div
                          className={clsx(
                            "tw:h-full tw:rounded-full",
                            isLate ? "tw:bg-rose-500" : "tw:bg-violet-500",
                          )}
                          style={{ width: `${account.utilization}%` }}
                        />
                      </div>
                      <p className="tw:mt-1 tw:text-[11px] tw:text-slate-400">
                        {account.utilization}%
                      </p>
                    </div>

                    <p
                      className={clsx(
                        "tw:w-16 tw:shrink-0 tw:text-right tw:text-xs tw:font-semibold",
                        isLate ? "tw:text-rose-500" : "tw:text-slate-400",
                      )}
                    >
                      {formatDueLabel(account.overdueDays)}
                    </p>

                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      className="tw:shrink-0"
                      disabled={remindingId === account.userId}
                      onClick={() => handleRemind(account)}
                    >
                      {remindingId === account.userId ? (
                        <AppSpinner className="tw:h-4 tw:w-4" />
                      ) : (
                        <Bell size={16} />
                      )}
                      {t("sendReminder")}
                    </AppButton>
                  </div>
                );
              })}
            </div>

            {hasMoreData && (
              <div className="tw:px-5 tw:pb-5">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalRecords}
                  loadedCount={accounts.length}
                  loaderType="button"
                />
              </div>
            )}
          </div>
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

export default HighExposure;
