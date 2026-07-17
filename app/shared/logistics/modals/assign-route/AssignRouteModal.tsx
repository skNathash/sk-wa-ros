import { CheckCircle2, MapPin, Phone, Store, User } from "lucide-react";
import UserPic from "~/shared/users/components/UserPic";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CustomerService from "~/services/CustomerService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import FranchiseService from "~/services/FranchiseService";
import UserService from "~/services/UserService";
import RoutesSlider from "../../components/RoutesSlider";
import { formatDate, nextDay, type Day } from "date-fns";

interface AssignRouteModalProps {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  userId: string;
  userType: "B2B" | "B2C" | "Employee";
  currentRouteId?: string | null;
  linkedRoutes?: Array<{
    routeId: string;
    routeCode?: string;
    description?: string;
  }>;
  feature?: "default" | "order";
  orderIds?: string[];
}

const WEEKDAY_INDEX: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const getNextWeekday = (weekday: string, fromDate = new Date()) => {
  const dayIndex = WEEKDAY_INDEX[weekday.toLowerCase()];

  if (dayIndex === undefined || typeof dayIndex !== "number") {
    return null;
  }

  return nextDay(fromDate, dayIndex);
};

const AssignRouteModal: React.FC<AssignRouteModalProps> = ({
  show,
  callback,
  userId,
  userType,
  currentRouteId = null,
  linkedRoutes = [],
  feature = "default",
  orderIds = [],
}) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedRoutes, setSelectedRoutes] = useState<
    Array<{ routeId: string; routeCode: string; description: string }>
  >([]);
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [routesCount, setRoutesCount] = useState<number | null>(null);
  const [loadingRoutesCount, setLoadingRoutesCount] = useState(false);
  const appNav = useAppNav();

  // Format user data to a consistent structure
  const formatUserData = (rawData: any, type: "B2B" | "B2C" | "Employee") => {
    if (!rawData) return null;

    let formattedUser: any = {
      _id: rawData._id,
      id: rawData.franchiseId || rawData.referenceId || rawData._id,
      name: "",
      mobile: "",
      addressStr: "",
      location: "",
    };

    if (type === "Employee") {
      const formatted = UserService.formatUser({ ...rawData });
      formattedUser.name = formatted.name || "N/A";
      formattedUser.mobile = formatted.mobile || "N/A";
      formattedUser.digitalRole = formatted._position || "";
      formattedUser.gender = formatted.gender;
      formattedUser.profileImages = formatted.profileImages || [];
      formattedUser._userPicType = formatted._userPicType;

      const address = rawData.address;
      if (address) {
        const parts = [
          address.doorNo,
          address.street,
          address.city,
          address.state,
        ].filter(Boolean);
        formattedUser.addressStr = parts.length > 0 ? parts.join(", ") : "N/A";
        formattedUser.location = address.postcode
          ? `PIN: ${address.postcode}`
          : "";
      } else {
        formattedUser.addressStr = "N/A";
      }
    } else if (type === "B2C") {
      formattedUser.name = rawData.name || "N/A";
      formattedUser.mobile = rawData.mobile || "N/A";

      const address = rawData.address;
      if (address) {
        const parts = [
          address.addressLine1,
          address.addressLine2,
          address.city,
          address.state,
        ].filter(Boolean);
        formattedUser.addressStr = parts.length > 0 ? parts.join(", ") : "N/A";
        formattedUser.location = address.pincode
          ? `PIN: ${address.pincode}`
          : "";
      } else if (rawData.formattedAddress) {
        formattedUser.addressStr = rawData.formattedAddress;
      } else {
        formattedUser.addressStr = "N/A";
      }
    } else {
      formattedUser.name = rawData.name || rawData.shopName || "N/A";
      formattedUser.mobile = rawData.mobile || rawData.phoneNumber || "N/A";

      const addressParts = [
        rawData.city,
        rawData.town,
        rawData.district,
        rawData.state,
      ].filter(Boolean);
      formattedUser.addressStr =
        addressParts.length > 0 ? addressParts.join(", ") : "N/A";
      formattedUser.location = rawData.pincode ? `PIN: ${rawData.pincode}` : "";
    }

    return formattedUser;
  };

  // Fetch user details
  const fetchUserDetails = useCallback(async () => {
    if (!userId || !show) return;

    try {
      setLoadingUser(true);
      let response;

      if (userType === "Employee") {
        response = await UserService.getUser(userId);
      } else if (userType === "B2C") {
        response = await CustomerService.getCustomer(userId);
      } else {
        response = await FranchiseService.getFranchise(userId);
      }

      const rawUserData = response?.data?.data;
      const formattedUserData = formatUserData(rawUserData, userType);
      setUserInfo(formattedUserData);
    } catch (error) {
      console.error("Error fetching user details:", error);
      appToast.show({
        msg: t("failedToLoadUserDetails"),
        color: "danger",
      });
      setUserInfo(null);
    } finally {
      setLoadingUser(false);
    }
  }, [userId, userType, show]);

  // Fetch all routes for employee multi-select
  useEffect(() => {
    if (!show || userType !== "Employee") return;
    const fetchAllRoutes = async () => {
      setLoadingRoutes(true);
      try {
        const resp = await DeliveryRoutesService.getRoutesList({
          page: 1,
          limit: 100,
          filter: { isActive: true },
        });
        setAllRoutes(resp?.data?.data || []);
      } catch {
        setAllRoutes([]);
      }
      setLoadingRoutes(false);
    };
    fetchAllRoutes();
  }, [show, userType]);

  // Initialize modal
  useEffect(() => {
    if (show) {
      setSelectedRouteId("");
      setSelectedRoutes([...linkedRoutes]);
      fetchUserDetails();
    } else {
      setUserInfo(null);
      setSelectedRouteId("");
      setSelectedRoutes([]);
    }
  }, [show, fetchUserDetails]);

  // Fetch active routes count to determine if config prompt should be shown
  useEffect(() => {
    if (!show) return;

    const fetchCount = async () => {
      try {
        setLoadingRoutesCount(true);
        const resp: any = await DeliveryRoutesService.getRoutesCount({
          filter: { isActive: true },
        });
        const data = resp?.data?.data;
        const count = typeof data === "number" ? data : (data?.count ?? 0);
        setRoutesCount(count);
      } catch (e) {
        console.error("Failed to fetch routes count", e);
        setRoutesCount(0);
      } finally {
        setLoadingRoutesCount(false);
      }
    };

    void fetchCount();
  }, [show]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const handleRouteToggle = useCallback((route: any, checked: boolean) => {
    if (checked) {
      setSelectedRoutes((prev) => [
        ...prev,
        {
          routeId: route._id,
          routeCode: route.routeCode || route.routeName,
          description: route.description || "",
        },
      ]);
    } else {
      setSelectedRoutes((prev) => prev.filter((r) => r.routeId !== route._id));
    }
  }, []);

  const handleSubmit = async () => {
    if (userType === "Employee") {
      if (selectedRoutes.length === 0) {
        appToast.show({ msg: t("pleaseSelectRoute"), color: "warning" });
        return;
      }
    } else if (!selectedRouteId) {
      appToast.show({
        msg: t("pleaseSelectRoute"),
        color: "warning",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Employee multi-route flow
      if (userType === "Employee" && feature !== "order") {
        const referenceType = "Manpower";
        const currentIds = new Set(linkedRoutes.map((r) => r.routeId));

        // Link newly added routes
        const toLink = selectedRoutes.filter((r) => !currentIds.has(r.routeId));
        for (const route of toLink) {
          const linkResp: any = await DeliveryRoutesService.linkRoute({
            referenceId: userId,
            routeId: route.routeId,
            referenceType,
          });
          if (
            !linkResp ||
            linkResp.statusCode < 200 ||
            linkResp.statusCode >= 300
          ) {
            const errMsg = linkResp?.data?.message || t("failedToAssignRoute");
            appToast.show({ msg: errMsg, color: "danger" });
            return;
          }
        }

        appToast.show({
          msg: t("routeAssignedSuccessfully"),
          color: "success",
        });
        callback({
          action: "success",
          data: { routes: selectedRoutes },
        });
        return;
      }

      if (feature === "order") {
        if (!orderIds || orderIds.length === 0) {
          appToast.show({ msg: t("noOrdersSelected"), color: "warning" });
          return;
        }

        const payload = {
          orders: orderIds.map((orderId) => ({
            orderId,
            routeId: selectedRouteId,
            deliveryDate: formatDate(
              getNextWeekday(selectedDay, new Date()),
              "yyyy-MM-dd",
            ),
            forceUpdate: true,
          })),
        };

        const resp: any =
          await DeliveryRoutesService.updateOrdersRouteBulk(payload);

        if (!resp || resp.statusCode < 200 || resp.statusCode >= 300) {
          const errMsg = resp?.data?.message || t("failedToAssignRoute");
          appToast.show({ msg: errMsg, color: "danger" });
          return;
        }

        appToast.show({
          msg: t("routeAssignedSuccessfully"),
          color: "success",
        });
        callback({ action: "success", data: payload });
        return;
      }

      const referenceType =
        userType === "Employee"
          ? "Manpower"
          : userType === "B2B"
            ? "Franchise"
            : "Customer";
      const payload = {
        referenceId: userId,
        routeId: selectedRouteId,
        referenceType,
      };

      // Unlink existing routes before assigning new one
      const routesToUnlink =
        userType === "Employee" && linkedRoutes.length > 0
          ? linkedRoutes
              .filter((r) => r.routeId !== selectedRouteId)
              .map((r) => r.routeId)
          : currentRouteId && currentRouteId !== selectedRouteId
            ? [currentRouteId]
            : [];

      for (const routeId of routesToUnlink) {
        try {
          const unlinkPayload = {
            referenceType,
            referenceId: userId,
            routeId,
          };

          const unlinkResp: any =
            await DeliveryRoutesService.unlinkRoute(unlinkPayload);

          if (
            !unlinkResp ||
            unlinkResp.statusCode < 200 ||
            unlinkResp.statusCode >= 300
          ) {
            const errMsg =
              unlinkResp?.data?.message || t("failedToAssignRoute");
            appToast.show({ msg: errMsg, color: "danger" });
            return;
          }
        } catch (err) {
          console.error("Error unlinking existing route:", err);
          appToast.show({ msg: t("failedToAssignRoute"), color: "danger" });
          return;
        }
      }

      const resp: any = await DeliveryRoutesService.linkRoute(payload);

      if (!resp || resp.statusCode < 200 || resp.statusCode >= 300) {
        const errMsg = resp?.data?.message || t("failedToAssignRoute");
        appToast.show({ msg: errMsg, color: "danger" });
        return;
      }

      appToast.show({
        msg: t("routeAssignedSuccessfully"),
        color: "success",
      });

      callback({ action: "success", data: payload });
    } catch (error: any) {
      console.error("Error assigning route:", error);
      appToast.show({
        msg:
          error?.response?.data?.message ||
          error?.data?.message ||
          error?.message ||
          t("failedToAssignRoute"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRouteSelect = (payload: { action: string; data: any }) => {
    if (payload.action === "select") {
      setSelectedRouteId(payload.data._id);
      setSelectedDay(payload.data.deliveryDays[0]);
    }
  };

  return (
    <AppModal show={show} callback={callback} backdropDismiss={!submitting}>
      <AppModal.Title onClose={onClose}>
        <span className="tw:text-base tw:font-semibold tw:text-gray-900">
          {userType === "Employee"
            ? `Assign Route for ${userInfo?.digitalRole || "Employee"}`
            : "Assign Route for the B2B Customer"}
        </span>
      </AppModal.Title>

      <AppModal.Content className="tw:space-y-6 tw:py-4">
        {/* User Information Section */}
        <div className="tw:bg-blue-50/40 tw:border tw:border-blue-100/60 tw:rounded-lg tw:p-3 tw:mb-4">
          {loadingUser ? (
            <div className="tw:flex tw:items-start tw:gap-3 tw:animate-pulse">
              <div className="tw:h-10 tw:w-10 tw:bg-gray-200 tw:rounded-full tw:shrink-0"></div>
              <div className="tw:space-y-2 tw:flex-1">
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-full"></div>
              </div>
            </div>
          ) : userInfo ? (
            <>
              <div className="tw:mb-2 tw:text-xs">
                {userType === "Employee"
                  ? "Staff Information"
                  : "B2B Customer Information"}
              </div>
              <div className="tw:flex tw:items-start tw:gap-3">
                {userType === "Employee" ? (
                  <UserPic
                    assetId={userInfo.profileImages?.[0]}
                    gender={userInfo.gender}
                    type={userInfo._userPicType}
                    className="tw:h-9 tw:w-9 tw:rounded-full tw:border tw:border-blue-100 tw:shrink-0 tw:shadow-sm"
                  />
                ) : (
                  <div className="tw:h-9 tw:w-9 tw:bg-white tw:border tw:border-blue-100 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shrink-0 tw:text-blue-500 tw:shadow-sm">
                    {userType === "B2B" ? (
                      <Store className="tw:h-4 tw:w-4" />
                    ) : (
                      <User className="tw:h-4 tw:w-4" />
                    )}
                  </div>
                )}
                <div className="tw:flex tw:flex-col tw:gap-1.5 tw:flex-1">
                  <div className="tw:flex tw:items-start tw:justify-between tw:flex-wrap tw:gap-2">
                    <div>
                      <span className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-none">
                        {userInfo.name}
                      </span>

                      <div className="tw:text-[11px] tw:text-gray-500 tw:mt-0.5">
                        {userInfo.id}
                      </div>
                    </div>

                    <div className="tw:flex tw:items-center tw:gap-1 tw:bg-white tw:px-1.5 tw:py-0.5 tw:rounded tw:border tw:border-gray-100 tw:shadow-sm">
                      <Phone className="tw:h-3 tw:w-3 tw:text-blue-500" />
                      <span className="tw:text-[11px] tw:font-medium tw:text-gray-600">
                        {userInfo.mobile}
                      </span>
                    </div>
                  </div>

                  <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-start tw:gap-1.5">
                    <MapPin className="tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:mt-0.5 tw:text-gray-400" />
                    <span className="tw:leading-snug">
                      {userInfo.addressStr}
                      {userInfo.location ? `, ${userInfo.location}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="tw:text-sm tw:text-center tw:text-gray-500 tw:py-2">
              {t("noUserInfoAvailable")}
            </div>
          )}
        </div>

        {/* Route Selection Section */}
        {(routesCount === null || routesCount > 0) && (
          <div className="tw:space-y-3">
            <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
              <span className="tw:text-sm tw:font-bold tw:text-gray-700">
                {t("selectRoute")}
              </span>
              {userType === "Employee"
                ? selectedRoutes.length > 0 && (
                    <span className="tw:text-xs tw:font-medium tw:text-blue-600 tw:flex tw:items-center tw:gap-1">
                      <CheckCircle2 className="tw:h-3 tw:w-3" />
                      {selectedRoutes.length} {t("routeSelected")}
                    </span>
                  )
                : selectedRouteId && (
                    <span className="tw:text-xs tw:font-medium tw:text-blue-600 tw:flex tw:items-center tw:gap-1">
                      <CheckCircle2 className="tw:h-3 tw:w-3" />
                      {t("routeSelected")}
                    </span>
                  )}
            </div>

            {userType === "Employee" ? (
              <div className="tw:px-1">
                {loadingRoutes ? (
                  <div className="tw:flex tw:justify-center tw:py-4">
                    <AppSpinner />
                  </div>
                ) : allRoutes.length === 0 ? (
                  <div className="tw:text-gray-500 tw:text-sm">
                    {t("noRoutesFound")}
                  </div>
                ) : (
                  <div className="tw:flex tw:flex-col tw:gap-2 tw:max-h-48 tw:overflow-y-auto tw:mb-4">
                    {allRoutes.map((route) => {
                      const isSelected = selectedRoutes.some(
                        (r) => r.routeId === route._id,
                      );
                      return (
                        <div
                          key={route._id}
                          className="tw:flex tw:items-center tw:gap-3 tw:p-2 tw:border tw:rounded tw:cursor-pointer"
                          onClick={() => handleRouteToggle(route, !isSelected)}
                        >
                          <AppCheckbox
                            value={isSelected}
                            label=""
                            onChange={(checked) =>
                              handleRouteToggle(route, checked)
                            }
                          />
                          <div>
                            <div className="tw:font-medium tw:text-sm">
                              {route.routeCode || route.routeName}
                            </div>
                            {route.description && (
                              <div className="tw:text-xs tw:text-gray-500">
                                {route.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="tw:min-w-0">
                <RoutesSlider
                  selectedId={selectedRouteId}
                  callback={handleRouteSelect}
                  hideAllOption={true}
                  className="tw:px-1 tw:mb-4"
                />
              </div>
            )}

            {userType === "Employee"
              ? selectedRoutes.length === 0 && (
                  <p className="tw:text-[11px] tw:text-gray-400 tw:italic tw:px-1">
                    * {t("pleaseSelectRouteToAssignUser")}
                  </p>
                )
              : !selectedRouteId && (
                  <p className="tw:text-[11px] tw:text-gray-400 tw:italic tw:px-1">
                    * {t("pleaseSelectRouteToAssignUser")}
                  </p>
                )}
          </div>
        )}

        {/* Info note */}
        {(routesCount === null || routesCount > 0) && (
          <div className="tw:bg-blue-50/50 tw:border tw:border-blue-100 tw:rounded-lg tw:p-3 tw:text-xs tw:text-blue-700/80 tw:flex tw:gap-2.5 tw:items-start">
            <CheckCircle2 className="tw:h-4 tw:w-4 tw:shrink-0 tw:mt-0.5 tw:text-blue-500" />
            <p className="tw:leading-relaxed">
              {t("assigningUserToRouteWillUpdateTheirDeliveryPreference")}
            </p>
          </div>
        )}

        {/* No active routes config block */}
        {routesCount === 0 && !loadingRoutesCount && (
          <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-md tw:p-2.5">
            <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:gap-3 tw:sm:gap-2">
              <div className="tw:h-5 tw:w-5 tw:rounded-full tw:bg-amber-100 tw:flex tw:items-center tw:justify-center tw:shrink-0 tw:text-amber-600 tw:text-xs tw:font-bold tw:mt-0.5 tw:sm:mt-0">
                !
              </div>
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:text-xs tw:font-semibold tw:text-gray-800">
                  No active delivery routes configured
                </div>
                <div className="tw:text-[11px] tw:text-gray-600 tw:mt-0.5 tw:leading-snug">
                  Create routes in Delivery Routes to assign them.
                </div>
              </div>
              <AppButton
                onClick={() => {
                  callback({ action: "close" });
                  const t = setTimeout(() => {
                    clearTimeout(t);
                    appNav.to("/configs/settings/delivery-routes");
                  }, 500);
                }}
                color="primary"
                fill="solid"
                size="small"
                className="tw:shrink-0 tw:text-xs tw:h-7 tw:px-2 tw:w-full tw:sm:w-auto"
              >
                Configure Now
              </AppButton>
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:flex tw:gap-3 tw:p-4 tw:bg-gray-50/50">
        <AppButton
          fill="outline"
          onClick={onClose}
          disabled={submitting}
          className="tw:flex-1 tw:border-gray-200"
        >
          {t("cancel")}
        </AppButton>
        {(routesCount === null || routesCount > 0) && (
          <AppButton
            onClick={handleSubmit}
            disabled={
              (userType === "Employee"
                ? selectedRoutes.length === 0
                : !selectedRouteId) || submitting
            }
            isLoading={submitting}
            className="tw:flex-[1.5]"
            color="primary"
          >
            {t("assignRoute")}
          </AppButton>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default AssignRouteModal;
