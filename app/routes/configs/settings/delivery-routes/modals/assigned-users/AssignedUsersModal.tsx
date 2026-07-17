import {
  Calendar,
  LayoutList,
  Map as MapIcon,
  MapPin,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import RouteInfo from "../../components/RouteInfo";
import CustomersMapView from "./components/CustomersMapView";
import orderBy from "lodash/orderBy";

const AssignedUsersModal = ({
  show,
  callback,
  routeId,
  refreshKey,
}: {
  show: boolean;
  callback: (p: { action: string; data?: any }) => void;
  routeId?: string | null;
  refreshKey?: number;
}) => {
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<any | null>(null);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    user?: any;
  }>({ show: false });
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"list" | "map">("list");

  const handleClose = () => callback({ action: "close" });
  const handleRemoveUser = (user: any) => {
    setConfirmDialog({ show: true, user });
  };

  const confirmRemoveUser = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    const userId = user?.id;

    // Close the confirmation dialog immediately so UI feels responsive,
    // then proceed with the API call.
    setConfirmDialog({ show: false });

    try {
      setRemovingUserId(userId);

      const payload = {
        referenceType: user?.referenceType || "Franchise",
        referenceId: userId,
        routeId,
      };

      const resp: any = await DeliveryRoutesService.unlinkRoute(payload);

      if (resp && resp.statusCode === 200) {
        // update local route data to remove the user
        setRouteData((prev: any) =>
          prev
            ? {
                ...prev,
                usersLinked: (prev.usersLinked || []).filter(
                  (uu: any) => (uu._id ?? uu.id) !== userId,
                ),
              }
            : prev,
        );

        // inform parent
        callback({ action: "userRemoved", data: { routeId, user } });
      } else {
        callback({
          action: "userRemovedFailed",
          data: { message: resp?.data?.message || "Failed to remove user" },
        });
      }
    } catch (e) {
      callback({
        action: "userRemovedFailed",
        data: { message: "Failed to remove user" },
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  useEffect(() => {
    const fetchRoute = async (id?: string | null) => {
      if (!id) {
        setRouteData(null);
        return;
      }
      setLoading(true);
      try {
        const resp = await DeliveryRoutesService.getRoutesList({
          filter: { _id: id },
        });
        const d = resp?.data?.data?.[0] ?? null;
        setRouteData(d);
      } catch (e) {
        setRouteData(null);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      void fetchRoute(routeId);
    } else {
      setRouteData(null);
    }
    // Refresh when refreshKey changes to pick up removals
  }, [show, routeId, refreshKey]);

  const users: any[] = orderBy(routeData?.usersLinked ?? [], ["name"], ["asc"]);

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-2xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        Assigned Route B2B Customers
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {/* Route details - use shared RouteInfo UI & key structure */}
        {!loading && routeData ? (
          <RouteInfo
            routeData={routeData}
            expanded={expandedDetails}
            onToggle={() => setExpandedDetails(!expandedDetails)}
          />
        ) : null}

        {!loading && (!users || users.length === 0) ? (
          <div className="tw:p-6">
            <NoData />
          </div>
        ) : null}

        {!loading && users && users.length > 0 ? (
          <div className="tw:space-y-4">
            <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
              <h4 className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wider">
                Customers ({users.length})
              </h4>

              <div className="tw:flex tw:items-center tw:bg-gray-100 tw:p-1 tw:rounded-lg">
                <button
                  onClick={() => setViewType("list")}
                  className={`tw:flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:text-xs tw:font-bold tw:rounded-md tw:transition-all ${
                    viewType === "list"
                      ? "tw:bg-white tw:text-indigo-600 tw:shadow-sm"
                      : "tw:text-gray-500 hover:tw:text-gray-700 hover:tw:bg-gray-200/50"
                  }`}
                >
                  <LayoutList size={14} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewType("map")}
                  className={`tw:flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:text-xs tw:font-bold tw:rounded-md tw:transition-all ${
                    viewType === "map"
                      ? "tw:bg-white tw:text-indigo-600 tw:shadow-sm"
                      : "tw:text-gray-500 hover:tw:text-gray-700 hover:tw:bg-gray-200/50"
                  }`}
                >
                  <MapIcon size={14} />
                  <span>Map</span>
                </button>
              </div>
            </div>

            {viewType === "list" ? (
              <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-xl tw:overflow-hidden tw:shadow-sm">
                <div className="tw:divide-y tw:divide-gray-100">
                  {users.map((u) => (
                    <div
                      key={u.id ?? u._id}
                      className="tw:flex tw:items-center tw:p-3.5 hover:tw:bg-gray-50 tw:transition-colors tw:group"
                    >
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                          <h3 className="tw:font-bold tw:text-sm tw:text-gray-900 tw:truncate">
                            <AppLink
                              asLink
                              href={`/dashboard/network/view/b2b/${u.id}`}
                              className="tw:font-bold tw:text-sm tw:text-gray-900 tw:truncate"
                              noUnderline
                              showLinkColor
                            >
                              {u.name}
                            </AppLink>
                          </h3>
                          <span
                            className={`tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:rounded tw:uppercase tw:tracking-wider tw:border ${
                              u.referenceType === "Franchise"
                                ? "tw:bg-indigo-50 tw:text-indigo-700 tw:border-indigo-100"
                                : "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-100"
                            }`}
                          >
                            {u.referenceType === "Franchise" ? "B2B" : "B2C"}
                          </span>
                        </div>

                        <div className="tw:flex tw:flex-col tw:gap-1">
                          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-600">
                            <MapPin
                              size={12}
                              className="tw:text-gray-400 tw:shrink-0"
                            />
                            <div className="tw:flex tw:flex-wrap tw:gap-x-1 tw:gap-y-0.5 tw:font-medium">
                              {u.town && <span>{u.town},</span>}
                              {u.city && <span>{u.city},</span>}
                              {u.district && <span>{u.district},</span>}
                              {u.state && <span>{u.state}</span>}
                              {u.pincode && (
                                <span className="tw:text-gray-400 tw:ml-0.5">
                                  ({u.pincode})
                                </span>
                              )}
                              {!u.town &&
                                !u.city &&
                                !u.district &&
                                !u.state &&
                                !u.pincode && (
                                  <span className="tw:italic tw:text-gray-400">
                                    Address not available
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:text-gray-400">
                            <Calendar
                              size={12}
                              className="tw:text-gray-300 tw:shrink-0"
                            />
                            <span>
                              Linked on{" "}
                              <DateFormat
                                value={u.linkedAt}
                                formatStr="dd MMM yyyy"
                              />
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="tw:ml-4">
                        {removingUserId &&
                        removingUserId === (u.id ?? u._id) ? (
                          <div className="tw:p-2">
                            <AppSpinner size="sm" />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRemoveUser(u)}
                            className="tw:p-2 tw:text-gray-400 hover:tw:text-red-600 hover:tw:bg-red-50 tw:rounded-lg tw:transition-colors"
                            title="Remove customer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <CustomersMapView users={users} />
            )}
          </div>
        ) : null}
      </AppModal.Content>
      <AppAlertDialog
        show={confirmDialog.show}
        title="Remove Customer"
        description="Are you sure you want to remove this customer from the route?"
        onConfirm={confirmRemoveUser}
        onCancel={() => setConfirmDialog({ show: false })}
      />
    </AppModal>
  );
};

export default AssignedUsersModal;
