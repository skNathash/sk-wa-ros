import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppButton from "~/components/core/button/AppButton";
import { Bell, Eye, Phone, SlidersHorizontal } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";
import Rbac from "~/components/core/rbac/Rbac";
import type { TableHeaderItem } from "~/types/CommonTypes";

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
  { label: "ID", key: "_id", enableSort: false, width: "10%", langKey: "id" },
  {
    label: "Customer",
    key: "customer",
    enableSort: false,
    width: "20%",
    langKey: "customer",
  },
  {
    label: "Registration Date",
    key: "registrationDate",
    enableSort: false,
    width: "15%",
    langKey: "registrationDate",
  },
  {
    label: "Pay Later Limit",
    key: "payLater",
    enableSort: false,
    width: "12%",
    langKey: "paylaterLimit",
  },
  {
    label: "Used Limit",
    key: "totalPayableAmount",
    enableSort: false,
    width: "12%",
    langKey: "usedLimit",
  },
  {
    label: "Available Limit",
    key: "availableCredit",
    enableSort: false,
    width: "12%",
    langKey: "availableLimit",
  },
  {
    label: "Wallet Status",
    key: "walletStatus",
    enableSort: false,
    width: "12%",
    langKey: "walletStatus",
  },
  {
    label: "KYC Status",
    key: "kycStatus",
    enableSort: false,
    width: "10%",
    langKey: "kycStatus",
  },
  {
    label: "Actions",
    key: "actions",
    enableSort: false,
    width: "18%",
    langKey: "actions",
  },
];

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
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/paylater/view/${row._id}`}>
                  {row.refId}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:font-semibold">
                  <AppLink
                    asLink
                    href={
                      // If request is not approved (Pending), redirect to request view
                      row.status === "Pending"
                        ? `/dashboard/paylater/view/${row._id}`
                        : row.userRedirectionLink || "#"
                    }
                  >
                    {row.userInfo?.name || "-"}
                  </AppLink>
                </div>
                <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                  <Phone size={12} />
                  <AppLink asLink href={`tel:${row.userInfo?.mobile}`}>
                    {row.userInfo?.mobile}
                  </AppLink>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.userInfo?.registerAt ? (
                  <DateFormat
                    value={row.userInfo?.registerAt}
                    formatStr="dd MMM yyyy"
                  />
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.creditLimit}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.totalPayableAmount}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-orange-500 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.creditAvailable}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-green-500 tw:font-medium"
                />
                {row.expiryStatus && (
                  <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                    {row.expiryStatus}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div>
                  <AppBadge variant={row._statusColor}>
                    {row._statusLbl}
                  </AppBadge>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row.kycStatusColor}>
                  {row.kycStatus}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:gap-2">
                  <AppLink href={row.viewBtnLink} asLink>
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
                          callback && callback({ action: "manage", data: row })
                        }
                      >
                        <SlidersHorizontal size={16} />
                      </AppButton>
                    </Rbac>
                  )}
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
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
