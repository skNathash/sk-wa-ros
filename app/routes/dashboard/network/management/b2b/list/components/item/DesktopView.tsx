import { MessageCircle, Phone } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type {
  PaginationState,
  TableHeaderItem,
  VariantColor,
  ViewToggleType,
} from "~/types/CommonTypes";
import {
  fromHeaderSort,
  toHeaderSort,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import CommonService from "~/services/CommonService";
import {
  DirectoryEmpty,
  InitialsAvatar,
  PaylaterBar,
  paylaterLabel,
} from "~/shared/network/components/directory-bits/DirectoryBits";

interface FranchiseData {
  _id: string;
  franchiseId?: string;
  name: string;
  mobile?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  city?: string;
  town?: string;
  district?: string;
  state?: string;
  pincode?: string;
  formattedAddress: string;
  initials: string;
  lastOrderDate?: string;
  // Directory metrics — sent by the franchise dashboard API when available.
  bills?: number;
  ltv?: number;
  paylaterUsed?: number;
  paylaterLimit?: number;
  /** Buyer flag from the API — drives the Active / "last · Nd" status line. */
  isActiveBuyer?: boolean;
  daysSinceOrder?: number;
  /** Registration date picked by the list helper — `createdAt`. */
  registeredOn?: string | null;
}

interface DesktopViewProps {
  loading?: boolean;
  data: FranchiseData[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  onAction?: (arg: { action: string; data?: any }) => void;
  paginationConfig: PaginationState;
  view: ViewToggleType;
  onViewChange: (view: ViewToggleType) => void;
  /** Current sort — same `{ key, value: 1 | -1 }` shape the popover uses. */
  sortValue?: SortValue;
  onSort?: (value: SortValue) => void;
}

/**
 * Column config. The sortable keys are the field names the franchise dashboard
 * endpoint sorts on, so the same list feeds both the header arrows and the
 * mobile popover.
 */
export const headers: TableHeaderItem[] = [
  {
    label: "Retailer",
    langKey: "retailer",
    key: "name",
    enableSort: true,
    width: "26%",
  },
  {
    label: "Mobile",
    langKey: "mobile",
    key: "mobile",
    enableSort: false,
    width: "14%",
  },
  {
    label: "Bills",
    key: "bills",
    enableSort: true,
    width: "7%",
    isRightAligned: true,
  },
  {
    label: "LTV",
    key: "ltv",
    enableSort: true,
    width: "10%",
    isRightAligned: true,
  },
  {
    // No `paylaterUsage` string in the bundles — keep the plain label so the
    // header never falls back to the raw key.
    label: "Paylater Usage",
    key: "paylaterUsed",
    enableSort: true,
    width: "16%",
  },
  {
    label: "Registered On",
    langKey: "registeredOn",
    key: "createdAt",
    enableSort: true,
    width: "11%",
  },
  {
    label: "Status",
    langKey: "status",
    key: "status",
    enableSort: false,
    width: "11%",
  },
  {
    label: "Action",
    langKey: "actions",
    key: "actions",
    enableSort: false,
    width: "12%",
    isRightAligned: true,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

/* Active is green, Inactive is red. Same shape as the B2C rows: Inactive
   carries its own red classes because the themed `default`/`secondary`
   surfaces both read green in theme-2. */
const statusBadge = (
  isActiveBuyer: boolean,
): { label: string; color: VariantColor; className?: string } =>
  isActiveBuyer
    ? { label: "Active", color: "success" }
    : {
        label: "Inactive",
        color: "light",
        className: "tw:bg-red-50! tw:text-red-600! tw:border-transparent!",
      };

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  onAction,
  paginationConfig,
  view,
  onViewChange,
  sortValue,
  onSort,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      {/* Toolbar — pagination summary on the left, sort hint, export and the
          view toggle on the right. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div>
          {loading ? (
            <span className="tw:inline-block tw:h-5 tw:w-32 tw:animate-pulse tw:rounded tw:bg-gray-200" />
          ) : (
            <PaginationSummary
              paginationConfig={paginationConfig}
              loadingTotalRecords={false}
              loadedCount={loadedCount}
              fwSize="sm"
            />
          )}
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <ViewToggle viewType={view} callback={onViewChange} />
        </div>
      </div>

      {!loading && data.length === 0 ? (
        <DirectoryEmpty
          title="No retailers found"
          description="Try another search, filter, or segment — or clear filters to see the full book."
        />
      ) : (
        <AppTable
          size="sm"
          stickyHeader
          fixedLayout
          container
          minWidth="1000px"
          containerStyle={containerStyle}
        >
          <AppTable.Header>
            <TableHeader
              headers={headers}
              {...toHeaderSort(sortValue)}
              onSort={(data) => onSort?.(fromHeaderSort(data))}
            />
          </AppTable.Header>
          <AppTable.Body>
            {loading ? (
              <TableSkeletonLoader cols={headers.length} rows={30} />
            ) : (
              data.map((row, idx) => {
                const badge = statusBadge(row.isActiveBuyer === true);
                return (
                  <AppTable.Row key={row._id || idx}>
                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:gap-3">
                        <InitialsAvatar
                          name={row.name}
                          initials={row.initials}
                          size={38}
                        />
                        <div className="tw:min-w-0">
                          <div className="tw:flex tw:items-center tw:gap-2">
                            <AppLink
                              asLink
                              href={`/dashboard/network/view/b2b/${row._id}`}
                            >
                              <span className="tw:font-semibold">
                                {row.name}
                              </span>
                            </AppLink>
                          </div>
                          {/* Identity line — franchise id, then the town/state the
                              retailer is registered in, then LTV once the
                              directory metrics are present. */}
                          <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                            {[
                              row.franchiseId,
                              row.formattedAddress !== "N/A"
                                ? row.formattedAddress
                                : null,
                              row.ltv
                                ? `LTV ${CommonService.formatCompact(row.ltv, { style: "short", prefix: "₹" })}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      </div>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <span className="tw:text-sm tw:text-gray-700">
                        {row.mobile ? (
                          <div className="tw:flex tw:items-center tw:gap-1">
                            <Phone size={14} /> {row.mobile}
                          </div>
                        ) : (
                          t("nA")
                        )}
                      </span>
                    </AppTable.Cell>

                    <AppTable.Cell className="tw:text-right">
                      <span className="tw:text-sm tw:text-gray-700">
                        {row.bills ?? 0}
                      </span>
                    </AppTable.Cell>

                    <AppTable.Cell className="tw:text-right">
                      <span className="tw:text-sm tw:font-semibold tw:text-gray-700">
                        {CommonService.formatCompact(row.ltv, {
                          style: "short",
                          prefix: "₹",
                        })}
                      </span>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      {row.paylaterLimit ? (
                        <>
                          <PaylaterBar
                            used={row.paylaterUsed}
                            limit={row.paylaterLimit}
                          />
                          <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                            {paylaterLabel(row.paylaterUsed, row.paylaterLimit)}
                          </div>
                        </>
                      ) : (
                        <span className="tw:text-xs tw:text-gray-400">
                          Not enrolled
                        </span>
                      )}
                    </AppTable.Cell>

                    <AppTable.Cell>
                      {row.registeredOn ? (
                        <DateFormat
                          value={row.registeredOn}
                          formatStr="dd MMM yyyy"
                          className="tw:text-sm tw:text-gray-700"
                        />
                      ) : (
                        <span className="tw:text-sm tw:text-gray-700">
                          {t("nA")}
                        </span>
                      )}
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <div className="tw:flex tw:flex-col tw:items-start tw:gap-1">
                        <AppBadge
                          variant={badge.color}
                          className={badge.className}
                        >
                          {badge.label}
                        </AppBadge>
                        <span className="tw:text-xs tw:text-gray-400">
                          {row.daysSinceOrder === undefined
                            ? "No orders yet"
                            : `Last · ${row.daysSinceOrder}d`}
                        </span>
                      </div>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                        <button
                          type="button"
                          title="Promote via WhatsApp"
                          aria-label="Promote via WhatsApp"
                          className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-gray-300 tw:text-gray-600 tw:cursor-pointer hover:tw:border-emerald-500 hover:tw:text-emerald-600"
                          onClick={() =>
                            onAction?.({ action: "openWhatsapp", data: row })
                          }
                        >
                          <MessageCircle size={15} />
                        </button>
                        <AppLink
                          asLink
                          href={`/dashboard/network/view/b2b/${row._id}`}
                          noUnderline
                        >
                          <span className="tw:inline-flex tw:items-center tw:rounded-md tw:border tw:border-gray-300 tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 hover:tw:bg-gray-50">
                            Open
                          </span>
                        </AppLink>
                      </div>
                    </AppTable.Cell>
                  </AppTable.Row>
                );
              })
            )}
            {hasMoreData && !loading && data.length > 0 && (
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
      )}
    </>
  );
};

export default DesktopView;
