import { useEffect, useState } from "react";
import { useParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BasicInfo from "./components/info/BasicInfo";
import ContactInfo from "./components/info/ContactInfo";
import Documents from "./components/info/Documents";
import StoreImages from "./components/info/StoreImages";
import RequestDetails from "./components/RequestDetails";
import JoinRequestSidePane from "./components/side-pane/JoinRequestSidePane";
import RejectModal from "./modals/RejectModal";
import AuthService from "~/services/AuthService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { useTranslation } from "react-i18next";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Join Requests",
    redirect: {
      path: "/dashboard/network/management/joining-request?tab=joining-request",
    },
  },
  { label: "Join Request Details" },
];

const ViewJoinRequest = () => {
  const { show } = useAppToast();
  const { id } = useParams();

  const { t } = useTranslation(["common"]);

  const [joinRequest, setJoinRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [busyLoader, setBusyLoader] = useState<{ show: boolean; msg?: string }>(
    { show: false, msg: "" },
  );
  const [rejectModal, setRejectModal] = useState({ show: false });

  const fetchJoinRequestData = async () => {
    try {
      setLoading(true);

      const reqResp = await FranchiseService.getJoiningRequesFromBuyer({
        filter: {
          _id: id,
        },
      });

      const requestData = reqResp?.data?.data?.requests;
      const requestDetails = requestData?.[0] || null;
      const fid = requestDetails?.sfsellerInfo?.id;

      const response = await FranchiseService.getFranchise(fid);
      const franData = response?.data?.data;

      if (franData?._id) {
        const requestData = {
          ...franData,
          requestMessage: requestDetails?.requestMessage,
          requestId: requestDetails?._id,
          distanceKm: requestDetails?.sfsellerInfo?.details?.distanceKm,
          status: requestDetails?.status,
          _statusLabel: requestDetails?._statusLbl,
          _statusColor: requestDetails?._statusColor,
          responseMessage: requestDetails?.responseMessage,
          requestedOn: requestDetails?.createdAt,
          lastUpdated: requestDetails?.updatedAt,
        };
        setJoinRequest(requestData as any);
      } else {
        setJoinRequest(null);
      }
    } catch (error) {
      console.error("Error fetching join request data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinRequestData();
  }, [id]);

  const confirmApprove = async () => {
    if (AuthService.isMasterLogin()) {
      show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    setConfirmApproveOpen(false);

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!joinRequest?.requestId) return;

    try {
      setBusyLoader({ show: true, msg: "Approving join request..." });
      const resp = await FranchiseService.updateNetworkRequest(
        joinRequest.requestId,
        { status: "Approved", responseMessage: "" },
      );
      const statusCode = (resp as any)?.statusCode;
      if (statusCode !== 200) {
        show({
          msg:
            (resp as any)?.message ||
            "Failed to approve the join request. Please try again.",
          color: "danger",
        });
        setBusyLoader({ show: false, msg: "" });
        return;
      }
      show({ msg: "Join request has been approved.", color: "success" });
      // Re-fetch data to get updated status
      await fetchJoinRequestData();
    } catch (error: any) {
      console.error("Error approving join request:", error);
      show({
        msg: error?.message || "Unable to approve. Please try again.",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleApprove = () => {
    if (AuthService.isMasterLogin()) {
      show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setConfirmApproveOpen(true);
  };

  const handleReject = () => {
    if (AuthService.isMasterLogin()) {
      show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setRejectModal({ show: true });
  };

  return (
    <>
      <AppHeader title="Join Request Details" />
      <div className="page-bg app-page page-padding">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="customers"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:mb-4">
                    <AppBreadcrumbs data={breadcrumbs} />
                    <div className="tw:text-gray-500 tw:text-xs">
                      {loading
                        ? "Loading join request details..."
                        : !joinRequest
                          ? "Join request not found"
                          : "Review and manage join request"}
                    </div>
                  </div>

                  {loading ? (
                    <div className="tw:flex tw:items-center tw:justify-center tw:h-64">
                      <div className="tw:text-gray-500">Loading...</div>
                    </div>
                  ) : !joinRequest ? (
                    <div className="tw:flex tw:items-center tw:justify-center tw:h-64">
                      <div className="tw:text-gray-500">
                        No join request data available
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* <SuspendRequest
                          data={joinRequest}
                          onAction={handleJoinRequestAction}
                        /> */}
                      {/* Request Details Meta */}
                      <RequestDetails data={joinRequest} />

                      {/* Join Request Basic Information */}
                      <BasicInfo data={joinRequest} />

                      {/* Contact Information */}
                      <ContactInfo data={joinRequest} />

                      {/* Store Images and Documents Grid */}
                      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4">
                        <StoreImages
                          images={
                            (joinRequest.shopPhotosDetails as Array<{
                              id?: string;
                              fileUrl?: string;
                            }>) || []
                          }
                        />
                        <Documents
                          documents={
                            joinRequest.documents || {
                              business: [],
                              address: [],
                              photo: [],
                            }
                          }
                        />
                      </div>
                    </>
                  )}
                </AppPaneMain>

                {joinRequest?._id ? (
                  <AppPaneSide className="app-pane-only">
                    <JoinRequestSidePane
                      data={joinRequest}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  </AppPaneSide>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      {joinRequest &&
        (joinRequest.status === "Pending" || !joinRequest.status) && (
          <div className="app-footer tw:px-4 tw:py-3 tw:bg-white tw:border-t tw:flex tw:justify-end tw:gap-2 theme-2-desktop-hide">
            <AppButton
              onClick={handleApprove}
              size="default"
              color="success"
              fill="solid"
              className="tw:min-w-[120px] tw:font-semibold"
            >
              Approve Request
            </AppButton>
            <AppButton
              onClick={handleReject}
              size="default"
              color="danger"
              fill="outline"
              className="tw:min-w-[120px]"
            >
              Reject Request
            </AppButton>
          </div>
        )}
      <AppAlertDialog
        title="Approve Join Request?"
        description="Are you sure you want to approve this join request? After approval, this retailer will be part of the network as a buyer."
        okText="Approve"
        cancelText="Cancel"
        type="confirm"
        show={confirmApproveOpen}
        onConfirm={confirmApprove}
        onCancel={() => setConfirmApproveOpen(false)}
      />
      {rejectModal.show && (
        <RejectModal
          show={rejectModal.show}
          requestId={joinRequest?.requestId as string}
          callback={({ action }) => {
            if (action === "close") {
              setRejectModal({ show: false });
            } else if (action === "rejected") {
              setRejectModal({ show: false });
              fetchJoinRequestData();
            }
          }}
        />
      )}
      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default ViewJoinRequest;
