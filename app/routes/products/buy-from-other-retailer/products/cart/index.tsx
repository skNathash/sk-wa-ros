import { ArrowRight, RefreshCw, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import { useSidebar } from "~/components/ui/sidebar";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import CartTab from "~/shared/catalog/components/cart-tab/CartTab";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import Seller from "./components/Seller";
import CartSummary from "./components/CartSummary";
import Summary from "./components/Summary";
import { getData } from "./helper";
import type { SellerData } from "./types";
import {
  ALERT_DISMISS_TIME,
  CART_ITEM_ADDED,
  CART_ITEM_REMOVED,
  DEFAULT_BROWSE_DISTANCE,
} from "~/constants";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Home",
    redirect: {
      path: "/products/main",
    },
  },
  {
    label: "Purchase Cart",
  },
];

const BuyFromOtherRetailerProductsCartPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { to } = useAppNav();
  const { show: showToast } = useAppToast();
  const { setOpen } = useSidebar();

  const [searchParams] = useSearchParams();

  const showTab = searchParams.get("tab") === "1";

  const rawDistance = searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
  const distance: any = rawDistance === "all" ? "all" : Number(rawDistance);

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  const [data, setData] = useState<SellerData[] | null>(null);

  const [loading, setLoading] = useState(true);

  const [userDetails, setUserDetails] = useState<any>(null);

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    msg: string;
  }>({ show: false, msg: "" });

  const [cartAction, setCartAction] = useState<{
    action: string;
    deal: any;
    dealId?: string;
    sellerId?: string;
  }>({ action: "", deal: {}, dealId: "", sellerId: "" });

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb?: () => void;
    cancelCb?: () => void;
  }>({
    show: false,
    title: "",
    description: "",
  });
  const [summary, setSummary] = useState({
    totalMRP: 0,
    subTotal: 0,
    totalDiscount: 0,
    totalAmountBeforeTax: 0,
    savings: 0,
    totalCouponDiscount: 0,
    totalSellers: 0,
    totalItems: 0,
    totalItemsLabel: "0 units",
  });

  const loadCart = async (showBusyLoader = false) => {
    if (showBusyLoader) {
      setBusyLoader({ show: true, msg: "Refreshing cart..." });
    } else {
      setLoading(true);
    }
    try {
      const result = await getData();
      setData(result);
      calculateSummary(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (showBusyLoader) {
        setBusyLoader({ show: false, msg: "" });
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = AuthService.getLoggedInUser();
        setUserDetails(user);
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUserDetails();
  }, []);

  const calculateSummary = (sellerData: SellerData[]) => {
    let totalMRP = 0;
    let subTotal = 0;
    let totalItems = 0;
    const uomEntries: Array<{ uom: string; qty: number }> = [];

    sellerData.forEach((seller) => {
      seller.items.forEach((item) => {
        totalMRP += item.mrp * item.actualQuantity;
        subTotal += item.purchasePrice * item.actualQuantity;
        totalItems += item.actualQuantity;
        uomEntries.push({
          uom: (item as any).selectedStockUom || item.uom || "unit",
          qty: item.actualQuantity || 0,
        });
      });
    });

    const totalItemsLabel =
      CommonService.groupQtyByUom(uomEntries).label || "0 units";

    const totalCouponDiscount = sellerData.reduce(
      (sum, seller) => sum + (seller.couponInfo?.totalCouponDiscount ?? 0),
      0,
    );

    const savings = totalMRP - subTotal;
    const savingsPercentage =
      totalMRP > 0 ? Math.round((savings / totalMRP) * 100) : 0;

    setSummary({
      totalMRP,
      subTotal,
      totalDiscount: savingsPercentage,
      totalAmountBeforeTax: subTotal, // Assuming no tax calculation here, similar to the other cart
      savings,
      totalCouponDiscount,
      totalSellers: sellerData.length,
      totalItems,
      totalItemsLabel,
    });
  };

  const handleRemoveSellerCart = async (seller: SellerData) => {
    setBusyLoader({ show: true, msg: "Removing cart from cart..." });
    try {
      const response = await CartService.deleteMyCart(seller._id);
      if (response.statusCode === 200) {
        showToast({
          msg: "Cart removed successfully",
          color: "success",
        });
        const result = await getData();
        setData(result);
        calculateSummary(result);
      } else {
        showToast({
          msg: response.data?.message || "Failed to remove cart from cart",
          color: "danger",
        });
      }
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleCartAction = async ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "updateRoute") {
      // update the local data state with the selected route info for the cart
      setData((prev) => {
        if (!prev) return prev;
        return prev.map((seller) => {
          if (seller._id === data.cartId) {
            const hasRoute =
              data.routeId !== undefined ||
              data.routeRefId !== undefined ||
              data.deliveryDate !== undefined ||
              data.routeCode !== undefined ||
              data.description !== undefined;

            return {
              ...seller,
              selectedRoute: hasRoute
                ? {
                    routeId: data.routeId,
                    routeRefId: data.routeRefId,
                    deliveryDate: data.deliveryDate,
                    routeCode: data.routeCode,
                    description: data.description,
                  }
                : undefined,
            };
          }
          return seller;
        });
      });
      return;
    }
    if (action === "price-slab") {
      setCartAction({
        action: "price-slab",
        deal: null,
        dealId: data?.dealId || "",
        sellerId: data?.sellerId || "",
      });
      return;
    }

    if (action === "removeCart") {
      setAppAlertDialog({
        show: true,
        title: "Remove Cart",
        description: `Are you sure you want to remove "${data.franchiseInfo.name}" cart?`,
        successCb: async () => {
          setAppAlertDialog((prev) => ({ ...prev, show: false }));
          await new Promise((resolve) =>
            setTimeout(resolve, ALERT_DISMISS_TIME),
          );
          handleRemoveSellerCart(data);
        },
        cancelCb: () => {
          setAppAlertDialog((prev) => ({ ...prev, show: false }));
        },
      });
      return;
    }

    if (action === "remove") {
      setBusyLoader({ show: true, msg: "Removing item from cart..." });
      try {
        const params = {
          cartId: data.cartId,
          itemId: data.deal.itemId,
        };
        const response = await PosService.removeItemFromCart(params);
        if (response.statusCode === 200) {
          showToast({
            msg: "Item removed successfully",
            color: "success",
          });

          // Clear local cart
          CartService.removeFromCart(data.deal.deal.refId, data.sellerId);
          // Re-fetch cart data
          const result = await getData();
          setData(result);
          calculateSummary(result);
        } else {
          showToast({
            msg: response.data?.message || "Failed to remove item from cart",
            color: "danger",
          });
        }
      } catch (error: any) {
        console.error("Error removing item:", error);
        showToast({
          msg: error?.message || "Failed to remove item from cart",
          color: "danger",
        });
      } finally {
        setBusyLoader({ show: false, msg: "" });
      }
    } else if (action === CART_ITEM_ADDED || action === CART_ITEM_REMOVED) {
      // Refresh data when item is added/updated/removed via AddToCart component
      const result = await getData();
      setData(result);
      calculateSummary(result);
    } else if (action === "couponApplied" || action === "couponRemoved") {
      // Re-fetch the cart so the summary reflects the server-computed coupon
      // discount. The apply/remove response doesn't return the discount in the
      // shape the UI reads (totalCouponDiscount), so an optimistic update would
      // show the coupon chip but leave the payable unchanged.
      const result = await getData();
      setData(result);
      calculateSummary(result);
    } else if (action === "paylaterRequested") {
      // Paylater request sent to a seller — refetch so that seller's payment
      // chip flips from "request" to "pending".
      const result = await getData();
      setData(result);
      calculateSummary(result);
    } else if (action === "updateSelectedPayment") {
      // data: { sellerId, selectedPayment }
      try {
        const { sellerId, selectedPayment } = data || {};
        if (!sellerId) return;
        setData((prev) => {
          if (!prev) return prev;
          return prev.map((seller) => {
            if (seller._id === sellerId) {
              return { ...seller, selectedPayment };
            }
            return seller;
          });
        });
      } catch (err) {
        console.error("Failed to update selected payment:", err);
      }
    }
  };

  const handleMakePayment = () => {
    if (!data || data.length === 0) {
      showToast({
        msg: "No items in cart to checkout.",
        color: "danger",
      });
      return;
    }

    if (!userDetails) {
      showToast({
        msg: "User details not found. Please try again.",
        color: "danger",
      });
      return;
    }

    // Validate that each seller has selected payment data
    const sellersMissingPayment = data.filter(
      (seller) => !seller.selectedPayment,
    );
    if (sellersMissingPayment.length > 0) {
      showToast({
        msg: "Please select payment method for all sellers before proceeding.",
        color: "danger",
      });
      return;
    }

    // Check minimum cart value for each seller
    // const unsatisfiedSellers = data.filter((seller) => {
    //   const subtotal = seller.items.reduce(
    //     (sum, item) => sum + item.purchasePrice * item.quantity,
    //     0
    //   );
    //   return subtotal < seller.minCartValue;
    // });

    // if (unsatisfiedSellers.length > 0) {
    //   const messages = unsatisfiedSellers.map((seller) => {
    //     const subtotal = seller.items.reduce(
    //       (sum, item) => sum + item.purchasePrice * item.quantity,
    //       0
    //     );
    //     const amountNeeded = seller.minCartValue - subtotal;
    //     return `Add ₹${amountNeeded} more from ${seller.franchiseInfo.name}`;
    //   });
    //   showToast({
    //     msg: messages.join(". "),
    //     color: "danger",
    //   });
    //   return;
    // }

    setAppAlertDialog({
      show: true,
      title: "Confirm Checkout",
      description: "Are you sure you want to proceed with the checkout?",
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, ALERT_DISMISS_TIME));
        handleBulkCheckout();
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleBulkCheckout = async () => {
    const cartPayloads =
      data?.map((seller) => {
        const paymentType = seller.selectedPayment?.paymentType || "COD";
        const orderData: any = {
          paymentType: paymentType === "PAYLATER" ? "POSTPAID" : paymentType,
          paymentMethod: paymentType,
        };

        if (paymentType === "PREPAID") {
          const pm = (seller.selectedPayment?.paymentMode || {}) as any;
          orderData.remarks = pm.remarks || "";
          orderData.paymentMode = [
            {
              type: "UPI",
              paidVia: pm.paidVia || pm.type || "",
              refNo: pm.methodId || "",
              paymentTransactionId: pm.referenceNumber || "",
              proof: pm.proof || [],
              amount: Number(pm.amount) || 0,
              paidAmount: Number(pm.amount) || 0,
              change: 0,
            },
          ];
        }

        if (seller.selectedRoute?.routeId) {
          orderData.routeInfo = {
            routeId: seller.selectedRoute.routeId,
            deliveryDate: seller.selectedRoute.deliveryDate,
          };
        }

        if (seller.couponInfo?.couponApplied && seller.couponInfo.code) {
          orderData.couponCode = seller.couponInfo.code;
        }

        return {
          cartId: seller._id,
          orderData,
        };
      }) || [];

    setBusyLoader({ show: true, msg: "Processing checkout..." });

    try {
      const response = await SellerCatalogService.bulkCheckout(
        cartPayloads,
        userDetails,
      );

      if (response && response.statusCode === 200) {
        const errors = response.data?.errors;
        // success only when errors array exists and is empty
        if (Array.isArray(errors) && errors.length === 0) {
          showToast({
            msg: response.data?.msg || "Checkout successful!",
            color: "success",
          });

          CartService.clearCartLocal();

          const orderIds: string[] = [];
          response.data?.data?.results?.forEach((result: any) => {
            if (result.order?.orderId) orderIds.push(result.order.orderId);
            if (result.reserveOrder?.orderId)
              orderIds.push(result.reserveOrder.orderId);
          });

          // Refresh the cart data
          const refreshed = await getData();
          setData(refreshed);
          calculateSummary(refreshed);

          to("/products/buy-from-other-retailer/products/order-success", {
            ids: orderIds.join(","),
          });
        } else {
          const errMsg = Array.isArray(errors)
            ? errors.map((e: any) => e?.message || e).join(", ")
            : response?.data?.message || "Checkout failed. Please try again.";

          showToast({
            msg: errMsg,
            color: "danger",
          });
        }
      } else {
        showToast({
          msg: response?.data?.message || "Checkout failed. Please try again.",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Bulk checkout error:", error);
      showToast({
        msg: error?.message || "Checkout failed. Please try again.",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleClearCart = () => {
    if (!data || data.length === 0) {
      showToast({
        msg: "No items in cart to clear.",
        color: "danger",
      });
      return;
    }

    setAppAlertDialog({
      show: true,
      title: "Clear Cart",
      description:
        "Are you sure you want to remove all items from your cart? This action cannot be undone.",
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, ALERT_DISMISS_TIME));
        handleBulkClearCart();
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleBulkClearCart = async () => {
    setBusyLoader({ show: true, msg: "Clearing cart..." });

    try {
      // Collect cart IDs from the data
      const cartIds = data!.map((seller) => seller._id);

      const response = await CartService.clearBulkCart(cartIds);

      if (response && response.statusCode === 200) {
        showToast({
          msg: "Cart cleared successfully!",
          color: "success",
        });

        // Clear local cart storage as well
        try {
          CartService.clearCartLocal();
        } catch (e) {
          console.error("Error clearing local cart storage:", e);
        }

        // Refresh the cart data
        const result = await getData();
        setData(result);
        calculateSummary(result);
      } else {
        showToast({
          msg:
            response?.data?.message ||
            "Failed to clear cart. Please try again.",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Bulk clear cart error:", error);
      showToast({
        msg: error?.message || "Failed to clear cart. Please try again.",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  return (
    <>
      <AppHeader title="Purchase Cart" />
      <div
        className={`app-page page-bg tw:p-4 ${data && data.length > 0 ? "has-footer cart-has-checkout-footer" : ""}`}
      >
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="sellers"
            noShadow
            sticky
          /> */}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="sellers"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

              {showTab ? (
                <>
                  {/* <CartTab activeTab="others" className="edge-tabs tw:mb-2" /> */}
                  <div
                    className="hide-in-theme-2 tw:text-xs tw:text-gray-500 tw:mb-4"
                    aria-live="polite"
                  >
                    List of products added to cart from other retailers
                  </div>
                </>
              ) : null}

              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Capped and centred: with the summary rail hidden the cart is
                    a single column, and left to fill a wide monitor the seller
                    rows stretched far past a comfortable reading measure. */}
                <AppPaneMain className="tw:lg:col-span-12 tw:w-full tw:max-w-6xl tw:mx-auto">
                  {loading && (
                    <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                      <AppSpinner className="tw:w-8 tw:h-8" />
                    </div>
                  )}

                  {data && data.length > 0 ? (
                    <>
                      {/* Top-level cart summary strip — owns its own
                          calculations from the cart data. */}
                      <div className="tw:mb-3">
                        <CartSummary sellers={data} />
                      </div>

                      {/* Two explicit rows at md+: both headings share row 1 and
                          both card stacks share row 2, so the columns stay level
                          no matter how tall either heading renders. Below md the
                          grid is a single column and DOM order takes over. */}
                      <div className="cart-thread-grid tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:md:grid-rows-[auto_1fr] tw:gap-x-2 tw:md:gap-x-6 tw:lg:gap-x-6 tw:gap-y-1">
                        {/* Threads column heading. Just the label and the two
                            list-wide actions: the seller count is the first
                            cell of the digest plate directly above, and the
                            quantity is a row of the summary card — repeating
                            both here only crowded the line. Refresh drops to
                            its icon so "Clear cart" is the one worded action. */}
                        <div className="tw:flex tw:items-center tw:gap-2 tw:md:col-start-1 tw:md:row-start-1">
                          <div className="app-section-label tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                            {t("sellers", { defaultValue: "Sellers" })}
                          </div>
                          {/* Actions hug their own heading instead of the column
                              edge — pushed right they landed against the summary
                              heading and the two columns read as one crowded row.
                              On phones the single-column grid puts them back at
                              the far edge, where there's no neighbour to collide
                              with. */}
                          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:ml-auto tw:md:ml-0">
                            <AppButton
                              onClick={() => loadCart(true)}
                              disabled={busyLoader.show}
                              size="small"
                              fill="clear"
                              className="tw:text-slate-500"
                              title={t("refresh")}
                            >
                              <RefreshCw
                                size={16}
                                className={busyLoader.show ? "tw:animate-spin" : ""}
                              />
                              {/* Icon-only on phones, where the row is tight;
                                  the word returns once there's room for it. */}
                              <span className="tw:hidden tw:sm:inline">
                                {t("refresh")}
                              </span>
                            </AppButton>
                            <AppButton
                              onClick={handleClearCart}
                              size="small"
                              fill="clear"
                              className="tw:text-red-600"
                            >
                              {t("clearCart")}
                            </AppButton>
                          </div>
                        </div>

                        {/* Cart Items */}
                        <div className="tw:md:col-start-1 tw:md:row-start-2">
                          {data.map((seller) => (
                            <Seller
                              key={seller.franchiseInfo.id}
                              seller={seller}
                              callback={handleCartAction}
                            />
                          ))}
                        </div>

                        {/* Order-summary rail. Theme-2 desktop drops it (see
                            `.cart-thread-grid` in theme-2.css): each seller
                            thread now states its own payable in its header, and
                            the checkout total lives with the action. */}
                        <div className="theme-2-desktop-hide tw:flex tw:items-center tw:gap-2 tw:md:col-start-2 tw:md:row-start-1">
                          <div className="app-section-label tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                            {t("orderSummary", { defaultValue: "Order summary" })}
                          </div>
                        </div>

                        <div className="theme-2-desktop-hide tw:md:col-start-2 tw:md:row-start-2 tw:lg:sticky tw:lg:top-20 tw:lg:self-start">
                          <Summary
                            totalMRP={summary.totalMRP}
                            subTotal={summary.subTotal}
                            totalDiscount={summary.totalDiscount}
                            totalAmountBeforeTax={summary.totalAmountBeforeTax}
                            savings={summary.savings}
                            totalCouponDiscount={summary.totalCouponDiscount}
                            totalItemsLabel={summary.totalItemsLabel}
                            totalSellers={summary.totalSellers}
                            // Desktop CTA lives inside the card so the payable
                            // total and the action that commits it read as one
                            // block. Hidden below md by CSS — the same
                            // breakpoint the sticky footer appears at — so the
                            // cart never shows two checkout buttons at once.
                            action={
                              <div className="tw:hidden tw:md:block">
                                <AppButton
                                  fill="solid"
                                  size="large"
                                  className="tw:w-full tw:h-12 tw:font-semibold"
                                  onClick={handleMakePayment}
                                >
                                  {t("proceedToCheckout")}
                                </AppButton>
                              </div>
                            }
                          />
                        </div>
                      </div>

                    </>
                  ) : null}

                  {!loading && (!data || data.length === 0) && (
                    <AppCard className="app-thread">
                      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full tw:gap-4 tw:my-10">
                        <div className="tw:text-center">
                          <span className="tw:inline-flex tw:h-20 tw:w-20 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/5">
                            <ShoppingCart
                              className="tw:text-primary/50"
                              size={40}
                            />
                          </span>
                          <div className="tw:mt-3 tw:text-lg tw:font-semibold">
                            Your cart is empty
                          </div>
                          <div className="tw:mt-1 tw:text-sm tw:text-gray-500">
                            Browse products and add them to your cart.
                          </div>
                        </div>
                        <AppButton
                          fill="solid"
                          className="tw:w-auto"
                          onClick={() => to("/products/main")}
                        >
                          Shop Now
                        </AppButton>
                      </div>
                    </AppCard>
                  )}
                </AppPaneMain>
              </div>
            </div>
          </div>
        </div>
      </div>
      {data && data.length > 0 && (
        // Sticky action bar carrying the payable and the action that commits
        // it. `app-composer` gives theme-2 the composer's white strip and lift;
        // the total and the action are left to sit on it plainly — a capsule
        // around the total only turned it into a slab. A phone affordance in
        // the base theme; theme-2 desktop shows it too, closing the cart here
        // now that the order-summary rail is dropped (see theme-2.css).
        <div className="app-footer app-composer cart-checkout-footer">
          <div className="tw:mx-auto tw:flex tw:max-w-6xl tw:gap-3 tw:justify-between tw:items-center">
            <div className="tw:flex tw:min-w-0 tw:flex-col tw:leading-tight">
              <span className="tw:text-[11px] tw:text-gray-500">
                {t("total")}
              </span>
              <span className="tw:text-lg tw:font-bold tw:text-primary tw:tabular-nums tw:lg:text-xl">
                <Amount
                  value={Math.max(
                    summary.subTotal - summary.totalCouponDiscount,
                    0,
                  )}
                  decimalPlaces={2}
                />
              </span>
              {/* Basket makeup only where there is room for it — on a phone the
                  strip is just the total and the action. */}
              <span className="tw:hidden tw:lg:block tw:text-[11px] tw:text-gray-500">
                {summary.totalItemsLabel} · {summary.totalSellers}{" "}
                {t("sellers", { defaultValue: "sellers" })}
              </span>
            </div>
            {/* Kept to a 40px tap target, not sized to fill the strip — the
                total is what the bar is for, the action just closes it. */}
            <AppButton
              fill="solid"
              size="small"
              className="tw:h-10 tw:shrink-0 tw:rounded-full tw:px-4 tw:text-sm tw:font-semibold tw:gap-1.5 tw:lg:px-5"
              onClick={handleMakePayment}
            >
              <span className="tw:lg:hidden">{t("checkout")}</span>
              <span className="tw:hidden tw:lg:inline">
                {t("proceedToCheckout")}
              </span>
              <ArrowRight size={15} />
            </AppButton>
          </div>
        </div>
      )}
      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <AddToCartActionHandler
        deal={cartAction.deal}
        action={cartAction.action}
        callback={async (e) => {
          setCartAction({ action: "", deal: {}, dealId: "", sellerId: "" });
          // refresh cart to reflect any slab-driven price/quantity changes
          const result = await getData();
          setData(result);
          calculateSummary(result);
        }}
        sellerId={cartAction.sellerId}
        dealId={cartAction.dealId}
      />
    </>
  );
};

export default BuyFromOtherRetailerProductsCartPage;
