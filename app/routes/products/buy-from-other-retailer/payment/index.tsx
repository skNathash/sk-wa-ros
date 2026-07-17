import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppSteps from "~/components/core/steps/AppSteps";
import Divider from "~/components/core/divider/Divider";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import { Check, ShoppingCart } from "lucide-react";
import OmsService from "~/services/OmsService";
import FranchiseService from "~/services/FranchiseService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
// Removed Payments component as per change request
import PrepaidInfoModal from "~/shared/configs/modals/PrepaidInfoModal";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import KeyValue from "~/components/core/key-value/KeyValue";
import Items from "./components/Items";

const breadcrumbData: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/main" } },
  { label: "Payment" },
];

const paymentSteps = [
  {
    key: "order_placed",
    title: "Order Placed",
    icon: "check-circle",
  },
  {
    key: "payment",
    title: "Complete Payment",
    icon: "credit-card",
  },
];

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const appNav = useAppNav();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hadOrders, setHadOrders] = useState(false);
  const [prepaidModal, setPrepaidModal] = useState<{
    show: boolean;
    paymentOptions: any[];
    orderAmount?: number | null;
    orderId?: string | number | null;
  }>({ show: false, paymentOptions: [], orderAmount: null, orderId: null });
  const [successOrders, setSuccessOrders] = useState<any[]>([]);
  const [fetchingSuccess, setFetchingSuccess] = useState(false);

  const appToast = useAppToast();

  const ids = searchParams.get("ids") || "";

  const isPrepaidOrder = (o: any) => {
    try {
      const pt = (o?.paymentMethod || "").toString().toUpperCase();
      if (["PREPAID"].includes(pt)) return true;
    } catch (e) {
      // ignore
    }

    return false;
  };

  const isReadyForPayment = (o: any) => {
    // Consider prepaid orders ready for payment. Also consider orders
    // whose payment status is not 'Paid' or 'Approved' as ready.
    if (isPrepaidOrder(o)) return true;
    const lbl = (o?._paymentStatusLbl || "").toString();
    if (!lbl) return true;
    return !/paid|approved/i.test(lbl);
  };

  useEffect(() => {
    const idsArray = (ids || "").split(",").map((id: string) => id.trim());

    if (idsArray && idsArray.length > 0) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res: any = await OmsService.getMyOrders({
            filter: {
              _id: { $in: idsArray },
              "paymentMode.approvalStatus": { $nin: ["Pending"] },
            },
          });
          let formatted = OmsService.formatOrderResponse(res?.data.data || []);

          try {
            const sellerIds = Array.from(
              new Set(
                formatted
                  .map((o: any) => o.sellerInfo?.franchiseId)
                  .filter((f: any) => f),
              ),
            );

            if (sellerIds.length > 0) {
              const cfgRes: any =
                await FranchiseService.getActiveOrderConfigs(sellerIds);
              const cfgs = cfgRes?.data?.data || [];
              const cfgMap: Record<string, any> = {};

              if (Array.isArray(cfgs)) {
                cfgs.forEach((c: any) => {
                  const fid = c?.franchiseInfo?.id;
                  cfgMap[fid] = c;
                });
              }

              formatted = formatted.map((o: any) => {
                const fid = o.sellerInfo?.franchiseId;
                const cfg = cfgMap[fid] || {};
                const paymentOptions = cfg?.paymentMethodConfig || [];

                return {
                  ...o,
                  sellerInfo: {
                    ...(o.sellerInfo || {}),
                    paymentOptions: paymentOptions,
                  },
                };
              });
            }
          } catch (e) {
            // ignore and continue with formatted orders
          }

          // Sort orders so those ready for payment appear first
          try {
            formatted.sort((a: any, b: any) => {
              const aReady = isReadyForPayment(a);
              const bReady = isReadyForPayment(b);
              if (aReady && !bReady) return -1;
              if (!aReady && bReady) return 1;
              return 0;
            });
          } catch (e) {
            // ignore sort errors and proceed
          }

          setOrders(formatted);
          if (formatted.length > 0) {
            setHadOrders(true);
          }
        } catch (err) {
          // ignore for now
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    if (
      hadOrders &&
      orders.length === 0 &&
      !loading &&
      ids &&
      successOrders.length === 0 &&
      !fetchingSuccess
    ) {
      const fetchSuccessDetails = async () => {
        setFetchingSuccess(true);
        try {
          const idsArray = ids.split(",").map((id) => id.trim());
          const res: any = await OmsService.getMyOrders({
            filter: { _id: { $in: idsArray } },
          });
          setSuccessOrders(res?.data?.data || []);
        } catch (e) {
          // ignore
        } finally {
          setFetchingSuccess(false);
        }
      };
      fetchSuccessDetails();
    }
  }, [
    orders.length,
    hadOrders,
    loading,
    ids,
    successOrders.length,
    fetchingSuccess,
  ]);

  return (
    <>
      <AppHeader title="Complete Payment" />
      <div className="app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbData} />

          {!(hadOrders && orders.length === 0 && !loading) && (
            <div className="tw:flex tw:justify-center tw:mb-6">
              <InfoBlock
                variant="success"
                size="sm"
                bordered={true}
                className="tw:w-full tw:max-w-2xl tw:px-4 tw:py-3 tw:flex tw:items-center tw:gap-3"
              >
                <div className="tw:bg-green-100 tw:p-1.5 tw:rounded-full tw:flex tw:items-center tw:justify-center">
                  <Check className="tw:text-green-600" size={18} />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-bold tw:text-green-900">
                    Order Successfully Placed!
                  </div>
                  <div className="tw:text-[11px] tw:text-green-700 tw:mt-0.5">
                    Your order has been recorded. Please complete the payment to
                    proceed further
                  </div>
                </div>
              </InfoBlock>
            </div>
          )}

          {/* Payment Steps */}
          <div className="tw:flex tw:justify-center">
            <AppSteps
              steps={paymentSteps}
              activeKey="payment"
              className=""
              borderMinWidth={80}
            />
          </div>

          {/* Payment Success Block - shown when all orders are paid */}
          {!loading && hadOrders && orders.length === 0 ? (
            <div className="tw:flex tw:justify-center tw:mt-8">
              <AppCard className="tw:w-full tw:max-w-2xl tw:text-center tw:py-8">
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
                  <div className="tw:bg-green-100 tw:p-4 tw:rounded-full tw:flex tw:items-center tw:justify-center">
                    <Check className="tw:text-green-600" size={48} />
                  </div>
                  <div>
                    <div className="tw:text-2xl tw:font-bold tw:text-gray-900 tw:mb-2">
                      Payment Completed Successfully!
                    </div>
                    <div className="tw:text-sm tw:text-gray-600">
                      All payments have been completed. Your orders are now
                      being processed.
                    </div>
                  </div>

                  {fetchingSuccess ? (
                    <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:my-4">
                      <div className="tw:w-6 tw:h-6 tw:border-2 tw:border-blue-600 tw:border-t-transparent tw:rounded-full tw:animate-spin"></div>
                      <div className="tw:text-[10px] tw:text-gray-400">
                        Fetching order details...
                      </div>
                    </div>
                  ) : (
                    successOrders.length > 0 && (
                      <div className="tw:w-full tw:max-w-md tw:mt-4 tw:text-left">
                        <div className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:mb-3 tw:tracking-wider tw:px-1">
                          Payment Summary
                        </div>
                        <div className="tw:space-y-3">
                          {successOrders.map((order: any) => (
                            <div
                              key={order._id}
                              className="tw:bg-gray-50 tw:border tw:border-gray-100 tw:rounded-xl tw:p-4 tw:shadow-sm"
                            >
                              <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
                                <div>
                                  <div className="tw:text-[9px] tw:text-gray-400 tw:font-bold tw:uppercase tw:mb-0.5">
                                    Seller
                                  </div>
                                  <div className="tw:text-sm tw:font-bold tw:text-gray-800">
                                    {order.sellerInfo?.franchiseName}
                                  </div>
                                </div>
                                <div className="tw:text-right">
                                  <div className="tw:text-[9px] tw:text-gray-400 tw:font-bold tw:uppercase tw:mb-0.5">
                                    Total Amount
                                  </div>
                                  <Amount
                                    value={order.orderAmount}
                                    className="tw:text-sm tw:font-black tw:text-gray-900"
                                  />
                                </div>
                              </div>

                              <div className="tw:pt-3 tw:border-t tw:border-gray-200/60">
                                {order.paymentMode &&
                                order.paymentMode.length > 0 ? (
                                  <div className="tw:space-y-2">
                                    {order.paymentMode.map(
                                      (pm: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="tw:flex tw:justify-between tw:items-center"
                                        >
                                          <div className="tw:flex tw:flex-col">
                                            <span className="tw:text-[11px] tw:font-bold tw:text-gray-700">
                                              {pm.paidVia}
                                            </span>
                                            {pm.refNo && (
                                              <span className="tw:text-[10px] tw:text-gray-500">
                                                Ref: {pm.refNo}
                                              </span>
                                            )}
                                          </div>
                                          <div className="tw:flex tw:flex-col tw:items-end">
                                            <span className="tw:text-[9px] tw:text-gray-400 tw:uppercase tw:font-bold">
                                              Paid
                                            </span>
                                            <Amount
                                              value={pm.paidAmount}
                                              className="tw:text-xs tw:font-bold tw:text-green-600"
                                            />
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  <div className="tw:flex tw:justify-between tw:items-center">
                                    <span className="tw:text-[11px] tw:font-bold tw:text-gray-700">
                                      Paid Amount
                                    </span>
                                    <Amount
                                      value={order.orderAmount}
                                      className="tw:text-xs tw:font-bold tw:text-green-600"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <AppButton
                    color="primary"
                    fill="solid"
                    onClick={() => appNav.to("/products/main")}
                    className="tw:mt-6"
                  >
                    <ShoppingCart size={18} className="tw:mr-2" />
                    Continue Shopping
                  </AppButton>
                </div>
              </AppCard>
            </div>
          ) : null}

          {/* Show orders list and loading states only when not in success state */}
          {!(hadOrders && orders.length === 0 && !loading) && (
            <>
              {loading ? (
                <div className="tw:grid tw:grid-cols-1 tw:md:tw:grid-cols-2 tw:gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <AppCard key={`skeleton-${idx}`} noPadding={true}>
                      <div className="tw:px-4 tw:py-3 tw:flex tw:items-start tw:animate-pulse">
                        <div className="tw:flex-1">
                          <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-32 tw:mb-2"></div>
                          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                        </div>
                        <div className="tw:w-24">
                          <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                        </div>
                      </div>
                      <Divider className="tw:my-0!" />
                      <div className="tw:px-4 tw:py-3 tw:flex tw:items-center">
                        <div className="tw:flex-1">
                          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20 tw:mt-2"></div>
                        </div>
                        <div>
                          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-12"></div>
                        </div>
                      </div>
                    </AppCard>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div
                  className={`tw:grid tw:grid-cols-1 ${
                    orders.length === 1
                      ? "tw:md:grid-cols-1"
                      : "tw:md:grid-cols-2"
                  } tw:gap-4`}
                >
                  {orders.map((item) => (
                    <AppCard
                      key={item.orderId}
                      noPadding={true}
                      className="tw:overflow-hidden tw:border-gray-200"
                    >
                      <div className="tw:p-4 tw:bg-gray-50/50">
                        <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
                          <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-widest">
                            Order #{item.orderRefNo ?? item.orderId}
                          </span>
                          {item.orderDate && (
                            <span className="tw:text-[10px] tw:font-medium tw:text-gray-500">
                              {new Date(item.orderDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <KeyValue label="Seller Name" size="sm">
                          <div className="tw:font-bold tw:text-gray-900 tw:text-base">
                            {item.sellerInfo.franchiseName}
                          </div>
                        </KeyValue>
                      </div>

                      <Divider className="tw:my-0!" />

                      <Items data={item.items} />

                      <div className="tw:p-4 tw:flex tw:justify-between tw:items-center tw:bg-blue-50/30">
                        <div>
                          <div className="tw:text-[10px] tw:font-bold tw:text-blue-600 tw:uppercase tw:tracking-wider">
                            Net Payable Amount
                          </div>
                          <div className="tw:text-[10px] tw:text-gray-400">
                            Inclusive of all charges
                          </div>
                        </div>
                        <Amount
                          value={item._payableAmt}
                          decimalPlaces={2}
                          className="tw:text-lg tw:font-black tw:text-gray-900"
                        />
                      </div>
                      <Divider className="tw:my-0!" />

                      <div className="tw:p-4">
                        <div className="tw:flex tw:justify-between tw:items-center tw:gap-4">
                          <div className="tw:text-sm tw:text-gray-700 tw:font-medium">
                            {item.paymentMethod}
                          </div>
                          <div>
                            {isPrepaidOrder(item) ? (
                              <AppButton
                                color="primary"
                                fill="solid"
                                onClick={() =>
                                  setPrepaidModal({
                                    show: true,
                                    paymentOptions:
                                      item.sellerInfo?.paymentOptions || [],
                                    orderAmount: item._payableAmt,
                                    orderId: item.orderId,
                                  })
                                }
                              >
                                Complete Payment
                              </AppButton>
                            ) : (
                              <div className="tw:text-right">
                                <div className="tw:text-xs tw:text-gray-500">
                                  Payment not available —{" "}
                                  {item.paymentMethod || "-"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AppCard>
                  ))}
                </div>
              ) : (
                <AppCard>
                  <NoData />
                </AppCard>
              )}
            </>
          )}
        </div>
      </div>

      <PrepaidInfoModal
        show={prepaidModal.show}
        callback={(a: { action: string; data: any }) => {
          // close first
          if (a.action === "close") {
            setPrepaidModal((s) => ({ ...s, show: false }));
            return;
          }

          if (a.action === "success") {
            setPrepaidModal((s) => ({ ...s, show: false }));
            // find order and mark as paid in UI (simple removal)
            const id = prepaidModal.orderId;
            setOrders((prev) => prev.filter((o) => o.orderId !== id));
            appToast.show({
              msg: "Payment details submitted",
              color: "success",
            });
          }
        }}
        paymentOptions={prepaidModal.paymentOptions}
        orderAmount={prepaidModal.orderAmount || undefined}
        orderId={prepaidModal.orderId}
      />
    </>
  );
};

export default PaymentPage;
