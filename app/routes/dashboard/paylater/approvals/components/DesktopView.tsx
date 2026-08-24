import { Check, Eye, Phone, X } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type {
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import { getInitial, getTint } from "../helper";

interface DesktopViewProps {
  data: any[];
  loading?: boolean;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (data: { key: string; value: SortValue }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
  callback?: (payload: { action: string; data: any }) => void;
}

const headers: TableHeaderItem[] = [
  {
    label: "Customer",
    key: "customer",
    enableSort: false,
    width: "28%",
    langKey: "customer",
  },
  {
    label: "Type",
    key: "userCategory",
    enableSort: false,
    width: "8%",
    langKey: "type",
  },
  {
    label: "Requested On",
    key: "createdAt",
    enableSort: true,
    width: "14%",
    langKey: "requestedOn",
  },
  {
    label: "Requested Limit",
    key: "requestedLimit",
    enableSort: false,
    width: "14%",
    langKey: "requestedLimit",
    isRightAligned: true,
  },
  {
    label: "KYC Status",
    key: "kycStatus",
    enableSort: false,
    width: "12%",
    langKey: "kycStatus",
  },
  {
    label: "Actions",
    key: "actions",
    enableSort: false,
    width: "24%",
    langKey: "actions",
    isRightAligned: true,
  },
];

/**
 * The pending-approval queue as a table: who asked, when, for how much and how
 * far their KYC has got — with approve/reject sitting on the row so a decision
 * never needs the detail page.
 */
const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  sortKey,
  sortValue,
  onSort,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  callback,
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <AppTable size="sm" stickyHeader fixedLayout container minWidth="100px">
        <AppTable.Header>
          <TableHeader
            headers={headers}
            onSort={onSort}
            sortKey={sortKey}
            sortValue={sortValue}
          />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : (
            data.map((row, idx) => {
              const name = row.userInfo?.name || "-";
              // The request carries the limit the customer asked for; older
              // records only kept the sanctioned figure.
              const requestedLimit =
                Number(row.requestedLimit ?? row.creditLimit) || 0;
              const kycApproved = row.kycStatus === "Approved";

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
                          href={row.viewBtnLink}
                          className="tw:font-semibold tw:truncate"
                          showLinkColor
                        >
                          {name}
                        </AppLink>
                        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-400 tw:truncate">
                          <AppLink asLink href={row.viewBtnLink}>
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
                    {row.createdAt ? (
                      <DateFormat
                        value={row.createdAt}
                        formatStr="dd MMM yyyy"
                        className="tw:text-sm tw:text-gray-500 tw:whitespace-nowrap"
                      />
                    ) : (
                      <span className="tw:text-sm tw:text-gray-300">--</span>
                    )}
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-right">
                    {requestedLimit > 0 ? (
                      <Amount
                        value={requestedLimit}
                        decimalPlaces={0}
                        className="tw:font-semibold tw:text-gray-800"
                      />
                    ) : (
                      <span className="tw:text-sm tw:text-gray-300">--</span>
                    )}
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <AppBadge variant={row.kycStatusColor}>
                      {row.kycStatus}
                    </AppBadge>
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

                      <Rbac roles={["ACCOUNTS.PAYLATER-MANAGE-LIMIT"]}>
                        <AppButton
                          size="small"
                          color="danger"
                          fill="outline"
                          onClick={() =>
                            callback?.({ action: "reject", data: row })
                          }
                        >
                          <X size={16} />
                          Reject
                        </AppButton>
                        {/* KYC has to clear before money can be sanctioned, so
                            the approve action stays shut until it does. */}
                        <AppButton
                          size="small"
                          color="success"
                          fill="solid"
                          // disabled={!kycApproved}
                          title={
                            kycApproved ? "Approve" : "KYC approval pending"
                          }
                          onClick={() =>
                            callback?.({ action: "approve", data: row })
                          }
                        >
                          <Check size={16} />
                          Approve
                        </AppButton>
                      </Rbac>
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          )}
        </AppTable.Body>
      </AppTable>

      {showLoadMore && loadMore && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={!!loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
          loaderType="button"
        />
      )}
    </>
  );
};

export default DesktopView;
