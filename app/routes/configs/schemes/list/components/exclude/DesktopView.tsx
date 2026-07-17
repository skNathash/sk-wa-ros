import { PencilLine, Phone, MapPin } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import type { TableHeaderItem } from "~/types/CommonTypes";
import AppLink from "~/components/core/link/AppLink";

type DesktopViewProps = {
  loading?: boolean;
  data?: any[];
  callback?: (args: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount?: number;
  removingId?: string | null;
  startSlNo?: number;
};

const headers: TableHeaderItem[] = [
  { label: "Sl No", key: "slno", width: "5%" },
  { label: "Name", key: "name", width: "30%" },
  { label: "ID", key: "refId", width: "10%" },
  { label: "City", key: "city", width: "10%" },
  { label: "District", key: "district", width: "10%" },
  { label: "State", key: "state", width: "10%" },
  { label: "Pincode", key: "pincode", width: "10%" },
  { label: "Action", key: "action", width: "15%" },
];

const containerStyle = { maxHeight: "calc(100vh - 220px)" };

const DesktopView = ({
  loading = false,
  data = [],
  callback,
  showLoadMore = false,
  loadingMore = false,
  loadMore = () => {},
  totalCount = 0,
  loadedCount = 0,
  removingId = null,
  startSlNo = 1,
}: DesktopViewProps) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <AppTable
        container
        responsive
        stickyHeader
        containerStyle={containerStyle}
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading && <TableSkeletonLoader cols={headers.length} />}

          {data.map((item, index) => (
            <AppTable.Row
              key={item.id || item._id}
              className="tw:align-middle tw:text-sm"
            >
              <AppTable.Cell className="tw-text-center">
                {startSlNo + index}
              </AppTable.Cell>
              <AppTable.Cell>
                <div>
                  <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-x-2 tw:gap-y-1">
                    <div className="tw-font-semibold tw-text-gray-900">
                      <AppLink
                        asLink
                        href={`/dashboard/network/view/b2b/${
                          item.id || item._id
                        }`}
                        showLinkColor
                      >
                        {item.name || item._displayName || "-"}
                      </AppLink>
                    </div>
                  </div>
                  {item.mobile && (
                    <div className="tw:text-[11px] tw:font-semibold tw:text-primary/70 tw:flex tw:items-center tw:gap-1">
                      <Phone size={10} className="tw:shrink-0 tw:opacity-70" />
                      {item.mobile}
                    </div>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw-text-xs tw-text-gray-500 tw:font-mono">
                  {item.refId || item.id || item._id || "-"}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw-text-sm tw-text-gray-700">
                  {item.city || "-"}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw-text-sm tw-text-gray-700">
                  {item.district || "-"}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw-text-sm tw-text-gray-700">
                  {item.state || "-"}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw-text-sm tw-text-gray-700">
                  {item.pincode || "-"}
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw-text-center">
                <AppButton
                  size="small"
                  color="danger"
                  fill="outline"
                  isLoading={removingId === (item.id || item._id)}
                  disabled={removingId !== null}
                  onClick={() => callback?.({ action: "remove", data: item })}
                >
                  Remove
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row noHover>
            <AppTable.Cell colSpan={headers.length} className="tw-text-center">
              <LoadMoreButton
                loading={loadingMore}
                loadMore={loadMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable>
    </>
  );
};

export default DesktopView;
