import clsx from "clsx";
import { produce } from "immer";
import { ChevronRight, ClipboardList, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import { useSidebar } from "~/components/ui/sidebar";
import {
  B2B_DISCOUNT_TYPE,
  B2C_DISCOUNT_TYPE,
  DISCOUNT_DECIMAL_PLACES,
  POS_CART_ITEM_ADDED,
  POS_CART_ITEM_REMOVED,
  POS_ORDER_PLACED,
  POS_STOCK_ADDED,
} from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CartTabs from "./components/cart-tabs/CartTabs";
import Cart from "./components/cart/Cart";
import Keypad from "./components/keypad/Keypad";
import Products from "./components/products/Products";
import SwitchBlock from "./components/SwitchBlock";
import BarcodeListModal from "./modals/barcode-list/BarcodeListModal";
import ChooseRetailerModal from "./modals/choose-retailer/ChooseRetailerModal";
import CustomerTypeModal from "./modals/customer-type/CustomerTypeModal";
import RecentOrdersModal from "./modals/recent-orders/RecentOrdersModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["SALE-ORDER.POS-BILLING"]);
}

const Billing = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(["posbilling", "menu"]);
  const { isMobile } = useScreenView();
  const { setOpen } = useSidebar();

  const appNav = useAppNav();
  const appToast = useAppToast();

  const typeInUrl = searchParams.get("type");
  const assisted = searchParams.get("assisted") === "true";
  // Quick checkout: a B2B cart flagged at creation to follow the B2C
  // fulfillment flow (snapshots on items, stock debit, invoice, Delivered).
  const quickCheckoutInUrl = searchParams.get("quickCheckout") === "true";
  const retailerIdInUrl = searchParams.get("retailerId") || "";

  // Hide sidebar on desktop when POS billing page loads or query params change
  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [displayCart, setDisplayCart] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);

  const [cartSummary, setCartSummary] = useState<{
    subtotal: number;
    couponDiscount: number;
    coinsDiscount: number;
    totalDiscount: number;
    finalPrice: number;
    orderAmount: number;
  }>({
    subtotal: 0,
    couponDiscount: 0,
    coinsDiscount: 0,
    totalDiscount: 0,
    finalPrice: 0,
    orderAmount: 0,
  });

  const [cartDiscount, setCartDiscount] = useState<number>(0);

  const [busyLoader, setBusyLoader] = useState(false);

  const [allCarts, setAllCarts] = useState<any[]>([]);

  const [guestCartIds, setGuestCartIds] = useState<string[]>([]);

  const [showChooseRetailerModal, setShowChooseRetailerModal] =
    useState<boolean>(false);

  const [showRecentOrdersModal, setShowRecentOrdersModal] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const update = async () => {
      const count = await OmsService.getPendingOrderCount();
      if (mounted) setPendingOrderCount(count);
    };
    update();
    const id = window.setInterval(update, 10 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const [showBarcodeListModal, setShowBarcodeListModal] =
    useState<boolean>(false);

  const [showKeypad, setShowKeypad] = useState<boolean>(false);

  const [keypadNotice, setKeypadNotice] = useState<{
    type: "info" | "error";
    msg: string;
    ts: number;
  } | null>(null);

  const lastKeypadSubmitRef = useRef<string | null>(null);

  const [fabFlipKey, setFabFlipKey] = useState(0);

  const handleProductsSearchResult = useCallback(
    (info: { count: number; searchTerm: string }) => {
      // Only react to results from the most recent keypad submission
      if (!showKeypad) return;
      if (info.searchTerm !== lastKeypadSubmitRef.current) return;
      if (info.count === 0) {
        setKeypadNotice({
          type: "error",
          msg: `No product found for "${info.searchTerm}"`,
          ts: Date.now(),
        });
      } else if (info.count > 1) {
        appToast.show({
          msg: `${info.count} matches for "${info.searchTerm}" — pick one`,
          color: "warning",
        });
        setShowKeypad(false);
      }
    },
    [showKeypad, appToast],
  );

  const submitToSearch = (value: string) => {
    lastKeypadSubmitRef.current = value;
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[name="search"]',
    );
    if (!searchInput) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(searchInput, value);
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const [scrollToDealId, setScrollToDealId] = useState<string | null>(null);

  const [selectedRetailer, setSelectedRetailer] = useState<any | null>(null);

  const [customerType, setCustomerType] = useState<string | null>(
    searchParams.get("type")?.trim() || "b2c",
  );

  const isQuickCheckout =
    quickCheckoutInUrl && (customerType || "").toLowerCase() === "b2b";

  // Tracks whether the user picked "B2B Quick Checkout" in the customer-type
  // modal, so the retailer-chooser callback can carry the flag into the URL.
  const [pendingQuickCheckout, setPendingQuickCheckout] =
    useState<boolean>(quickCheckoutInUrl);

  useEffect(() => {
    setPendingQuickCheckout(quickCheckoutInUrl);
  }, [quickCheckoutInUrl]);

  useEffect(() => {
    const param = searchParams.get("type")?.trim() || "b2c";
    if (param !== customerType) {
      setCustomerType(param);
    }
  }, [searchParams]);

  // Only treat customer type as valid when it's exactly 'b2b' or 'b2c' (case-insensitive)
  // When no type is provided in URL, default to b2c (valid)
  const isValidCustomerType = useMemo(() => {
    return ["b2b", "b2c"].includes(typeInUrl || "b2c");
  }, [typeInUrl]);

  const [showCustomerTypeModal, setShowCustomerTypeModal] =
    useState<boolean>(false);

  useEffect(() => {
    setShowCustomerTypeModal(!isValidCustomerType);
  }, [isValidCustomerType]);

  // if type is b2b but no retailer selected, restore it from the
  // retailerId query param when present, otherwise show retailer chooser
  useEffect(() => {
    const ct = (customerType || "").toLowerCase();
    if (ct !== "b2b") return;
    if (selectedRetailer?._id === retailerIdInUrl && retailerIdInUrl) return;

    if (!retailerIdInUrl) {
      if (!selectedRetailer) {
        setShowChooseRetailerModal(true);
        setShowCustomerTypeModal(false);
      }
      return;
    }

    let cancelled = false;
    const restoreRetailer = async () => {
      try {
        const resp = await FranchiseService.getFranchise(retailerIdInUrl);
        const fran = resp?.data?.data;
        if (cancelled) return;
        if (fran?._id) {
          setSelectedRetailer({
            ...fran,
            formatAddress: [
              fran.city || fran.town,
              fran.district,
              fran.state,
              fran.postcode,
            ]
              .filter(Boolean)
              .join(", "),
          });
          setShowChooseRetailerModal(false);
          setShowCustomerTypeModal(false);
        } else {
          setShowChooseRetailerModal(true);
        }
      } catch (e) {
        console.error("Error restoring retailer from query param", e);
        if (!cancelled) setShowChooseRetailerModal(true);
      }
    };
    restoreRetailer();
    return () => {
      cancelled = true;
    };
  }, [customerType, selectedRetailer, retailerIdInUrl]);

  // Prepare a user-friendly label for the customer type value
  const getCustomerTypeLabel = (type: string | null | undefined) => {
    if (!type) return "";
    const key = type.toLowerCase();

    // Map known type ids to translation keys used in CustomerTypeModal
    const mapping: Record<string, string> = {
      b2c: t("customerTypeModal.options.b2c.title"),
      b2b: t("customerTypeModal.options.b2b.title"),
      walkin: t("customerTypeModal.options.walkin.title"),
    };

    return mapping[key] || type;
  };

  const fetchCart = useCallback(async () => {
    // Do not fetch cart when customer type is invalid
    if (!isValidCustomerType) return;

    const ct = (customerType || "").toLowerCase();
    if (ct === "b2b" && !selectedRetailer) {
      setCart([]);
      setCartSummary({
        subtotal: 0,
        couponDiscount: 0,
        coinsDiscount: 0,
        totalDiscount: 0,
        finalPrice: 0,
        orderAmount: 0,
      });
      setGuestCartIds([]);
      setAllCarts([]);
      setCartDiscount(0);
      return;
    }

    setLoadingCart(true);

    // normalize customer type and cartType string used by backend
    // ct already defined above
    const cartType = ct === "b2b" ? "B2B" : "B2C";

    // start with base filters and add retailer filter only for B2B
    const cartParams: Record<string, any> = {
      filter: {
        platform: "POS",
        cartType: cartType,
      },
    };

    if (ct === "b2b" && selectedRetailer) {
      // include retailer id in filter along with existing platform/cartType
      cartParams.filter["customerInfo.customerId"] = selectedRetailer._id;
    }

    if (assisted) {
      cartParams.filter.assistedOrder = true;
    }

    const response = await PosService.getCart(cartParams);
    const data =
      response.data?.data && Array.isArray(response.data.data)
        ? response.data.data || []
        : [];

    setAllCarts(
      data.map((cart: Record<string, any>) => ({
        _id: cart._id,
        cartId: cart.cartId,
      })),
    );

    // For B2B, normal and quick-checkout carts can coexist for the same
    // retailer — pick the one matching the current mode.
    const cart =
      ct === "b2b"
        ? data.find((c: Record<string, any>) =>
            isQuickCheckout ? c.quickCheckout === true : !c.quickCheckout,
          ) || {}
        : data[0] || {};

    if (!cart.cartId) {
      // Only include retailer/customerInfo when customer type is B2B
      const createPayload: Record<string, any> = {
        platform: "POS",
        cartType: cartType,
      };

      if (assisted) {
        createPayload.assistedOrder = true;
      }

      if (ct === "b2b" && selectedRetailer) {
        createPayload.customerInfo = {
          type: "Retailer",
          customerId: selectedRetailer._id,
          name: selectedRetailer.name,
        };
        if (isQuickCheckout) {
          createPayload.quickCheckout = true;
        }
      }

      const guestCartResponse = await PosService.createGuestCart(createPayload);
      const guestCart = guestCartResponse.data?.data || {};
      updateCartInfo({
        ...guestCart,
        _id: guestCart.cartId,
      });
    } else {
      updateCartInfo(cart);
    }

    setLoadingCart(false);
  }, [
    customerType,
    isValidCustomerType,
    selectedRetailer,
    assisted,
    isQuickCheckout,
  ]);

  const refreshCart = async (cartId: string = "") => {
    const cartIdToFetch = cartId || guestCartIds[0];
    if (cartIdToFetch) {
      const refreshFilter: Record<string, any> = { _id: cartIdToFetch };
      if (assisted) refreshFilter.assistedOrder = true;
      const response = await PosService.getCart({
        filter: refreshFilter,
      });
      const data = response.data?.data?.[0] || {};
      updateCartInfo(data);
    }
  };

  useEffect(() => {
    const handleAddToCartEvent = (data: any) => {
      if (isValidCustomerType) {
        const detail = (data as CustomEvent)?.detail || {};
        const dealId = detail.dealId;
        // If item already exists in cart, scroll to it and show cart on mobile
        if (dealId && cart.some((item: any) => item.deal?.id === dealId)) {
          setScrollToDealId(dealId);
          if (isMobile) {
            setDisplayCart(true);
          }
        }
        if (isMobile) {
          setFabFlipKey((k) => k + 1);
        }
        refreshCart();
      }
    };
    document.addEventListener(POS_CART_ITEM_ADDED, handleAddToCartEvent);

    const handleRemoveFromCartEvent = (data: any) => {
      if (isValidCustomerType) {
        refreshCart();
      }
    };
    document.addEventListener(POS_CART_ITEM_REMOVED, handleRemoveFromCartEvent);

    const handleOrderPlacedEvent = () => {
      if (isValidCustomerType) fetchCart();
    };
    document.addEventListener(POS_ORDER_PLACED, handleOrderPlacedEvent);

    const handleStockAddedEvent = () => {
      if (isValidCustomerType) refreshCart();
    };
    document.addEventListener(POS_STOCK_ADDED, handleStockAddedEvent);

    return () => {
      document.removeEventListener(POS_CART_ITEM_ADDED, handleAddToCartEvent);
      document.removeEventListener(
        POS_CART_ITEM_REMOVED,
        handleRemoveFromCartEvent,
      );
      document.removeEventListener(POS_ORDER_PLACED, handleOrderPlacedEvent);
      document.removeEventListener(POS_STOCK_ADDED, handleStockAddedEvent);
    };
  }, [isValidCustomerType, fetchCart, refreshCart, cart, isMobile]);

  useEffect(() => {
    // Only fetch cart if we have a valid customer type
    if (isValidCustomerType) {
      fetchCart();
    }
  }, [isValidCustomerType, fetchCart]);

  // Switch to product view in mobile when cart becomes empty
  useEffect(() => {
    if (isMobile && cart.length === 0 && displayCart) {
      setDisplayCart(false);
    }
  }, [isMobile, cart.length, displayCart]);

  const handleCartCallback = (data: any) => {
    if (data.action === "checkout") {
      // Quick-checkout B2B follows the B2C fulfillment flow: payment is
      // collected upfront on the checkout page and the order lands Delivered.
      if (customerType === "b2b" && isQuickCheckout) {
        appNav.to(`/pos/b2c-checkout`, {
          cartId: guestCartIds[0],
          quickCheckout: "true",
          ...(selectedRetailer?._id
            ? { retailerId: selectedRetailer._id }
            : {}),
        });
        return;
      }
      // For B2B keep the modal flow; for B2C/walkin/assisted navigate to the page.
      // Both flows use dedicated pages: B2B and B2C/walkin/assisted.
      if (customerType === "b2b") {
        appNav.to(`/pos/b2b-checkout`, {
          cartId: guestCartIds[0],
          ...(selectedRetailer?._id
            ? { retailerId: selectedRetailer._id }
            : {}),
          ...(assisted ? { assisted: "true" } : {}),
        });
      } else {
        appNav.to(`/pos/b2c-checkout`, {
          cartId: guestCartIds[0],
          ...(assisted ? { assisted: "true" } : {}),
        });
      }
    }
    if (data.action === "back") {
      setDisplayCart(false);
    }
    if (data.action === "refreshCart") {
      refreshCart(guestCartIds[0]);
    }
  };

  // no customer type switching in walkin-only mode

  const handleCustomerTypeModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    if (payload.action === "select") {
      const selected = payload.data;
      const typeId = selected?.id || null;
      if (typeId) {
        // If b2b (normal or quick checkout) is selected, open retailer chooser first
        if (typeId === "b2b" || typeId === "b2b-quick") {
          setPendingQuickCheckout(typeId === "b2b-quick");
          setShowCustomerTypeModal(false);
          setShowChooseRetailerModal(true);
        } else {
          setPendingQuickCheckout(false);
          setCustomerType(typeId);
          setShowCustomerTypeModal(false);
          appNav.replace(`/pos/billing`, {
            type: typeId,
            ...(assisted ? { assisted: "true" } : {}),
          });
        }
      }
    }

    if (payload.action === "close") {
      setShowCustomerTypeModal(false);
    }
  };

  const handleChooseRetailerCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    if (payload.action === "select") {
      appToast.show({
        msg: t("retailerSelectedSuccessfully"),
        color: "success",
      });
      // When a retailer is chosen, store selection and redirect with
      // type + retailerId query params so the selection survives navigation
      const retailer = payload.data;
      setSelectedRetailer(retailer || null);
      setShowChooseRetailerModal(false);
      setCustomerType("b2b");
      appNav.replace(`/pos/billing`, {
        type: "b2b",
        ...(pendingQuickCheckout ? { quickCheckout: "true" } : {}),
        ...(retailer?._id ? { retailerId: retailer._id } : {}),
        ...(assisted ? { assisted: "true" } : {}),
      });
    }

    if (payload.action === "close") {
      // If user closes retailer modal, go back to customer type modal
      setShowChooseRetailerModal(false);
      setShowCustomerTypeModal(true);
    }
  };

  const updateCartInfo = (cart: Record<string, any> = {}) => {
    const items = (cart.items || []).map((item: any) => {
      let sellingType = "UNIT";
      let caseQty = 0;
      let innerCaseQty = 0;

      let availableStock = item.availableStock || 0;
      let quantity = item.quantity || 0;
      let actualQuantity = item.quantity || 0;
      let packageQty = 1;

      const mrp = Number(item.mrp) || 0;
      const snapshotMrps = Array.isArray(item.snapshots)
        ? item.snapshots
            .map((s: any) => Number(s?.mrp))
            .filter((n: number) => !isNaN(n) && n > 0)
        : [];
      const leastMrp =
        snapshotMrps.length > 0 ? Math.min(...snapshotMrps) : mrp;
      const purchasePrice = Number(item.purchasePrice) || 0;
      const discountType =
        customerType === "b2b" ? B2B_DISCOUNT_TYPE : B2C_DISCOUNT_TYPE;
      const discountPerc =
        mrp > purchasePrice && mrp > 0
          ? CommonService.calculateDiscount(
              mrp,
              purchasePrice,
              DISCOUNT_DECIMAL_PLACES,
              discountType,
            )
          : 0;

      const stOptions = SellerCatalogService.getSellingTypes();
      const stFound = stOptions.find(
        (st: any) => st.apiValue === item.packType,
      );

      if (stFound && item.packType !== "Unit") {
        sellingType = stFound.value;
        packageQty = item.packQuantity || 1;
        availableStock = Math.floor(availableStock / packageQty);
        quantity = SellerCatalogService.convertUnitsToPackQty(
          quantity,
          packageQty,
        );
      }

      return {
        ...item,
        selectedStockUom:
          item.selectedStockUom === "piece" ? "unit" : item.selectedStockUom,
        discountPerc,
        sellingType,
        packageQty,
        availableStock,
        quantity,
        actualQuantity,
        leastMrp,
      };
    });

    setCart(items);
    setCartSummary(cart.priceBreakdown);
    setCartDiscount(cart.discountInfo?.totalAmount || 0);
    setGuestCartIds(cart._id ? [cart._id] : []);
    if (cart._id) {
      CartService.setTmpCartData(cart._id, items);
    }
  };

  const handleCartTabsCallback = async (args: {
    action: string;
    data?: any;
  }) => {
    const fetchCartData = async (cartId: string) => {
      setBusyLoader(true);
      const tabFilter: Record<string, any> = { _id: cartId };
      if (assisted) tabFilter.assistedOrder = true;
      const response = await PosService.getCart({
        filter: tabFilter,
      });
      const data = response.data?.data?.[0] || {};
      updateCartInfo(data);
      setBusyLoader(false);
      return data;
    };

    if (args.action === "viewCart") {
      const activeCartId = guestCartIds[0];
      if (activeCartId === args.data.cartId) {
        return;
      }

      await fetchCartData(args.data.cartId);
    }

    if (args.action === "removeCart") {
      const cartId = args.data.cartId;
      const filteredCarts = allCarts.filter((cart) => cart.cartId !== cartId);
      setAllCarts(filteredCarts);
      setGuestCartIds(filteredCarts.map((cart) => cart._id));
      refreshCart(filteredCarts[filteredCarts.length - 1]._id);
    }

    if (args.action === "addCart") {
      const cartId = args.data.cartId;
      if (cartId) {
        setAllCarts(
          produce((draft) => {
            draft.push({
              _id: cartId,
              cartId: cartId,
            });
          }),
        );
        await fetchCartData(cartId);
      }
    }
  };

  return (
    <>
      <AppHeader
        title={assisted ? t("header.assistedOrder") : t("header.billing")}
        showAudioNote={true}
        audioNoteTitle={
          assisted ? t("header.assistedOrder") : t("header.billing")
        }
        audioFeature="posBilling"
      />
      <div className="page-padding app-page page-bg">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs sectionKey="bill" activeTab="pos" noShadow sticky />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="bill"
                  activeTab="pos"
                  title={t("manageSales", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <PageDescription
                description={assisted ? "assistedOrder" : "pos"}
                className="tw:mb-2"
              />

              {/* Recent Orders buttons removed here — recent orders is reached
                  through the floating FAB, which is shown only in the default
                  theme (hidden in theme-2 via `wa-recent-fab`). */}

              <div
                className={clsx("tw:flex tw:md:gap-4", {
                  "tw:flex-col": isMobile && displayCart,
                })}
              >
                <div
                  className={clsx("tw:md:flex-1 tw:w-full tw:pb-24 tw:md:pb-0", {
                    "tw:hidden": displayCart,
                  })}
                >
                  {/* Window tabs (guest carts) — B2C only. Kept in the left
                      column above the switch block so the cart can occupy the
                      full right section. */}
                  {!displayCart && customerType !== "b2b" && !assisted && (
                    <div className="theme-2-mobile-gap-top tw:mb-2">
                      <CartTabs
                        cartData={allCarts}
                        activeCartId={guestCartIds[0]}
                        callback={handleCartTabsCallback}
                      />
                    </div>
                  )}
                  {/* Switch block lives below the window tabs in the products
                      column (not full width) so the cart column can start at the
                      top and reclaim the vertical space. */}
                  {isValidCustomerType && !displayCart && (
                    <SwitchBlock
                      typeLabel={getCustomerTypeLabel(customerType)}
                      customerType={customerType}
                      quickCheckout={isQuickCheckout}
                      selectedRetailer={selectedRetailer}
                      onSwitch={() => setShowCustomerTypeModal(true)}
                      /* In B2B mobile there's no CartTabs row above, so the
                         block sits flush against the sticky section tabs — add
                         the gap here to restore the breathing room. */
                      className={clsx({
                        "theme-2-mobile-gap-top": customerType === "b2b",
                      })}
                    />
                  )}
                  {/* Only show products when customer type is explicitly b2b or b2c */}
                  {isValidCustomerType && (
                    <>
                      <div className={clsx({ "tw:hidden": showKeypad })}>
                        <Products
                          cartId={guestCartIds[0]}
                          customerType={customerType ?? undefined}
                          quickCheckout={isQuickCheckout}
                          autoAddSingleResult={!assisted}
                          assisted={assisted}
                          cartItems={cart}
                          onKeypadClick={() => {
                            submitToSearch("");
                            lastKeypadSubmitRef.current = null;
                            setKeypadNotice(null);
                            setShowKeypad(true);
                          }}
                          onSearchResult={handleProductsSearchResult}
                        />
                      </div>
                      {showKeypad && (
                        <Keypad
                          cart={cart}
                          notice={keypadNotice}
                          onClose={() => setShowKeypad(false)}
                          onSubmit={(v) => {
                            setKeypadNotice(null);
                            submitToSearch(v);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
                <div
                  className={clsx(
                    "tw:md:w-1/3 tw:sticky tw:top-4 tw:self-start",
                    {
                      "wa-cart-view tw:block tw:w-full": displayCart,
                      "tw:hidden tw:md:block": !displayCart,
                    },
                  )}
                >
                  {guestCartIds[0] && (
                    <Cart
                      data={cart}
                      cartId={guestCartIds[0]}
                      callback={handleCartCallback}
                      summary={cartSummary}
                      discount={cartDiscount}
                      type={assisted ? "b2b" : customerType || ""}
                      quickCheckout={isQuickCheckout}
                      assisted={assisted}
                      scrollToDealId={scrollToDealId}
                      onScrollComplete={() => setScrollToDealId(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer type modal: show when ?type is missing or empty */}
      <CustomerTypeModal
        show={showCustomerTypeModal}
        callback={handleCustomerTypeModalCallback}
        showClose={isValidCustomerType}
        hideQuickCheckout={assisted}
      />

      <ChooseRetailerModal
        show={showChooseRetailerModal}
        callback={handleChooseRetailerCallback}
      />

      <RecentOrdersModal
        show={showRecentOrdersModal}
        pendingOrderCount={pendingOrderCount}
        callback={({ action }) => {
          if (action === "close") setShowRecentOrdersModal(false);
        }}
      />

      <BarcodeListModal
        show={showBarcodeListModal}
        callback={(payload) => {
          if (payload.action === "close") {
            setShowBarcodeListModal(false);
          }
          if (payload.action === "select") {
            setShowBarcodeListModal(false);
            const barcode = payload.data?.barcode || "";
            if (barcode) {
              const searchInput = document.querySelector<HTMLInputElement>(
                'input[name="search"]',
              );
              if (searchInput) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  "value",
                )?.set;
                nativeInputValueSetter?.call(searchInput, barcode);
                searchInput.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
                searchInput.focus();
              }
            }
          }
        }}
      />

      {isMobile && !displayCart && (
        <AppButton
          color="light"
          className={`wa-recent-fab tw:fixed tw:right-4 tw:z-50 tw:rounded-full tw:w-12 tw:h-12 tw:shadow-lg ${
            cart.length > 0
              ? "tw:bottom-20 wa-above-cartbar"
              : "tw:bottom-4 wa-above-tabbar"
          }`}
          onClick={() => setShowRecentOrdersModal(true)}
        >
          <ClipboardList className="tw:size-5" />
          {pendingOrderCount > 0 && (
            <span className="tw:absolute tw:-top-1 tw:-right-1 tw:bg-red-500 tw:text-white tw:rounded-full tw:text-[10px] tw:leading-none tw:px-1.5 tw:py-0.5 tw:min-w-[18px] tw:flex tw:items-center tw:justify-center">
              {pendingOrderCount}
            </span>
          )}
        </AppButton>
      )}

      {/* Cart summary bar — replaces the floating cart button. Shows the live
          item count and payable total, and taps through to the full cart view
          (which hides the products block). */}
      {isMobile && cart.length > 0 && !displayCart && (
        <button
          key={fabFlipKey}
          type="button"
          onClick={() => setDisplayCart(true)}
          className="animate__animated animate__fadeInUp tw:fixed tw:bottom-4 wa-above-tabbar tw:inset-x-3 tw:z-50 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-full tw:bg-primary tw:px-5 tw:py-3 tw:text-white tw:shadow-lg tw:cursor-pointer"
        >
          <span className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold">
            <span className="tw:relative tw:flex">
              <ShoppingCart className="tw:size-5" />
              <span className="tw:absolute tw:-top-2 tw:-right-2 tw:flex tw:h-[18px] tw:min-w-[18px] tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:px-1 tw:text-[10px] tw:font-bold tw:text-primary">
                {cart.length}
              </span>
            </span>
            {cart.length > 1 ? "items in cart" : "item in cart"}
          </span>
          <span className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-bold">
            <Amount value={cartSummary?.finalPrice || 0} decimalPlaces={2} />
            <span className="tw:ml-1 tw:flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-bold tw:uppercase tw:tracking-wide">
              Proceed
              <ChevronRight className="tw:size-4" />
            </span>
          </span>
        </button>
      )}

      <BusyLoader show={busyLoader} />
    </>
  );
};

export default Billing;

export const meta = () => {
  return [
    { title: "POS Billing" },
    { name: "description", content: "POS Billing" },
  ];
};
