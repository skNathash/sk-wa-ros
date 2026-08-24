import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { ChevronRight, Clock, MessageSquare, SlidersHorizontal } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppProgress from "~/components/core/progress/AppProgress";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { getInitial, getTint } from "../helper";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (payload: { action: string; data: any }) => void;
}

const parseDate = (value?: string) => {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
};

const MobileView: React.FC<MobileViewProps> = ({ data, loading, callback }) => {
  const { t } = useTranslation();

  if (loading)
    return (
      <div className="tw:text-center tw:py-4">
        <AppSpinner />
      </div>
    );

  if (!data.length) return <NoData />;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
      {data.map((row) => {
        const name = row.userInfo?.name || "-";
        const used = Number(row.totalPayableAmount) || 0;
        const limit = Number(row.creditLimit) || 0;
        const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

        const dueDate = parseDate(row.validityEndDate);
        const overdueDays = dueDate
          ? Math.max(0, differenceInCalendarDays(new Date(), dueDate))
          : 0;

        // Progress + status tone follow the due state: overdue → red, due today → amber, else green.
        const tone: "danger" | "warning" | "success" = row.isOverdue
          ? "danger"
          : row.isDueToday
            ? "warning"
            : "success";

        const viewHref =
          row.status === "Pending"
            ? `/dashboard/paylater/view/${row._id}`
            : row.userRedirectionLink || row.viewBtnLink || "#";

        const canRemind = row.status !== "Pending";

        return (
          <AppCard key={row._id} noPadding className="tw:mb-0">
            <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3">
              {/* Avatar */}
              <div
                className={`tw:shrink-0 tw:w-11 tw:h-11 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-base tw:font-semibold ${getTint(
                  name,
                )}`}
              >
                {getInitial(name)}
              </div>

              {/* Body */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
                    <AppLink
                      asLink
                      href={viewHref}
                      className="tw:text-base tw:font-semibold tw:truncate"
                      showLinkColor
                    >
                      {name}
                    </AppLink>
                    {/* B2B/B2C tag — the list can mix both (combined book). */}
                    {row.userCategory && (
                      <span className="tw:shrink-0 tw:text-[10px] tw:font-medium tw:text-indigo-500">
                        {row.userCategory}
                      </span>
                    )}
                  </div>

                  {row._canManage && (
                    <Rbac roles={["ACCOUNTS.PAYLATER-MANAGE-LIMIT"]}>
                      <AppButton
                        size="small"
                        color="light"
                        fill="clear"
                        onClick={() =>
                          callback && callback({ action: "manage", data: row })
                        }
                        title={t("manage", { defaultValue: "Manage" })}
                      >
                        <SlidersHorizontal size={16} />
                      </AppButton>
                    </Rbac>
                  )}
                </div>

                {/* Progress + used/limit */}
                <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1.5">
                  <AppProgress
                    value={pct}
                    color={tone}
                    className="tw:h-1.5 tw:w-24 tw:shrink-0"
                  />
                  <span className="tw:text-xs tw:text-gray-500 tw:whitespace-nowrap">
                    <Amount value={used} decimalPlaces={0} className="tw:text-gray-700 tw:font-medium" />
                    <span className="tw:mx-0.5">/</span>
                    <Amount value={limit} decimalPlaces={0} />
                  </span>
                </div>

                {/* Due / overdue status */}
                <div className="tw:mt-1">
                  {row.isOverdue ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-red-500">
                      <Clock size={12} />
                      {t("overdue", { defaultValue: "Overdue" })} · {overdueDays}d
                    </span>
                  ) : row.isDueToday ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-amber-600">
                      <Clock size={12} />
                      {t("dueToday", { defaultValue: "Due today" })}
                    </span>
                  ) : dueDate ? (
                    <span className="tw:text-xs tw:text-gray-400">
                      {t("dueOn", { defaultValue: "Due" })} {format(dueDate, "dd MMM")}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Trailing action: Remind for active wallets, chevron otherwise */}
              <div className="tw:shrink-0">
                {canRemind ? (
                  <AppButton
                    size="small"
                    color="success"
                    fill="solid"
                    onClick={() =>
                      callback &&
                      callback({ action: "send-reminder", data: row })
                    }
                  >
                    <MessageSquare size={14} />
                    {t("remind", { defaultValue: "Remind" })}
                  </AppButton>
                ) : (
                  <AppLink href={viewHref} asLink className="tw:text-gray-400">
                    <ChevronRight size={20} />
                  </AppLink>
                )}
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
};

export default MobileView;
