import clsx from "clsx";
import {
  BoxIcon,
  CheckCheck,
  Clock,
  CreditCard,
  File,
  GitBranch,
  Package,
  Split,
  FileText,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import { ALERT_DISMISS_TIME } from "~/constants";
import { useIsMobile } from "~/hooks/use-mobile";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import ApproveSuccessModal from "~/modals/ApproveSuccessModal";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import SharedRemarksModal from "~/modals/feature/remarks/RemarksModal";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import SellerCatalogService from "~/services/SellerCatalogService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import { AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import RouteInfoBanner from "~/shared/logistics/components/RouteInfoBanner";
import FulfillmentSidePane from "~/shared/fulfillment/components/fulfillment-side-pane/FulfillmentSidePane";
import PaymentApprovedList from "~/shared/fulfillment/components/fulfillment-side-pane/PaymentApprovedList";
import PaymentPendingList from "~/shared/fulfillment/components/fulfillment-side-pane/PaymentPendingList";
import { PAYMENT_APPROVAL_FROM_PARAM } from "~/shared/fulfillment/components/fulfillment-side-pane/paymentApprovalHelper";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import ShipLaterModal from "~/shared/orders/modals/ship-later/ShipLaterModal";
import OrderBoxes from "~/shared/orders/order-boxes/OrderBoxes";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";
import RefundSettlement from "~/shared/orders/refund-settlement/RefundSettlement";
import SplitOrder from "~/shared/orders/split-order/SplitOrder";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import BillSummary from "./components/bill-summary/BillSummary";
import { CartDiscountBadge } from "./components/cart-discount/CartDiscountInfo";
import DeliveryTo from "./components/delivery-to/DeliveryTo";
import InsufficientStockBanner from "./components/InsufficientStockBanner";
import LinkedOrderNotice from "./components/LinkedOrderNotice";
import PaymentMethodList from "./components/payment-method-list/PayamentMethodList";
import PaymentApprovalInfo from "./components/PaymentApprovalInfo";
import PointsReward from "./components/points-reward/PointsReward";
import PrepaidPaymentBtn from "./components/PrepaidPaymentBtn";
import OrderProducts from "./components/products/OrderProducts";
import SellerInfo from "./components/seller-info/SellerInfo";
import ShiplaterApproval from "./components/ShiplaterApproval";
import StatusSummary from "./components/status-summary/StatusSummary";
import FulfillmentStepper from "./components/FulfillmentStepper";
import Timeline from "./components/timeline/Timeline";
import RemarksModal from "./modals/RemarksModal";
import ShiplaterRejectModal from "./modals/ShiplaterRejectModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["SALE-ORDER.VIEW-ORDERS"]);
}

const rbacRoles = {
  cancelOrder: ["SALE-ORDER.CANCEL"],
};

const tabs: TabItem[] = [
  {
    name: "Order Details",
    key: "details",
    langKey: "orderDetailsTab",
    icon: <File />,
  },
  {
    name: "Fulfillment Timeline",
    key: "timeline",
    langKey: "fulfillmentTimelineTab",
    icon: <Clock />,
  },
];

if (AuthService.isBuyerUser()) {
  tabs.push({
    name: "Boxes",
    key: "boxes",
    langKey: "boxes",
    icon: <BoxIcon />,
  });
}

/**
 * A standing note about the order (pay-later wallet, coin store, …). Theme-2
 * renders it as an incoming chat bubble so the page's asides read the way a
 * conversation's do; every other theme keeps the framed InfoBlock.
 */
const OrderNote = ({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "warning";
}) => {
  const isTheme2 = useTheme() === "theme-2";

  if (!isTheme2) {
    return (
      <InfoBlock size="sm" className="tw:mb-4" bordered variant={variant}>
        {children}
      </InfoBlock>
    );
  }

  return (
    <div
      className={clsx(
        "ov-bubble tw:mb-4",
        variant === "warning" && "ov-bubble-warn",
      )}
    >
      {children}
    </div>
  );
};

const OrderView = () => {
  const { t } = useTranslation(["common"]);
  const { id } = useParams();
  const appNav = useAppNav();
  const appToast = useAppToast();
  const isTheme2 = useTheme() === "theme-2";
  const isMobile = useIsMobile();

  const [searchParams] = useSearchParams();

  const from = searchParams.get("from");

  // Opened out of the payment-approval queue — the pane trades the fulfilment
  // stages for what is still waiting on a payment check and what just cleared.
  const isPaymentApproval = from === PAYMENT_APPROVAL_FROM_PARAM;

  /** Bumped after a payment is approved / rejected so the blocks reload. */
  const [paymentBlocksKey, setPaymentBlocksKey] = useState(0);

  const [order, setOrder] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [showRemarksModal, setShowRemarksModal] = useState<boolean>(false);
  const [showShipLaterModal, setShowShipLaterModal] = useState<boolean>(false);
  const [showShiplaterRejectModal, setShowShiplaterRejectModal] =
    useState<boolean>(false);
  const [showCancelShiplaterModal, setShowCancelShiplaterModal] =
    useState<boolean>(false);

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title?: string;
    description?: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({ show: false, successCb: () => {}, cancelCb: () => {} });

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    message?: string;
  }>({ show: false, message: "" });

  const [showApproveSuccessModal, setShowApproveSuccessModal] =
    useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);

  // counts for boxes (received / not received) - fetched when order is linked to SK
  const [receivedCount, setReceivedCount] = useState<number>(0);
  const [notReceivedCount, setNotReceivedCount] = useState<number>(0);

  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: { id: string }[];
    initialImageId?: string;
  }>({ show: false, images: [], initialImageId: undefined });

  const handleChildCallback = (event: { action: string; data?: any }) => {
    if (event.action === "showImages" && event.data?.images) {
      setImgPreviewModal({
        show: true,
        images: event.data.images,
        initialImageId: event.data.initialImageId,
      });
    }
  };

  const imgPreviewModalCallback = (event: { action: string; data?: any }) => {
    if (event.action === "close") {
      setImgPreviewModal({
        show: false,
        images: [],
        initialImageId: undefined,
      });
    }
  };

  // Compute tabs with dynamic counts (e.g., show not received boxes count)
  const tabsWithCounts: TabItem[] = useMemo(() => {
    const computed = tabs.map((tab) => {
      if (tab.key === "boxes") {
        return {
          ...tab,
          count: notReceivedCount > 0 ? notReceivedCount : undefined,
        };
      }
      return tab;
    });

    if (order?.linkedOrder) {
      computed.push({
        name: "Linked Order",
        key: "linkedOrder",
        langKey: "linkedOrder",
        icon: <Split />,
      });
    }

    return computed;
  }, [notReceivedCount, order?.linkedOrder]);

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const b: BreadcrumbItem[] = [
      {
        label: "Dashboard",
        langKey: "dashboard",
        redirect: { path: "/dashboard" },
      },
      {
        label: "Orders",
        langKey: "orders",
        redirect: {
          path: "/dashboard/orders/list",
        },
      },
      { label: "Order Details", langKey: "orderDetailsTitle" },
    ];

    if (from === "ord-dash") {
      b[0].redirect!.path = "/dashboard/orders/dashboard";
    }

    // Back out of an order opened from the queue lands on the queue itself.
    if (from === PAYMENT_APPROVAL_FROM_PARAM) {
      b[1].redirect!.params = { tab: PAYMENT_APPROVAL_FROM_PARAM };
    }

    return b;
  }, [from]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setActiveTab(tabs[0].key);
      setLoading(true);
      const data = await getData(id);
      setOrder(data);
      setNotReceivedCount(data.notReceivedCount || 0);
      setReceivedCount(data.receivedCount || 0);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleRemarksModalCallback = async (data: {
    action: string;
    data?: any;
  }) => {
    setShowRemarksModal(false);
    if (data.action === "submit") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
    }
  };

  const handleApproveModalClose = useCallback(async () => {
    setShowApproveSuccessModal(false);
    // refresh order on modal close
    setLoading(true);
    const updatedOrder = await getData(id || "");
    setOrder(updatedOrder);
    setLoading(false);
  }, [id]);

  const handleApproveModalProcessNow = useCallback(
    async (orderId?: string) => {
      setShowApproveSuccessModal(false);
      // refresh then navigate to receive/process if order id exists
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
      if (orderId) {
        appNav.to(`/dashboard/orders/process/${orderId}`);
      }
    },
    [id, appNav],
  );

  const handleDownloadInvoice = () => {
    if (!order.invoices || order.invoices.length === 0) {
      appToast.show({
        msg: t("noInvoicesAvailable"),
        color: "danger",
      });
      return;
    }

    // Download the first invoice (you can modify this logic if you want to download all invoices)
    const firstInvoice = order.invoices[0];
    const invoiceDocumentId = firstInvoice.invoiceDocumentId;

    if (invoiceDocumentId) {
      // Use common service to download/open the asset similar to pick list download
      CommonService.assetDownload(invoiceDocumentId);
      appToast.show({
        msg: t("downloadingInvoice"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: t("invoiceDocumentNotFound"),
        color: "danger",
      });
    }
  };

  const orderProductsCallback = async (data: {
    action: string;
    data?: any;
  }) => {
    if (data.action === "cancelItem") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
      return;
    }

    // Open Add Stock modal when requested from child
    if (data.action === "addStock") {
      setAddStockModal({ show: true, data: data.data });
      return;
    }

    // Refresh data after multiple stock addition
    if (data.action === "addStockMultiple") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
      return;
    }
  };

  const handleAddStockModal = async ({ action, data, product }: any) => {
    if (action === "close") {
      setAddStockModal({ show: false, data: null });
      return;
    }

    if (action === "submit") {
      // Update the order locally to reflect updated stock/availability
      // InventoryAddStockModal sends back `data` (form) and `product` (fresh product details)
      try {
        setAddStockModal({ show: false, data: null });

        // If product info is provided, update matching items' dealDetails.maxQty
        const returnedProduct = product;
        const submittedQty = Number(data?.data?.quantity ?? 0);

        if (returnedProduct && returnedProduct._id) {
          setOrder((prevOrder: any) => {
            if (!prevOrder || !prevOrder.items) return prevOrder;

            const updatedItems = (prevOrder.items || []).map((it: any) => {
              const matchesDeal = it.dealId === returnedProduct._id;

              if (!matchesDeal) return it;

              const newMaxQty = Number(returnedProduct.maxQty);

              return {
                ...it,
                dealDetails: {
                  ...(it.dealDetails || {}),
                  maxQty: newMaxQty,
                },
                showAddStock:
                  Number(it.remainingQty ?? it.quantity ?? 0) > newMaxQty &&
                  it.status === "Pending",
              };
            });

            const hasInsufficientStock =
              !!prevOrder._isReserveOrder &&
              !prevOrder.shiplaterRequest &&
              updatedItems.some(
                (it: any) => it?.showAddStock && it?.status !== "Cancelled",
              );

            return {
              ...prevOrder,
              items: updatedItems,
              _hasInsufficientStock: hasInsufficientStock,
            };
          });
        }
      } catch (e) {
        console.warn("Failed to update order after add-stock", e);
      } finally {
        // ensure loading flag is false (we didn't set it true here, but keep parity)
        setLoading(false);
      }
    }
  };

  const handleApprove = async () => {
    // Validate one deal at a time: find the first item that lacks sufficient stock
    try {
      const insufficientItem = (order?.items || []).find((it: any) => {
        // ignore cancelled items
        const isCancelled = it.status && it.status === "Cancelled";
        if (isCancelled) return false;

        if (it.showAddStock) return true;

        // const availableQty = Number(it?.dealDetails?.maxQty ?? 0);
        // if (availableQty === 0) return true;

        return false;
      });

      if (insufficientItem) {
        const productName = insufficientItem?.dealName;

        const msg = `${productName} does not have sufficient stock. Please cancel the item or add stock before approving.`;

        // Show the toast to inform the user about the specific deal
        appToast.show({
          msg,
          color: "danger",
        });

        return;
      }
    } catch (err) {
      console.warn("Failed to validate stock before approve:", err);
    }

    // show confirmation dialog
    setAppAlertDialog({
      show: true,
      title: t("confirm"),
      description: t("areYouSureApproveOrder"),
      successCb: async () => {
        // hide dialog first
        setAppAlertDialog((p) => ({ ...p, show: false }));

        await new Promise((res) => setTimeout(res, ALERT_DISMISS_TIME));

        setBusyLoader({
          show: true,
          message: t("approvingOrder"),
        });

        try {
          const resp: any = await OmsService.approveOrder(order._id);

          // If API returned success statusCode 200 treat as success
          if (resp && resp.statusCode === 200) {
            const updatedOrder = await getData(id || "");
            setOrder(updatedOrder);
            appToast.show({
              msg: t("orderApproved"),
              color: "success",
            });
            // show success modal asking user to process now or later
            setShowApproveSuccessModal(true);
          } else {
            // Show error message from server response where available
            const serverMsg = resp?.data?.message;
            appToast.show({
              msg: serverMsg || t("failedToApproveOrder"),
              color: "danger",
            });
          }
        } catch (e: any) {
          appToast.show({
            msg: e?.message || t("failedToApproveOrder"),
            color: "danger",
          });
        } finally {
          setBusyLoader({ show: false, message: "" });
        }
      },
      cancelCb: () => setAppAlertDialog((p) => ({ ...p, show: false })),
    });
  };

  const handleShipLaterCallback = async (data: {
    action: string;
    data?: any;
  }) => {
    setShowShipLaterModal(false);
    if (data.action === "success") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
    }
  };

  const handleShiplaterApprove = () => {
    setAppAlertDialog({
      show: true,
      title: t("confirm"),
      description: t("areYouSureApproveShipLaterRequest"),
      successCb: async () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
        await new Promise((res) => setTimeout(res, ALERT_DISMISS_TIME));
        setBusyLoader({ show: true, message: t("approvingShipLaterRequest") });
        try {
          const resp: any = await OmsService.respondShipLaterRequest(
            order._id,
            { acceptRequest: true, remarks: "" },
          );
          if (resp && resp.statusCode === 200) {
            const updatedOrder = await getData(id || "");
            setOrder(updatedOrder);
            appToast.show({
              msg: t("shipLaterRequestApproved"),
              color: "success",
            });
          } else {
            appToast.show({
              msg: resp?.data?.message || t("failedToApproveShipLaterRequest"),
              color: "danger",
            });
          }
        } catch (e: any) {
          appToast.show({
            msg: e?.message || t("failedToApproveShipLaterRequest"),
            color: "danger",
          });
        } finally {
          setBusyLoader({ show: false, message: "" });
        }
      },
      cancelCb: () => setAppAlertDialog((p) => ({ ...p, show: false })),
    });
  };

  const handleCancelShiplaterCallback = async (data: {
    action: string;
    remarks?: string;
  }) => {
    if (data.action !== "submit") {
      setShowCancelShiplaterModal(false);
      return;
    }
    setShowCancelShiplaterModal(false);
    setBusyLoader({ show: true, message: t("cancellingShipLaterRequest") });
    try {
      const resp: any = await OmsService.cancelShipLaterRequest(order._id, {
        remarks: data.remarks || "",
      });
      if (resp && resp.statusCode === 200) {
        const updatedOrder = await getData(id || "");
        setOrder(updatedOrder);
        appToast.show({
          msg: t("shipLaterRequestCancelled"),
          color: "success",
        });
      } else {
        appToast.show({
          msg: resp?.data?.message || t("failedToCancelShipLaterRequest"),
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || t("failedToCancelShipLaterRequest"),
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, message: "" });
    }
  };

  const handleShiplaterRejectCallback = async (data: {
    action: string;
    data?: any;
  }) => {
    setShowShiplaterRejectModal(false);
    if (data.action === "reject") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
    }
  };

  const handleOrderBoxesCallback = async (data: {
    action: string;
    data?: any;
  }) => {
    if (data.action === "success") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setNotReceivedCount(updatedOrder.notReceivedCount || 0);
      setReceivedCount(updatedOrder.receivedCount || 0);
      setLoading(false);
    }
  };

  const handlePaymentApprovalCallback = async (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "approved" || params.action === "rejected") {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setPaymentBlocksKey((key) => key + 1);
      setLoading(false);
    }
  };

  const handleSplitOrderCallback = async (data: {
    action: string;
    data?: any;
  }) => {
    if (data.action === "submit") {
      setLoading(true);
      const updatedOrder = await getData(id || "");
      setOrder(updatedOrder);
      setLoading(false);
    }
  };

  // Who the order is with, from this side of it: the customer when we're the
  // seller, the seller when we're buying. Rides in the header subtitle.
  const partyName = order?.isMyOrder
    ? order?.customerInfo?.name
    : order?.sellerInfo?.franchiseName;

  const orderBadges = order?._id ? (
    <>
      <AppBadge variant={order._typeColor}>{order.orderType}</AppBadge>
      {order.isKcStore ? (
        <AppBadge variant="primary">Coins Store</AppBadge>
      ) : null}
      {order._isReserveOrder ? (
        <AppBadge variant="light">Reserve Order</AppBadge>
      ) : null}
      {order.orderType === "B2C" && order.pickupType ? (
        <AppBadge variant={order.pickupTypeColor}>{order.pickupType}</AppBadge>
      ) : null}
      {order.assistedOrder ? (
        <AppBadge variant="info">Assisted Order</AppBadge>
      ) : null}
      <CartDiscountBadge order={order} />
      {order.quickCheckout ? (
        <AppBadge variant="warning">Quick Checkout</AppBadge>
      ) : null}
    </>
  ) : null;

  return (
    <>
      {/* Chat-style header on phones: the order is the "contact" — its ref no
          and type on the title line, the party it belongs to underneath. On
          desktop the identity plate below already carries all of that, so the
          header stays a plain page title. */}
      <AppHeader
        mobileLead="back"
        title={
          order?._id && isMobile ? (
            <span className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
              <span className="tw:truncate tw:min-w-0">{order.orderRefNo}</span>
              <AppBadge variant={order._typeColor} className="tw:shrink-0">
                {order.orderType}
              </AppBadge>
            </span>
          ) : (
            t("orderDetailsTitle")
          )
        }
        subtitle={
          partyName && isMobile ? (
            <span className="tw:font-medium tw:truncate tw:min-w-0 tw:opacity-80">
              {partyName}
            </span>
          ) : undefined
        }
      />
      <div className="page-bg app-page page-padding">
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu sectionKey="bill" activeTab="orders" title="Bill" />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid; the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed order pane beside the icon rail. */}
              <div className="app-pane-main tw:col-span-12">
                <div className="hide-in-theme-2 tw:flex tw:lg:justify-between tw:items-center tw:flex-wrap tw:gap-2 tw:mb-4">
                  <AppBreadcrumbs data={breadcrumbs} />
                </div>

                {loading ? (
                  <div className="tw:p-4 tw:text-center tw:flex tw:justify-center tw:items-center tw:h-full">
                    <AppSpinner />
                  </div>
                ) : null}

                {!loading && !order?._id ? <NoData /> : null}

                {!loading && order?._id ? (
                  <>
                    <div className="ov-hero tw:mb-4">
                      {/* Identity above, actions below on narrow columns: the
                          ref no is long enough that a right-hand button stack
                          would squeeze it onto two lines. They share a row from
                          sm up, where there's width for both. */}
                      <div className="tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-start tw:sm:justify-between">
                        <div className="tw:flex tw:items-start tw:gap-3 tw:min-w-0 tw:flex-1">
                          <div className="ov-hero-icon">
                            <Package size={20} />
                          </div>
                          <div className="tw:min-w-0 tw:flex-1">
                            <div className="ov-hero-eyebrow">Order</div>
                            {/* Ref no and badges share a line wherever there's
                                room and wrap onto their own when there isn't,
                                so the plate stays two or three lines tall
                                instead of one row per fact. */}
                            <div className="tw:flex tw:items-center tw:gap-x-2 tw:gap-y-1.5 tw:flex-wrap tw:min-w-0">
                              <h1 className="app-heading-serif tw:text-[18px] tw:font-bold tw:tracking-tight tw:text-primary tw:leading-tight tw:tabular-nums tw:truncate tw:min-w-0">
                                #{order.orderRefNo}
                              </h1>
                              <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                                {orderBadges}
                              </div>
                            </div>
                            <div className="ov-hero-meta tw:mt-2">
                              <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
                                <span className="tw:shrink-0">
                                  {t("placedOn")}:
                                </span>
                                <strong className="tw:truncate">
                                  <DateFormat value={order.createdAt} />
                                </strong>
                              </div>
                              {order.createdBy?.name ? (
                                <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:min-w-0">
                                  <User
                                    size={13}
                                    className="tw:text-gray-400 tw:shrink-0"
                                  />
                                  <span className="tw:shrink-0">
                                    Created by
                                  </span>
                                  {order.createdBy.redirect ? (
                                    <AppLink
                                      href={order.createdBy.redirect.path}
                                      className="tw:font-medium"
                                      asLink={true}
                                    >
                                      {order.createdBy.name}
                                    </AppLink>
                                  ) : (
                                    <strong>{order.createdBy.name}</strong>
                                  )}
                                  {order.createdBy.userType ? (
                                    <AppBadge variant="light">
                                      {order.createdBy.userType}
                                    </AppBadge>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:sm:justify-end tw:sm:shrink-0">
                          <Rbac roles={rbacRoles.cancelOrder}>
                            {order._showCancelFullOrder &&
                              !order._needToApprove &&
                              !order._needPaymentApproval && (
                                <AppButton
                                  color="light"
                                  fill="outline"
                                  size="small"
                                  onClick={() => setShowRemarksModal(true)}
                                >
                                  {t("cancelOrder")}
                                </AppButton>
                              )}
                          </Rbac>
                          {!order.isMyOrder && order.status === "Shipped" ? (
                            <AppButton
                              color="success"
                              size="small"
                              onClick={() =>
                                appNav.to(
                                  `/dashboard/orders/primary/receive/process/${order._id}`,
                                )
                              }
                            >
                              <BoxIcon />
                              {t("receive")}
                            </AppButton>
                          ) : null}
                          {order.invoices && order.invoices.length > 0 ? (
                            <>
                              {order.orderType === "B2C" ? (
                                <>
                                  <PrintReceipt
                                    orderId={order._id}
                                    size="small"
                                    color="light"
                                    variant="outline"
                                  />
                                  {order.invoices[0]?.invoiceDocumentId ? (
                                    <AppButton
                                      color="light"
                                      fill="outline"
                                      size="small"
                                      onClick={() =>
                                        CommonService.assetDownload(
                                          order.invoices[0].invoiceDocumentId,
                                          true,
                                        )
                                      }
                                    >
                                      <FileText />
                                      {t("printInvoice")}
                                    </AppButton>
                                  ) : null}
                                </>
                              ) : (
                                <AppButton
                                  color="light"
                                  fill="outline"
                                  size="small"
                                  onClick={handleDownloadInvoice}
                                >
                                  <File />
                                  {t("downloadInvoice")}
                                </AppButton>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Where the order stands, straight under its identity —
                        the two travel as one block on phones. Everything
                        below is either something to act on or detail. */}
                    <FulfillmentStepper order={order} />

                    {order._needPaymentApproval ? (
                      <PaymentApprovalInfo
                        payments={order.paymentMode}
                        orderAmount={order._payableAmt || 0}
                        orderId={order._id}
                        groupTransactionId={order.groupTransactionId}
                        linkedOrder={order.linkedOrder}
                        currentOrderRefNo={order.orderRefNo}
                        isCurrentOrderReserve={
                          !!order._hasInsufficientStock ||
                          !!order.shiplaterRequest
                        }
                        callback={handlePaymentApprovalCallback}
                      />
                    ) : null}

                    {!order.quickCheckout ? (
                      <RouteInfoBanner
                        customerInfo={order.customerInfo}
                        routeInfo={order.routeInfo}
                        isMyOrder={!!order.isMyOrder}
                        orderType={order.orderType}
                        orderStatus={order.status}
                        orderId={order._id}
                        feature="order"
                        onRefresh={() => {
                          setLoading(true);
                          getData(id || "").then((data) => {
                            setOrder(data);
                            setLoading(false);
                          });
                        }}
                      />
                    ) : null}

                    {order.canDoSplitOrder ? (
                      <SplitOrder
                        orderId={order._id}
                        canDoSplitOrder={order.canDoSplitOrder}
                        callback={handleSplitOrderCallback}
                        className="tw:mb-4"
                        isMyOrder={order.isMyOrder}
                      />
                    ) : null}

                    {!order._needPaymentApproval &&
                    order.shiplaterRequest &&
                    (order.showApproveForShiplater ||
                      order.shiplaterRequest.status !== "Pending") ? (
                      <ShiplaterApproval
                        shiplaterRequest={order.shiplaterRequest}
                        onApprove={
                          order.showApproveForShiplater
                            ? handleShiplaterApprove
                            : undefined
                        }
                        onReject={
                          order.showApproveForShiplater
                            ? () => setShowShiplaterRejectModal(true)
                            : undefined
                        }
                      />
                    ) : null}

                    {order._needToApprove &&
                    !order._needPaymentApproval &&
                    order._hasInsufficientStock ? (
                      <InsufficientStockBanner
                        count={
                          (order.items || []).filter(
                            (it: any) =>
                              it?.showAddStock && it?.status !== "Cancelled",
                          ).length
                        }
                        showShipLaterButton={order.showShipLaterButton}
                        onShipLater={() => setShowShipLaterModal(true)}
                      />
                    ) : null}

                    {!order._needPaymentApproval &&
                    order.waitingForBuyerApproval ? (
                      <AppCard
                        noPadding
                        className="tw:mb-4 tw:rounded-lg tw:border tw:border-amber-200/80 tw:bg-white tw:overflow-hidden tw:relative tw:shadow-sm"
                      >
                        <div className="tw:h-1 tw:bg-linear-to-r tw:from-amber-200 tw:via-amber-400 tw:to-amber-200 tw:animate-pulse" />
                        <div className="tw:relative tw:px-3.5 tw:py-3 tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-3">
                          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
                            <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-full tw:bg-amber-50 tw:border tw:border-amber-200 tw:shrink-0">
                              <Clock size={18} className="tw:text-amber-700" />
                              <span className="tw:absolute tw:-top-0.5 tw:-right-0.5 tw:flex tw:h-2.5 tw:w-2.5">
                                <span className="tw:absolute tw:inline-flex tw:h-full tw:w-full tw:rounded-full tw:bg-amber-400 tw:opacity-75 tw:animate-ping" />
                                <span className="tw:relative tw:inline-flex tw:h-2.5 tw:w-2.5 tw:rounded-full tw:bg-amber-500 tw:ring-2 tw:ring-white" />
                              </span>
                            </div>
                            <div className="tw:min-w-0 tw:flex-1">
                              <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                                <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-tight">
                                  {t("waitingForApproval")}
                                </span>
                                <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-amber-800 tw:font-semibold tw:bg-amber-100 tw:border tw:border-amber-200 tw:px-1.5 tw:py-0.5 tw:rounded">
                                  {t("shipLater")}
                                </span>
                              </div>
                              <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:leading-snug">
                                {t("shipLaterAwaitingBuyerApproval")}
                              </p>
                              {order.shiplaterRequest?.expectedDeliveryDate ? (
                                <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-1.5 tw:text-xs">
                                  <span className="tw:text-gray-500">
                                    {t("newExpectedDeliveryDate")}:
                                  </span>
                                  <span className="tw:font-semibold tw:text-gray-900">
                                    <DateFormat
                                      value={
                                        order.shiplaterRequest
                                          .expectedDeliveryDate
                                      }
                                    />
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {order._canCancelShipLaterRequest ? (
                            <AppButton
                              color="light"
                              fill="outline"
                              size="small"
                              onClick={() => setShowCancelShiplaterModal(true)}
                            >
                              <X size={14} />
                              {t("cancelRequest")}
                            </AppButton>
                          ) : null}
                        </div>
                      </AppCard>
                    ) : null}

                    {/* Pills on theme-2 (the chat-app register), the segmented
                  control everywhere else. Pinned under the app header either
                  way, so switching views never means scrolling back up. */}
                    <AppTab
                      tabs={tabsWithCounts}
                      activeTab={activeTab}
                      onTabChange={(tab) => setActiveTab(tab.key)}
                      variant={isTheme2 ? "pills" : undefined}
                      className="ov-tabs tw:mb-4"
                      slideOffset={isTheme2 ? 16 : 0}
                    />

                    {order.isPaylaterOrder ? (
                      <OrderNote>
                        <span className="tw:font-bold tw:mr-2">
                          Please Note:
                        </span>
                        <span>
                          Payment processed through customer&apos;s &quot;
                          <span className="tw:font-bold">Pay Later</span> &quot;
                          wallet. No immediate payment collection required.
                        </span>
                      </OrderNote>
                    ) : null}

                    <RefundSettlement
                      orderId={order._id}
                      refundSettlements={order.refundSettlements}
                      className="tw:mb-4"
                      callback={async (data) => {
                        if (data.action === "submit") {
                          setLoading(true);
                          const updatedOrder = await getData(id || "");
                          setOrder(updatedOrder);
                          setLoading(false);
                        }
                      }}
                    />

                    {order.isKcStore ? (
                      <OrderNote variant="warning">
                        <span className="tw:font-bold tw:mr-2">
                          Please Note:
                        </span>
                        <span>
                          This is a{" "}
                          <AppBadge variant={order._subTypeColor}>
                            CoinStore
                          </AppBadge>{" "}
                          order. Customer has redeemed
                          <span className="tw:font-bold tw:mx-1">
                            {order.coinsRedeemed ?? 0} {t("coins")}
                          </span>
                        </span>
                      </OrderNote>
                    ) : null}

                    {order.isSplitOrder && order.parentOrder ? (
                      <div className="ov-bubble ov-bubble-info tw:mb-4 tw:flex tw:items-center tw:gap-2">
                        <GitBranch size={14} className="tw:shrink-0" />
                        <span>
                          This order was created from order{" "}
                          <AppLink
                            asLink
                            href={`/dashboard/orders/view/${order.parentOrder.orderId}`}
                            className="tw:font-semibold tw:underline"
                          >
                            #{order.parentOrder.orderRefNo}
                          </AppLink>{" "}
                          because some items were sent separately.
                        </span>
                      </div>
                    ) : null}

                    {activeTab === "details" ? (
                      <div className="ov-grid">
                        <div className="tw:min-w-0">
                          <StatusSummary
                            order={order}
                            callback={handleChildCallback}
                          />

                          {/* <OrderInvoiceList
                      invoices={order.invoices}
                      callback={listCallback}
                    /> */}

                          <PointsReward coinsRewared={order.coinsRewared} />

                          <div id="order-products-section">
                            <OrderProducts
                              products={order.items}
                              statusSummary={order.statusSummary}
                              orderId={order._id}
                              isKCStore={order.isKcStore}
                              isMyOrder={order.isMyOrder}
                              needPaymentApproval={order._needPaymentApproval}
                              orderType={order.orderType}
                              callback={orderProductsCallback}
                            />
                          </div>

                          <BillSummary order={order} />
                        </div>
                        <div className="ov-grid-side tw:min-w-0">
                          {order.isMyOrder ? (
                            <DeliveryTo
                              customerInfo={order.customerInfo}
                              deliveryAddress={order.shippingAddress}
                              deliveryDistance={order.deliveryDistance}
                            />
                          ) : (
                            <SellerInfo data={order.sellerInfo} />
                          )}

                          {/* Payment, as a contact-info style block: how it's being
                        paid on the identity row, then the settled/pending
                        state and each tender underneath. */}
                          <AppCard noPadding>
                            <div className="app-seller-header tw:bg-primary/5 tw:px-4 tw:py-3 tw:border-b tw:border-primary/15">
                              <div className="tw:flex tw:items-center tw:gap-3">
                                <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-full tw:bg-primary tw:text-white tw:flex tw:items-center tw:justify-center">
                                  <CreditCard size={17} />
                                </div>
                                <div className="tw:flex-1 tw:min-w-0">
                                  <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                                    {order.isKcStore
                                      ? "Coinstore"
                                      : order.isPaylaterOrder
                                        ? "Paylater Wallet"
                                        : order.paymentType}
                                  </div>
                                  <div className="tw:text-[11px] tw:text-gray-500">
                                    {t("payment")} · {t("method")}
                                  </div>
                                </div>
                                {order._paymentStatusLbl ? (
                                  <AppBadge variant={order._paymentStatusColor}>
                                    {order._paymentStatusLbl}
                                  </AppBadge>
                                ) : null}
                              </div>
                            </div>

                            <div className="tw:px-4 tw:py-4">
                              {order.isKcStore ? (
                                <div className="tw:text-sm tw:text-gray-700">
                                  Customer has redeemed{" "}
                                  <span className="tw:font-bold">
                                    {order.coinsRedeemed ?? 0} {t("coins")}
                                  </span>{" "}
                                </div>
                              ) : (
                                <>
                                  {Array.isArray(order.paymentMode) &&
                                  order.paymentMode.length > 0 ? (
                                    <div className="tw:flex tw:flex-col tw:gap-2">
                                      {order.paymentMode.map(
                                        (payment: any, index: number) => (
                                          <PaymentMethodList
                                            key={index}
                                            payment={payment}
                                            callback={handleChildCallback}
                                          />
                                        ),
                                      )}
                                    </div>
                                  ) : null}
                                  <PrepaidPaymentBtn
                                    order={order}
                                    onPaymentSuccess={async () => {
                                      setLoading(true);
                                      const updatedOrder = await getData(
                                        id || "",
                                      );
                                      setOrder(updatedOrder);
                                      setLoading(false);
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </AppCard>
                        </div>
                      </div>
                    ) : activeTab === "timeline" ? (
                      <Timeline
                        timelineData={order.logs || []}
                        invoices={order.invoices || []}
                        orderType={order.orderType}
                        packages={order.packages || []}
                        shipmentDetails={order.shipmentDetails || null}
                        orderSubType={order.orderSubType}
                        orderId={order._id}
                        orderStatus={order.status}
                        canProcess={order._canProcessOrder}
                        isGuestCustomer={order.customerInfo?.isGuesCustomer}
                        quickCheckout={order.quickCheckout}
                      />
                    ) : activeTab === "linkedOrder" ? (
                      <LinkedOrderNotice
                        order={order}
                        linkedOrder={order.linkedOrder}
                      />
                    ) : activeTab === "boxes" ? (
                      <OrderBoxes
                        orderId={order._id}
                        receivedCount={receivedCount}
                        notReceivedCount={notReceivedCount}
                        callback={handleOrderBoxesCallback}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>

              {/* Side column — theme-2 desktop only, where the CSS re-homes it
                  as the fixed order pane: the list of orders stays alongside
                  the one being read, the way a chat list sits beside a chat. */}
              <AppPaneSide className="app-pane-only">
                <FulfillmentSidePane
                  title={t("orders")}
                  chipType="order-channel"
                  showStages={!isPaymentApproval}
                />

                {isPaymentApproval && (
                  <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-4">
                    <PaymentPendingList refreshKey={paymentBlocksKey} />
                    <PaymentApprovedList refreshKey={paymentBlocksKey} />
                  </div>
                )}
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <RemarksModal
        show={showRemarksModal}
        callback={handleRemarksModalCallback}
        orderId={id || ""}
      />

      <SharedRemarksModal
        show={showCancelShiplaterModal}
        title={t("cancelShipLaterRequest")}
        callback={handleCancelShiplaterCallback}
      />

      <ShiplaterRejectModal
        show={showShiplaterRejectModal}
        orderId={order?._id || ""}
        callback={handleShiplaterRejectCallback}
      />

      <ShipLaterModal
        show={showShipLaterModal}
        orderId={order?._id || ""}
        customerId={order?.customerInfo?.customerId || ""}
        isB2C={order?.orderType === "B2C"}
        onClose={() => setShowShipLaterModal(false)}
        callback={handleShipLaterCallback}
      />

      {/* Footer actions for approval flow */}
      {!loading && order?._needToApprove && !order?._needPaymentApproval ? (
        <div className="app-footer tw:px-4 tw:py-3 tw:bg-white tw:border-t tw:flex tw:justify-end tw:gap-2">
          {order._showCancelFullOrder && (
            <AppButton
              color="light"
              fill="outline"
              onClick={() => setShowRemarksModal(true)}
            >
              <XCircle />
              {t("cancelOrder")}
            </AppButton>
          )}

          {!order._hasInsufficientStock && (
            <AppButton
              color="success"
              onClick={handleApprove}
              className="tw:font-semibold"
            >
              <CheckCheck />
              {t("acceptOrder")}
            </AppButton>
          )}
        </div>
      ) : null}

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title || ""}
        description={appAlertDialog.description || ""}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?.dealId}
        productName={addStockModal.data?.product?.dealName}
        dealRefId={addStockModal.data?.dealRefId}
        mrp={addStockModal.data?.mrp}
        qty={addStockModal.data?.remainingQty}
        callback={handleAddStockModal}
      />

      <ApproveSuccessModal
        show={showApproveSuccessModal}
        orderId={order?._id}
        onClose={handleApproveModalClose}
        onProcessNow={handleApproveModalProcessNow}
      />
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </>
  );
};

const getData = async (id: string) => {
  const response = await OmsService.getSellerOrderDetail(id);
  const order = response.data?.data || {};
  // Prepare status summary if items exist
  if (order.items) {
    order.statusSummary = OmsService.getStatusSummary(order.items);
  }

  // Use OmsService.formatOrderResponse to add computed keys like _statusColor and _canProcessOrder
  const formattedList = OmsService.formatOrderResponse([order]);
  const formattedOrder = formattedList.length > 0 ? formattedList[0] : order;

  // Preserve statusSummary in case formatOrderResponse didn't include it
  if (!formattedOrder.statusSummary && order.statusSummary) {
    formattedOrder.statusSummary = order.statusSummary;
  }

  if (formattedOrder.groupTransactionId) {
    try {
      const orderOwnerId =
        formattedOrder.sellerInfo?.franchiseId ||
        AuthService.getLoggedInUserId() ||
        "";

      const linkedResp = await OmsService.getSalesOrders(orderOwnerId, {
        filter: {
          groupTransactionId: formattedOrder.groupTransactionId,
        },
      });

      const linkedOrders = Array.isArray(linkedResp?.data?.data)
        ? linkedResp.data.data
        : [];
      const currentOrderId = formattedOrder._id || formattedOrder.orderId;
      const siblingOrder = linkedOrders.find((linked: any) => {
        const linkedId = linked?.orderId || linked?._id;
        return linkedId && linkedId !== currentOrderId;
      });

      if (siblingOrder) {
        const siblingFormatted = OmsService.formatOrderResponse([
          siblingOrder,
        ])[0];
        if (siblingFormatted?.orderId) {
          formattedOrder.linkedOrder = siblingFormatted;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch linked order group:", e);
    }
  }

  // Fetch deal details (stock info) for items and attach as `dealDetails`
  try {
    const items = formattedOrder.items || [];
    const dealIds = Array.from(
      new Set(items.map((it: any) => it.dealId).filter(Boolean)),
    );

    if (dealIds.length > 0) {
      const dealsResp = await SellerCatalogService.getProducts({
        page: 1,
        count: dealIds.length,
        filter: {
          dealId: { $in: dealIds },
          ...(formattedOrder.isKcStore && { isKCStoreEnabled: true }),
        },
      });

      const deals = SellerCatalogService.formatProductResponse(
        dealsResp.data?.data || [],
      );

      const dealMap: Record<string, any> = {};
      (deals || []).forEach((d: any) => {
        if (d && d._id) dealMap[d._id] = d;
      });

      // Attach dealDetails to each item and set showAddStock when ordered qty > available qty
      formattedOrder.items = (items || []).map((it: any) => {
        const availableQty = dealMap[it.dealId]
          ? Number(dealMap[it.dealId].actualMaxQty ?? 0)
          : 0;
        const orderedQty = Number(it.remainingQty ?? it.quantity ?? 0);
        return {
          ...it,
          dealDetails: dealMap[it.dealId]
            ? { maxQty: dealMap[it.dealId].actualMaxQty }
            : null,
          showAddStock: orderedQty > availableQty && it.status === "Pending",
        };
      });

      formattedOrder._hasInsufficientStock =
        !!formattedOrder._isReserveOrder &&
        !formattedOrder.shiplaterRequest &&
        (formattedOrder.items || []).some(
          (it: any) => it?.showAddStock && it?.status !== "Cancelled",
        );

      if (AuthService.isBuyerUser()) {
        const loggedInId = AuthService.getLoggedInUserId() || "";

        const baseFilter = { "orderData.refId2": formattedOrder.orderRefNo };

        const [notReceivedResp, receivedResp] = await Promise.all([
          PurchaseOrderService.getPoPackages(loggedInId, {
            outputType: "count",
            filter: { ...baseFilter, status: "Shipped" },
          }),
          PurchaseOrderService.getPoPackages(loggedInId, {
            outputType: "count",
            filter: { ...baseFilter, status: "Delivered" },
          }),
        ]);

        // PurchaseOrderService returns count as response.data.data
        formattedOrder.notReceivedCount =
          notReceivedResp?.data?.data?.count || 0;
        formattedOrder.receivedCount = receivedResp?.data?.data?.count || 0;
      }
    }
  } catch (e) {
    // If fetching deal details fails, continue without breaking order view
    console.warn("Failed to fetch deal details for order items:", e);
  }

  console.log("formattedOrder", formattedOrder);

  return formattedOrder;
};

export default OrderView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Order Details"),
    },
  ];
}
