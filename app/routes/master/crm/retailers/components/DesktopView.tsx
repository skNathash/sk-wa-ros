import { MapPin } from "lucide-react";
import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

export interface RetailerRow {
  _id?: string;
  franchiseId?: string;
  name?: string;
  shopName?: string;
  mobile?: string;
  town?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string | number;
}

interface DesktopViewProps {
  loading?: boolean;
  data: RetailerRow[];
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
  { label: "S.No", key: "sno", enableSort: false, width: "60px" },
  { label: "Retailer", key: "name", width: "26%", enableSort: true },
  { label: "Mobile", key: "mobile", width: "14%", enableSort: false },
  { label: "Town", key: "town", width: "15%", enableSort: true },
  { label: "District", key: "district", width: "15%", enableSort: true },
  { label: "State", key: "state", width: "15%", enableSort: true },
  { label: "Pincode", key: "pincode", width: "10%", enableSort: true },
];

const containerStyle = {
  maxHeight: "calc(100vh - 260px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  sortKey,
  sortValue,
  onSort,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  if (!loading && data.length === 0) {
    return (
      <NoData
        title="No retailers found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="900px"
      condensed
    >
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
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row.franchiseId || row._id || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>

              {/* Retailer name + franchise id */}
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1">
                  <span className="tw:font-medium tw:text-gray-900 tw:line-clamp-2">
                    {row.name || row.shopName || "-"}
                  </span>
                  {row.franchiseId && (
                    <span className="tw:text-xs tw:text-gray-500">
                      ID: {row.franchiseId}
                    </span>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>{row.mobile || "-"}</AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <MapPin className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
                  <span className="tw:truncate">{row.city || "-"}</span>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>{row.district || "-"}</AppTable.Cell>

              <AppTable.Cell>{row.state || "-"}</AppTable.Cell>

              <AppTable.Cell>{row.pincode || "-"}</AppTable.Cell>
            </AppTable.Row>
          ))
        )}
        {hasMoreData && !loading && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
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
  );
};

export default DesktopView;
