import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Pencil } from "lucide-react";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CouponService from "~/services/CouponService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import AppTab from "~/components/core/tab/AppTab";
import RemarksModal from "~/modals/feature/remarks/RemarksModal";
import CouponAuditLogs from "./components/audit-logs/CouponAuditLogs";
import CouponDetails from "./components/CouponDetails";
import { getCoupon } from "./helper";

const CouponViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appNav = useAppNav();
  const appToast = useAppToast();
  const [coupon, setCoupon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showStatusRemarks, setShowStatusRemarks] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { label: "Dashboard", redirect: { path: "/dashboard" } },
      {
        label: "Coupon Configuration List",
        redirect: { path: "/configs/coupon" },
      },
      { label: "View Coupon" },
    ],
    [],
  );

  const tabs: TabItem[] = [
    { name: "Details", key: "details" },
    { name: "Audit Logs", key: "audit_log" },
  ];

  const couponStatus = (coupon?.status || "").toLowerCase();
  const isCouponLocked =
    couponStatus === "running" || couponStatus === "completed";

  useEffect(() => {
    if (id) {
      fetchCoupon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCoupon = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await getCoupon(id);
      setCoupon(data);
    } catch (error) {
      console.error("Error fetching coupon details:", error);
      appToast.show({ msg: "Failed to fetch coupon details", color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (isActive: boolean, remarks: string) => {
    if (!id || isStatusUpdating) return;

    // Skip the call if it's already in the requested state
    if (coupon?.isActive === isActive) return;

    try {
      setIsStatusUpdating(true);
      const response = await CouponService.updateCouponStatus(id, {
        isActive,
        remarks,
      });

      if (response?.statusCode === 200) {
        setCoupon((prev: any) => ({ ...prev, isActive }));
        appToast.show({
          msg: `Coupon marked as ${isActive ? "Active" : "Inactive"}`,
          color: "success",
        });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to update coupon status",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error updating coupon status:", error);
      appToast.show({ msg: "Failed to update coupon status", color: "danger" });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <div>
      <AppHeader title="View Coupon" />
      <div className="tw:p-4">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-3 tw:mb-4">
          <AppBreadcrumbs data={breadcrumbs} />
          {coupon && (
            <div className="tw:flex tw:gap-2">
              {/* Running/completed coupons are live or finished, so their terms
                  can no longer be changed — hide the edit action for them. */}
              {!isCouponLocked && (
                <AppButton
                  size="small"
                  onClick={() => appNav.to("/configs/coupon/manage", { id })}
                  className="tw:flex tw:items-center tw:gap-2"
                >
                  <Pencil className="tw:w-4 tw:h-4" />
                  Edit Coupon
                </AppButton>
              )}

              <AppButton
                size="small"
                color={coupon.isActive ? "danger" : "success"}
                isLoading={isStatusUpdating}
                disabled={isStatusUpdating}
                onClick={() => setShowStatusRemarks(true)}
                className="tw:flex tw:items-center tw:gap-2"
              >
                {coupon.isActive ? "Inactive" : "Active"}
              </AppButton>
            </div>
          )}
        </div>

        <AppTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab.key)}
          className="tw:mb-4"
        />

        {isLoading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
            <AppSpinner />
          </div>
        ) : !coupon ? (
          <NoData />
        ) : activeTab === "audit_log" ? (
          <CouponAuditLogs coupon={coupon} />
        ) : (
          <CouponDetails coupon={coupon} />
        )}
      </div>

      <RemarksModal
        show={showStatusRemarks}
        title={`${coupon?.isActive ? "Inactivate" : "Activate"} Coupon`}
        callback={({ action, remarks }) => {
          setShowStatusRemarks(false);
          if (action === "submit") {
            handleStatusChange(!coupon?.isActive, remarks || "");
          }
        }}
      />
    </div>
  );
};

export default CouponViewPage;

export function meta() {
  return [{ title: "View Coupon" }];
}
