import { CheckCircle, Plus, SlidersHorizontal, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ImgRender from "~/components/core/img/ImgRender";
import DocumentDisplayItem from "~/routes/dashboard/paylater/request/components/DocumentDisplayItem";
import PaylaterService from "~/services/PaylaterService";
import PaylaterPane from "~/shared/accounts/components/paylater/paylater-pane/PaylaterPane";
import PaylaterManageWalletModal from "~/shared/accounts/modals/paylater/manage-wallet/PaylaterManageWalletModal";
import PaylaterReviewRequestModal from "~/shared/accounts/paylater/modals/review-request/PaylaterReviewRequestModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import DocumentsUploadModal from "~/shared/others/modals/documents-upload/DocumentsUploadModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AuditLog from "./components/AuditLog";
import BuyerScorecard from "./components/BuyerScorecard";
import BuyerSummary from "./components/BuyerSummary";
import DocumentItem from "./components/DocumentItem";
import PendingRequestBanner from "./components/PendingRequestBanner";
import RecentOrders from "./components/RecentOrders";
import { getRequest } from "./helper";
import ApproveModal from "./modals/ApproveModal";
import RejectModal from "./modals/RejectModal";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Paylater",
    redirect: { path: "/dashboard/paylater/analytics?tab=analytics" },
  },
  {
    label: "View Request",
  },
];

type Document = {
  id: string;
  documentType: string;
  referenceNo: string;
  frontImage: string;
  backImage?: string;
  type: string;
};

const PaylaterRequestViewPage = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const toast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);

  const [approveModal, setApproveModal] = useState({ show: false });
  const [rejectModal, setRejectModal] = useState({ show: false });
  const [reviewModal, setReviewModal] = useState({ show: false });
  const [manageModal, setManageModal] = useState<{ show: boolean }>({
    show: false,
  });
  const [newDocuments, setNewDocuments] = useState<Document[]>([]);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [updating, setUpdating] = useState(false);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const data = await getRequest(id || "");
      setRequest(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleApproveModalCallback = (a: { action: string; data?: any }) => {
    setApproveModal({ show: false });
    if (a.action === "submit") {
      fetchRequest();
      setNewDocuments([]);
    }
  };
  const handleRejectModalCallback = (a: { action: string; data?: any }) => {
    setRejectModal({ show: false });
    if (a.action === "submit") {
      fetchRequest();
      setNewDocuments([]);
    }
  };

  // The guided review lands the same approve/reject the footer buttons do, so a
  // decision there refreshes the request the page is showing.
  const handleReviewModalCallback = (a: { action: string; data?: any }) => {
    setReviewModal({ show: false });
    if (a.action === "submit") {
      fetchRequest();
      setNewDocuments([]);
    }
  };

  const handleDocumentsModalCallback = (data: any) => {
    if (data?.action === "submit" && data?.data) {
      handleAddDocument(data.data);
      setShowDocumentsModal(false);
    } else if (data?.action === "close") {
      setShowDocumentsModal(false);
    }
  };

  const handleAddDocument = (documentData: {
    documentType: string;
    referenceNo: string;
    frontImage: string;
    backImage?: string;
  }) => {
    const document: Document = {
      id: documentData.referenceNo,
      documentType: documentData.documentType,
      referenceNo: documentData.referenceNo,
      frontImage: documentData.frontImage,
      backImage: documentData.backImage,
      type: documentData.documentType,
    };
    setNewDocuments((prev) => [...prev, document]);
  };

  const handleRemoveDocument = (index: number) => {
    setNewDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const prepareUpdatePayload = () => {
    // Build otherDocuments array with format [{id, frontImage, backImage, type}]
    const otherDocuments: any[] = [];

    // Include existing documents from request
    if (
      Array.isArray(request?.otherDocuments) &&
      request.otherDocuments.length > 0
    ) {
      for (const doc of request.otherDocuments) {
        if (doc && doc.id && doc.frontImage) {
          otherDocuments.push({
            id: doc.id,
            frontImage: doc.frontImage || "",
            backImage: doc.backImage || "",
            type: doc.type || "",
          });
        }
      }
    }

    // Include newly added documents
    if (Array.isArray(newDocuments) && newDocuments.length > 0) {
      for (const doc of newDocuments) {
        if (doc && doc.referenceNo && doc.frontImage) {
          otherDocuments.push({
            id: doc.id || doc.referenceNo,
            frontImage: doc.frontImage,
            backImage: doc.backImage || "",
            type: doc.type || doc.documentType,
          });
        }
      }
    }

    return {
      otherDocuments,
    };
  };

  const handleUpdateDocuments = async () => {
    if (newDocuments.length === 0) {
      return true;
    }

    setUpdating(true);
    try {
      const payload = prepareUpdatePayload();
      const resp: any = await PaylaterService.updateRequest(id || "", payload);

      if (resp?.statusCode === 200) {
        toast.show({
          msg: "Documents updated successfully",
          color: "success",
        });
        await fetchRequest();
        setNewDocuments([]);
        return true;
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update documents",
          color: "error",
        });
        return false;
      }
    } catch (error) {
      console.error("Update documents error:", error);
      toast.show({
        msg: "Failed to update documents",
        color: "error",
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (newDocuments.length > 0) {
      setPendingAction("approve");
      const success = await handleUpdateDocuments();
      if (success) {
        setApproveModal({ show: true });
        setPendingAction(null);
      } else {
        setPendingAction(null);
      }
    } else {
      setApproveModal({ show: true });
    }
  };

  const handleReject = async () => {
    if (newDocuments.length > 0) {
      setPendingAction("reject");
      const success = await handleUpdateDocuments();
      if (success) {
        setRejectModal({ show: true });
        setPendingAction(null);
      } else {
        setPendingAction(null);
      }
    } else {
      setRejectModal({ show: true });
    }
  };

  const handleManageModalCallback = (a: { action: string; data?: any }) => {
    setManageModal({ show: false });
    if (a.action === "submit" || a.action === "close") {
      fetchRequest();
    }
  };

  // Normalize nominees to always be an array
  const nominees = Array.isArray(request?.NomineeDetails)
    ? request.NomineeDetails
    : request?.NomineeDetails
      ? [request.NomineeDetails]
      : [];

  const renderManageWalletButton = () => {
    return (
      <Rbac roles={["ACCOUNTS.PAYLATER-MANAGE-LIMIT"]}>
        <AppButton
          onClick={() => setManageModal({ show: true })}
          color="primary"
          className="tw:w-full tw:md:w-auto"
        >
          <SlidersHorizontal />
          Manage Wallet
        </AppButton>
      </Rbac>
    );
  };

  return (
    <>
      <AppHeader
        title="View Paylater Request"
        sectionKey="business"
        activeTab="paylater"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — same section side menu the PayLater
                layout carries, so the request view keeps its place in the
                section rather than reading as a detached page. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="paylater"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column spans the full grid — in theme-2 desktop the CSS
                    lifts the side pane out of it into the fixed list rail. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-end tw:md:justify-between tw:md:mb-2">
                    <AppBreadcrumbs data={breadcrumbs} />

                    {request && request?._canManage && !isMobile ? (
                      <div className="tw:flex tw:items-center tw:gap-2">
                        {renderManageWalletButton()}
                      </div>
                    ) : null}
                  </div>
                  {loading ? (
                    <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                      <AppSpinner />
                    </div>
                  ) : null}

                  {!loading && !request ? <NoData /> : null}

                  {!loading && request ? (
                    <>
                      {/* Who the request is for. */}
                      <BuyerSummary request={request} />

                      {/* The ask, while it is still undecided. */}
                      {request?.status === "Pending" ? (
                        <PendingRequestBanner
                          request={request}
                          onReview={() => setReviewModal({ show: true })}
                        />
                      ) : null}

                      {/* What the buyer is worth — spend, cart, fill rate, repayment. */}
                      <BuyerScorecard buyerId={request?.userInfo?.id || ""} />

                      {/* What the wallet has actually funded. */}
                      <RecentOrders buyerId={request?.userInfo?.id || ""} />

                      {request?.status === "Rejected" &&
                      request?.rejectionReason ? (
                        <InfoBlock
                          variant="danger"
                          className="tw:mb-4"
                          size="sm"
                        >
                          <div className="tw:flex tw:items-start tw:gap-2">
                            <XCircle size={16} className="tw:mt-1" />
                            <div>
                              <div className="tw:font-semibold">
                                Rejected Reason:
                              </div>
                              <div className="tw:mt-1">
                                &quot;{request?.rejectionReason}&quot;
                              </div>
                            </div>
                          </div>
                        </InfoBlock>
                      ) : null}

                      <AppCard>
                        <div className="tw:text-base tw:font-semibold tw:mb-4">
                          Request Details
                        </div>
                        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
                          <KeyValue label="Request ID" size="sm">
                            {request?.refId}
                          </KeyValue>

                          <KeyValue label="Status" size="sm">
                            <AppBadge
                              variant={
                                request?.status === "Approved"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {request?.status}
                            </AppBadge>
                          </KeyValue>

                          <KeyValue label="KYC Status" size="sm">
                            <AppBadge
                              variant={request?.kycStatusColor || "default"}
                            >
                              {request?.kycStatus}
                            </AppBadge>
                          </KeyValue>

                          <KeyValue label="Request Date" size="sm">
                            <DateFormat
                              value={request?.createdAt}
                              formatStr="dd MMM yyyy"
                            />
                            <DateFormat
                              value={request?.createdAt}
                              formatStr="hh:mm a"
                              className="tw:text-xs tw:text-gray-500 tw:ml-2"
                            />
                          </KeyValue>

                          <KeyValue label="Updated On" size="sm">
                            <DateFormat
                              value={request?.updatedAt}
                              formatStr="dd MMM yyyy"
                            />
                            <DateFormat
                              value={request?.updatedAt}
                              formatStr="hh:mm a"
                              className="tw:text-xs tw:text-gray-500 tw:ml-2"
                            />
                          </KeyValue>

                          <KeyValue label="Approved Limit" size="sm">
                            {request?.approvedLimit ??
                              request?.creditLimit ??
                              "N/A"}
                          </KeyValue>

                          <KeyValue label="Validity Period" size="sm">
                            {request?.validityPeriod || "N/A"}
                          </KeyValue>

                          {request?.reason ? (
                            <KeyValue label="Reason" size="sm">
                              {request.reason}
                            </KeyValue>
                          ) : null}
                        </div>

                        <Divider />

                        <div>
                          <div>
                            {/* requester details */}
                            <div className="tw:mb-4">
                              <div className="tw:text-base tw:font-semibold">
                                Requester Details
                              </div>
                              <div className="tw:text-xs tw:text-gray-500">
                                Details of the user who requested for paylater
                              </div>
                            </div>

                            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
                              <KeyValue
                                label={
                                  request?.userInfo?.type === "customer"
                                    ? "B2C User"
                                    : "B2B User"
                                }
                                size="sm"
                              >
                                <div className="tw:flex tw:items-center tw:gap-2">
                                  {request?.userInfo?.photo ? (
                                    <ImgRender
                                      assetId={request.userInfo.photo}
                                      alt="User"
                                      className="tw:w-8 tw:h-8 tw:rounded-full tw:object-cover"
                                    />
                                  ) : null}
                                  <span className="tw:font-semibold tw:text-blue-600 tw:flex-1">
                                    {request?.userInfo?.name}
                                  </span>
                                </div>
                              </KeyValue>

                              <KeyValue label="User Mobile" size="sm">
                                {request?.userInfo?.mobile}
                              </KeyValue>

                              {request?.userInfo?.alternatePhone ? (
                                <KeyValue label="Alternate Phone" size="sm">
                                  {request.userInfo.alternatePhone}
                                </KeyValue>
                              ) : null}

                              {request?.userInfo?.email ? (
                                <KeyValue label="Email" size="sm">
                                  {request.userInfo.email}
                                </KeyValue>
                              ) : null}

                              {request?.userInfo?.gender ? (
                                <KeyValue label="Gender" size="sm">
                                  {request.userInfo.gender}
                                </KeyValue>
                              ) : null}

                              {request?.userInfo?.dob ? (
                                <KeyValue label="Date of Birth" size="sm">
                                  <DateFormat
                                    value={request.userInfo.dob}
                                    formatStr="dd MMM yyyy"
                                  />
                                </KeyValue>
                              ) : null}

                              {request?.userInfo?.age ? (
                                <KeyValue label="Age" size="sm">
                                  {request.userInfo.age}
                                </KeyValue>
                              ) : null}

                              {request?.userInfo?.occupation ? (
                                <KeyValue label="Occupation" size="sm">
                                  {request.userInfo.occupation}
                                </KeyValue>
                              ) : null}

                              <KeyValue
                                label="Address"
                                size="sm"
                                className="tw:col-span-2"
                              >
                                {request?.userInfo?._formattedAddress}
                              </KeyValue>

                              {request?.vehicleInfo?.length > 0 ? (
                                <KeyValue
                                  label="Vehicle Info"
                                  size="sm"
                                  className="tw:col-span-2"
                                >
                                  {request.vehicleInfo.map(
                                    (v: any, i: number) => (
                                      <span key={i}>
                                        {v.vehileName || v.vehicleName}
                                        {v.vehicleNo ? ` - ${v.vehicleNo}` : ""}
                                        {i < request.vehicleInfo.length - 1
                                          ? ", "
                                          : ""}
                                      </span>
                                    ),
                                  )}
                                </KeyValue>
                              ) : null}
                            </div>
                            {/* end of requester details */}
                          </div>
                          <div></div>
                        </div>

                        {request?.franchiseInfo?.name ? (
                          <>
                            <Divider />
                            <div className="tw:mb-4">
                              <div className="tw:text-base tw:font-semibold">
                                Franchise Details
                              </div>
                              <div className="tw:text-xs tw:text-gray-500">
                                Details of the franchise who assigned paylater
                              </div>
                            </div>
                            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
                              <KeyValue label="Franchise Name" size="sm">
                                {request.franchiseInfo.name}
                              </KeyValue>
                              {request.franchiseInfo.subType ? (
                                <KeyValue label="Type" size="sm">
                                  {request.franchiseInfo.subType}
                                </KeyValue>
                              ) : null}
                            </div>
                          </>
                        ) : null}

                        <Divider />
                        {/* nominee details */}
                        <div className="tw:mb-4">
                          <div className="tw:text-base tw:font-semibold">
                            Nominee Details
                          </div>
                          <div className="tw:text-xs tw:text-gray-500">
                            Details of the nominee(s) who requested for paylater
                          </div>
                        </div>

                        {nominees.length === 0 ? (
                          <div className="tw:text-center tw:text-gray-500 tw:py-4">
                            No nominee details available
                          </div>
                        ) : (
                          nominees.map((nominee: any, index: number) => (
                            <div
                              key={index}
                              className="tw:grid tw:grid-cols-2 tw:gap-4"
                            >
                              <KeyValue label="Nominee Name" size="sm">
                                {nominee?.name || "N/A"}
                                {nominee?.relationShip && (
                                  <span className="tw:text-xs tw:text-gray-500 tw:uppercase tw:ml-2">
                                    {nominee.relationShip}
                                  </span>
                                )}
                              </KeyValue>

                              <KeyValue label="Nominee Mobile" size="sm">
                                {nominee?.mobile || "N/A"}
                              </KeyValue>
                            </div>
                          ))
                        )}

                        {/* end of nominee details */}

                        <Divider />

                        {/* document details */}
                        <div className="tw:mb-4">
                          <div className="tw:text-base tw:font-semibold">
                            KYC Documents
                          </div>
                          <div className="tw:text-xs tw:text-gray-500">
                            Details of the KYC documents uploaded by the user
                          </div>
                        </div>
                        {request?.status === "Pending" && (
                          <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
                            <div className="tw:flex-1">
                              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                                <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                                  Additional KYC Documents
                                </span>
                              </div>

                              <p className="tw:text-xs tw:text-gray-500">
                                Upload additional KYC documents if needed
                              </p>
                            </div>

                            <Rbac roles={["ACCOUNTS.PAYLATER-REQUEST-REVIEW"]}>
                              <AppButton
                                size="small"
                                color="primary"
                                onClick={() => setShowDocumentsModal(true)}
                                disabled={updating}
                                className="tw:flex-shrink-0"
                              >
                                <Plus size={14} />
                                <span className="tw:ml-1">Add</span>
                              </AppButton>
                            </Rbac>
                          </div>
                        )}

                        {(!request?.otherDocuments ||
                          (Array.isArray(request.otherDocuments) &&
                            request.otherDocuments.length === 0)) &&
                        newDocuments.length === 0 ? (
                          <div className="tw:text-center tw:text-gray-400 tw:text-sm tw:py-6 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-dashed tw:border-gray-200">
                            No additional KYC documents uploaded
                          </div>
                        ) : (
                          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3">
                            {Array.isArray(request?.otherDocuments) &&
                              request.otherDocuments.map(
                                (doc: any, index: number) => (
                                  <DocumentItem
                                    key={doc.id || index}
                                    title={doc.type || "KYC Document"}
                                    front={doc.frontImage || ""}
                                    back={doc.backImage || ""}
                                    refNo={doc.id || ""}
                                  />
                                ),
                              )}
                            {newDocuments.map((doc, index) => (
                              <DocumentDisplayItem
                                key={`new-${index}`}
                                title={doc.documentType}
                                front={doc.frontImage}
                                back={doc.backImage}
                                refNo={doc.referenceNo}
                                onRemove={() => handleRemoveDocument(index)}
                              />
                            ))}
                          </div>
                        )}
                        {/* end of document details */}
                      </AppCard>

                      <AuditLog logs={request?.auditLog} />
                    </>
                  ) : null}
                </AppPaneMain>

                {/* Side column — theme-2 desktop only. The request view reads
                    the same book as the rest of the section, so the pane keeps
                    the section chips, the portfolio health and both approval
                    queues; the period strip and nudge list are dropped, they
                    belong to the analytics landing, not to one request. */}
                <AppPaneSide className="app-pane-only">
                  <PaylaterPane
                    title={t("paylater")}
                    showPeriodSummary={false}
                    showNudgeTargets={false}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      {request && request?._canManage && isMobile ? (
        <div className="app-footer tw:flex tw:justify-end">
          {renderManageWalletButton()}
        </div>
      ) : null}

      {!loading && request && request.status === "Pending" ? (
        <>
          <div className="app-footer">
            <div className="tw:flex tw:justify-end tw:gap-2">
              <Rbac roles={["ACCOUNTS.PAYLATER-REQUEST-REVIEW"]}>
                <AppButton
                  onClick={handleReject}
                  size="default"
                  color="danger"
                  fill="outline"
                  className="tw:font-semibold"
                  disabled={updating}
                  isLoading={updating && pendingAction === "reject"}
                >
                  <XCircle size={14} />
                  Reject Request
                </AppButton>
              </Rbac>
              <Rbac roles={["ACCOUNTS.PAYLATER-REQUEST-REVIEW"]}>
                <AppButton
                  onClick={handleApprove}
                  size="default"
                  color="success"
                  fill="solid"
                  className="tw:font-semibold"
                  disabled={updating}
                  isLoading={updating && pendingAction === "approve"}
                >
                  <CheckCircle size={14} />
                  Approve Request
                </AppButton>
              </Rbac>
            </div>
          </div>
        </>
      ) : null}

      <ApproveModal
        show={approveModal.show}
        callback={handleApproveModalCallback}
        requestId={id || ""}
        userName={request?.userInfo?.name}
      />

      <RejectModal
        show={rejectModal.show}
        callback={handleRejectModalCallback}
        requestId={id || ""}
        userName={request?.userInfo?.name}
      />

      <PaylaterReviewRequestModal
        show={reviewModal.show}
        requestId={id || ""}
        callback={handleReviewModalCallback}
      />

      <PaylaterManageWalletModal
        show={manageModal.show}
        callback={handleManageModalCallback}
        userId={request?.userInfo?.id}
      />

      <DocumentsUploadModal
        show={showDocumentsModal}
        callback={handleDocumentsModalCallback}
        onClose={() => setShowDocumentsModal(false)}
        title="Add KYC Document"
        showSubmitButton={true}
        defaultProofType="photo"
      />
    </>
  );
};

export default PaylaterRequestViewPage;
