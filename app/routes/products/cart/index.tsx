import { ArrowRight, MapPin, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import type { BreadcrumbItem, BuyCartType } from "~/types/CommonTypes";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import PaylaterService from "~/services/PaylaterService";
import PaymentService from "~/services/PaymentService";
import MiscService from "~/services/MiscService";
import { EVENTS } from "~/constants";
import PaylaterRequestCard from "~/shared/accounts/components/paylater/paylater-req-card/PaylaterRequestCard";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CartItem from "./components/CartItem";
import SellerInfo from "./components/SellerInfo";
import Summary from "./components/Summary";
import {
  getCartDetails,
  proceedBuyerCartCheckout,
  removeCartItem,
} from "./helper";
import PaymentOptionModal from "./modals/PaymentOptionModal";
import CartTermsModal from "./overview/modals/CartTermsModal";
import { useTranslation } from "react-i18next";
import CartTab from "~/shared/catalog/components/cart-tab/CartTab";
import DateFormat from "~/components/core/date/DateFormat";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    blockForMasterLogin: true,
  });
}

const Cart = () => {
  const { t } = useTranslation(["common", "menu"]);

  const [searchParams] = useSearchParams();

  const retailerId = searchParams.get("retailer");

  // Buying from another retailer (retailer param present) belongs to the
  // "Buy from Network" tab; otherwise this is the StoreKing cart.
  const sectionActiveTab = retailerId ? "sellers" : "buy-from-sk";

  const showTab = searchParams.get("tab") === "1";

  // AppAlertDialog state
  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
  });

  const [loading, setLoading] = useState(true);
  const { show: showToast } = useAppToast();
  const { to } = useAppNav();
  const [busyloader, setBusyLoader] = useState({ show: false, msg: "" });
  const [deals, setDeals] = useState<Array<any>>([]);
  const [cartId, setCartId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalMRP: 0,
    subTotal: 0,
    totalDiscount: 0,
    totalAmountBeforeTax: 0,
    savingsPercentage: 0,
    savings: 0,
  });

  const [userDetails, setUserDetails] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const [pdpDate, setPdpDate] = useState<Date | null>(null);
  const [termsModal, setTermsModal] = useState({ show: false });

  const [paymentOptionModal, setPaymentOptionModal] = useState<{
    show: boolean;
    orderAmount: number;
    availableLimit: number;
  }>({ show: false, orderAmount: 0, availableLimit: 0 });

  const totalItems = deals.reduce(
    (count, item) => count + (item.inCart?.qty || 0),
    0,
  );

  const cartType: BuyCartType = retailerId
    ? "buy-from-other-retailer"
    : AuthService.getCartType();

  const getEffectiveCartType = (): BuyCartType => {
    return retailerId ? "buy-from-other-retailer" : AuthService.getCartType();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cartType = getEffectiveCartType();

        const res = await getCartDetails(cartType, retailerId || "");
        setDeals(res.deals);
        setSummary(res.summary);
        setCartId(res.cartId || "");
        setError(null);

        if (cartType === "normal") {
          try {
            setShowTermsAndConditions(true);

            const pdpResp = await CommonService.getPdpDate(
              AuthService.getLoggedInUserId(true) || "",
            );

            if (pdpResp.statusCode === 200) {
              setPdpDate(new Date(pdpResp.data?.nextPdpDate));
            }
          } catch (e) {
            // ignore; terms won't be shown
          }
        }
      } catch (err) {
        console.error("Error fetching cart data:", err);
        setError("Failed to load cart items. Please try again.");
        showToast({
          msg: "Failed to load cart items. Please try again.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [retailerId]);

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

  const refreshCartDetails = async () => {
    try {
      setBusyLoader({ show: true, msg: "Refreshing cart details..." });
      const cartType = getEffectiveCartType();
      const res = await getCartDetails(cartType, retailerId || "");
      setDeals(res.deals);
      setSummary(res.summary);
      setError(null);
      setCartId(res.cartId || "");
    } catch (err) {
      console.error("Error refreshing cart data:", err);
      setError("Failed to refresh cart items. Please try again.");
      showToast({
        msg: "Failed to refresh cart items. Please try again.",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleCartAction = async (action: string, id: string, qty?: number) => {
    try {
      if (action === "remove") {
        const deal = deals.find((deal) => deal.id === id);
        if (!deal) {
          setError("Deal not found");
          showToast({ msg: "Deal not found", color: "danger" });
          setBusyLoader({ show: false, msg: "" });
          return;
        }
        const userId = AuthService.getLoggedInUserId();
        if (!userId) {
          setError("User ID not found");
          showToast({ msg: "User ID not found", color: "danger" });
          setBusyLoader({ show: false, msg: "" });
          return;
        }
        const cartType = getEffectiveCartType();
        setBusyLoader({ show: true, msg: "Removing item from cart..." });
        const result = await removeCartItem({
          deal,
          userId,
          cartType,
        });
        if (result.status === "success") {
          setDeals((prevDeals) => prevDeals.filter((d) => d.id !== id));
          await refreshCartDetails();
        } else {
          setError(result.msg);
          showToast({ msg: result.msg, color: "danger" });
        }
        setBusyLoader({ show: false, msg: "" });
      } else if (action === "refresh") {
        await refreshCartDetails();
      } else if (action === "update") {
        await refreshCartDetails();
      }
    } catch (err: any) {
      console.error(`Error handling cart action (${action}):`, err);
      setError(err.message || "Failed to update cart. Please try again.");
      showToast({
        msg: err.message || "Failed to update cart. Please try again.",
        color: "danger",
      });
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleClearCart = async () => {
    setAppAlertDialog({
      show: true,
      title: "Clear Cart",
      description: "Are you sure you want to clear the cart?",
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, 800));
        setBusyLoader({ show: true, msg: "Clearing cart..." });
        const userId = AuthService.getLoggedInUserId();
        if (!userId) {
          showToast({
            msg: "User ID not found",
            color: "danger",
          });
          setBusyLoader({ show: false, msg: "" });
          return;
        }
        const cartType = getEffectiveCartType();
        let response;
        if (cartType === "buyer" || cartType === "buy-from-other-retailer") {
          response = await CartService.deleteMyCart(cartId || "");
        } else {
          response = await CartService.clearCart(
            AuthService.getLoggedInUserId(true),
            "B2B",
          );
        }
        if (response && response.statusCode === 200) {
          CartService.clearCartLocal();
          setDeals([]);
          setSummary({
            totalMRP: 0,
            subTotal: 0,
            totalDiscount: 0,
            totalAmountBeforeTax: 0,
            savingsPercentage: 0,
            savings: 0,
          });
          try {
            MiscService.createEvent(EVENTS.CART_ITEM_REMOVED, {
              cleared: true,
            });
          } catch (e) {
            // ignore
          }
        } else {
          showToast({
            msg:
              response?.data?.message ||
              "Failed to clear cart. Please try again.",
            color: "danger",
          });
        }
        setBusyLoader({ show: false, msg: "" });
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const doBuyerCartCheckout = async (type: "COD" | "PAYLATER") => {
    const paymentMode = {
      refNo: "",
      type: "COD",
      proof: [],
      amount: summary.totalAmountBeforeTax,
    };

    if (type === "PAYLATER") {
      paymentMode.type = "PAYLATER";
    }

    const result = await proceedBuyerCartCheckout({ cartId, paymentMode });
    if (result?.status === "success") {
      // Redirect to order-placed page with type=buyer query parameter
      const orderIds = result.orderIds || "";
      const queryParams: any = { type: "buyer" };
      if (orderIds) {
        queryParams.ids = orderIds;
      }
      if (retailerId) {
        queryParams.retailer = retailerId;
      }
      // Clear local cart data and reset UI
      CartService.clearCartLocal();
      to("/products/order-placed", queryParams);
    } else {
      showToast({
        msg: result?.msg || "Checkout failed. Please try again.",
        color: "danger",
      });
    }
  };

  const handleProceedToCheckout = async () => {
    const cartType = getEffectiveCartType();

    if (!deals.length) {
      showToast({
        msg: "No items in cart to checkout.",
        color: "danger",
      });
      return;
    }

    if (!cartId) {
      showToast({
        msg: "Cart ID not found.",
        color: "danger",
      });
      return;
    }

    if (cartType === "buyer" || retailerId) {
      setBusyLoader({ show: true, msg: "Processing checkout..." });
      try {
        try {
          const linkedFranchise = AuthService.getLinkedSeller();
          const parentId = retailerId || linkedFranchise?._id;
          const paylaterResp = await PaylaterService.validateEligibility({
            userInfo: {
              id: AuthService.getLoggedInUserId(),
              type: "franchise",
            },
            franchiseInfo: {
              id: parentId,
            },
          });

          const d = paylaterResp.data || {};

          if (paylaterResp?.statusCode !== 200) {
            const msg =
              d?.message || "Failed to validate Paylater eligibility.";

            showToast({
              msg,
              color: "warning",
            });
          } else {
            const isEligible = d?.data?.eligible;

            if (isEligible) {
              setPaymentOptionModal({
                show: true,
                orderAmount: summary.totalAmountBeforeTax,
                availableLimit: d?.data?.paylaterInfo?.creditAvailable,
              });
            } else {
              doBuyerCartCheckout("COD");
            }
          }
        } catch (e) {
          console.error("Error validating Paylater eligibility:", e);
          showToast({
            msg: "Failed to validate Paylater eligibility.",
            color: "danger",
          });
        }
      } catch (err: any) {
        showToast({
          msg: err?.message || "Checkout failed. Please try again.",
          color: "danger",
        });
      } finally {
        setBusyLoader({ show: false, msg: "" });
      }
    } else {
      // Normal flow: prepare payment payload and redirect to payment page
      if (showTermsAndConditions && !agreedToTerms) {
        showToast({
          msg: "Please agree to the terms and conditions",
          color: "danger",
        });
        return;
      }

      setBusyLoader({ show: true, msg: "Preparing payment..." });
      try {
        // Fetch detailed cart data similar to overview
        const detailed = await CartService.fetchCartDetails({
          type: "B2B",
          id: AuthService.getLoggedInUserId(true),
        });

        const groups: any[] = [];
        if (Array.isArray(detailed.data?.sellers)) {
          const gmap: Record<string, any> = {};
          detailed.data.sellers.forEach((seller: any) => {
            seller.deals.forEach((deal: any) => {
              if (!gmap[deal.fulfilledBy]) {
                gmap[deal.fulfilledBy] = {
                  fulfilledBy: deal.fulfilledBy,
                  _id: seller._id,
                  name: seller.name,
                  deals: [],
                  isMinWhCartAmountSatisfied: seller.isMinWhCartAmountSatisfied,
                  minCartValue: seller.minCartValue,
                  isCodApplicable: seller.isCodApplicable,
                  isSfRfOwnOrder: seller.isSfRfOwnOrder,
                };
              }
              gmap[deal.fulfilledBy].deals.push(deal);
            });
          });
          Object.values(gmap).forEach((group: any) => {
            group.deals.forEach((deal: any) => {
              deal.discount = CommonService.calculateDiscount(
                deal.mrp,
                deal.price,
              );
            });
            group.totalAmount = group.deals.reduce(
              (acc: number, d: any) => acc + d.price * d.quantity,
              0,
            );
            groups.push(group);
          });
        }

        const cartData = {
          ...detailed.data,
          groups,
          summary: detailed.data?.summary,
        };

        // Validate minimum cart values (overall or per-seller) before proceeding
        if (
          cartData.isOverallCartValue &&
          !cartData.isMinWhCartAmountSatisfied
        ) {
          showToast({
            msg: `The minimum overall cart value to proceed is ₹${cartData.overallMinCartValue}. Please add more items to your cart.`,
            color: "danger",
          });
          setBusyLoader({ show: false, msg: "" });
          return;
        }

        const unsatisfiedGroups = (cartData.groups || []).filter(
          (group: any) =>
            !cartData.isOverallCartValue && !group.isMinWhCartAmountSatisfied,
        );

        if (unsatisfiedGroups.length > 0) {
          showToast({
            msg: "Some sellers have not met the minimum cart value. Please review your cart.",
            color: "danger",
          });
          setBusyLoader({ show: false, msg: "" });
          return;
        }

        const tempData: any = {
          moduleType: "physical",
          amount: cartData.summary?.subTotal || 0,
          physicalOrder: {
            cartId: cartData._id,
            groups: cartData.groups || cartData.groups,
            summary: cartData.summary,
            amount: cartData.summary?.subTotal || 0,
            checkoutParams: getCheckoutParams(),
          },
        };

        PaymentService.setTempData(tempData);

        // Redirect to payment page after preparing temp data
        setBusyLoader({ show: false, msg: "" });
        to("/payment");
      } catch (err: any) {
        setBusyLoader({ show: false, msg: "" });
        showToast({
          msg: err?.message || "Failed to prepare payment.",
          color: "danger",
        });
      }
    }
  };

  const termsModalCallback = (a: { action: string }) => {
    setTermsModal({ show: false });
  };

  const getCheckoutParams = (isRequestToSf = false) => {
    const params: any = {
      cartid: cartId,
      remarks: `Checkout - ${cartId}`,
    };

    if (userDetails?.raniCode) {
      params.genBy = userDetails.raniCode;
      params.genByType = "subUser";
    }

    if (AuthService.isSfSeller()) {
      params.isPurchaseOrder = true;
      params.isPurchaseOrderForSFMF = true;
    }

    if (isRequestToSf) {
      params.payBySFBalance = true;
      params.sellerId = userDetails?.sk_franchise_details?.linkedRmfSellerId;
    }

    return params;
  };

  const handlePaymentOptionModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    setPaymentOptionModal({ show: false, orderAmount: 0, availableLimit: 0 });
    if (a.action === "submit") {
      doBuyerCartCheckout(a.data === "paylater" ? "PAYLATER" : "COD");
    }
  };

  return (
    <>
      <AppHeader title={t("cart")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab={sectionActiveTab}
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab={sectionActiveTab}
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

              {/* <InfoBlock className="tw:mb-4" variant="info" size="sm">
            Only products added to the cart are visible here. To view your
            purchase basket,{" "}
            <span
              className="tw:text-blue-600 tw-underline tw-cursor-pointer hover:tw-text-blue-800"
              onClick={() => to("/products/purchase-basket")}
            >
              click here
            </span>
            .
          </InfoBlock> */}

              <div className="tw:mb-4">
                {showTab ? (
                  <CartTab activeTab="sk" className="edge-tabs tw:mb-2" />
                ) : null}

                <div className="tw:text-xs tw:text-gray-500">
                  List of products purchased from StoreKing.
                </div>
              </div>

              {loading && (
                <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                  <AppSpinner className="tw:w-8 tw:h-8" />
                </div>
              )}

              {deals.length > 0 ? (
                <>
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:lg:gap-4">
                    <div>
                      {/* Cart summary */}
                      <div className="tw:flex tw:gap-2 tw:mb-1 tw:items-center">
                        <div className="tw:text-base tw:font-semibold tw:flex-1">
                          {t("cartItems")} ({deals.length})
                        </div>
                        <div>
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
                      <AppCard noPadding>
                        <div className="app-seller-header tw:bg-primary/5 tw:p-3 tw:border-b tw:border-primary/15">
                          <div className="tw:flex tw:items-center tw:gap-3">
                            {/* Avatar */}
                            <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-full tw:bg-primary tw:text-white tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold">
                              S
                            </div>

                            <div className="tw:min-w-0 tw:flex-1">
                              <div className="tw:font-semibold tw:text-gray-900 tw:truncate tw:leading-tight">
                                StoreKing
                              </div>

                              {pdpDate ? (
                                <div className="tw:mt-0.5 tw:inline-flex tw:items-center tw:text-[11px] tw:text-gray-500">
                                  Delivery by
                                  <DateFormat
                                    value={pdpDate}
                                    formatStr="dd MMM yyyy"
                                    className="tw:ms-1"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {deals.map((deal, idx) => (
                          <CartItem
                            key={deal.id}
                            item={deal}
                            callback={handleCartAction}
                            cartType={cartType}
                            isLast={idx === deals.length - 1}
                          />
                        ))}
                      </AppCard>
                    </div>

                    <div className="tw:lg:sticky tw:lg:top-0 tw:lg:self-start tw:lg:pt-1.5">
                      <SellerInfo retailerId={retailerId || ""} />
                      {userDetails && userDetails.address && (
                        <>
                          <div className="tw:text-base tw:font-semibold tw:mb-4">
                            Delivery to
                          </div>
                          <AppCard className="tw:mb-4">
                            <div className="tw:flex tw:items-start tw:gap-2">
                              <MapPin className="tw:text-lg tw:mt-1" />
                              <div className="tw:text-sm">
                                <div>{userDetails.address.full_address}</div>
                                <div className="tw:text-gray-500 tw:text-xs">{`${userDetails.town}, ${userDetails.district}, ${userDetails.state} - ${userDetails.pincode}`}</div>
                              </div>
                            </div>
                          </AppCard>
                        </>
                      )}

                      <div className="tw:text-base tw:font-semibold tw:mb-1">
                        {t("summary")}
                      </div>

                      <Summary
                        totalMRP={summary.totalMRP}
                        subTotal={summary.subTotal}
                        totalDiscount={summary.totalDiscount}
                        totalAmountBeforeTax={summary.totalAmountBeforeTax}
                        savings={summary.savings}
                      />
                      {showTermsAndConditions && (
                        <div className="tw:flex tw:gap-2 tw:mb-4 tw:items-start">
                          <input
                            type="checkbox"
                            className="tw:self-start tw:mt-1 tw:block tw:w-4 tw:h-4"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                          />
                          <div className="tw:text-sm tw:text-gray-500">
                            I, authorize StoreKing to debit my account in case
                            product price increases during order processing.{" "}
                            <button
                              type="button"
                              className="tw:outline-none tw:text-primary tw:underline tw:cursor-pointer tw:font-semibold tw:text-xs"
                              onClick={() => setTermsModal({ show: true })}
                            >
                              Read More
                            </button>
                          </div>
                        </div>
                      )}

                      {AuthService.isPaylaterEnabled() && (
                        <PaylaterRequestCard />
                      )}

                      <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:items-end tw:lg:text-right">
                        <div className="tw:w-full tw:md:w-auto tw:md:min-w-fit">
                          <AppButton
                            fill="solid"
                            className="tw:w-full tw:md:w-auto"
                            onClick={handleProceedToCheckout}
                          >
                            {t("proceedToCheckout")}
                            <ArrowRight className="tw:w-4 tw:h-4 tw:ml-2" />
                          </AppButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {!loading && deals.length === 0 && (
                <AppCard>
                  <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full tw:gap-4 tw:my-10">
                    <div className="tw:text-center">
                      <ShoppingCart
                        className="tw:text-gray-400 tw:inline-block"
                        size={96}
                      />
                      <div className="tw:mt-2 tw:text-lg tw:font-semibold">
                        Your cart is empty
                      </div>
                      <div className="tw:mt-1 tw:text-sm tw:text-gray-500">
                        Browse products and add them to your cart.
                      </div>
                    </div>
                    <AppButton
                      fill="solid"
                      className="tw:w-auto"
                      onClick={() => to("/products/sk")}
                    >
                      Shop Now
                    </AppButton>
                  </div>
                </AppCard>
              )}
            </div>
          </div>
        </div>
      </div>
      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />
      <CartTermsModal show={termsModal.show} callback={termsModalCallback} />
      <BusyLoader show={busyloader.show} message={busyloader.msg} />

      <PaymentOptionModal
        show={paymentOptionModal.show}
        orderAmount={paymentOptionModal.orderAmount}
        availableLimit={paymentOptionModal.availableLimit}
        callback={handlePaymentOptionModalCallback}
      />
    </>
  );
};

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/sk" }, langKey: "home" },
  { label: "Cart", langKey: "cart" },
];

export default Cart;
