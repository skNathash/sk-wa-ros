import { Calendar, Mail, Phone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import RouteInfo from "../../components/RouteInfo";
import orderBy from "lodash/orderBy";

const AssignedEmployeesModal = ({
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

  const handleClose = () => callback({ action: "close" });

  const handleRemoveEmployee = (user: any) => {
    setConfirmDialog({ show: true, user });
  };

  const confirmRemoveEmployee = async () => {
    const user = confirmDialog.user;
    if (!user) return;
    const manpowerId = user?.manpowerId;

    setConfirmDialog({ show: false });

    try {
      setRemovingUserId(manpowerId);

      const resp: any = await DeliveryRoutesService.unlinkRoute({
        referenceType: "Manpower",
        referenceId: manpowerId,
        routeId,
      });

      if (resp && resp.statusCode === 200) {
        setRouteData((prev: any) =>
          prev
            ? {
                ...prev,
                manpowerLinked: (prev.manpowerLinked || []).filter(
                  (uu: any) => uu.manpowerId !== manpowerId,
                ),
              }
            : prev,
        );
        callback({ action: "employeeRemoved", data: { routeId, user } });
      } else {
        callback({
          action: "employeeRemovedFailed",
          data: {
            message: resp?.data?.message || "Failed to remove employee",
          },
        });
      }
    } catch (e) {
      callback({
        action: "employeeRemovedFailed",
        data: { message: "Failed to remove employee" },
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
  }, [show, routeId, refreshKey]);

  const employees: any[] = orderBy(
    routeData?.manpowerLinked ?? [],
    ["name"],
    ["asc"],
  );

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-2xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        Assigned Digital Raja/Rani
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && routeData ? (
          <RouteInfo
            routeData={routeData}
            expanded={expandedDetails}
            onToggle={() => setExpandedDetails(!expandedDetails)}
          />
        ) : null}

        {!loading && (!employees || employees.length === 0) ? (
          <div className="tw:p-6">
            <NoData />
          </div>
        ) : null}

        {!loading && employees && employees.length > 0 ? (
          <div className="tw:space-y-4">
            <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
              <h4 className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wider">
                Digital Raja/Rani ({employees.length})
              </h4>
            </div>

            <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-xl tw:overflow-hidden tw:shadow-sm">
              <div className="tw:divide-y tw:divide-gray-100">
                {employees.map((u) => (
                  <div
                    key={u.id ?? u._id}
                    className="tw:flex tw:items-center tw:p-3.5 hover:tw:bg-gray-50 tw:transition-colors tw:group"
                  >
                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                        <h3 className="tw:font-bold tw:text-sm tw:text-gray-900 tw:truncate">
                          {u.name}
                        </h3>
                        {u.position ? (
                          <span className="tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:rounded tw:uppercase tw:tracking-wider tw:border tw:bg-purple-50 tw:text-purple-700 tw:border-purple-100">
                            {u.position}
                          </span>
                        ) : null}
                      </div>

                      <div className="tw:flex tw:flex-col tw:gap-1">
                        {u.mobile ? (
                          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-600">
                            <Phone
                              size={12}
                              className="tw:text-gray-400 tw:shrink-0"
                            />
                            <span className="tw:font-medium">{u.mobile}</span>
                          </div>
                        ) : null}

                        {u.email ? (
                          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-600">
                            <Mail
                              size={12}
                              className="tw:text-gray-400 tw:shrink-0"
                            />
                            <span className="tw:font-medium">{u.email}</span>
                          </div>
                        ) : null}

                        {u.linkedAt ? (
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
                        ) : null}
                      </div>
                    </div>

                    <div className="tw:ml-4">
                      {removingUserId && removingUserId === u.manpowerId ? (
                        <div className="tw:p-2">
                          <AppSpinner size="sm" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRemoveEmployee(u)}
                          className="tw:p-2 tw:text-gray-400 hover:tw:text-red-600 hover:tw:bg-red-50 tw:rounded-lg tw:transition-colors"
                          title="Remove employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </AppModal.Content>
      <AppAlertDialog
        show={confirmDialog.show}
        title="Remove Employee"
        description="Are you sure you want to remove this employee from the route?"
        onConfirm={confirmRemoveEmployee}
        onCancel={() => setConfirmDialog({ show: false })}
      />
    </AppModal>
  );
};

export default AssignedEmployeesModal;
