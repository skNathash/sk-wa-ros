import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppHeader from "~/components/core/header/AppHeader";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import OmsService from "~/services/OmsService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

const OrderPlacedPage = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<string>("");
  const [poId, setPoId] = useState<string | null>(null);
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);

  const retailerId = searchParams.get("retailer");

  useEffect(() => {
    const fetchOrders = async () => {
      const orderIds = searchParams.get("ids");
      const poIdParam = searchParams.get("poId");
      const type = searchParams.get("type");

      setOrderType(type || "");
      setPoId(poIdParam);

      if (poIdParam) {
        // Fetch purchase order details
        try {
          const poResponse = await PurchaseOrderService.getDetails(poIdParam);
          if (poResponse.data?.data) {
            const formattedData = PurchaseOrderService.formatPurchaseOrderData(
              poResponse.data.data,
            );
            // Transform purchase order data to match expected structure
            const transformedOrder = {
              _id: formattedData.orderId || formattedData._id,
              createdAt: formattedData.createdAt,
              orderAmount: formattedData._totalValue,
              orderId: formattedData.orderId || formattedData._id,
              vendorName: formattedData.vendorDetails?.name,
              status: formattedData.status,
              totalItems: formattedData.items?.length || 0,
              totalQuantity: formattedData._totalQuantity,
            };
            setOrders([transformedOrder]);
          }
        } catch (error) {
          console.error("Failed to fetch purchase order", error);
        } finally {
          setLoading(false);
        }
      } else if (orderIds && type === "buyer") {
        // Only handle buyer orders with orderIds
        try {
          const orderData = await OmsService.getMyOrders({
            filter: {
              _id: {
                $in: orderIds.split(",").map((id) => id.trim()),
              },
            },
          });
          // getMyOrders returns response.data.data
          // Transform buyer order data to match expected structure
          const transformedOrders = orderData.data.data.map((order: any) => ({
            ...order,
            _id: order.orderRefNo,
            createdAt: order.orderDate,
            orderAmount: order.totalAmount || order.orderAmount || 0,
            orderId: order.orderId, // Keep original orderId for navigation
          }));
          setOrders(transformedOrders);
        } catch (error) {
          console.error("Failed to fetch buyer orders", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams]);

  return (
    <>
      <AppHeader title={t("orderPlaced")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {loading && (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner className="tw:w-8 tw:h-8" />
            </div>
          )}

          {!loading &&
          ((!searchParams.get("poId") &&
            !(
              searchParams.get("ids") && searchParams.get("type") === "buyer"
            )) ||
            !orders ||
            orders.length === 0) ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <p className="tw:text-gray-600 tw:text-lg">{t("noDataFound")}</p>
            </div>
          ) : (
            <div className="tw:max-w-3xl tw:w-full tw:mx-auto">
              <div className="tw:bg-white tw:p-6 tw:md:p-12 tw:rounded-xl tw:border tw:border-gray-300 tw:text-center tw:mb-6">
                <div className="tw:mb-8">
                  <CheckCircle className="tw:w-16 tw:h-16 tw:mx-auto tw:text-green-500 tw:mb-4" />
                  <h1 className="tw:text-3xl tw:md:text-4xl tw:font-bold tw:text-gray-800 tw:mb-2">
                    {t("thankYou")}
                  </h1>
                  <p className="tw:text-gray-600 tw:text-lg">
                    {poId
                      ? t("purchaseOrderCreatedSuccessfully")
                      : orderType === "buyer"
                        ? t("orderPlacedDelivered")
                        : t("orderPlacedSuccessfully")}
                  </p>
                </div>

                <div className="tw:mb-8 tw:text-left">
                  <div
                    id="order-summaries-container"
                    className="tw:order-summaries-container tw:space-y-4"
                  >
                    {orders?.map((order, index) => (
                      <div
                        key={index}
                        className="tw:bg-gray-100 tw:p-4 tw:rounded-lg tw:space-y-4 tw:shadow-xs"
                      >
                        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:space-y-2 tw:md:space-y-0">
                          <div>
                            <AppLink
                              onClick={() => {
                                if (poId) {
                                  // Navigate to purchase order view
                                  appNav.to(
                                    `/dashboard/purchase-order/view/${poId}`,
                                  );
                                } else if (orderType === "buyer") {
                                  // Navigate to buyer order view
                                  appNav.to(
                                    `/dashboard/orders/view/${order.orderId}`,
                                  );
                                }
                              }}
                            >
                              <span className="tw:font-medium tw:text-gray-800 tw:text-base tw:text-left">
                                {poId ? t("purchaseOrderId") : t("orderId")}:{" "}
                                {order._id}
                              </span>
                            </AppLink>
                          </div>
                          <span className="tw:font-medium tw:text-gray-800 tw:text-lg">
                            {t("total")}:{" "}
                            <Amount
                              value={order.orderAmount}
                              decimalPlaces={2}
                            />
                          </span>
                        </div>
                        <div className="tw:flex tw:flex-col tw:space-y-2">
                          <span className="tw:text-sm tw:text-gray-600">
                            {t("orderedOn")}:{" "}
                            <DateFormat
                              value={order.createdAt || order.orderedDate}
                            />
                          </span>
                          {poId ? (
                            <span className="tw:text-sm tw:text-gray-600">
                              {t("vendor")}: {order.vendorName}
                            </span>
                          ) : orderType === "buyer" ? (
                            <>
                              <span className="tw:text-sm tw:text-gray-600">
                                {t("paymentMethod")}:{" "}
                                {order.paymentMethod === "PAYLATER"
                                  ? t("paylaterWallet")
                                  : t("cashOnDelivery")}
                              </span>
                              {order.sellerInfo && (
                                <span className="tw:text-sm tw:text-gray-600">
                                  {t("soldBy")}:{" "}
                                  {order.sellerInfo.franchiseName || t("na")}
                                </span>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Always show commission note (smaller font) for all order types */}
                  {/* <div className="tw:mt-3">
                    <span className="tw:text-xs tw:text-gray-500">
                      “Platform Fee” is not charged for this transaction as its
                      purchased from “SK Seller” or “SK Vendor” nominated by
                      StoreKing
                    </span>
                  </div> */}
                </div>
              </div>

              <div className="tw:flex tw:justify-end">
                <AppButton
                  onClick={() => {
                    if (poId) {
                      appNav.to("/dashboard/purchase-order/list");
                    } else if (orderType === "buyer" && !retailerId) {
                      appNav.to("/products/sk");
                    } else if (orderType === "buyer" && retailerId) {
                      appNav.to(
                        "/products/buy-from-other-retailer/retailer/" +
                          retailerId,
                        {
                          retailer: retailerId,
                        },
                      );
                    } else {
                      appNav.to("/products/sk");
                    }
                  }}
                >
                  {poId
                    ? t("viewPurchaseOrders")
                    : orderType === "buyer"
                      ? t("browseMoreProducts")
                      : t("continueShopping")}
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const breadcrumbs = [
  { label: "Home", redirect: { path: "/" }, langKey: "home" },
  { label: "Order Placed", langKey: "orderPlaced" },
];

export default OrderPlacedPage;
