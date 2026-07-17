import { produce } from "immer";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import PageAccessService from "~/services/PageAccessService";
import RackBinService from "~/services/RackBinService";
import DeliveryAddress from "./components/DeliveryAddress";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import Boxing from "./components/boxing/Boxing";
import CompletedBoxes from "./components/CompletedBoxes";
import GenerateInvoice from "./components/GenerateInvoice";
import ItemPickList from "./components/item-pick/ItemPickList";
import OrderSteps from "./components/OrderSteps";
import OrderSummary from "./components/OrderSummary";
import PendingPicking from "./components/pending-picking/PendingPicking";
import Products from "./components/products/Products";
import Ship from "./components/ship/Ship";
import ShippedDetails from "./components/ship/ShippedDetails";
import { getDetails } from "./helper";
import { useTranslation } from "react-i18next";
import RouteInfoBanner from "~/shared/logistics/components/RouteInfoBanner";
import PickupPaymentModal from "./modals/PickupPaymentModal";
import MarkAsDeliveredModal from "~/shared/logistics/modals/mark-as-delivered/MarkAsDeliveredModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(
    ["SALE-ORDER.VIEW-ORDERS", "SALE-ORDER.PICK-PACK"],
    {
      blockForMasterLogin: true,
    },
  );
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Orders",
    langKey: "orders",
    redirect: { path: "/dashboard/orders/list" },
  },
  { label: "Process Order", langKey: "processOrder" },
];

interface OrderData {
  order: any;
  deals: any[];
  boxes: any[];
}

const OrderProcess = () => {
  const { t } = useTranslation();
  const appToast = useAppToast();
  const { id } = useParams();
  const appNav = useAppNav();

  const [orderData, setOrderData] = useState<OrderData>({
    order: {},
    deals: [],
    boxes: [],
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Boxes state for packing UI
  const [boxes, setBoxes] = useState<any[]>([]);

  const [busyLoader, setBusyLoader] = useState<{ show: boolean }>({
    show: false,
  });

  // State to instruct ShippedDetails to open OTP verify modal
  const [triggerOtpVerify, setTriggerOtpVerify] = useState<{
    show: boolean;
    shipmentId?: string;
    invoiceRefId?: string;
  }>({ show: false });

  const [pickupPaymentModal, setPickupPaymentModal] = useState<{
    show: boolean;
    pickingId?: string;
  }>({ show: false });

  const [markDeliveredModal, setMarkDeliveredModal] = useState<{
    show: boolean;
    orderId?: string;
  }>({ show: false });

  const autoStartedPickingRef = useRef<string | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);

  // Box action handler
  const handleBoxAction = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    switch (action) {
      case "boxFinished":
        setBoxes(
          produce((draft) => {
            draft.push({ ...data });
          }),
        );
        // Update scannedQty on orderData.deals based on the box response items
        // data expected shape: { items: [{ qty, dealId }] }
        if (data?.items && Array.isArray(data.items)) {
          setOrderData(
            produce((draft) => {
              if (!draft.deals) return;
              data.items.forEach((item: any) => {
                const match = draft.deals.find(
                  (deal: any) =>
                    deal.dealId == item.dealId || deal._id == item.dealId,
                );
                if (match) {
                  match.scannedQty = (match.scannedQty || 0) + (item.qty || 0);
                }
              });
            }),
          );
        }
        break;
      case "removeBox":
        setBoxes((prev) => {
          const filtered = prev.filter((box) => box.id !== data?.boxId);

          return filtered;
        });
        break;
      default:
        break;
    }
  };

  // Common function to fetch order details and update state (orderData and boxes)
  const fetchOrderDetails = async (options?: {
    showLoading?: boolean;
    showToastOnError?: boolean;
  }) => {
    const { showLoading = true, showToastOnError = false } = options || {};
    if (!id) return null;
    try {
      if (showLoading) setLoading(true);
      const result = await getDetails(id);
      setOrderData(result);
      setBoxes(result.boxes || []);
      return result;
    } catch (e) {
      console.error("Error fetching order details:", e);
      if (showToastOnError) {
        appToast.show({
          msg: "Failed to refresh order details.",
          color: "danger",
        });
      }
      setOrderData({ order: {}, deals: [], boxes: [] });
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const result = await fetchOrderDetails({
        showLoading: true,
        showToastOnError: false,
      });
      if (
        result?.order?._id &&
        result.order.pickUpAtStore &&
        !result.order.activePicking?.id &&
        (result.order.status === "Created" ||
          result.order.status === "Picking") &&
        autoStartedPickingRef.current !== result.order._id
      ) {
        autoStartedPickingRef.current = result.order._id;
        try {
          const res = await RackBinService.startPicking(result.order._id);
          if (res.statusCode === 200) {
            await fetchOrderDetails({
              showLoading: false,
              showToastOnError: false,
            });
          }
        } catch (e) {
          console.error("Auto startPicking failed:", e);
        }
      }
    };
    fetchData();
  }, [id]);

  // Called when picking is confirmed in child components to refresh order details
  const handlePickingConfirmed = async () => {
    if (!id) return;
    await fetchOrderDetails({ showLoading: true, showToastOnError: true });
  };

  // Callback for GenerateInvoice component
  const handleGenerateInvoice = async (action: {
    action: string;
    data?: any;
  }) => {
    if (action.action === "invoiceGenerated") {
      if (id) {
        await fetchOrderDetails({ showLoading: true, showToastOnError: true });
      }
      // Auto-scroll to Ship block after invoice is generated
      const t = setTimeout(() => {
        clearTimeout(t);
        if (shipRef.current) {
          shipRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 1000);
    }
  };

  // Callback for Ship component
  const handleShip = async (action: { action: string; data?: any }) => {
    if (action.action === "deliveryAssigned") {
      // Refresh order details first
      if (id) {
        await fetchOrderDetails({ showLoading: true, showToastOnError: true });
      }

      // If shipment info is available in action.data, trigger the OTP verify
      // in ShippedDetails by setting trigger state. ShippedDetails will reset
      // its own local modal state when it processes this prop.
      // Skip OTP verification for selfship
      const shipmentId = action.data?.assignmentResponse?.shipmentId;
      const invoiceRefId = action.data?.invoiceRefId;
      const shipmentType = action.data?.assignmentResponse?.shipmentType;

      if ((shipmentId || invoiceRefId) && shipmentType !== "selfship") {
        setTriggerOtpVerify({ show: true, shipmentId, invoiceRefId });
      }
    }
  };

  // Helper function to determine if CompletePacking should be shown
  const shouldShowCompletePacking = () => {
    return (
      orderData?.deals &&
      orderData.deals.length > 0 &&
      (orderData.deals.every((deal: any) => (deal.scannedQty || 0) > 0) ||
        boxes.some((box) => box.status === "Saved"))
    );
  };

  // Helper function to determine if all scanned quantities match required quantities
  const areAllQuantitiesMatched = () => {
    return (
      orderData?.deals &&
      orderData.deals.length > 0 &&
      orderData.deals.every(
        (deal: any) => (deal.scannedQty || 0) >= (deal.quantity || 0),
      )
    );
  };

  // Callback for CompletePacking component
  const handleCompletePacking = async (action: {
    action: string;
    data?: any;
  }) => {
    // List of actions that require refreshing order details
    const refreshActions = ["refresh", "packingCompleted", "cancelPicking"];
    if (refreshActions.includes(action.action)) {
      if (id) {
        await fetchOrderDetails({
          showLoading: true,
          showToastOnError: false,
        });
      }
      return;
    }
  };

  const handlePendingPickingCb = () => {
    if (id) {
      fetchOrderDetails({ showLoading: true, showToastOnError: true });
    }
  };

  return (
    <>
      <AppHeader title="Process Order" />
      <div className="page-bg tw:p-4 app-page">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          {loading ? (
            <div className="tw:p-4 tw:text-center tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : null}

          {/* BusyLoader for API call */}
          <BusyLoader show={busyLoader.show} />

          {!loading &&
          (!orderData?.order || Object.keys(orderData?.order).length === 0) ? (
            <div className="tw:p-4 tw:text-center">No order details found</div>
          ) : null}

          {!loading && orderData.order?._id ? (
            <div className="tw:mb-4">
              <AppCard>
                <div className="tw:flex tw:justify-between tw:items-center">
                  <div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {t("fulfillOrderType", {
                        orderType: orderData?.order?.orderType,
                      })}
                    </div>
                    <div className="tw:text-base tw:font-semibold tw:flex tw:items-center tw:gap-2">
                      {orderData?.order.orderRefNo}{" "}
                      <AppBadge variant={orderData?.order?._typeColor}>
                        {orderData?.order?.orderType}
                      </AppBadge>
                    </div>
                    <div className="tw:text-sm tw:text-gray-500">
                      {t("for")}: {orderData?.order.customerInfo?.name || "N/A"}
                    </div>
                  </div>

                  <div>
                    <AppLink
                      asLink
                      href={`/dashboard/orders/view/${orderData?.order?._id}`}
                    >
                      <AppButton color="primary" fill="outline" size="small">
                        {t("viewOrder")}
                      </AppButton>
                    </AppLink>
                  </div>
                </div>

                {!orderData?.order?.pickUpAtStore && (
                  <DeliveryAddress
                    shippingAddress={orderData?.order?.shippingAddress}
                    deliveryDistance={orderData?.order?.deliveryDistance}
                  />
                )}
              </AppCard>

              {/* If order requires approval, show a notice and a button to view/approve the order */}
              {orderData?.order?._needPaymentApproval ? (
                <div className="tw:bg-yellow-50 tw:border tw:border-yellow-200 tw:text-yellow-800 tw:p-4 tw:rounded tw:mb-4">
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-2">
                    <div>
                      <div className="tw:font-semibold">
                        Payment Approval Pending
                      </div>
                      <div className="tw:text-sm">
                        This order requires payment approval before any
                        processing can continue. Please review and approve the
                        payment from the order view.
                      </div>
                    </div>
                    <div className="tw:self-end">
                      <AppLink
                        asLink
                        href={`/dashboard/orders/view/${orderData?.order?._id}`}
                      >
                        <AppButton color="primary" size="small">
                          Go to Order
                        </AppButton>
                      </AppLink>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* If order requires approval, show a notice and a button to view/approve the order */}
              {orderData?.order?._needToApprove ? (
                <div className="tw:bg-yellow-50 tw:border tw:border-yellow-200 tw:text-yellow-800 tw:p-4 tw:rounded tw:mb-4">
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-2">
                    <div>
                      <div className="tw:font-semibold">
                        Order Approval Pending
                      </div>
                      <div className="tw:text-sm">
                        This order needs approval before any processing can
                        continue. Please review and approve the order first.
                      </div>
                    </div>
                    <div className="tw:self-end">
                      <AppLink
                        asLink
                        href={`/dashboard/orders/view/${orderData?.order?._id}`}
                      >
                        <AppButton color="primary" size="small">
                          Go to Order
                        </AppButton>
                      </AppLink>
                    </div>
                  </div>
                </div>
              ) : null}

              {!orderData?.order?._needPaymentApproval ? (
                <>
                  <RouteInfoBanner
                    customerInfo={orderData?.order?.customerInfo}
                    routeInfo={orderData?.order?.routeInfo}
                    orderType={orderData?.order?.orderType}
                    orderId={orderData?.order?._id}
                    feature="order"
                    onRefresh={() =>
                      fetchOrderDetails({
                        showLoading: true,
                        showToastOnError: true,
                      })
                    }
                  />

                  {!orderData?.order?.pickUpAtStore && (
                    <>
                      <OrderSteps status={orderData?.order?.status} />

                      {/* Order Summary Component */}
                      <OrderSummary
                        order={orderData?.order}
                        onRefresh={() =>
                          fetchOrderDetails({
                            showLoading: true,
                            showToastOnError: true,
                          })
                        }
                      />
                    </>
                  )}

                  {/* Display matched deals if available */}
                  {orderData?.deals && orderData?.deals.length > 0 && (
                    <div className="tw:mt-4">
                      {/* Products Component - Desktop/Mobile responsive view */}
                      <Products
                        data={orderData?.deals}
                        loading={loading}
                        callback={() => {}}
                        orderAmount={orderData?.order._payableAmt}
                      />

                      {/* ItemPickList - show when order is Created */}
                      {(orderData?.order?.status === "Created" ||
                        orderData?.order?.status === "Picking") && (
                        <div className="tw:mt-4">
                          <ItemPickList
                            orderId={orderData?.order?._id}
                            orderItems={orderData?.deals}
                            onPickingConfirmed={handlePickingConfirmed}
                            activePickingId={
                              orderData?.order?.activePicking?.id
                            }
                            pickUpAtStore={orderData?.order?.pickUpAtStore}
                            onPickupConfirm={async (pickingId) => {
                              await fetchOrderDetails({
                                showLoading: false,
                                showToastOnError: false,
                              });
                              setPickupPaymentModal({ show: true, pickingId });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Complete Packing UI Component */}
                  {/* Show CompletePacking when each product has scannedQty > 0 OR when boxes have status "Saved" */}
                  {/* {shouldShowCompletePacking() && (
                    <CompletePacking
                      callback={handleCompletePacking}
                      boxes={boxes}
                      orderId={orderData?.order?._id}
                    />
                  )} */}

                  {/* Generate Invoice Component - Show when all boxes are completed */}
                  {boxes.length > 0 && orderData?.order?.status == "Packed" && (
                    <div ref={invoiceRef}>
                      <GenerateInvoice
                        boxes={boxes}
                        orderId={orderData?.order?._id}
                        callback={handleGenerateInvoice}
                      />
                    </div>
                  )}

                  {/* Ship Component - Show when order status is Invoiced */}
                  {orderData?.order?.status === "Invoiced" && (
                    <div ref={shipRef}>
                      <Ship
                        invoiceRefId={
                          orderData?.order?.invoices?.[0]?.invoiceNumber ||
                          "N/A"
                        }
                        invoiceId={orderData?.order?.invoices?.[0]?.id || "N/A"}
                        invoiceDocumentId={
                          orderData?.order?.invoices?.[0]?.invoiceDocumentId ||
                          null
                        }
                        orderAmount={orderData?.order?.orderAmount}
                        orderId={orderData?.order?._id}
                        orderType={orderData?.order?.orderType}
                        callback={handleShip}
                      />
                    </div>
                  )}

                  {orderData?.order?.status !== "Created" &&
                    orderData?.order?.status !== "Picking" && (
                      <PendingPicking
                        products={orderData?.deals}
                        orderId={orderData?.order?._id}
                        activePickingId={orderData?.order?.activePicking?.id}
                        callback={handlePendingPickingCb}
                      />
                    )}

                  {/* Show Box and ItemPackList only if status is 'Picking' AND CompletePacking is not shown AND quantities are not all matched */}
                  {orderData?.order?.status === "Packing" && (
                    <>
                      <div ref={boxRef}>
                        <Boxing
                          products={orderData?.deals}
                          orderId={orderData?.order?._id}
                          callback={handleCompletePacking}
                          activePickingId={orderData?.order?.activePicking?.id}
                        />
                        {/* <Box
                            boxes={boxes}
                            callback={handleBoxAction}
                            orderId={orderData?.order?._id}
                            products={orderData?.deals}
                          /> */}
                      </div>
                      {/* Items to Pack Component */}
                      {/* {orderData?.deals && orderData?.deals.length > 0 && (
                          <div className="tw:mt-4">
                            <ItemPackList deals={orderData.deals} />
                          </div>
                        )} */}
                    </>
                  )}

                  {["Pending Shipment", "Shipped"].includes(
                    orderData?.order?.status,
                  ) && (
                    <ShippedDetails
                      shipment={
                        orderData?.order?.invoices?.[0]?.shippingDetails
                      }
                      triggerOtpVerify={triggerOtpVerify}
                      onOtpHandled={() => setTriggerOtpVerify({ show: false })}
                      invoiceRefId={
                        orderData?.order?.invoices?.[0]?.invoiceNumber
                      }
                    />
                  )}

                  {/* Completed Boxes Component */}
                  {boxes.length > 0 &&
                    orderData.order.status !== "Packing" &&
                    orderData.order.status !== "Picking" &&
                    !orderData?.order?.pickUpAtStore && (
                      <CompletedBoxes
                        boxes={boxes}
                        deals={orderData?.deals}
                        callback={handleBoxAction}
                      />
                    )}
                </>
              ) : null}
            </div>
          ) : null}

          {/* <MoveToBoxModal orderId={orderData.order._id} show={true} /> */}
        </div>
      </div>

      {pickupPaymentModal.show && (
        <PickupPaymentModal
          show={pickupPaymentModal.show}
          order={orderData.order}
          deals={orderData.deals}
          pickingId={pickupPaymentModal.pickingId}
          callback={(arg) => {
            if (arg.action === "invoiceGenerated") {
              return;
            }
            if (arg.action === "success-close") {
              setPickupPaymentModal({ show: false });
              appNav.to("/dashboard/orders/list?tab=b2c-orders");
              return;
            }
            if (arg.action === "close") {
              setPickupPaymentModal({ show: false });
            }
            if (arg.action === "payNow") {
              setPickupPaymentModal({ show: false });
              setMarkDeliveredModal({
                show: true,
                orderId: orderData.order._id,
              });
            }
          }}
        />
      )}

      {markDeliveredModal.show && (
        <MarkAsDeliveredModal
          show={markDeliveredModal.show}
          orderId={markDeliveredModal.orderId || ""}
          callback={(arg) => {
            if (arg.action === "submit") {
              setMarkDeliveredModal({ show: false });
              appNav.to("/dashboard/orders/list?tab=b2c-orders");
              return;
            }
            setMarkDeliveredModal({ show: false });
            fetchOrderDetails({ showLoading: true, showToastOnError: true });
          }}
        />
      )}
    </>
  );
};

export default OrderProcess;
