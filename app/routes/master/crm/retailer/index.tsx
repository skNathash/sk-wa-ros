import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import NoData from "~/components/core/no-data/NoData";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import Activity from "./components/activity/Activity";
import FollowUpHistory from "./components/activity/FollowUpHistory";
import NextFollowUp from "./components/activity/NextFollowUp";
import StoreSnapshot from "./components/StoreSnapshot";
import FollowUpDetailsModal from "../modals/FollowUpDetailsModal";
import UpdateFollowUpModal from "../modals/UpdateFollowUpModal";
import { getFranchise } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/auth/master/stores",
    },
    langKey: "dashboard",
  },
  {
    label: "CRM",
    redirect: {
      path: "/master/crm/dashboard",
    },
  },
  { label: "Retailer Overview" },
];

const RetailerView = () => {
  const [searchParams] = useSearchParams();
  const franchiseId = searchParams.get("id") || "";
  // Optional deep-linked scope (from the employee page's count links), used to
  // open the activity feed pre-filtered to one employee's follow-ups in a given
  // status. The name only labels the filter chip.
  const initialStatus = searchParams.get("status") || "";
  const employeeRefId = searchParams.get("employeeId") || "";
  const employeeName = searchParams.get("employeeName") || "";

  const [franchise, setFranchise] = useState<any | null>(null);
  const [franchiseLoading, setFranchiseLoading] = useState(false);

  // Shared activity state, lifted here so the timeline (Activity) and the rail
  // (NextFollowUp + FollowUpHistory) stay in sync.
  //
  // The retailer's current open follow-up, reported up by NextFollowUp's own
  // API call; consumed by Activity's "Log activity" button. `undefined` while
  // it's still resolving.
  const [openFollowUp, setOpenFollowUp] = useState<any | null | undefined>(
    undefined,
  );
  // Bumped after any mutation (from the timeline or the rail) to force the
  // timeline and both rail cards to re-fetch.
  const [reloadKey, setReloadKey] = useState(0);
  const refreshAll = useCallback(() => setReloadKey((k) => k + 1), []);

  // Shared update / details modals, opened from either a timeline row or the
  // rail's open follow-up card.
  const [detailsModal, setDetailsModal] = useState<{
    show: boolean;
    followup: any | null;
  }>({ show: false, followup: null });
  const [updateModal, setUpdateModal] = useState<{
    show: boolean;
    followup: any | null;
  }>({ show: false, followup: null });

  // Updating / closing a follow-up is a master-only action; everyone else is
  // told why on click instead of silently getting a modal they can't submit.
  const canUpdateFollowUp = AuthService.isMasterLogin();
  const appToast = useAppToast();

  const openUpdate = useCallback(
    (followup: any) => {
      if (!canUpdateFollowUp) {
        appToast.show({
          msg: "Only master users can update or close a follow-up",
          color: "danger",
        });
        return;
      }
      setUpdateModal({ show: true, followup });
    },
    [canUpdateFollowUp, appToast],
  );

  const openDetails = useCallback((followup: any) => {
    setDetailsModal({ show: true, followup });
  }, []);

  const handleDetailsModal = useCallback(
    (payload: { action: string; data?: any }) => {
      setDetailsModal((prev) => ({ ...prev, show: false }));
      if (payload.action === "update") {
        openUpdate(payload.data ?? null);
      }
    },
    [openUpdate],
  );

  const handleUpdateModal = useCallback(
    (payload: { action: string }) => {
      setUpdateModal((prev) => ({ ...prev, show: false }));
      if (payload.action === "updated" || payload.action === "closed") {
        refreshAll();
      }
    },
    [refreshAll],
  );

  // Load the franchise details whenever the id changes.
  useEffect(() => {
    if (!franchiseId) {
      setFranchise(null);
      return;
    }
    let active = true;
    setFranchiseLoading(true);
    (async () => {
      try {
        const result = await getFranchise(franchiseId);
        if (active) setFranchise(result);
      } catch (e) {
        if (active) setFranchise(null);
      } finally {
        if (active) setFranchiseLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [franchiseId]);

  // No retailer to show — either the id is missing or the lookup failed.
  const noFranchise = !franchiseId || (!franchiseLoading && !franchise);

  return (
    <>
      <AppSimpleHeader title="Retailer Overview" />
      <div className="app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          {noFranchise ? (
            <AppCard className="tw:mt-4">
              <NoData
                title="Retailer not found"
                description="We couldn't load this retailer. Please check the link and try again."
              />
            </AppCard>
          ) : (
            <>
              <StoreSnapshot
                franchise={franchise}
                loading={franchiseLoading}
                className="tw:mt-4 tw:mb-4"
              />

              <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-3">
                {/* Timeline */}
                <Activity
                  fid={franchiseId}
                  initialStatus={initialStatus}
                  employeeRefId={employeeRefId}
                  employeeName={employeeName}
                  openFollowUp={openFollowUp}
                  reloadKey={reloadKey}
                  onOpenUpdate={openUpdate}
                  onOpenDetails={openDetails}
                  onMutated={refreshAll}
                  className="tw:lg:col-span-2"
                />

                {/* Rail: open follow-up + history. */}
                <div className="tw:flex tw:flex-col tw:gap-4">
                  <NextFollowUp
                    fid={franchiseId}
                    reloadKey={reloadKey}
                    onLoaded={setOpenFollowUp}
                    onUpdate={openUpdate}
                    onDetails={openDetails}
                  />
                  <FollowUpHistory
                    fid={franchiseId}
                    reloadKey={reloadKey}
                    onView={openDetails}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <FollowUpDetailsModal
        show={detailsModal.show}
        followup={detailsModal.followup}
        callback={handleDetailsModal}
      />

      <UpdateFollowUpModal
        show={updateModal.show}
        followup={updateModal.followup}
        callback={handleUpdateModal}
      />
    </>
  );
};

export default RetailerView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Retailer Overview"),
    },
  ];
}
