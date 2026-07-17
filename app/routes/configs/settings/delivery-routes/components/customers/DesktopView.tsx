import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import RoutePopover from "~/shared/logistics/components/RoutePopover";
import Rbac from "~/components/core/rbac/Rbac";

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
    { label: "Address", key: "address" },
    { label: "Route", key: "route" },
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
                <div className="tw:font-semibold tw:text-sm tw:text-gray-900">
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/b2b/${d._id}`}
                    className="tw:text-blue-600 hover:tw:underline"
                  >
                    {d.name}
                  </AppLink>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{d.mobile || "-"}</AppTable.Cell>
              <AppTable.Cell>{d.addressStr || "-"}</AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:font-medium tw:text-blue-600">
                  <span className="tw:truncate">{d.routeName || "-"}</span>
                  {d.routeData && (
                    <RoutePopover route={d.routeData} isActive={false} />
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:justify-center tw:gap-2">
                  <Rbac roles={rbacRoles.assignRoute}>
                    <AppButton
                      onClick={() => callback?.({ action: "change", data: d })}
                      fill="clear"
                      size="small"
                      color="primary"
                      className="tw:font-medium tw:text-primary"
                    >
                      {d.routeId ? "Change" : "Assign"}
                    </AppButton>
                  </Rbac>

                  <Rbac roles={rbacRoles.assignRoute}>
                    {d.routeId && (
                      <AppButton
                        onClick={() =>
                          callback?.({ action: "remove", data: d })
                        }
                        fill="clear"
                        size="small"
                        color="danger"
                        className="tw:font-medium tw:text-red-500"
                      >
                        Remove
                      </AppButton>
                    )}
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
