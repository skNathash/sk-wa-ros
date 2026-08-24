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
import TodaySalesPill from "~/components/core/header/TodaySalesPill";
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
import useTheme from "~/hooks/useTheme";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import PosService from "~/services/PosService";
import { CustomerService } from "~/services/CustomerService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import SellerCatalogService from "~/services/SellerCatalogService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CartTabs from "./components/cart-tabs/CartTabs";
import Cart from "./components/cart/Cart";
import type { FnKeyItem } from "./components/fn-keys/FnKeys";
import Keypad from "./components/keypad/Keypad";
import Products from "./components/products/Products";
import SwitchBlock from "./components/SwitchBlock";
import BarcodeListModal from "./modals/barcode-list/BarcodeListModal";
import ChooseRetailerModal from "./modals/choose-retailer/ChooseRetailerModal";
import CustomerTypeModal from "./modals/customer-type/CustomerTypeModal";
import RecentOrdersModal from "./modals/recent-orders/RecentOrdersModal";
import ReorderModal from "./modals/reorder/ReorderModal";
import OrderPlacedModal from "./modals/order-placed/OrderPlacedModal";
import CheckoutFlowModal from "~/shared/pos/checkout/CheckoutFlowModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["SALE-ORDER.POS-BILLING"]);
}

const Billing = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(["posbilling", "menu"]);
  const { isMobile } = useScreenView();
  const { setOpen } = useSidebar();
  const isTheme2 = useTheme() === "theme-2";

  const appNav = useAppNav();
  const appToast = useAppToast();

  const typeInUrl = searchParams.get("type");
  const assisted = searchParams.get("assisted") === "true";
  // Quick checkout: a B2B cart flagged at creation to follow the B2C
  // fulfillment flow (snapshots on items, stock debit, invoice, Delivered).
  const quickCheckoutInUrl = searchParams.get("quickCheckout") === "true";
  const retailerIdInUrl = searchParams.get("retailerId") || "";
  const customerIdInUrl = searchParams.get("customerId") || "";

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

  const [reorderModal, setReorderModal] = useState<{
    show: boolean;
    orderId: string;
  }>({ show: false, orderId: "" });

  // Checkout runs in a modal over the cart: the counter never leaves the
  // billing screen, so a half-finished checkout can be dropped and the same
  // cart carried on with.
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [orderPlacedModal, setOrderPlacedModal] = useState<{
    show: boolean;
    orderId: string | null;
    orderRefNo: string | null;
    /** A B2B order can raise a reserve order alongside the sale order. */
    reserveOrderId: string | null;
    reserveOrderRefNo: string | null;
  }>({
    show: false,
    orderId: null,
    orderRefNo: null,
    reserveOrderId: null,
    reserveOrderRefNo: null,
  });

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

  // Theme-2 mobile reads the page as a chat: one sticky primary dock (window
  // chips + customer switch + scan rail) with either the search results or the
  // cart bubbles running underneath it. There is no separate full-screen cart
  // view here, so `displayCart` stays out of the picture.
  const docked = isTheme2 && isMobile;

  // Whether the product grid currently has a search/filter to show. In the
  // docked layout the cart takes over the space whenever it doesn't.
  const [productQueryActive, setProductQueryActive] = useState(false);

  const [selectedRetailer, setSelectedRetailer] = useState<any | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

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

  // If type is b2c and a customerId query param is present, restore the
  // customer record so the checkout can skip the select-customer step.
  useEffect(() => {
    const ct = (customerType || "").toLowerCase();
    if (ct !== "b2c") {
      setSelectedCustomer(null);
      return;
    }
    if (!customerIdInUrl) {
      setSelectedCustomer(null);
      return;
    }
    if (selectedCustomer?._id === customerIdInUrl) return;

    let cancelled = false;
    const restoreCustomer = async () => {
      try {
        const resp = await CustomerService.getCustomer(customerIdInUrl);
        const cust = resp?.data?.data;
        if (cancelled) return;
        if (cust?._id || cust?.customerId) {
          if (!cust._id) cust._id = cust.customerId;
          const holderId = cust?.id || cust?._id || cust?.customerId || null;
          if (holderId) {
            try {
              const pointsResp = await LoyaltyPointService.getHolderPoints(
                "Customer",
                holderId,
              );
              cust.points = pointsResp?.available ?? null;
            } catch (err) {
              cust.points = null;
            }
          }
          setSelectedCustomer(cust);
        } else {
          setSelectedCustomer(null);
        }
      } catch (e) {
        console.error("Error restoring customer from query param", e);
        if (!cancelled) setSelectedCustomer(null);
      }
    };

    restoreCustomer();
    return () => {
      cancelled = true;
    };
  }, [customerType, customerIdInUrl, selectedCustomer]);

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
          // The docked layout already shows the cart inline, so there is no
          // separate view to switch to.
          if (isMobile && !docked) {
            setDisplayCart(true);
          }
        }
        if (isMobile) {
          setFabFlipKey((k) => k + 1);
        }
        // Docked layout: the item is in the thread now, so the results that
        // produced it have done their job. Clear the search so the grid gives
        // the space back to the cart. Filter only self-clears after an
        // auto-add, which leaves a manual tap on a name-search result showing
        // the list with no cart in sight.
        if (docked) {
          setProductQueryActive(false);
          submitToSearch("");
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
  }, [isValidCustomerType, fetchCart, refreshCart, cart, isMobile, docked]);

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
      if (!guestCartIds[0] || cart.length === 0) {
        appToast.show({
          msg: "Add items to the cart before checking out",
          color: "error",
        });
        return;
      }

      setShowCheckoutModal(true);
    }
    if (data.action === "back") {
      setDisplayCart(false);
    }
    if (data.action === "refreshCart") {
      refreshCart(guestCartIds[0]);
    }
  };

  const handleCheckoutCallback = (payload: { action: string; data?: any }) => {
    if (payload.action === "close") {
      setShowCheckoutModal(false);
      return;
    }

    if (payload.action === "success") {
      setShowCheckoutModal(false);
      // Both the payment and the assisted-OTP path hand back the raw service
      // response; the order sits one level down on some of them.
      const resp = payload.data?.order || {};
      const placed = resp.data || resp;
      const order = placed.order || resp.order || placed || {};
      const reserve = placed.reserveOrder || {};
      setOrderPlacedModal({
        show: true,
        orderId: order.orderId ?? null,
        orderRefNo: order.orderRefNo ?? null,
        reserveOrderId: reserve.orderId ?? null,
        reserveOrderRefNo: reserve.orderRefNo ?? null,
      });
      if (isMobile) setDisplayCart(false);
      // `createPosOrder` fires POS_ORDER_PLACED, which refetches and opens the
      // next cart for the counter — nothing to reset here.
    }
  };

  const handleOrderPlacedCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    setOrderPlacedModal({
      show: false,
      orderId: null,
      orderRefNo: null,
      reserveOrderId: null,
      reserveOrderRefNo: null,
    });
    if (payload.action === "view-order" && payload.data?.orderId) {
      appNav.to(`/dashboard/orders/view/${payload.data.orderId}`);
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
        // Display-only fields for the chat-bubble cart row: the tax the meta
        // line prints, and the sent-at stamp its footer shows. The line's own
        // timestamp is preferred, then the cart's; a line that carries neither
        // is stamped now, so every bubble in the thread reads as sent.
        gstPerc: Number(item.gst ?? item.deal?.gst ?? 0) || 0,
        addedAt:
          item.createdAt ||
          item.updatedAt ||
          cart.updatedAt ||
          cart.createdAt ||
          new Date().toISOString(),
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

  // Opens another billing window (guest cart), the same way the "ADD" chip in
  // CartTabs does — the till's F2 is that chip without reaching for the mouse.
  const handleNewWindow = async () => {
    setBusyLoader(true);
    const response = await PosService.createGuestCart({
      platform: "POS",
      cartType: "B2C",
    });
    setBusyLoader(false);
    if (response.statusCode === 200) {
      await handleCartTabsCallback({
        action: "addCart",
        data: { cartId: response.data?.data?.cartId },
      });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to add cart",
        color: "danger",
      });
    }
  };

  // F9 walks the open windows in a ring, so repeated presses cycle through
  // every held bill and come back to the one in front of the operator.
  const handleNextWindow = () => {
    if (allCarts.length < 2) return;
    const current = allCarts.findIndex((c) => c.cartId === guestCartIds[0]);
    const next = allCarts[(current + 1) % allCarts.length];
    if (next?.cartId) {
      handleCartTabsCallback({
        action: "viewCart",
        data: { cartId: next.cartId },
      });
    }
  };

  // Window (guest cart) chips exist for B2C only. In theme-2 desktop they move
  // out of the products column into a sticky footer bar pinned to the bottom of
  // that column; everywhere else they stay inline above the switch block.
  const showWindowTabs = customerType !== "b2b" && !assisted && !displayCart;
  const windowTabsInFooter = showWindowTabs && isTheme2 && !isMobile;

  /* Function keys the page owns. Each one is an existing control on this
     screen, never a new capability: the strip under the scan rail is the same
     set of actions a mouse can already reach. Voice (F4) and keypad (F5) are
     the rail's own and get added there. Window keys only exist where windows
     do — B2C, non-assisted. */
  const fnKeys: FnKeyItem[] = [
    ...(showWindowTabs
      ? [
          {
            key: "F2",
            label: "New bill",
            // CartTabs stops offering ADD past three windows; so does the key.
            disabled: allCarts.length > 2,
            onPress: handleNewWindow,
          },
        ]
      : []),
    {
      key: "F3",
      label: "Customer",
      onPress: () => setShowCustomerTypeModal(true),
    },
    {
      key: "F6",
      label: "Barcodes",
      onPress: () => setShowBarcodeListModal(true),
    },
    {
      key: "F8",
      label: "Orders",
      onPress: () => setShowRecentOrdersModal(true),
    },
    ...(showWindowTabs
      ? [
          {
            key: "F9",
            label: "Window",
            disabled: allCarts.length < 2,
            onPress: handleNextWindow,
          },
        ]
      : []),
    {
      key: "F12",
      label: "Pay",
      disabled: cart.length === 0,
      onPress: () => handleCartCallback({ action: "checkout" }),
    },
  ];

  const renderWindowTabs = () => (
    <CartTabs
      cartData={allCarts}
      activeCartId={guestCartIds[0]}
      callback={handleCartTabsCallback}
    />
  );

  /* Window chips + switch row share one surface. The wrapper is
     layout-transparent (`display: contents`) everywhere except theme-2 mobile,
     where it becomes the top half of the sticky primary dock (see
     `.app-billing-topbar` / `.app-billing-dock` in pos-billing.css). */
  const topBar = (
    <div className="app-billing-topbar">
      {/* Window tabs (guest carts) — B2C only. Kept in the left column above
          the switch block so the cart can occupy the full right section. */}
      {showWindowTabs && !windowTabsInFooter && (
        <div className="app-billing-topbar-tabs theme-2-mobile-gap-top tw:mb-2">
          {renderWindowTabs()}
        </div>
      )}
      {/* Switch block lives below the window tabs in the products column (not
          full width) so the cart column can start at the top and reclaim the
          vertical space. */}
      {isValidCustomerType && !displayCart && (
        <SwitchBlock
          typeLabel={getCustomerTypeLabel(customerType)}
          customerType={customerType}
          quickCheckout={isQuickCheckout}
          selectedRetailer={selectedRetailer}
          selectedCustomer={selectedCustomer}
          onSwitch={() => setShowCustomerTypeModal(true)}
          /* In B2B mobile there's no CartTabs row above, so the block sits
             flush against the sticky section tabs — add the gap here to
             restore the breathing room. */
          className={clsx({
            "theme-2-mobile-gap-top": customerType === "b2b",
          })}
        />
      )}
    </div>
  );

  const cartPane = guestCartIds[0] ? (
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
  ) : null;

  return (
    // `pos-billing` is the parent hook every style written for this page hangs
    // off (see the "POS billing page" section in theme-2.css) — it wraps the
    // page shell plus the floating mobile bars so nothing here leaks elsewhere.
    <div className="pos-billing">
      <AppHeader
        title={assisted ? t("header.assistedOrder") : t("header.billing")}
        sectionKey="bill"
        activeTab="pos"
        mobileLead="menu"
        showAudioNote={true}
        audioNoteTitle={
          assisted ? t("header.assistedOrder") : t("header.billing")
        }
        audioFeature="posBilling"
        showHeaderClock={!isMobile}
        renderActions={
          <TodaySalesPill onClick={() => setShowRecentOrdersModal(true)} />
        }
      />
      <div className="page-padding app-page page-bg">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          {/* <SectionTabs sectionKey="bill" activeTab="pos" noShadow sticky /> */}

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
                  className={clsx(
                    "app-products-col tw:md:flex-1 tw:w-full tw:pb-24 tw:md:pb-0",
                    {
                      "tw:hidden": displayCart,
                    },
                  )}
                >
                  {!docked && topBar}
                  {/* Only show products when customer type is explicitly b2b or b2c */}
                  {isValidCustomerType && (
                    <>
                      {/* The dock is sticky against this box, so the inline
                          cart has to live inside it too — otherwise the dock
                          would unstick as soon as the (short) product block
                          scrolled past. */}
                      <div
                        className={clsx("app-billing-stage", {
                          "tw:hidden": showKeypad,
                        })}
                      >
                        <Products
                          cartId={guestCartIds[0]}
                          customerType={customerType ?? undefined}
                          buyerId={selectedRetailer?._id}
                          quickCheckout={isQuickCheckout}
                          autoAddSingleResult={!assisted}
                          assisted={assisted}
                          cartItems={cart}
                          dock={docked ? topBar : undefined}
                          fnKeys={fnKeys}
                          onQueryChange={setProductQueryActive}
                          onKeypadClick={() => {
                            submitToSearch("");
                            lastKeypadSubmitRef.current = null;
                            setKeypadNotice(null);
                            setShowKeypad(true);
                          }}
                          onSearchResult={handleProductsSearchResult}
                        />
                        {/* Chat-style cart: takes the product list's place
                            whenever there is nothing being searched for. An
                            empty cart has nothing to say, so it stays out of
                            the way until the first item is added. */}
                        {docked && !productQueryActive && cart.length > 0 && (
                          <div className="app-cart-inline app-bleed-x">
                            {cartPane}
                          </div>
                        )}
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

                  {/* Window chips footer — theme-2 desktop only. `margin-top:
                      auto` inside the min-height column drops it to the bottom
                      of the viewport, and it sticks there while the product
                      grid scrolls (see `.app-billing-footer` in theme-2.css). */}
                  {windowTabsInFooter && (
                    <div className="app-billing-footer">
                      <span className="app-billing-footer-label">Windows</span>
                      <div className="app-billing-footer-tabs">
                        {renderWindowTabs()}
                      </div>
                    </div>
                  )}
                </div>
                {/* The docked layout renders the cart inline above, so the
                    side column would only duplicate it. */}
                {!docked && (
                  <div
                    className={clsx(
                      "app-cart-col tw:md:w-1/3 tw:sticky tw:top-4 tw:self-start",
                      {
                        "wa-cart-view tw:block tw:w-full": displayCart,
                        "tw:hidden tw:md:block": !displayCart,
                      },
                    )}
                  >
                    {cartPane}
                  </div>
                )}
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
        callback={({ action, data }) => {
          if (action === "close") setShowRecentOrdersModal(false);
          if (action === "reorder" && data?.orderId) {
            setShowRecentOrdersModal(false);
            setReorderModal({ show: true, orderId: String(data.orderId) });
          }
        }}
      />

      <ReorderModal
        show={reorderModal.show}
        orderId={reorderModal.orderId}
        cartId={guestCartIds[0]}
        type={customerType || "b2c"}
        quickCheckout={isQuickCheckout}
        cartItems={cart}
        callback={({ action }) => {
          if (action === "close") {
            setReorderModal({ show: false, orderId: "" });
          }
          if (action === "added") {
            setReorderModal({ show: false, orderId: "" });
            refreshCart(guestCartIds[0]);
            if (isMobile) setDisplayCart(true);
          }
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
          (which hides the products block). The docked layout has the cart and
          its checkout button on screen already, so the bar is dropped there. */}
      {isMobile && !docked && cart.length > 0 && !displayCart && (
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

      {/* Checkout, over the cart. B2C collects at the counter; a plain B2B
          order runs its own payment / delivery / OTP steps inside the same
          modal, and quick-checkout B2B settles exactly like B2C. */}
      <CheckoutFlowModal
        show={showCheckoutModal}
        type={customerType === "b2b" ? "b2b" : "b2c"}
        quickCheckout={isQuickCheckout}
        cartId={guestCartIds[0]}
        assisted={assisted}
        customer={selectedCustomer}
        retailerId={selectedRetailer?._id || ""}
        callback={handleCheckoutCallback}
      />

      <OrderPlacedModal
        show={orderPlacedModal.show}
        orderId={orderPlacedModal.orderId ?? undefined}
        orderRefNo={orderPlacedModal.orderRefNo ?? undefined}
        reserveOrderId={orderPlacedModal.reserveOrderId ?? undefined}
        reserveOrderRefNo={orderPlacedModal.reserveOrderRefNo ?? undefined}
        isB2b={customerType === "b2b" && !isQuickCheckout}
        isAssisted={assisted}
        showInvoicePrint={!(customerType === "b2b" && !isQuickCheckout)}
        callback={handleOrderPlacedCallback}
      />
    </div>
  );
};

export default Billing;

export const meta = () => {
  return [
    { title: "POS Billing" },
    { name: "description", content: "POS Billing" },
  ];
};
