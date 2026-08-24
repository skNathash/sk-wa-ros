import { ArrowRight, ExternalLink, MapPin, MessageSquare } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import CommonService from "~/services/CommonService";
import UserBadgeForItem from "~/shared/store/badge/UserBadgeForItem";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

interface RetailerData {
  pincode?: string;
  franchiseId: string;
  franchiseName: string;
  networkType?: string;
  state?: string;
  district?: string;
  city?: string;
  b2bSales?: number;
  b2cSales?: number;
  totalSales?: number;
  buyersCount?: number;
  customersCount?: number;
  customerCreatedtoday?: number;
  posOrders?: number;
  clubOrders?: number;
  b2bposOrders?: number;
  b2cposOrders?: number;
  rosOrders?: number;
  registeredOn?: string;
  lastLoginOn?: string;
  subscriptionPlan?: {
    status?: string;
    planInfo?: {
      refId?: string;
      amountFrom?: number;
      amountTo?: number;
      planDurationDays?: number;
      subscriptionAmount?: number;
      type?: string;
      typeOfPlan?: string;
      planName?: string;
      operationalFeeInfo?: {
        value?: number;
        type?: string;
      };
      isInclusiveTax?: boolean;
      taxPercentage?: number;
    };
    amount?: number;
    afterTaxAmount?: number;
    availableAmount?: number;
    usedAmount?: number;
    validFrom?: string;
    validTo?: string;
    planStartAt?: string;
    planEndAt?: string;
  };
  inventory?: {
    _id?: string | null;
    totalProducts?: number;
    inStock?: number;
    lowStock?: number;
    outOfStock?: number;
    nearExpiry?: number;
  };
  recentlyInwarded?: {
    date: string;
    units: number;
  };
  lastOrderPlacedDate?: string;
  unitsInLastOrder?: number;
  lastStockedDate?: string;
  availableUnits?: number;
  reservedUnits?: number;
  totalSubscribedDeals?: number;
  totalSubscribedInStockDeals?: number;
  totalSubscribedOutOfStockDeals?: number;
  activePlan?: string;
  // kept optional fallbacks for legacy fields
  totalSKUs?: number;
  totalUnitsInStock?: number;
}

interface DesktopViewProps {
  loading?: boolean;
  data: RetailerData[];
  callback?: (args: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

// Column-group tint system: the band row is strongest, the sub-header row a
// step lighter, body cells lightest; a hue-matched left border marks where
// each group starts so the bands stay crisp instead of smearing together.
const groupTints = {
  plan: {
    band: "tw:bg-violet-100 tw:text-violet-800",
    head: "tw:bg-violet-50 tw:border-l tw:border-violet-200",
    cell: "tw:bg-violet-50/60 tw:border-l tw:border-violet-200/70",
  },
  sales: {
    band: "tw:bg-blue-100 tw:text-blue-800",
    head: "tw:bg-blue-50 tw:border-l tw:border-blue-200",
    headInner: "tw:bg-blue-50",
    cell: "tw:bg-blue-50/60 tw:border-l tw:border-blue-200/70",
    cellInner: "tw:bg-blue-50/60",
  },
  customers: {
    band: "tw:bg-emerald-100 tw:text-emerald-800",
    head: "tw:bg-emerald-50 tw:border-l tw:border-emerald-200",
    headInner: "tw:bg-emerald-50",
    cell: "tw:bg-emerald-50/60 tw:border-l tw:border-emerald-200/70",
    cellInner: "tw:bg-emerald-50/60",
  },
  orders: {
    band: "tw:bg-amber-100 tw:text-amber-800",
    head: "tw:bg-amber-50 tw:border-l tw:border-amber-200",
    headInner: "tw:bg-amber-50",
    cell: "tw:bg-amber-50/60 tw:border-l tw:border-amber-200/70",
    cellInner: "tw:bg-amber-50/60",
  },
  stock: {
    band: "tw:bg-rose-100 tw:text-rose-800",
    head: "tw:bg-rose-50 tw:border-l tw:border-r tw:border-rose-200",
    cell: "tw:bg-rose-50/60 tw:border-l tw:border-r tw:border-rose-200/70",
  },
} as const;

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "2%" },
  { label: "Retailer", key: "franchiseName", width: "12%", enableSort: true },
  {
    label: "Registered On",
    key: "registeredOn",
    width: "7%",
    enableSort: true,
  },
  {
    label: "Active Plan",
    key: "activePlan",
    width: "13%",
    enableSort: false,
    className: groupTints.plan.head,
  },
  {
    label: "Total",
    key: "totalSales",
    width: "7%",
    enableSort: true,
    isRightAligned: true,
    className: groupTints.sales.head,
  },
  {
    label: "B2B",
    key: "b2bSales",
    width: "6%",
    enableSort: true,
    isRightAligned: true,
    className: groupTints.sales.headInner,
  },
  {
    label: "B2C",
    key: "b2cSales",
    width: "6%",
    enableSort: true,
    isRightAligned: true,
    className: groupTints.sales.headInner,
  },
  {
    label: "SK Buyers",
    key: "buyersCount",
    width: "5%",
    enableSort: true,
    isCentered: true,
    className: groupTints.customers.head,
  },
  {
    label: "Cust.",
    key: "customersCount",
    width: "5%",
    enableSort: true,
    isCentered: true,
    className: groupTints.customers.headInner,
  },
  {
    label: "Today",
    key: "customerCreatedtoday",
    width: "5%",
    enableSort: true,
    isCentered: true,
    className: groupTints.customers.headInner,
  },
  {
    label: "POS",
    key: "posOrders",
    width: "6%",
    enableSort: true,
    isCentered: true,
    className: groupTints.orders.head,
  },
  {
    label: "Club",
    key: "clubOrders",
    width: "5%",
    enableSort: true,
    isCentered: true,
    className: groupTints.orders.headInner,
  },
  {
    label: "B2B",
    key: "rosOrders",
    width: "5%",
    enableSort: true,
    isCentered: true,
    className: groupTints.orders.headInner,
  },
  {
    label: "Inventory Status",
    key: "inventory.inStock",
    width: "12%",
    enableSort: true,
    className: groupTints.stock.head,
  },
  { label: "", key: "action", width: "4%", enableSort: false },
];

const bandLabelClass =
  "tw:text-[11px] tw:uppercase tw:tracking-wider tw:py-1.5";

const headerGroups = [
  { label: "", span: 3 },
  {
    label: "Plan",
    span: 1,
    className: `${groupTints.plan.band} ${bandLabelClass}`,
  },
  {
    label: "Sales",
    span: 3,
    className: `${groupTints.sales.band} ${bandLabelClass}`,
  },
  {
    label: "Customers",
    span: 3,
    className: `${groupTints.customers.band} ${bandLabelClass}`,
  },
  {
    label: "Orders",
    span: 3,
    className: `${groupTints.orders.band} ${bandLabelClass}`,
  },
  {
    label: "Stock",
    span: 1,
    className: `${groupTints.stock.band} ${bandLabelClass}`,
  },
  { label: "", span: 1 },
];

const containerStyle = {
  maxHeight: "calc(100vh - 150px)",
};

// Plan validity pill: color only appears when action is needed so the
// column stays quiet for healthy plans.
const planValidityStatus = (endAt?: string) => {
  if (!endAt) return null;
  const end = new Date(endAt);
  if (isNaN(end.getTime())) return null;
  const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
  if (days < 0)
    return { label: "Expired", className: "tw:bg-red-100 tw:text-red-700" };
  if (days === 0)
    return {
      label: "Expires today",
      className: "tw:bg-amber-100 tw:text-amber-700",
    };
  if (days <= 30)
    return {
      label: `${days}d left`,
      className: "tw:bg-amber-100 tw:text-amber-700",
    };
  return null;
};

// Empty/zero metrics should recede so active stores stand out for quick scanning.
const isEmpty = (v?: number | null) => v == null || Number(v) === 0;
const mutedIfEmpty = (v?: number | null, activeClass = "") =>
  isEmpty(v) ? "tw:text-gray-300 tw:font-normal" : activeClass;

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  sortKey,
  sortValue,
  onSort,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  // Show NoData above the table when there's no data and not loading
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <AppTable
        size="sm"
        stickyHeader
        fixedLayout
        container
        containerStyle={containerStyle}
        minWidth="1500px"
        condensed
      >
        <colgroup>
          {headers.map((header, index) => (
            <col key={index} style={{ width: header.width }} />
          ))}
        </colgroup>
        <AppTable.Header>
          <TableHeader
            headers={headers}
            groups={headerGroups}
            onSort={onSort}
            sortKey={sortKey}
            sortValue={sortValue}
          />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={20} />
          ) : (
            data.map((row, idx) => {
              const totalDeals = row.inventory?.totalProducts ?? 0;
              const inStock = row.inventory?.inStock ?? 0;
              const lowStock = row.inventory?.lowStock ?? 0;
              const outOfStock = row.inventory?.outOfStock ?? 0;

              return (
                <AppTable.Row
                  key={idx}
                  className="hover:tw:bg-gray-50/70 tw:transition-colors"
                >
                  <AppTable.Cell>{idx + 1}</AppTable.Cell>

                  {/* Retailer Name Column with FID */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:flex-col tw:gap-1 tw:py-1">
                      {/* Franchise Name */}
                      <div
                        className="tw:font-semibold tw:max-w-full tw:underline tw:text-primary tw:cursor-pointertw:mb-1"
                        onClick={() =>
                          callback?.({ action: "accessStore", data: row })
                        }
                      >
                        <span className="tw:line-clamp-2 tw:inline-block tw:underline tw:cursor-pointer">
                          {row.franchiseName}
                        </span>
                        {/* <ExternalLink
                          size={16}
                          className="tw:align-middle tw:inline-block tw:ml-1"
                        /> */}
                      </div>

                      {/* FID and Type Badge Row */}
                      <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                        <span className="tw:text-xs tw:text-gray-500">
                          ID: {row.franchiseId}
                        </span>
                        <UserBadgeForItem
                          networkType={row.networkType || "-"}
                        />
                      </div>

                      {/* Location Info */}
                      <div className="tw:flex tw:items-start tw:gap-1 tw:text-xs tw:text-gray-500">
                        <MapPin className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0 tw:mt-0.5" />
                        <span className="tw:wrap-break-word">
                          {[row.district, row.state]
                            .filter(Boolean)
                            .join(", ") || "-"}
                          {row.pincode ? ` - ${row.pincode}` : ""}
                        </span>
                      </div>

                      {/* CRM Follow-up entry point */}
                      <button
                        type="button"
                        onClick={() =>
                          callback?.({ action: "followUp", data: row })
                        }
                        className="tw:mt-1.5 tw:inline-flex tw:items-center tw:gap-1.5 tw:w-fit tw:rounded-md tw:border tw:border-emerald-500/40 tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:text-emerald-600 tw:cursor-pointer tw:transition-colors hover:tw:bg-emerald-50"
                      >
                        <MessageSquare className="tw:w-3 tw:h-3" />
                        <span>Follow-ups</span>
                        <ExternalLink className="tw:w-2.5 tw:h-2.5 tw:opacity-70" />
                      </button>
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <DateFormat
                      value={row.registeredOn || null}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:mt-1 tw:flex tw:flex-col tw:whitespace-nowrap">
                      {row.lastLoginOn ? (
                        <>
                          <span className="tw:text-[10px] tw:text-gray-400">
                            Last Login
                          </span>
                          <span className="tw:text-[10px] tw:text-gray-500">
                            <DateFormat
                              value={row.lastLoginOn}
                              formatStr="dd MMM yyyy"
                            />
                          </span>
                        </>
                      ) : (
                        <span className="tw:text-[10px] tw:text-gray-400 tw:italic">
                          Never logged in
                        </span>
                      )}
                    </div>
                  </AppTable.Cell>

                  {/* Active Plan Column */}
                  {/* Inline style: the base TableCell's align-middle wins over
                      the align-top utility in Tailwind's output order. */}
                  <AppTable.Cell
                    className={groupTints.plan.cell}
                    style={{ verticalAlign: "top" }}
                  >
                    {row.subscriptionPlan?.planInfo?.type ? (
                      <div className="tw:flex tw:flex-col tw:gap-1">
                        <div className="tw:text-xs tw:font-bold tw:text-purple-800 tw:uppercase">
                          {row.subscriptionPlan.planInfo.typeOfPlan === "Hybrid"
                            ? `Hybrid Plan${row.subscriptionPlan.planInfo.planName ? ` - ${row.subscriptionPlan.planInfo.planName}` : ""}`
                            : row.subscriptionPlan.planInfo.type === "Value"
                              ? "Fixed Plan"
                              : row.subscriptionPlan.planInfo.type ===
                                  "Percentage"
                                ? "Percentage Plan"
                                : row.subscriptionPlan.planInfo.type}
                        </div>

                        {/* Validity: date range + status pill, outside the
                            label grid so the money rows align as one unit. */}
                        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-xs">
                          <span className="tw:whitespace-nowrap tw:text-gray-600">
                            <DateFormat
                              value={row.subscriptionPlan.planStartAt || null}
                              formatStr="dd MMM yy"
                            />
                            {" → "}
                            <DateFormat
                              value={row.subscriptionPlan.planEndAt || null}
                              formatStr="dd MMM yy"
                            />
                          </span>
                          {(() => {
                            const status = planValidityStatus(
                              row.subscriptionPlan.planEndAt,
                            );
                            return status ? (
                              <span
                                className={`tw:rounded tw:px-1.5 tw:py-px tw:text-[10px] tw:font-semibold tw:whitespace-nowrap ${status.className}`}
                              >
                                {status.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {/* Grid keeps labels, colons and values on the same
                            axis regardless of label/value length. */}
                        <div className="tw:grid tw:grid-cols-[auto_auto_1fr] tw:items-baseline tw:gap-x-1 tw:gap-y-0.5 tw:text-xs">
                          {row.subscriptionPlan.planInfo.operationalFeeInfo && (
                            <>
                              <span className="tw:whitespace-nowrap tw:text-gray-500">
                                Operational Fee
                              </span>
                              <span className="tw:text-gray-400">:</span>
                              <span className="tw:font-semibold tw:text-gray-700">
                                {
                                  row.subscriptionPlan.planInfo
                                    .operationalFeeInfo.value
                                }
                                <span className="tw:ml-1 tw:text-[10px] tw:font-medium tw:text-gray-500">
                                  {
                                    row.subscriptionPlan.planInfo
                                      .operationalFeeInfo.type
                                  }
                                </span>
                              </span>
                            </>
                          )}

                          <span className="tw:whitespace-nowrap tw:text-gray-500">
                            Purchase Limit
                          </span>
                          <span className="tw:text-gray-400">:</span>
                          <span className="tw:font-semibold tw:whitespace-nowrap tw:text-blue-600">
                            <Amount
                              value={
                                row.subscriptionPlan.planInfo?.amountTo ?? 0
                              }
                            />
                          </span>

                          <span className="tw:whitespace-nowrap tw:text-gray-500">
                            Used
                          </span>
                          <span className="tw:text-gray-400">:</span>
                          <span className="tw:font-semibold tw:whitespace-nowrap tw:text-red-600">
                            <Amount
                              value={row.subscriptionPlan.usedAmount ?? 0}
                            />
                          </span>

                          <span className="tw:whitespace-nowrap tw:text-gray-500">
                            Available
                          </span>
                          <span className="tw:text-gray-400">:</span>
                          <span className="tw:font-semibold tw:whitespace-nowrap tw:text-green-600">
                            <Amount
                              value={row.subscriptionPlan.availableAmount ?? 0}
                            />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="tw:text-xs tw:text-gray-400">
                        No active plan
                      </div>
                    )}
                  </AppTable.Cell>

                  {/* Total Value Column */}
                  <AppTable.Cell
                    className={`tw:text-right ${groupTints.sales.cell}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.totalSales,
                        "tw:font-bold tw:text-primary",
                      )}
                    >
                      <Amount value={row.totalSales ?? 0} decimalPlaces={0} />
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell
                    className={`tw:text-right ${groupTints.sales.cellInner}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.b2bSales,
                        "tw:font-semibold tw:text-gray-800",
                      )}
                    >
                      <Amount value={row.b2bSales ?? 0} decimalPlaces={0} />
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell
                    className={`tw:text-right ${groupTints.sales.cellInner}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.b2cSales,
                        "tw:font-semibold tw:text-gray-800",
                      )}
                    >
                      <Amount value={row.b2cSales ?? 0} decimalPlaces={0} />
                    </div>
                  </AppTable.Cell>

                  {/* Buyers Column */}
                  <AppTable.Cell
                    className={`tw:text-center ${groupTints.customers.cell}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.buyersCount,
                        "tw:font-medium tw:text-gray-700",
                      )}
                    >
                      {row.buyersCount != null
                        ? CommonService.commaSeparated(Number(row.buyersCount))
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* Customers Column */}
                  <AppTable.Cell
                    className={`tw:text-center ${groupTints.customers.cellInner}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.customersCount,
                        "tw:font-medium tw:text-gray-700",
                      )}
                    >
                      {row.customersCount != null
                        ? CommonService.commaSeparated(
                            Number(row.customersCount),
                          )
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* New Customers Today Column */}
                  <AppTable.Cell
                    className={`tw:text-center ${groupTints.customers.cellInner}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.customerCreatedtoday,
                        "tw:font-medium tw:text-gray-700",
                      )}
                    >
                      {row.customerCreatedtoday != null
                        ? CommonService.commaSeparated(
                            Number(row.customerCreatedtoday),
                          )
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* POS Orders Column */}
                  <AppTable.Cell
                    className={`tw:text-center ${groupTints.orders.cell}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.posOrders,
                        "tw:font-medium tw:text-gray-700",
                      )}
                    >
                      {row.posOrders != null
                        ? CommonService.commaSeparated(Number(row.posOrders))
                        : "-"}
                    </div>
                    <div className="tw:mt-1.5 tw:flex tw:flex-col tw:items-center tw:gap-0.5">
                      <span className="tw:flex tw:w-14 tw:items-center tw:justify-between tw:rounded tw:bg-amber-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-amber-700">
                        <span>B2B</span>
                        <span className="tw:font-semibold tw:text-amber-900">
                          {CommonService.commaSeparated(
                            Number(row.b2bposOrders ?? 0),
                          )}
                        </span>
                      </span>
                      <span className="tw:flex tw:w-14 tw:items-center tw:justify-between tw:rounded tw:bg-sky-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-sky-700">
                        <span>B2C</span>
                        <span className="tw:font-semibold tw:text-sky-900">
                          {CommonService.commaSeparated(
                            Number(row.b2cposOrders ?? 0),
                          )}
                        </span>
                      </span>
                    </div>
                  </AppTable.Cell>

                  {/* Club Orders Column */}
                  <AppTable.Cell
                    className={`tw:text-center ${groupTints.orders.cellInner}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.clubOrders,
                        "tw:font-medium tw:text-gray-700",
                      )}
                    >
                      {row.clubOrders != null
                        ? CommonService.commaSeparated(Number(row.clubOrders))
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* B2B (ROS) Orders Column */}
                  <AppTable.Cell
                    className={`tw:text-center ${groupTints.orders.cellInner}`}
                  >
                    <div
                      className={mutedIfEmpty(
                        row.rosOrders,
                        "tw:font-medium tw:text-gray-700",
                      )}
                    >
                      {row.rosOrders != null
                        ? CommonService.commaSeparated(Number(row.rosOrders))
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* Stock Overview Column */}
                  <AppTable.Cell className={groupTints.stock.cell}>
                    <div className="tw:grid tw:grid-cols-[auto_auto_1fr] tw:items-baseline tw:gap-x-1 tw:gap-y-0.5 tw:text-xs">
                      {[
                        {
                          label: "In Stock",
                          value: inStock,
                          unit: "units",
                          className: "tw:text-green-600",
                        },
                        {
                          label: "Low Stock",
                          value: lowStock,
                          unit: "units",
                          className: "tw:text-orange-600",
                        },
                        {
                          label: "Out of Stock",
                          value: outOfStock,
                          unit: "units",
                          className: "tw:text-red-600",
                        },
                        {
                          label: "Total Items",
                          value: totalDeals,
                          unit: "items",
                          className: "tw:text-blue-600",
                        },
                      ].map((item) => (
                        <React.Fragment key={item.label}>
                          <span className="tw:whitespace-nowrap tw:text-gray-500">
                            {item.label}
                          </span>
                          <span className="tw:text-gray-400">:</span>
                          <span
                            className={`tw:whitespace-nowrap tw:font-semibold ${item.className}`}
                          >
                            {CommonService.commaSeparated(Number(item.value))}
                            <span className="tw:ml-1 tw:text-[10px] tw:font-medium tw:text-gray-500">
                              {item.unit}
                            </span>
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </AppTable.Cell>

                  {/* Action Column */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:justify-center">
                      <AppButton
                        size="small"
                        fill="clear"
                        onClick={() =>
                          callback?.({ action: "accessStore", data: row })
                        }
                        className="tw:text-primary hover:tw:bg-primary/10 tw:px-2 tw:py-1 tw:rounded tw:transition-colors tw:flex tw:items-center tw:gap-1"
                      >
                        <span className="tw:text-xs tw:font-medium">View</span>
                        <ArrowRight className="tw:w-3.5 tw:h-3.5" />
                      </AppButton>
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          )}
          {hasMoreData && !loading && (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center"
              >
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </>
  );
};

export default DesktopView;
