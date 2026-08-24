import React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Bell, Eye, Phone, SlidersHorizontal } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppButton from "~/components/core/button/AppButton";
import AppProgress from "~/components/core/progress/AppProgress";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";
import Rbac from "~/components/core/rbac/Rbac";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { getInitial, getTint } from "../helper";

interface WalletData {
  _id: string;
  customer: string;
  registrationDate: string | Date;
  payLater: number;
  outstandingBalance: number;
  availableCredit: number;
  walletStatus: string;
  kycStatus: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: WalletData[];
  callback?: (payload: { action: string; data: any }) => void;
}

const headers: TableHeaderItem[] = [
  {
    label: "Customer",
    key: "customer",
    enableSort: false,
    width: "22%",
    langKey: "customer",
  },
  {
    label: "Type",
    key: "userCategory",
    enableSort: false,
    width: "6%",
    langKey: "type",
  },
  {
    label: "Registered On",
    key: "registrationDate",
    enableSort: false,
    width: "12%",
    langKey: "registrationDate",
  },
  {
    label: "Usage",
    key: "totalPayableAmount",
    enableSort: false,
    width: "16%",
    langKey: "usage",
  },
  {
    label: "Balance",
    key: "outstandingBalance",
    enableSort: false,
    width: "10%",
    langKey: "balance",
    isRightAligned: true,
  },
  {
    label: "KYC Status",
    key: "kycStatus",
    enableSort: false,
    width: "9%",
    langKey: "kycStatus",
  },
  {
    label: "Due",
    key: "validityEndDate",
    enableSort: false,
    width: "9%",
    langKey: "due",
    isRightAligned: true,
  },
  {
    label: "Actions",
    key: "actions",
    enableSort: false,
    width: "16%",
    langKey: "actions",
    isRightAligned: true,
  },
];

const parseDate = (value?: string | Date) => {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="100px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => {
            const name = row.userInfo?.name || "-";
            const limit = Number(row.creditLimit) || 0;
            // Usage is the drawn balance against the sanctioned limit.
            const used = Number(row.outstandingBalance) || 0;
            const pct =
              limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

            // Bar tone follows the due state: overdue → red, due today → amber, else green.
            const tone: "danger" | "warning" | "success" = row.isOverdue
              ? "danger"
              : row.isDueToday
                ? "warning"
                : "success";

            const dueDate = parseDate(row.validityEndDate);
            const registeredAt = parseDate(row.userInfo?.registerAt);

            // Pending requests have no wallet page yet — send them to the request view.
            const nameHref =
              row.status === "Pending"
                ? `/dashboard/paylater/view/${row._id}`
                : row.userRedirectionLink || "#";

            return (
              <AppTable.Row key={row._id || idx}>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div
                      className={`tw:shrink-0 tw:w-9 tw:h-9 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-sm tw:font-semibold ${getTint(
                        name,
                      )}`}
                    >
                      {getInitial(name)}
                    </div>
                    <div className="tw:min-w-0">
                      <AppLink
                        asLink
                        href={nameHref}
                        className="tw:font-semibold tw:truncate"
                        showLinkColor
                      >
                        {name}
                      </AppLink>
                      {/* Wallet state reads as plain text here, no badge. */}
                      <div className="tw:text-xs tw:text-gray-400">
                        {row._statusLbl}
                      </div>
                      {/* Secondary identity line: request id and phone. */}
                      <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-400 tw:truncate">
                        <AppLink
                          asLink
                          href={`/dashboard/paylater/view/${row._id}`}
                        >
                          {row.refId}
                        </AppLink>
                        {row.userInfo?.mobile && (
                          <>
                            <span>·</span>
                            <AppLink
                              asLink
                              href={`tel:${row.userInfo?.mobile}`}
                              className="tw:inline-flex tw:items-center tw:gap-0.5"
                            >
                              <Phone size={10} />
                              {row.userInfo?.mobile}
                            </AppLink>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <span className="tw:text-sm tw:text-indigo-500 tw:font-medium">
                    {row.userCategory}
                  </span>
                </AppTable.Cell>

                <AppTable.Cell>
                  {registeredAt ? (
                    <span className="tw:text-sm tw:text-gray-500 tw:whitespace-nowrap">
                      {format(registeredAt, "dd MMM yyyy")}
                    </span>
                  ) : (
                    <span className="tw:text-sm tw:text-gray-300">--</span>
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppProgress
                    value={pct}
                    color={tone}
                    className="tw:h-1.5 tw:w-full"
                  />
                  <div className="tw:text-xs tw:text-gray-400 tw:mt-1 tw:whitespace-nowrap">
                    <Amount
                      value={used}
                      decimalPlaces={0}
                      className={
                        used > 0 ? "tw:font-semibold tw:text-gray-800" : ""
                      }
                    />
                    <span className="tw:mx-0.5">/</span>
                    <Amount value={limit} decimalPlaces={0} />
                  </div>
                </AppTable.Cell>

                {/* Headroom left on the wallet. */}
                <AppTable.Cell className="tw:text-right">
                  <Amount
                    value={row.creditAvailable}
                    decimalPlaces={0}
                    className={
                      Number(row.creditAvailable) > 0
                        ? "tw:font-semibold tw:text-emerald-600"
                        : "tw:text-gray-400"
                    }
                  />
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppBadge variant={row.kycStatusColor}>
                    {row.kycStatus}
                  </AppBadge>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-right">
                  {row.isOverdue ? (
                    <span className="tw:text-sm tw:text-red-500 tw:whitespace-nowrap">
                      {row.expiryStatus}
                    </span>
                  ) : row.isDueToday ? (
                    <span className="tw:text-sm tw:text-amber-600 tw:whitespace-nowrap">
                      {row.expiryStatus}
                    </span>
                  ) : dueDate ? (
                    <span className="tw:text-sm tw:text-gray-500 tw:whitespace-nowrap">
                      Due {format(dueDate, "dd MMM")}
                    </span>
                  ) : (
                    <span className="tw:text-sm tw:text-gray-300">--</span>
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:gap-1 tw:justify-end tw:flex-nowrap tw:shrink-0">
                    <AppLink
                      href={row.viewBtnLink}
                      asLink
                      className="tw:shrink-0"
                    >
                      <AppButton size="small" color="light" fill="outline">
                        <Eye size={16} />
                      </AppButton>
                    </AppLink>
                    {row.status !== "Pending" && (
                      <AppButton
                        size="small"
                        color="light"
                        fill="outline"
                        onClick={() =>
                          callback &&
                          callback({ action: "send-reminder", data: row })
                        }
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
                            callback &&
                            callback({ action: "manage", data: row })
                          }
                        >
                          <SlidersHorizontal size={16} />
                        </AppButton>
                      </Rbac>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No data found
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
