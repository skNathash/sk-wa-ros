import AppTable from "~/components/core/table/AppTable";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";
import Rbac from "~/components/core/rbac/Rbac";
import { X } from "lucide-react";
import UserPic from "~/shared/users/components/UserPic";
import AppBadge from "~/components/core/badge/AppBadge";

type Props = {
  loading: boolean;
  data: any[];
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
  callback?: (a: { action: string; data?: any }) => void;
};

const rbacRoles = {
  assignRoute: ["DELIVERY-ROUTE.DELIVERY-ROUTE-ASSIGN"],
};

const containerStyle = {
  maxHeight: "calc(100vh - 300px)",
};

const DesktopView = ({
  loading,
  data,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount,
  loadedCount,
  callback,
}: Props) => {
  const headers: TableHeaderItem[] = [
    { label: "Name", key: "name" },
    { label: "Mobile", key: "mobile" },
    { label: "Role", key: "role" },
    { label: "Routes", key: "routes" },
    { label: "Actions", key: "actions", isCentered: true },
  ];

  if (!loading && !data.length) {
    return <NoData />;
  }

  return (
    <div className="tw:overflow-hidden">
      <AppTable
        bordered
        hover
        size="sm"
        container
        containerStyle={containerStyle}
        stickyHeader
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading && data.length === 0 ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : null}

          {data.map((d) => (
            <AppTable.Row key={d._id}>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <UserPic
                    assetId={d.profileImages?.[0]}
                    gender={d.gender}
                    type={d._userPicType}
                    className="tw:w-9 tw:h-9 tw:rounded-full tw:border tw:border-gray-200"
                  />
                  <div className="tw:font-semibold tw:text-sm tw:text-gray-900">
                    {d.name}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{d.mobile || "-"}</AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={d._positionBadgeColor}>
                  {d.digitalRole}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {d.linkedRoutes?.length > 0 ? (
                  <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                    {d.linkedRoutes.map((route: any) => (
                      <div
                        key={route.routeId}
                        className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:rounded tw:bg-primary-50 tw:border tw:border-primary-200 tw:text-xs tw:font-medium tw:text-primary-700"
                      >
                        <span>{route.routeName}</span>
                        <Rbac roles={rbacRoles.assignRoute}>
                          <button
                            type="button"
                            onClick={() =>
                              callback?.({
                                action: "remove",
                                data: {
                                  ...d,
                                  routeId: route.routeId,
                                  routeName: route.routeName,
                                },
                              })
                            }
                            className="tw:ml-0.5 tw:text-red-400 hover:tw:text-red-600 tw:transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </Rbac>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:justify-center tw:gap-2">
                  <Rbac roles={rbacRoles.assignRoute}>
                    <AppButton
                      onClick={() => callback?.({ action: "assign", data: d })}
                      fill="clear"
                      size="small"
                      color="primary"
                      className="tw:font-medium tw:text-primary"
                    >
                      {d.linkedRoutes?.length > 0 ? "Change" : "Assign"}
                    </AppButton>
                  </Rbac>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>

      {showLoadMore && !loading && (
        <div className="tw:mt-4 tw:flex tw:justify-center tw:mb-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default DesktopView;
