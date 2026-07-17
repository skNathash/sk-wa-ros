import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import { AuthService } from "~/services/AuthService";
import CartService from "~/services/CartService";
import Item from "./components/Item";
import AppButton from "~/components/core/button/AppButton";
import clsx from "clsx";
import { produce } from "immer";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import CartTermsModal from "./modals/CartTermsModal";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import Summary from "../components/Summary";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";
import PaymentService from "~/services/PaymentService";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import DateFormat from "~/components/core/date/DateFormat";
import type { TempPaymentData } from "~/types/TempPaymentData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  MapPin,
  ShoppingCart,
} from "lucide-react";

const isAllCodOrder = (
  groups: any[],
  connectedSellersLength: number,
): boolean => {
  return (
    groups.filter((group: any) => group.fulfilledBy !== "MPS0").length ===
      groups.length && connectedSellersLength > 0
  );
};

const CartOverview = () => {
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [busyLoader, setBusyLoader] = useState({ show: false });
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const [pdpDate, setPdpDate] = useState<Date | null>(null);

  const [termsModal, setTermsModal] = useState({
    show: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getData();

      const anySkDeals = data?.sellers?.some(
        (seller: any) => seller.fulfilledBy === "MPS0",
      );

      const pdpResp = await CommonService.getPdpDate(
        AuthService.getLoggedInUserId() || "",
      );

      if (pdpResp.statusCode === 200) {
        setPdpDate(new Date(pdpResp.data?.nextPdpDate));
      }

      setShowTermsAndConditions(anySkDeals);
      setCartData(data);
      setLoading(false);
    };
    fetchData();
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

  const toggleViewMoreDeals = (index: number) => {
    setCartData(
      produce((draft: any) => {
        draft.groups[index].viewMoreDeals = !draft.groups[index].viewMoreDeals;
      }),
    );
  };

  const handleMakePayment = async () => {
    if (showTermsAndConditions && !agreedToTerms) {
      appToast.show({
        msg: "Please agree to the terms and conditions",
        color: "danger",
      });
      return;
    }

    if (cartData.isOverallCartValue && !cartData.isMinWhCartAmountSatisfied) {
      appToast.show({
        msg: `The minimum overall cart value to proceed is ₹${cartData.overallMinCartValue}. Please add more items to your cart.`,
        color: "danger",
      });
      return;
    }

    const unsatisfiedGroups = Object.values(cartData.groups).filter(
      (group: any) =>
        !cartData.isOverallCartValue && !group.isMinWhCartAmountSatisfied,
    );

    if (unsatisfiedGroups.length > 0) {
      appToast.show({
        msg: "Some sellers have not met the minimum cart value. Please review your cart.",
        color: "danger",
      });
      return;
    }

    const tempData: TempPaymentData = {
      moduleType: "physical",
      amount: cartData.summary.subTotal,
      physicalOrder: {
        cartId: cartData._id,
        groups: cartData.groups,
        summary: cartData.summary,
        amount: cartData.summary.subTotal,
        allCodOrder: isAllCodOrder(
          cartData.groups,
          FranchiseService.getConnectedSellers().length,
        ),
        checkoutParams: getCheckoutParams(),
      },
    };

    PaymentService.setTempData(tempData);

    if (FranchiseService.getConnectedSellers().length > 0) {
      setBusyLoader({ show: true });

      try {
        const updatePromises = Object.values(cartData.groups)
          .filter((group: any) => group.fulfilledBy !== "MPS0")
          .map((group: any) => {
            const params = {
              cartId: cartData._id,
              sellerId: group._id,
              codEnabled: true,
            };
            return CartService.updateCodPreference(params);
          });

        const responses = await Promise.all(updatePromises);

        const failedResponses = responses.filter(
          (response) => response?.statusCode !== 200,
        );

        setBusyLoader({ show: false });

        if (failedResponses.length > 0) {
          appToast.show({
            msg: "Failed to update COD preference for some sellers. Please try again.",
            color: "danger",
          });
        } else {
          if (tempData.physicalOrder?.allCodOrder) {
            setBusyLoader({ show: true });
            doCheckout((result) => {
              setBusyLoader({ show: false });
              if (result.status === "success") {
                appNav.to("/products/order-placed", {
                  ids: result.oids,
                });
              } else {
                appToast.show({
                  msg: result.errMsg || "Checkout failed. Please try again.",
                  color: "danger",
                });
              }
            });
          } else {
            appNav.to("/payment");
          }
        }
      } catch (error) {
        setBusyLoader({ show: false });
        appToast.show({
          msg: "An error occurred while updating COD preferences. Please try again.",
          color: "danger",
        });
      }
    } else {
      appNav.to("/payment");
    }
  };

  const termsModalCallback = (a: { action: string }) => {
    setTermsModal({ show: false });
  };

  const getCheckoutParams = (isRequestToSf = false) => {
    const params: any = {
      cartid: cartData._id,
      remarks: `Checkout - ${cartData._id}`,
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

    if (cartData.captureCustomer && cartData.customerInfo?._id) {
      params.customerId = cartData.customerInfo._id;
    }

    return params;
  };

  const doCheckout = async (
    callback: (a: {
      status: string;
      oids: string;
      errMsg?: any;
      raw?: any;
    }) => void,
    isRequestToSf = false,
  ) => {
    try {
      const checkoutParams = getCheckoutParams(isRequestToSf);
      const checkoutResp = await CartService.checkout(
        "B2B",
        AuthService.getLoggedInUserId() || "",
        checkoutParams,
      );

      if (checkoutResp.statusCode !== 200) {
        const errorMsg = CartService.checkoutErrorHandler(checkoutResp);
        throw new Error(errorMsg.join(", "));
      }

      const physicalOrderIds = (checkoutResp.data.orders || [])
        .map((v: any) => v._id)
        .join(",");

      callback({
        status: "success",
        oids: physicalOrderIds,
      });
    } catch (err) {
      callback({
        status: "error",
        oids: "",
        errMsg: (err as Error)?.message || "An error occurred during checkout",
        raw: err,
      });
    }
  };

  const headerTitle = AuthService.isBuyerUser() ? "Seller Cart" : "SK Cart";

  const dynamicBreadcrumbs = [
    { label: "Home", redirect: { path: "/" } },
    { label: headerTitle, redirect: { path: "/products/cart" } },
    { label: `${headerTitle} Overview` },
  ];

  return (
    <>
      <AppHeader title={headerTitle + " Overview"} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : null}

          {!loading && cartData?._id ? (
            <>
              <AppBreadcrumbs data={dynamicBreadcrumbs} className="tw:mb-4" />

              <InfoBlock
                className="tw:mb-4"
                variant="info"
                bordered={true}
                shadow={true}
              >
                <div className="tw:text-sm">
                  Please ensure all items in your cart meet the minimum
                  requirements before proceeding with payment.
                </div>
              </InfoBlock>

              {cartData.isOverallCartValue &&
                !cartData.isMinWhCartAmountSatisfied && (
                  <InfoBlock className="tw:mb-4" variant="danger">
                    <div className="tw:text-sm">
                      The minimum overall cart value to proceed is
                      <Amount
                        value={cartData.overallMinCartValue}
                        decimalPlaces={2}
                      />
                      . Please add more items to your cart.
                    </div>
                  </InfoBlock>
                )}

              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:lg:gap-4">
                <div>
                  {Object.values(cartData.groups).map(
                    (group: any, index: number) => (
                      <AppCard className="tw:mb-4" key={index}>
                        <div className="tw:text-base tw:mb-4">
                          <span className="tw:text-gray-500 tw:font-normal">
                            Sold By -{" "}
                          </span>
                          <span className="tw:font-semibold">{group.name}</span>{" "}
                          <span className="tw:text-sm tw:text-gray-500 tw:font-normal">
                            ({group.deals?.length} items)
                          </span>
                        </div>

                        {!group.isMinWhCartAmountSatisfied &&
                          !cartData.isOverallCartValue && (
                            <InfoBlock
                              className="tw:mb-4"
                              variant="danger"
                              bordered={true}
                            >
                              <div className="tw:text-xs tw:flex tw:items-center">
                                <AlertCircle className="tw:mr-2 tw:text-danger" />
                                The minimum cart value for this seller is{" "}
                                <Amount
                                  value={group.minCartValue}
                                  decimalPlaces={2}
                                  className="tw:ml-1"
                                />
                                . Please add more items to your cart.
                              </div>
                            </InfoBlock>
                          )}

                        {group.deals.map((item: any, index: number) => (
                          <div
                            key={item._id}
                            className={clsx("tw:mb-2 tw:pb-4", {
                              "tw:border-b tw:border-gray-200":
                                index !== group.deals.length - 1,
                              "tw:hidden": index > 1 && !group.viewMoreDeals,
                            })}
                          >
                            <Item item={item} />
                          </div>
                        ))}

                        {group.deals.length > 2 && (
                          <div className="tw:flex tw:flex-row tw:justify-center">
                            <AppButton
                              className="tw:w-full"
                              size="small"
                              fill="clear"
                              onClick={() => toggleViewMoreDeals(index)}
                            >
                              View {group.viewMoreDeals ? "Less" : "More"}{" "}
                              <ChevronDown
                                className={clsx({
                                  "tw:rotate-180": group.viewMoreDeals,
                                })}
                              />
                            </AppButton>
                          </div>
                        )}

                        <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:mt-2 tw:text-base tw:font-medium tw:border-t tw:border-gray-200 tw:border-dashed tw:pt-4">
                          <div className="">Total Amount</div>
                          <div className="tw:text-primary tw:font-semibold">
                            <Amount
                              value={group.totalAmount}
                              decimalPlaces={2}
                            />
                          </div>
                        </div>

                        <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:mt-2 tw:text-base tw:font-medium tw:border-t tw:border-gray-200 tw:border-dashed tw:pt-4">
                          <div className="">Delivery By</div>
                          <div className="tw:text-secondary tw:flex tw:flex-row tw:items-center tw:gap-2">
                            <Calendar className="tw:text-lg" />
                            {pdpDate && group.fulfilledBy === "MPS0" ? (
                              <DateFormat
                                value={pdpDate}
                                formatStr="dd MMM yyyy"
                              />
                            ) : (
                              "24 - 48 hrs"
                            )}
                          </div>
                        </div>
                      </AppCard>
                    ),
                  )}
                </div>

                <div className="tw:lg:sticky tw:lg:top-0 tw:lg:self-start">
                  {userDetails?.address && (
                    <>
                      <div className="tw:text-base tw:font-semibold tw:mb-3">
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

                  <div className="tw:text-base tw:font-semibold tw:mb-3">
                    Summary
                  </div>
                  <Summary
                    totalMRP={cartData.summary.totalMRP}
                    subTotal={cartData.summary.subTotal}
                    totalDiscount={cartData.summary.totalDiscount}
                    totalAmountBeforeTax={cartData.summary.totalAmountBeforeTax}
                    savings={cartData.summary.savings}
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
                          className="tw:text-secondary tw:outline-none"
                          onClick={() => setTermsModal({ show: true })}
                        >
                          Read More
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:items-end tw:lg:text-right">
                    <div className="tw:w-full tw:md:w-auto tw:md:min-w-fit">
                      <AppButton
                        onClick={handleMakePayment}
                        className="tw:w-full tw:md:w-auto"
                      >
                        <ShoppingCart className="tw:mr-2" />
                        Proceed to Payment
                      </AppButton>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {!loading && (!cartData || !cartData._id) && (
            <AppCard>
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full tw:gap-4">
                <div className="tw:text-center">
                  <ShoppingCart className="tw:text-6xl tw:text-gray-400" />
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
                  onClick={() => appNav.to("/products/sk")}
                >
                  Shop Now
                </AppButton>
              </div>
            </AppCard>
          )}
        </div>
      </div>
      <CartTermsModal show={termsModal.show} callback={termsModalCallback} />

      <BusyLoader show={busyLoader.show} />
    </>
  );
};

const breadcrumbs = [
  { label: "Home", redirect: { path: "/" } },
  { label: "Cart", redirect: { path: "/products/cart" } },
  { label: "Cart Overview" },
];

const getData = async () => {
  const res = await CartService.fetchCartDetails({
    type: "B2B",
    id: AuthService.getLoggedInUserId(true),
  });

  const groups: Record<string, any> = {};

  if (Array.isArray(res.data?.sellers)) {
    res.data.sellers.forEach((seller: any) => {
      seller.deals.forEach((deal: any) => {
        if (!groups[deal.fulfilledBy]) {
          groups[deal.fulfilledBy] = {
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
        groups[deal.fulfilledBy].deals.push(deal);
      });
    });
  }

  const finalGroups = Object.values(groups).map((group: any) => {
    group.deals.forEach((deal: any) => {
      deal.discount = CommonService.calculateDiscount(
        deal.mrp,
        deal.price,
        0,
        "markup",
      );
    });

    return {
      ...group,
      totalAmount: group.deals.reduce(
        (acc: number, deal: any) => acc + deal.price * deal.quantity,
        0,
      ),
      totalMrp: group.deals.reduce(
        (acc: number, deal: any) => acc + deal.mrp * deal.quantity,
        0,
      ),
    };
  });

  const totalMRP = finalGroups.reduce(
    (acc: number, group: any) => acc + group.totalMrp,
    0,
  );
  const subTotal = finalGroups.reduce(
    (acc: number, group: any) => acc + group.totalAmount,
    0,
  );
  const totalDiscount = CommonService.calculateDiscount(
    totalMRP,
    subTotal,
    0,
    "markup",
  );
  const totalAmountBeforeTax = res.data.totalAmountBeforeTax;

  const summary = {
    totalMRP: totalMRP,
    subTotal: subTotal,
    totalDiscount: totalDiscount,
    totalAmountBeforeTax: totalAmountBeforeTax,
    savings: totalMRP - subTotal,
  };

  return {
    ...res.data,
    groups: finalGroups,
    summary: summary,
  };
};

export default CartOverview;
