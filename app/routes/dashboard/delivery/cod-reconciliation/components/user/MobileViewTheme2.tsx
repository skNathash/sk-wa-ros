import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface UserMobileViewTheme2Props {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  tab?: string;
}

/**
 * Theme-2 mobile COD list, grouped by delivery agent: the same white sheet bled
 * to the screen edges (`app-bleed-x`) with one hairline-divided row per agent,
 * so switching view-by does not switch layouts. The row leads with the agent's
 * initials avatar, the name owns the first line, the staff ref and the order
 * count sit under it as a muted meta line, and the right rail carries the cash
 * they are holding as a bubble-green pill. Tapping the row opens the agent;
 * the handover action closes it while the money is still pending.
 */
const UserMobileViewTheme2: React.FC<UserMobileViewTheme2Props> = ({
  loading,
  data,
  callback,
  tab,
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`skeleton-${idx}`}
            className="tw:animate-pulse tw:px-4 tw:py-3"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full tw:bg-gray-200"></div>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:h-4 tw:w-32 tw:rounded tw:bg-gray-200"></div>
                <div className="tw:mt-2 tw:h-3 tw:w-40 tw:rounded tw:bg-gray-200"></div>
              </div>
              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:ms-auto tw:h-5 tw:w-20 tw:rounded-full tw:bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="app-bleed-x tw:border-y tw:border-slate-100 tw:bg-white">
        <NoData />
      </div>
    );
  }

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-slate-100 tw:border-y tw:border-slate-100 tw:bg-white">
      {data.map((row, idx) => {
        const userId = row.shipmentUserId || row.shipmentUserInfo?.id;
        const userName = row.shipmentUserInfo?.name || row.userName || "-";
        const refId = row.refId || row.shipmentUserInfo?.refId;
        const orderCount = row.count || row.totalCount || 0;
        const openAgent = () => {
          if (userId) appNav.to(`/dashboard/employee/view/${userId}`);
        };

        return (
          <div
            key={userId || idx}
            role="button"
            tabIndex={0}
            className="tw:w-full tw:cursor-pointer tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:active:bg-slate-50"
            onClick={openAgent}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") openAgent();
            }}
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <InitialsAvatar name={userName} initials={row.initial} />

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:text-sm tw:font-bold tw:text-slate-900 tw:wrap-break-word">
                  {userName}
                </p>
                {/* Staff ref + how many collections make up the amount — the
                    two facts the card carried, folded into one meta line. It
                    wraps rather than clips, so a long ref never eats the
                    count. */}
                <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500 tw:wrap-break-word">
                  {refId ? `#${refId} · ` : ""}
                  {orderCount} {t("orders")}
                </p>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                {/* The cash the agent is holding as a bubble-green pill — the
                    unread-badge slot in a WhatsApp chat row. */}
                <span
                  className="tw:inline-block tw:rounded-full tw:px-2 tw:py-0.5 tw:text-xs tw:font-bold tw:whitespace-nowrap tw:tabular-nums"
                  style={{
                    backgroundColor: "var(--wa-bubble)",
                    color: "var(--wa-bubble-text)",
                  }}
                >
                  <Amount value={row.totalAmount} decimalPlaces={2} />
                </span>
              </div>
            </div>

            {tab !== "handedover" && (
              <div
                className="tw:mt-2 tw:flex tw:justify-end tw:ps-13"
                onClick={(event) => event.stopPropagation()}
              >
                <AppButton
                  type="button"
                  size="small"
                  onClick={() =>
                    callback({ action: "handover", data: { ...row, userId } })
                  }
                >
                  {t("handover")}
                </AppButton>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UserMobileViewTheme2;
