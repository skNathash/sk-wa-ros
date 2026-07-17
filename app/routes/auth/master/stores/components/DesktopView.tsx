import { LockOpen, Phone } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";
import UserBadgeForItem from "~/shared/store/badge/UserBadgeForItem";

interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback?: (action: { action: string; data: any }) => void;
  sortKey?: string;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortValue?: SortValue;
  showLoadMore?: boolean;
  loadedCount?: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const tableHeaders: TableHeaderItem[] = [
  { label: "#", key: "sl", width: "3%" },
  { label: "Store Name", key: "name", width: "20%" },
  { label: "Type", key: "type", width: "10%" },
  { label: "City", key: "city", width: "10%" },
  { label: "District", key: "district", width: "10%" },
  { label: "State", key: "state", width: "10%" },
  { label: "Pincode", key: "pincode", width: "10%" },
  { label: "Registered On", key: "createdAt", width: "10%" },
  { label: "Actions", key: "action", width: "10%" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading = false,
  data,
  callback,
  sortKey,
  onSort,
  sortValue,
  showLoadMore = true,
  loadedCount,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  // if not loading and no data, show NoData like inventory implementation
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  const loaded = typeof loadedCount === "number" ? loadedCount : data.length;

  return (
    <>
      <AppTable container stickyHeader containerStyle={containerStyle}>
        <AppTable.Header>
          <TableHeader
            headers={tableHeaders}
            sortKey={sortKey}
            onSort={onSort}
            sortValue={sortValue}
          />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={tableHeaders.length} rows={20} />
          ) : null}
          {data.map((item, index) => (
            <AppTable.Row key={item._id}>
              <AppTable.Cell>{index + 1}</AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:w-12 tw:h-12 tw:bg-gray-100 tw:rounded-md">
                    <ImgRender
                      assetId={item.shopImg}
                      className="tw:object-cover tw:rounded-md"
                    />
                  </div>
                  <div>
                    <div className="tw:font-medium">{item.name}</div>
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center">
                      <span>ID: {item.franchiseId}</span>
                      {item.mobile ? (
                        <span
                          className="tw:inline-flex tw:items-center tw:ml-2 tw:text-xs tw:text-gray-500"
                          aria-label="mobile"
                        >
                          <Phone className="tw:w-3 tw:h-3 tw:mr-1 tw:text-gray-500" />
                          <span>{item.mobile}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <UserBadgeForItem networkType={item.networkType} />
              </AppTable.Cell>
              <AppTable.Cell>{item.city}</AppTable.Cell>
              <AppTable.Cell>{item.district}</AppTable.Cell>
              <AppTable.Cell>{item.state}</AppTable.Cell>
              <AppTable.Cell>{item.pincode}</AppTable.Cell>
              <AppTable.Cell>
                {item.createdAt ? (
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AppButton
                  onClick={() =>
                    callback?.({ action: "accessStore", data: item })
                  }
                  size="small"
                >
                  <LockOpen size={14} />
                  Access Store
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))}

          {showLoadMore && !loading && (
            <AppTable.Row>
              <AppTable.Cell colSpan={tableHeaders.length}>
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loaded}
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
