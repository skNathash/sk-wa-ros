import { ArrowRight, MapPin } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
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

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "3%" },
  { label: "Retailer", key: "franchiseName", width: "14%", enableSort: true },
  {
    label: "Registered On",
    key: "registeredOn",
    width: "7%",
    enableSort: true,
  },
  {
    label: "Active Plan",
    key: "activePlan",
    width: "15%",
    enableSort: false,
  },
  {
    label: "Total",
    key: "totalSales",
    width: "7%",
    enableSort: true,
    isRightAligned: true,
  },
  {
    label: "B2B",
    key: "b2bSales",
    width: "6%",
    enableSort: true,
    isRightAligned: true,
  },
  {
    label: "B2C",
    key: "b2cSales",
    width: "6%",
    enableSort: true,
    isRightAligned: true,
  },
  {
    label: "SK Buyers",
    key: "buyersCount",
    width: "5%",
    enableSort: true,
    isCentered: true,
  },
  {
    label: "Cust.",
    key: "customersCount",
    width: "5%",
    enableSort: true,
    isCentered: true,
  },
  {
    label: "Today",
    key: "customerCreatedtoday",
    width: "5%",
    enableSort: true,
    isCentered: true,
  },
  {
    label: "POS",
    key: "posOrders",
    width: "6%",
    enableSort: true,
    isCentered: true,
  },
  {
    label: "Club",
    key: "clubOrders",
    width: "5%",
    enableSort: true,
    isCentered: true,
  },
  {
    label: "Inventory Status",
    key: "inventory.inStock",
    width: "11%",
    enableSort: true,
  },
  { label: "Access Store", key: "action", width: "5%", enableSort: false },
];

const headerGroups = [
  { label: "", span: 3 },
  { label: "Plan", span: 1, className: "tw:bg-violet-50" },
  { label: "Sales", span: 3, className: "tw:bg-blue-50" },
  { label: "Customers", span: 3, className: "tw:bg-emerald-50" },
  { label: "Orders", span: 2, className: "tw:bg-amber-50" },
  { label: "Stock", span: 1, className: "tw:bg-rose-50" },
  { label: "", span: 1 },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
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
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <DateFormat
                      value={row.registeredOn || null}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:mt-1 tw:flex tw:flex-col tw:whitespace-nowrap">
                      <span className="tw:text-[10px] tw:text-gray-400">
                        Last Login
                      </span>
                      <span className="tw:text-[10px] tw:text-gray-500">
                        {row.lastLoginOn ? (
                          <DateFormat
                            value={row.lastLoginOn || null}
                            formatStr="dd MMM yyyy"
                          />
                        ) : (
                          "-"
                        )}
                      </span>
                    </div>
                  </AppTable.Cell>

                  {/* Active Plan Column */}
                  <AppTable.Cell className="tw:bg-violet-50/50">
                    {row.subscriptionPlan?.planInfo?.type ? (
                      <div className="tw:flex tw:flex-col tw:gap-1">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <div className="tw:text-xs tw:font-bold tw:text-purple-800 tw:uppercase">
                            {row.subscriptionPlan.planInfo.typeOfPlan ===
                            "Hybrid"
                              ? `Hybrid Plan${row.subscriptionPlan.planInfo.planName ? ` - ${row.subscriptionPlan.planInfo.planName}` : ""}`
                              : row.subscriptionPlan.planInfo.type === "Value"
                                ? "Fixed Plan"
                                : row.subscriptionPlan.planInfo.type ===
                                    "Percentage"
                                  ? "Percentage Plan"
                                  : row.subscriptionPlan.planInfo.type}
                          </div>
                        </div>
                        {row.subscriptionPlan.planInfo.operationalFeeInfo && (
                          <KeyValue
                            label="Operational Fee"
                            size="xs"
                            horizontal
                            labelClassName="tw:w-24"
                            valueClassName="tw:text-gray-700 tw:font-semibold"
                          >
                            :{" "}
                            {
                              row.subscriptionPlan.planInfo.operationalFeeInfo
                                .value
                            }{" "}
                            <span className="tw:text-[10px] tw:text-gray-500 tw:ml-1 tw:font-medium">
                              {
                                row.subscriptionPlan.planInfo.operationalFeeInfo
                                  .type
                              }
                            </span>
                          </KeyValue>
                        )}
                        <KeyValue label="Validity" size="xs" horizontal>
                          <div className="tw:flex tw:items-center tw:gap-1 tw:text-gray-600">
                            <DateFormat
                              value={row.subscriptionPlan.planStartAt || null}
                              formatStr="dd MMM yyyy"
                            />
                            <span className="tw:text-gray-600"> - </span>
                            <DateFormat
                              value={row.subscriptionPlan.planEndAt || null}
                              formatStr="dd MMM yyyy"
                            />
                          </div>
                        </KeyValue>

                        <KeyValue
                          label="Purchase Limit"
                          size="xs"
                          horizontal
                          labelClassName="tw:w-24"
                          valueClassName="tw:text-blue-600 tw:font-semibold"
                        >
                          :{" "}
                          <Amount
                            value={row.subscriptionPlan.planInfo?.amountTo ?? 0}
                          />
                        </KeyValue>

                        <KeyValue
                          label="Used"
                          size="xs"
                          horizontal
                          labelClassName="tw:w-24"
                          valueClassName="tw:text-red-600 tw:font-semibold"
                        >
                          :{" "}
                          <Amount
                            value={row.subscriptionPlan.usedAmount ?? 0}
                          />
                        </KeyValue>

                        <KeyValue
                          label="Available"
                          size="xs"
                          horizontal
                          labelClassName="tw:w-24"
                          valueClassName="tw:text-green-600 tw:font-semibold"
                        >
                          :{" "}
                          <Amount
                            value={row.subscriptionPlan.availableAmount ?? 0}
                          />
                        </KeyValue>
                      </div>
                    ) : (
                      <div className="tw:text-xs tw:text-gray-400">
                        No active plan
                      </div>
                    )}
                  </AppTable.Cell>

                  {/* Total Value Column */}
                  <AppTable.Cell className="tw:text-right tw:bg-blue-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.totalSales,
                          "tw:font-bold tw:text-primary",
                        )
                      }
                    >
                      <Amount value={row.totalSales ?? 0} decimalPlaces={0} />
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-right tw:bg-blue-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.b2bSales,
                          "tw:font-semibold tw:text-gray-800",
                        )
                      }
                    >
                      <Amount value={row.b2bSales ?? 0} decimalPlaces={0} />
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-right tw:bg-blue-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.b2cSales,
                          "tw:font-semibold tw:text-gray-800",
                        )
                      }
                    >
                      <Amount value={row.b2cSales ?? 0} decimalPlaces={0} />
                    </div>
                  </AppTable.Cell>

                  {/* Buyers Column */}
                  <AppTable.Cell className="tw:text-center tw:bg-emerald-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.buyersCount,
                          "tw:font-medium tw:text-gray-700",
                        )
                      }
                    >
                      {row.buyersCount != null
                        ? CommonService.commaSeparated(Number(row.buyersCount))
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* Customers Column */}
                  <AppTable.Cell className="tw:text-center tw:bg-emerald-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.customersCount,
                          "tw:font-medium tw:text-gray-700",
                        )
                      }
                    >
                      {row.customersCount != null
                        ? CommonService.commaSeparated(
                            Number(row.customersCount),
                          )
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* New Customers Today Column */}
                  <AppTable.Cell className="tw:text-center tw:bg-emerald-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.customerCreatedtoday,
                          "tw:font-medium tw:text-gray-700",
                        )
                      }
                    >
                      {row.customerCreatedtoday != null
                        ? CommonService.commaSeparated(
                            Number(row.customerCreatedtoday),
                          )
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* POS Orders Column */}
                  <AppTable.Cell className="tw:text-center tw:bg-amber-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.posOrders,
                          "tw:font-medium tw:text-gray-700",
                        )
                      }
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
                  <AppTable.Cell className="tw:text-center tw:bg-amber-50/50">
                    <div
                      className={
                        mutedIfEmpty(
                          row.clubOrders,
                          "tw:font-medium tw:text-gray-700",
                        )
                      }
                    >
                      {row.clubOrders != null
                        ? CommonService.commaSeparated(Number(row.clubOrders))
                        : "-"}
                    </div>
                  </AppTable.Cell>

                  {/* Stock Overview Column */}
                  <AppTable.Cell className="tw:bg-rose-50/50">
                    <div className="tw:flex tw:flex-col tw:text-xs">
                      <KeyValue
                        label="In Stock"
                        size="xs"
                        horizontal
                        labelClassName="tw:w-20"
                        valueClassName="tw:text-green-600 tw:font-semibold"
                        className="tw:mb-1"
                      >
                        : {CommonService.commaSeparated(Number(inStock))}{" "}
                        <span className="tw:text-[10px] tw:text-gray-500 tw:ml-1 tw:font-medium">
                          units
                        </span>
                      </KeyValue>
                      <KeyValue
                        label="Low Stock"
                        size="xs"
                        horizontal
                        labelClassName="tw:w-20"
                        valueClassName="tw:text-orange-600 tw:font-semibold"
                        className="tw:mb-1"
                      >
                        : {CommonService.commaSeparated(Number(lowStock))}
                        <span className="tw:text-[10px] tw:text-gray-500 tw:ml-1 tw:font-medium">
                          units
                        </span>
                      </KeyValue>
                      <KeyValue
                        label="Out of Stock"
                        size="xs"
                        horizontal
                        labelClassName="tw:w-20"
                        valueClassName="tw:text-red-600 tw:font-semibold"
                        className="tw:mb-1"
                      >
                        : {CommonService.commaSeparated(Number(outOfStock))}
                        <span className="tw:text-[10px] tw:text-gray-500 tw:ml-1 tw:font-medium">
                          units
                        </span>
                      </KeyValue>

                      <KeyValue
                        label="Total Items"
                        size="xs"
                        horizontal
                        labelClassName="tw:w-20"
                        valueClassName="tw:text-blue-600 tw:font-semibold"
                      >
                        : {CommonService.commaSeparated(Number(totalDeals))}
                        <span className="tw:text-[10px] tw:text-gray-500 tw:ml-1 tw:font-medium">
                          items
                        </span>
                      </KeyValue>
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
