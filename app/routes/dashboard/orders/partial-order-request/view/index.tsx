import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import OmsService from "~/services/OmsService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import {
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  Phone,
  User,
  ShoppingBag,
  Clock,
  Package,
  Hash,
  Calendar,
  MapPin,
  ChevronLeft,
} from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import Divider from "~/components/core/divider/Divider";
import Amount from "~/components/core/amount/Amount";
import useScreenView from "~/hooks/useScreenView";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { ALERT_DISMISS_TIME } from "~/constants";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import RejectModal from "./modals/RejectModal";

const PartialOrderRequestView = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { isMobile } = useScreenView();
  const { show: showToast } = useAppToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title?: string;
    description?: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({ show: false, successCb: () => {}, cancelCb: () => {} });

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    { label: "Orders", redirect: { path: "/dashboard/orders/list" } },
    {
      label: "Reservation Requests",
      redirect: { path: "/dashboard/orders/partial-order-request/list" },
    },
    { label: "Request Details" },
  ];

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params = {
        filter: {
          $or: [{ requestId: id }, { _id: id }],
        },
      };
      const response = await OmsService.getSplitRequestCustomerList(params);
      const list = response?.data?.data || [];
      if (list.length > 0) {
        const formatted: Record<string, any> =
          OmsService.formatSplitRequestCustomerList(list[0]);
        setData(formatted);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Failed to fetch partial order request", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApprove = () => {
    setAppAlertDialog({
      show: true,
      title: "Approve Request",
      description: `Are you sure you want to approve this reservation request?`,
      successCb: async () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
        await new Promise((res) => setTimeout(res, ALERT_DISMISS_TIME));

        setIsSubmitting(true);
        try {
          const requestId = data.requestId || data._id;
          const resp = await OmsService.approveSplitRequest(requestId);

          if (resp?.statusCode === 200) {
            showToast({
              msg: `Request approved successfully`,
              color: "success",
            });
            fetchData();
          } else {
            showToast({
              msg: resp?.data?.message || `Failed to approve request`,
              color: "danger",
            });
          }
        } catch (e: any) {
          showToast({
            msg: e?.message || `Failed to approve request`,
            color: "danger",
          });
        } finally {
          setIsSubmitting(false);
        }
      },
      cancelCb: () => setAppAlertDialog((p) => ({ ...p, show: false })),
    });
  };

  const handleRejectCallback = ({ action }: { action: string }) => {
    setShowRejectModal(false);
    if (action === "submit") {
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="tw:h-screen tw:flex tw:items-center tw:justify-center">
        <AppSpinner />
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <AppHeader title="Request Details" />
        <div className="app-page page-bg tw:p-4">
          <div className="app-container">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <NoData />
          </div>
        </div>
      </>
    );
  }

  const items = data.splitItems || data.items || [];

  return (
    <>
      <AppHeader title={`Request Details - ${data.requestCode}`} />

      <div className="app-page page-bg tw:p-4 tw:flex-1 tw:pb-24">
        <div className="app-container tw:space-y-6">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:space-y-1">
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                <h1 className="tw:text-base tw:font-medium tw:text-slate-800">
                  Request #{data.requestCode}
                </h1>
                <AppBadge variant={data.statusColor}>{data.status}</AppBadge>
              </div>
            </div>
          </div>

          {data.status === "Rejected" && data.responseRemarks && (
            <div className="tw:mt-3 tw:w-full tw:rounded-md tw:border tw:border-red-200 tw:bg-red-50 tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-start tw:gap-2">
                <MessageSquareWarning className="tw:w-4 tw:h-4 tw:text-red-500 tw:mt-0.5 tw:shrink-0" />
                <div>
                  <span className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-red-700 tw:font-semibold">
                    Rejection Remarks
                  </span>
                  <p className="tw:text-sm tw:text-red-700 tw:mt-1">
                    {data.responseRemarks}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(data.childOrderId || data.childOrderRefNo) && (
            <div className="tw:mt-3 tw:w-full tw:rounded-md tw:border tw:border-emerald-100 tw:bg-emerald-50 tw:px-3 tw:py-1.5">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <ShoppingBag className="tw:w-4 tw:h-4 tw:text-emerald-500" />
                  <span className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-emerald-700 tw:font-semibold">
                    New Order
                  </span>
                </div>
                <span className="tw:hidden sm:tw:inline tw:h-3 tw:w-px tw:bg-emerald-100" />
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <span className="tw:text-[11px] tw:text-emerald-700 tw:font-medium">
                    Order ID
                  </span>
                  <span className="tw:text-[11px] tw:text-emerald-400">•</span>
                  {data.childOrderId ? (
                    <AppLink
                      href={`/dashboard/orders/view/${data.childOrderId}`}
                      asLink
                      showLinkColor
                      className="tw:text-xs tw:font-semibold"
                    >
                      {data.childOrderRefNo || data.childOrderId}
                    </AppLink>
                  ) : (
                    <span className="tw:text-xs tw:font-semibold tw:text-slate-800">
                      {data.childOrderRefNo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Info - Full Width */}
          <AppCard
            title="Order Information"
            icon={<ShoppingBag className="tw:w-5 tw:h-5 tw:text-amber-500" />}
          >
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-6">
              <KeyValue label="Original Order" icon={Hash} size="sm">
                <AppLink
                  href={`/dashboard/orders/view/${data.orderId}`}
                  asLink
                  showLinkColor
                  className="tw:font-bold"
                >
                  {data.orderRefNo || "View Order"}
                </AppLink>
              </KeyValue>
              <KeyValue label="Ordered Date" icon={Calendar} size="sm">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <DateFormat value={data.orderedOn} formatStr="dd MMM yyyy" />
                  <span className="tw:text-xs tw:text-slate-500">
                    <DateFormat value={data.orderedOn} formatStr="hh:mm a" />
                  </span>
                </div>
              </KeyValue>
              {data.createdAt && (
                <KeyValue label="Requested On" icon={Clock} size="sm">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <DateFormat
                      value={data.createdAt}
                      formatStr="dd MMM yyyy"
                    />
                    <span className="tw:text-xs tw:text-slate-500">
                      <DateFormat value={data.createdAt} formatStr="hh:mm a" />
                    </span>
                  </div>
                </KeyValue>
              )}
              {data.expectedShipping && (
                <KeyValue label="Expected Shipping" icon={Calendar} size="sm">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <DateFormat
                      value={data.expectedShipping}
                      formatStr="dd MMM yyyy"
                    />
                    <span className="tw:text-xs tw:text-slate-500">
                      <DateFormat
                        value={data.expectedShipping}
                        formatStr="hh:mm a"
                      />
                    </span>
                  </div>
                </KeyValue>
              )}
            </div>
          </AppCard>

          {/* Customer & Seller Grid */}
          <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-6">
            {/* Customer Info */}
            <AppCard
              title="Customer Details"
              icon={<User className="tw:w-5 tw:h-5 tw:text-blue-500" />}
              className="tw:mb-0"
            >
              <div className="tw:space-y-4">
                <div>
                  <AppLink
                    href={`/dashboard/network/view/b2b/${data.customerInfo?.customerId}`}
                    asLink
                    showLinkColor
                    className="tw:text-sm tw:font-bold tw:block tw:mb-1"
                  >
                    {data.customerInfo?.name || "N/A"}
                  </AppLink>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
                      <Hash size={12} />
                      {data.customerInfo?.refId || "N/A"}
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
                      <Phone size={12} />
                      {data.customerInfo?.mobile || "N/A"}
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="tw:flex tw:items-start tw:gap-2">
                  <MapPin className="tw:w-4 tw:h-4 tw:text-slate-400 tw:mt-1 tw:shrink-0" />
                  <div className="tw:text-xs tw:text-slate-600 tw:leading-relaxed">
                    {[
                      data.customerInfo?.address?.city,
                      data.customerInfo?.address?.district,
                      data.customerInfo?.address?.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {data.customerInfo?.address?.pincode &&
                      ` - ${data.customerInfo.address.pincode}`}
                  </div>
                </div>
              </div>
            </AppCard>

            {/* Seller Info */}
            <AppCard
              title="Seller Details"
              icon={
                <ShoppingBag className="tw:w-5 tw:h-5 tw:text-emerald-500" />
              }
              className="tw:mb-0"
            >
              <div className="tw:space-y-4">
                <div>
                  <AppLink
                    href={`/dashboard/network/view/b2b/${data.sellerInfo?.franchiseId}`}
                    asLink
                    showLinkColor
                    className="tw:text-sm tw:font-bold tw:block tw:mb-1"
                  >
                    {data.sellerInfo?.franchiseName || "N/A"}
                  </AppLink>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
                      <Hash size={12} />
                      {data.sellerInfo?.refId || "N/A"}
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
                      <Phone size={12} />
                      {data.sellerInfo?.mobile || "N/A"}
                    </div>
                  </div>
                </div>
                <Divider />
                <div className="tw:flex tw:items-start tw:gap-2">
                  <MapPin className="tw:w-4 tw:h-4 tw:text-slate-400 tw:mt-1 tw:shrink-0" />
                  <div className="tw:text-xs tw:text-slate-600 tw:leading-relaxed">
                    {[
                      data.sellerInfo?.address?.city,
                      data.sellerInfo?.address?.district,
                      data.sellerInfo?.address?.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {data.sellerInfo?.address?.pincode &&
                      ` - ${data.sellerInfo.address.pincode}`}
                  </div>
                </div>
              </div>
            </AppCard>
          </div>

          {/* Items List */}
          <div className="tw:space-y-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:px-1">
              <Package className="tw:w-5 tw:h-5 tw:text-primary" />
              <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">
                Requested Items
              </h2>
            </div>
            {isMobile ? (
              <MobileView items={items} />
            ) : (
              <DesktopView items={items} />
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {data.status === "Pending" && (
        <div className="app-footer tw:bg-white tw:border-t tw:border-slate-200 tw:shadow-lg tw:px-6 tw:py-4">
          <div className="app-container tw:flex tw:justify-between tw:items-center tw:w-full">
            <div className="tw:hidden tw:sm:flex tw:items-center tw:gap-4">
              <div className="tw:flex tw:flex-col">
                <span className="tw:text-[10px] tw:uppercase tw:text-slate-400 tw:font-bold tw:tracking-wider">
                  Total Items
                </span>
                <span className="tw:text-sm tw:font-bold tw:text-slate-900">
                  {items.length}
                </span>
              </div>
              <div className="tw:w-px tw:h-8 tw:bg-slate-200" />
              <div className="tw:flex tw:flex-col">
                <span className="tw:text-[10px] tw:uppercase tw:text-slate-400 tw:font-bold tw:tracking-wider">
                  Request Total
                </span>
                <Amount
                  value={items.reduce(
                    (acc: number, curr: any) => acc + (curr.finalPrice || 0),
                    0,
                  )}
                  className="tw:text-sm tw:font-bold tw:text-slate-900"
                />
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-3 tw:w-full tw:sm:w-auto">
              {String(data.customerInfo?.customerId) ===
                String(AuthService.getLoggedInUserId()) && (
                <>
                  <AppButton
                    color="danger"
                    fill="outline"
                    className="tw:flex-1 tw:sm:flex-none"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isSubmitting}
                  >
                    <XCircle className="tw:w-4 tw:h-4 tw:mr-2" />
                    Reject
                  </AppButton>
                  <AppButton
                    color="primary"
                    className="tw:flex-1 tw:sm:flex-none tw:px-8"
                    onClick={handleApprove}
                    isLoading={isSubmitting}
                  >
                    <CheckCircle2 className="tw:w-4 tw:h-4 tw:mr-2" />
                    Approve
                  </AppButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <RejectModal
        show={showRejectModal}
        requestId={data.requestId || data._id}
        callback={handleRejectCallback}
      />
    </>
  );
};

export default PartialOrderRequestView;
