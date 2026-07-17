import { Bell, Eye, Hash, Phone, SlidersHorizontal } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (payload: { action: string; data: any }) => void;
}

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
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((row) => (
        <AppCard key={row._id} noPadding className="tw:mb-0">
          {/* Row: Name & Email (left), KYC Status (right) */}
          <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
            <div>
              <div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppLink
                    asLink
                    href={
                      row.status === "Pending"
                        ? `/dashboard/paylater/view/${row._id}`
                        : row.userRedirectionLink || "#"
                    }
                    className="tw:text-base tw:font-semibold"
                    showLinkColor
                  >
                    {row.userInfo?.name || "-"}
                  </AppLink>
                  <div className="tw:text-sm tw:text-gray-500 tw:mb-0.5 tw:flex tw:items-center tw:gap-1">
                    <Hash className="tw:w-3.5 tw:h-3.5" />
                    <AppLink
                      asLink
                      href={`/dashboard/paylater/view/${row._id}`}
                      className="tw:underline"
                    >
                      {row.refId}
                    </AppLink>
                  </div>
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:mt-1">
                  <Phone size={12} />
                  {row.userInfo?.mobile || "-"}
                </div>
              </div>
            </div>
            <div className="tw:flex tw:flex-col tw:items-end">
              <AppBadge variant={row._statusColor}>{row._statusLbl}</AppBadge>
              {row.expiryStatus && (
                <div className="tw:text-xs tw:text-slate-400 tw:mt-1">
                  {row.expiryStatus}
                </div>
              )}
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:px-4 tw:py-3">
            <KeyValue label={t("creditLimit")} size="sm">
              <Amount
                value={row.creditLimit}
                decimalPlaces={2}
                className="tw:font-semibold"
              />
            </KeyValue>
            <KeyValue label={t("usedLimit")} size="sm">
              <Amount
                value={row.totalPayableAmount}
                decimalPlaces={2}
                className="tw:text-orange-600 tw:font-semibold"
              />
            </KeyValue>
            <KeyValue label={t("availableLimit")} size="sm">
              <Amount
                value={row.creditAvailable}
                decimalPlaces={2}
                className="tw:text-green-600 tw:font-semibold"
              />
            </KeyValue>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-3">
            <div className="tw:flex tw:justify-between tw:items-center tw:text-xs tw:gap-2">
              <span className="tw:text-gray-500">{t("kycStatus")}</span>
              <span>
                <AppBadge variant={row.kycStatusColor}>
                  {row.kycStatus}
                </AppBadge>
              </span>
            </div>

            <div className="tw:flex tw:justify-end tw:items-center tw:gap-2">
              <AppLink href={row.viewBtnLink} asLink>
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  title="View"
                >
                  <Eye size={16} />
                </AppButton>
              </AppLink>
              {row.status !== "Pending" && (
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  onClick={() =>
                    callback && callback({ action: "send-reminder", data: row })
                  }
                  title="Send Reminder"
                >
                  <Bell size={16} />
                </AppButton>
              )}

              {row._canManage && (
                <Rbac roles={["ACCOUNTS.PAYLATER-MANAGE-LIMIT"]}>
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    onClick={() =>
                      callback && callback({ action: "manage", data: row })
                    }
                    title="Manage"
                  >
                    <SlidersHorizontal size={16} />
                  </AppButton>
                </Rbac>
              )}
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
