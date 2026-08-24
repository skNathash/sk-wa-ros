import { produce } from "immer";
import {
  PackagePlus,
  Save,
  ShoppingCart,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PageDescription from "~/components/core/page-description/PageDescription";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
import useScreenView from "~/hooks/useScreenView";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";
import PageAccessService from "~/services/PageAccessService";
import UomPriceService from "~/services/UomPriceService";
import AddMoreImagesModal from "~/shared/catalog/modals/add-more-images/AddMoreImagesModal";
import ConsumerOfferConfigModal from "~/shared/catalog/modals/consumer-offer-config/ConsumerOfferConfigModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PageTopBar from "~/shared/layout/page-top-bar/PageTopBar";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import { getSubscribeHomeUrl } from "../helper";
import {
  getCount as getPendingCount,
  prepareParams as preparePendingParams,
} from "./components/create-pending/helper";
import DesktopView from "./components/DesktopView";
import CreatePending from "./components/create-pending/CreatePending";
import GlobalQtyApply from "./components/GlobalQtyApply";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import CartSidePane from "./components/theme2/CartSidePane";
import CartSummaryTheme2 from "./components/theme2/CartSummaryTheme2";
import DesktopViewTheme2 from "./components/theme2/DesktopViewTheme2";
import MobileViewTheme2 from "./components/theme2/MobileViewTheme2";
import { getCartTotals, toCartRowViews } from "./components/theme2/helper";
import type { CartItem } from "./helper";
import { clearCart, clone, removeItem, validateProducts } from "./helper";
import EditProductDetailModal from "./modals/EditProductDetailModal";
import GlobalQtyApplyStatusModal from "./modals/GlobalQtyApplyStatusModal";
import SaveToInventoryModal from "./modals/SaveToInventoryModal";
import SubscribeSuccessModal from "./modals/SubscribeSuccessModal";
import { SUBSCRIBE_MAX_PRODUCTS_COUNT } from "~/constants";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CATALOG.SUBSCRIBE"], {
    blockForMasterLogin: false,
    allowNoSubscribe: true,
  });
}

const SubscribeCart: React.FC = () => {
  const { t } = useTranslation(["menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  // Set just before an intentional programmatic navigation (after saving or
  // clearing the cart) so the "leave this page?" guard lets it through instead
  // of prompting the user to discard their own completed action.
  const allowLeaveRef = useRef(false);
  const navigateAway = useCallback(
    (path: string) => {
      allowLeaveRef.current = true;
      appNav.replace(path);
    },
    [appNav],
  );

  const [showLeaveAlert, setShowLeaveAlert] = useState(false);

  const [searchParams] = useSearchParams();
  const fromModule = searchParams.get("from");
  const version = searchParams.get("version");
  const newPendingCount = Number(searchParams.get("newPending") || "0");

  const [cartDetails, setCartDetails] = useState<any>(null);
  const [data, setData] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Warn before leaving with items in the cart — the inline edits (price, qty,
  // barcode, offers) live only in local state and are lost on navigation until
  // the user saves to inventory. Only guard when there's something to lose.
  const hasUnsavedCart = data?.length > 0;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedCart &&
      !allowLeaveRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") setShowLeaveAlert(true);
  }, [blocker.state]);

  // Guard hard reloads / tab close too.
  useEffect(() => {
    if (!hasUnsavedCart) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedCart]);

  const handleLeaveConfirm = () => {
    setShowLeaveAlert(false);
    if (blocker.state === "blocked") blocker.proceed();
  };

  const handleLeaveCancel = () => {
    setShowLeaveAlert(false);
    if (blocker.state === "blocked") blocker.reset();
  };

  const [cartLoaded, setCartLoaded] = useState(false);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [busyLoader, setBusyLoader] = useState({ show: false, message: "" });
  const [globalQuantity, setGlobalQuantity] = useState<string>("");
  const [unitOptions, setUnitOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [viewType, setViewType] = useState<"list" | "card">("list");

  // AI "create pending" items (products found by AI but not yet in the SK
  // catalog). When any exist we surface a second tab to create them.
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingStats, setPendingStats] = useState({
    foundBySk: 0,
    notMatched: 0,
  });
  // Honour a deep-linked tab (e.g. arriving from bulk barcode scan with only
  // creatable items). The tab bar still only shows once pending items exist.
  const [activeTab, setActiveTab] = useState<"current" | "pending">(
    searchParams.get("activeTab") === "pending" ? "pending" : "current",
  );

  const [editProductDetailModal, setEditProductDetailModal] = useState<{
    show: boolean;
    product: any;
    mode?: "edit" | "add" | "clone";
    index?: number;
  }>({
    show: false,
    product: undefined,
    mode: "edit",
    index: undefined,
  });

  const [globalQtyApplyStatusModal, setGlobalQtyApplyStatusModal] = useState<{
    show: boolean;
  }>({
    show: false,
  });

  const [saveToInventoryModal, setSaveToInventoryModal] = useState<{
    show: boolean;
  }>({
    show: false,
  });

  const [subscribeSuccessModal, setSubscribeSuccessModal] = useState<{
    show: boolean;
    count: number;
  }>({
    show: false,
    count: 0,
  });

  const [consumerOfferConfigModal, setConsumerOfferConfigModal] = useState<{
    show: boolean;
    deal: any;
  }>({
    show: false,
    deal: null,
  });

  const [updatePriceFromMrp, setUpdatePriceFromMrp] = useState(false);

  const [addMoreImagesModal, setAddMoreImagesModal] = useState<{
    show: boolean;
    dealName: string;
    dealId: string;
    dealRefId?: string;
    oldImages?: string[];
    itemId?: string;
  }>({
    show: false,
    dealName: "",
    dealId: "",
    dealRefId: undefined,
    oldImages: [],
    itemId: undefined,
  });

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

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string }>;
  }>({
    show: false,
    images: [],
  });

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await InventorySubscribeService.getCart();

      setCartDetails(response.data.data);
      setData(
        response.data?.data?.products.map((item: any) => {
          let barcodeOptions = [];
          let selectedBarcode = item.isCloned ? "" : item.barcodes?.[0] || "";

          if (!item.isCloned && item.barcodes?.length > 0) {
            barcodeOptions = item.barcodes.map((barcode: string) => ({
              value: barcode,
              label: barcode,
            }));
            // barcodeOptions.push({
            //   value: "Add New Barcode",
            //   label: "Add New Barcode",
            // });
          }
          const price = CommonService.roundedByDecimalPlace(
            AuthService.isMasterLogin() ? item.mrp : item.price,
          );
          return {
            ...item,
            quantity: item.quantity,
            price: price,
            originalPrice: price, // Store original price for reverting
            totalPrice:
              UomPriceService.toDisplayPrice(price, item.unit) * item.quantity,
            unitType: item.unit || "piece",
            barcode: selectedBarcode,
            barcodeOptions: barcodeOptions,
            showbarcodeOption: barcodeOptions.length > 0,
            // flag used to show duplicate item animation briefly
            duplicateItemAnimate: false,
            isConsumerOffer: item.isConsumerOffer || false,
            dealName: item.dealName || item.name || "",
            b2cPriceConfig: item.b2cPriceConfig || {
              discount: 0,
              fixedPrice: 0,
              isFixedPrice: false,
            },
          };
        }),
      );
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchCart();

    const fetchUomMasters = async () => {
      try {
        const response = await CommonService.getUomMasters({
          filter: {
            isPackType: false,
          },
        });
        const list = (response?.data?.data || []).filter((item: any) => {
          const name = item.name?.toLowerCase();
          return name !== "kg" && name !== "liter";
        });
        setUnitOptions(
          list
            .filter((item: any) => String(item.name).toLowerCase() !== "kg")
            .map((item: any) => ({ label: item.name, value: item.name })),
        );
      } catch (e) {
        // ignore
      }
    };
    fetchUomMasters();
  }, [fetchCart]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const baseParams = preparePendingParams(
        {},
        { activePage: 1, rowsPerPage: 10 },
      );
      const [count, foundBySk, notMatched] = await Promise.all([
        getPendingCount(baseParams),
        getPendingCount({
          ...baseParams,
          filter: {
            ...baseParams.filter,
            matchStatus: { $in: ["FoundInAi"] },
          },
        }),
        getPendingCount({
          ...baseParams,
          filter: {
            ...baseParams.filter,
            matchStatus: { $in: ["NotFound"] },
          },
        }),
      ]);
      setPendingCount(count);
      setPendingStats({ foundBySk, notMatched });
    } catch {
      // Best-effort
    } finally {
      setPendingLoaded(true);
    }
  }, []);

  // On load, check whether any AI "create pending" items exist. If so we show a
  // second tab so the user can create those products without leaving the cart.
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  useEffect(() => {
    const handleCountRefresh = () => {
      fetchPendingCount();
      // Subscribing an SK suggestion from the Create Pending tab adds a row to
      // the cart, so refresh it too to keep the "Ready to Submit" count current.
      fetchCart();
    };

    MiscService.listenEvent("create-pending-updated", handleCountRefresh);
    return () => {
      MiscService.removeEventListener(
        "create-pending-updated",
        handleCountRefresh,
      );
    };
  }, [fetchPendingCount, fetchCart]);

  // A deal can be subscribed from the barcode modal (a brand-new cart item is
  // created server-side), so refetch the cart when that happens.
  useEffect(() => {
    const handleItemAdded = () => {
      fetchCart();
    };
    MiscService.listenEvent("subscribe-item-added", handleItemAdded);
    return () => {
      MiscService.removeEventListener("subscribe-item-added", handleItemAdded);
    };
  }, [fetchCart]);

  const handleClone = async (index: number) => {
    setBusyLoader({ show: true, message: "Cloning item..." });
    const item = data[index];
    const sourceDealName = item.dealName || item.name || "";
    const result = await clone({
      name: item.name || item.dealName,
      // Default cloned quantity should be 0
      quantity: 0,
      isCloned: true,
      clonedFrom: item.dealId,
      mrp: item.mrp,
      price: item.price,
      unitType: item.unitType,
      dealName: sourceDealName,
    });

    if (result.status === "success") {
      const clonedIndex = index + 1;
      setData(
        produce((draft: any[]) => {
          const clonedItem = {
            ...item,
            showbarcodeOption: false,
            barcodeOptions: [],
            // cloned item default quantity should be 0
            quantity: 0,
            price: item.price,
            totalPrice: 0,
            unitType: item.unitType,
            barcode: "",
            isCloned: true,
            clonedFrom: result.data?.clonedFrom,
            itemId: result.data?.itemId,
            dealName:
              result.data?.dealName || result.data?.name || sourceDealName,
            duplicateItemAnimate: true, // Start with animation enabled
            isConsumerOffer: false, // Reset consumer offer for cloned items
          };
          draft.splice(clonedIndex, 0, clonedItem);
        }),
      );

      appToast.show({
        msg: result.msg,
        color: "success",
      });

      // Scroll to the cloned item after a short delay to ensure DOM is updated
      setTimeout(() => {
        const el = document.getElementById(`subscribe-cart-row-${clonedIndex}`);
        if (el) {
          CommonService.scrollToView(el);
        }
      }, 100);

      // Remove animation after 3 seconds
      setTimeout(() => {
        setData(
          produce((draft: any[]) => {
            if (draft[clonedIndex]) {
              draft[clonedIndex] = {
                ...draft[clonedIndex],
                duplicateItemAnimate: false,
              };
            }
          }),
        );
      }, 3000);
    } else {
      appToast.show({
        msg: result.msg,
        color: "danger",
      });
    }
    setBusyLoader({ show: false, message: "" });
  };

  const handleMarkAsLocal = async (index: number, barcode?: string) => {
    const item = data[index];
    if (!cartDetails?._id || !item?.itemId) return;

    setBusyLoader({ show: true, message: "Marking as local item..." });
    try {
      const response = await InventorySubscribeService.updateCartItem(
        cartDetails._id,
        item.itemId,
        {
          isLocalDeal: true,
          ...(barcode ? { barcodes: [barcode] } : {}),
        },
      );

      if (response.statusCode === 200) {
        setData(
          produce((draft: any[]) => {
            draft[index].isLocalDeal = true;
            if (barcode) draft[index].barcode = barcode;
          }),
        );
        appToast.show({ msg: "Marked as local item", color: "success" });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to mark as local item",
          color: "danger",
        });
      }
    } catch (e) {
      appToast.show({
        msg: "Failed to mark as local item",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, message: "" });
    }
  };

  const handleRemoveItem = async (index: number) => {
    setBusyLoader({ show: true, message: "Removing item..." });
    const item = data[index];
    const result = await removeItem(item.itemId, item.name);

    if (result.status === "success") {
      setData(
        produce((draft: any[]) => {
          draft.splice(index, 1);
        }),
      );

      InventorySubscribeService.removeLocalCartItem(item.itemId);
      InventorySubscribeService.triggerItemRemovedEvent({
        itemId: item.itemId,
      });

      appToast.show({
        msg: result.msg,
        color: "success",
      });
    } else {
      appToast.show({
        msg: result.msg,
        color: "danger",
      });
    }
    setBusyLoader({ show: false, message: "" });
  };

  const handleItemCallback = (params: { action: string; data?: any }) => {
    const index = params?.data?.index;

    if (params.action === "add-more-images") {
      const item = params.data.item;
      // For cloned items, use clonedFrom as dealId if dealId is not available
      // The image upload API needs a valid dealId to associate images with the original deal
      const dealId = item.dealId;
      const dealRefId = item.dealRefId;

      setAddMoreImagesModal((prev) => ({
        ...prev,
        show: true,
        dealName: item.dealName || item.name,
        dealId: dealId,
        dealRefId: dealRefId,
        oldImages: item.images || [],
        itemId: item.itemId,
      }));
      return;
    }

    if (params.action === "show-img-preview") {
      if (params.data.images.length > 0) {
        setImgPreviewModal({
          show: true,
          images: params.data.images.map((img: string) => ({ id: img })),
        });
      } else {
        appToast.show({
          msg: "No images found",
          color: "danger",
        });
      }
      return;
    }

    if (params.action === "edit") {
      setEditProductDetailModal({
        show: true,
        product: params.data,
        mode: "edit",
        index: index,
      });
      return;
    }

    if (params.action === "save") {
      appToast.show({
        msg: "Feature not implemented yet",
        color: "success",
      });
    } else if (params.action === "addBarcode") {
      setData(
        produce((draft) => {
          draft[index].showbarcodeOption = false;
          draft[index].barcode = "";
        }),
      );
    } else if (params.action === "cancelBarcode") {
      setData(
        produce((draft) => {
          draft[index].showbarcodeOption = true;
          draft[index].barcode = "";
        }),
      );
    } else if (params.action === "clone") {
      handleClone(index);
    } else if (params.action === "delete") {
      handleRemoveItem(index);
    } else if (params.action === "markAsLocal") {
      handleMarkAsLocal(index, params.data?.barcode);
    } else if (params.action === "enableOffer") {
      let deal: any = null;
      if (index !== undefined && data[index]) {
        const product = data[index];
        deal = {
          dealName: product.name,
          dealId: product.dealId,
          itemId: product.itemId,
          index,
          gst: product.gst,
          mrp: product.mrp,
          price: AuthService.isMasterLogin() ? product.mrp : product.price,
          unitType: product.unitType,
          hsnNumber: product.hsn,
          description: product.description,
          // forward brand and category so cloned offer can display them
          brand: (product as any).brand,
          category: (product as any).category,
        };
      }
      setConsumerOfferConfigModal({
        show: true,
        deal,
      });
    } else if (params.action === "b2cPriceConfigUpdate") {
      setData(
        produce((draft: any[]) => {
          draft[index].b2cPriceConfig = params.data.value;
        }),
      );
    } else if (params.action === "fieldUpdate") {
      setData(
        produce((draft: any) => {
          let value = params.data.value;

          if (value < 0) {
            value = "";
          }
          if (["mrp", "price", "quantity"].includes(params.data.key)) {
            draft[index][params.data.key] = value ? Number(value) : "";

            if (params.data.key === "quantity") {
              value = Math.round(value);
            }

            const qty = draft[index].quantity;
            const price = draft[index].price;
            const mrp = draft[index].mrp;

            if (price > mrp || AuthService.isMasterLogin()) {
              draft[index].price = mrp;
            }

            // Keep the fixed B2C selling price within the (new) MRP. Discount
            // mode needs no change — its final price is derived live from MRP.
            if (params.data.key === "mrp") {
              const cfg = draft[index].b2cPriceConfig;
              if (cfg?.isFixedPrice && Number(cfg.fixedPrice) > Number(mrp)) {
                cfg.fixedPrice = Number(mrp) || 0;
              }
            }

            draft[index].totalPrice =
              UomPriceService.toDisplayPrice(price, draft[index].unitType) *
              qty;
          } else if (params.data.key === "dealName") {
            draft[index][params.data.key] = value;
          } else if (params.data.key === "isConsumerOffer") {
            draft[index][params.data.key] = value;
          } else if (params.data.key === "barcode") {
            if (value === "Add New Barcode") {
              draft[index].showbarcodeOption = false;
              draft[index].barcode = "";
            } else {
              const cleaned = value.replace(/[^A-z0-9#\.]/g, "");
              draft[index].barcode = cleaned;
            }
          } else {
            draft[index][params.data.key] = value;
          }
        }),
      );
    }
  };

  const handleSetGlobalQuantity = () => {
    const quantity = Number(globalQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      appToast.show({
        msg: "Please enter a valid quantity greater than 0",
        color: "danger",
      });
      return;
    }

    setData(
      produce((draft: any[]) => {
        draft.forEach((item) => {
          item.quantity = quantity;
          item.totalPrice =
            UomPriceService.toDisplayPrice(item.price, item.unitType) *
            quantity;
        });
      }),
    );

    setGlobalQuantity("");
    appToast.show({
      msg: `Global quantity set to ${quantity} for all products`,
      color: "success",
    });
  };

  const handleClearCart = async () => {
    setAppAlertDialog({
      show: true,
      title: "Clear Cart",
      description:
        "Are you sure you want to clear the entire cart? This action cannot be undone.",
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, 800));
        setBusyLoader({ show: true, message: "Clearing cart..." });
        const result = await clearCart();
        if (result.status === "success") {
          setData([]);
          InventorySubscribeService.clearLocalCart();
          appToast.show({
            msg: result.msg,
            color: "success",
          });

          if (fromModule === "bulk-upload-products") {
            navigateAway("/dashboard/inventory/subscribe/add-product/bulk");
          } else if (fromModule === "bulk-upload") {
            navigateAway("/dashboard/inventory/subscribe/bulk-upload/barcode");
          } else if (fromModule === "barcode-scan") {
            navigateAway("/dashboard/inventory/barcode-scan");
          } else if (fromModule === "barcode-scan-bulk") {
            navigateAway("/dashboard/inventory/barcode-scan-bulk");
          } else {
            navigateAway("/dashboard/inventory/subscribe/search?tab=search");
          }
        } else {
          appToast.show({
            msg: result.msg,
            color: "danger",
          });
        }
        setBusyLoader({ show: false, message: "" });
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handlePriceUpdateToggle = (checked: boolean) => {
    setUpdatePriceFromMrp(checked);

    setData(
      produce((draft: any[]) => {
        draft.forEach((item) => {
          item.price = checked ? item.mrp : item.originalPrice || item.price;
          item.totalPrice =
            UomPriceService.toDisplayPrice(
              checked ? item.mrp : item.originalPrice || item.price,
              item.unitType,
            ) * item.quantity;
        });
      }),
    );
  };

  const handleSaveToInventory = async () => {
    const seenBarcodes = new Map<string, number>();
    for (let i = 0; i < data.length; i++) {
      const bc = (data[i].barcode || "").trim();
      if (!bc) continue;
      const isLocal = !!data[i].isLocalDeal;
      const seenKey = `${isLocal ? "local" : "deal"}:${bc}`;
      if (seenBarcodes.has(seenKey)) {
        const msg = isLocal
          ? `Duplicate barcode "${bc}" found across local products. Each local product must have a unique barcode.`
          : `Duplicate barcode "${bc}" found. Each deal must have a unique barcode.`;
        appToast.show({
          msg,
          color: "danger",
        });
        const dupIndex = i;
        const el = document.getElementById(`subscribe-cart-row-${dupIndex}`);
        if (el) CommonService.scrollToView(el);
        setData(
          produce((draft: any[]) => {
            if (draft[dupIndex]) draft[dupIndex].duplicateItemAnimate = true;
          }),
        );
        setTimeout(() => {
          setData(
            produce((draft: any[]) => {
              if (draft[dupIndex]) draft[dupIndex].duplicateItemAnimate = false;
            }),
          );
        }, 3000);
        return;
      }
      seenBarcodes.set(seenKey, i);
    }

    if (data.length > SUBSCRIBE_MAX_PRODUCTS_COUNT) {
      appToast.show({
        msg: `You can only save up to ${SUBSCRIBE_MAX_PRODUCTS_COUNT} items at a time. Please remove some items from the cart.`,
        color: "warning",
      });
      return;
    }

    const validation = validateProducts(data);
    if (validation.msg) {
      appToast.show({
        msg: validation.msg,
        color: "danger",
      });
      // If validation returned an index, scroll to that row
      if (validation.index >= 0) {
        const el = document.getElementById(
          `subscribe-cart-row-${validation.index}`,
        );
        if (el) {
          CommonService.scrollToView(el);
        }
        // set duplicate animation flag on the errored item briefly
        setData(
          produce((draft: any[]) => {
            if (draft[validation.index]) {
              draft[validation.index].duplicateItemAnimate = true;
            }
          }),
        );

        setTimeout(() => {
          setData(
            produce((draft: any[]) => {
              if (draft[validation.index]) {
                draft[validation.index].duplicateItemAnimate = false;
              }
            }),
          );
        }, 3000);
      }
      return;
    }

    // Show the modal instead of alert dialog
    setSaveToInventoryModal({ show: true });
  };

  // Handler for GlobalQtyApply component to avoid inline functions
  const handleGlobalQtyApply = (qty: number) => {
    // parent receives only validated qty from component
    setData(
      produce((draft: any[]) => {
        draft.forEach((item) => {
          if (item.isCloned) return;
          item.quantity = qty;
          item.totalPrice =
            UomPriceService.toDisplayPrice(item.price, item.unitType) * qty;
        });
      }),
    );

    setGlobalQtyApplyStatusModal({
      show: true,
    });
  };

  const handleGlobalQtyApplyStatusModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    setGlobalQtyApplyStatusModal((prev) => ({ ...prev, show: false }));

    if (params.action === "close") {
      setData(
        produce((draft) => {
          draft.forEach((item) => {
            item.globalQtyAnimate = true;
          });
        }),
      );

      const t = setTimeout(() => {
        clearTimeout(t);
        setData(
          produce((draft) => {
            draft.forEach((item) => {
              item.globalQtyAnimate = false;
            });
          }),
        );
      }, 3000);
    }
  };

  const handleSubscribeSuccessModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    setSubscribeSuccessModal({ show: false, count: 0 });

    if (params.action === "subscribe_more") {
      navigateAway("/dashboard/inventory/subscribe/search?tab=search");
    } else if (params.action === "go_to_inventory") {
      navigateAway("/dashboard/inventory/products/list");
    } else if (params.action === "review_pending") {
      setActiveTab("pending");
      fetchCart();
    } else {
      if (pendingCount > 0) {
        setActiveTab("pending");
        fetchCart();
      } else if (fromModule === "barcode-scan") {
        navigateAway("/dashboard/inventory/barcode-scan");
      } else if (fromModule === "barcode-scan-bulk") {
        navigateAway("/dashboard/inventory/barcode-scan-bulk");
      } else {
        navigateAway("/dashboard/inventory/subscribe/search?tab=search");
      }
    }
  };

  const handleSaveToInventoryModalCallback = async (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "cancel") {
      setSaveToInventoryModal({ show: false });
      return;
    }

    if (params.action === "confirm") {
      setSaveToInventoryModal({ show: false });

      await new Promise((resolve) => setTimeout(resolve, 500));

      setBusyLoader({
        show: true,
        message: "Saving products to inventory...",
      });

      try {
        // Prepare products array with required structure, including additional fields
        const products = data.map((item) => {
          const payload: any = {
            itemId: item.itemId,
            mrp: Number(item.mrp),
            price: Number(AuthService.isMasterLogin() ? item.mrp : item.price),
            unitType: item.unitType,
            barcode: item.barcode,
            quantity: item.isCloned
              ? 0
              : Number(
                  UomPriceService.toApiQuantity(item.quantity, item.unitType),
                ),
            dealName: item.isCloned ? item.dealName || item.name : item.name,
            isConsumerOffer: item.isConsumerOffer || false,
            isLocalDeal: item.isLocalDeal || false,
          };

          // B2C price config — only send when the user actually set a value
          // (a fixed selling price or a non-zero discount). Fixed and discount
          // are mutually exclusive: zero out the unused field.
          const isFixedPrice = !!item.b2cPriceConfig?.isFixedPrice;
          const fixedPrice = Number(item.b2cPriceConfig?.fixedPrice) || 0;
          const discount = Number(item.b2cPriceConfig?.discount) || 0;
          if (isFixedPrice && fixedPrice > 0) {
            payload.b2cPriceConfig = {
              isFixedPrice: true,
              fixedPrice,
              discount: 0,
            };
          } else if (!isFixedPrice && discount > 0) {
            payload.b2cPriceConfig = {
              isFixedPrice: false,
              fixedPrice: 0,
              discount,
            };
          }

          // Optional fields as requested
          if (item?.description) payload.description = item.description;
          if (item?.hsn) payload.hsnNumber = item.hsn;
          if (item?.gst !== undefined && item?.gst !== "")
            payload.gst = Number(item.gst);
          if (item?.newBrand) payload.newBrand = item.newBrand;
          if ((item as any)?.consumerOfferData) {
            payload.consumerOfferData = (item as any).consumerOfferData;
          }
          if (
            (item as any)?.consumerOfferPrice !== undefined &&
            (item as any)?.consumerOfferPrice !== null
          ) {
            payload.consumerOfferPrice = Number(
              (item as any).consumerOfferPrice,
            );
          }

          // Only include dealId if not a cloned deal
          if (!item.isCloned && item.dealId) {
            payload.dealId = item.dealId;
          }
          return payload;
        });

        const result = await InventorySubscribeService.saveToInventory({
          cartId: cartDetails._id,
          products,
        });

        if (result.statusCode === 200) {
          const pollingMessages = [
            "Processing your items...",
            "Hang tight, adding to your inventory...",
            "Almost there...",
            "Finalizing your subscription...",
            "Just a moment more...",
          ];
          const pollCartSummary = async () => {
            let messageIndex = 0;
            while (true) {
              try {
                const summary = await InventorySubscribeService.getCartSummary(
                  cartDetails._id,
                );
                const d = summary?.data?.data?.cartSummary || {};
                if (d) {
                  setBusyLoader({
                    show: true,
                    message:
                      pollingMessages[messageIndex % pollingMessages.length],
                  });
                  messageIndex++;
                  if (d.totalItems === d.executedItems) {
                    return;
                  }
                }
              } catch (e) {
                // ignore and retry
              }
              await new Promise((res) => setTimeout(res, 5000));
            }
          };
          await pollCartSummary();

          setBusyLoader({ show: false, message: "" });

          // update the local key of totalSubscribedProducts
          const user = AuthService.getLoggedInUser();
          if (user) {
            if (!user?.analytics) {
              user.analytics = {
                totalSubscribedDeals: 0,
              };
            }
            user.analytics.totalSubscribedDeals =
              user.analytics.totalSubscribedDeals + products.length;
            AuthService.setloggedInUser(user);
          }

          appToast.show({
            msg: result.data?.message || "Products saved to inventory",
            color: "success",
          });
          InventorySubscribeService.clearLocalCart();
          // Notify other parts of app that products were subscribed successfully (bulk)
          try {
            InventorySubscribeService.triggerSubscribeSuccessEvent({
              bulk: true,
              count: products.length,
            });
          } catch (e) {
            // ignore event errors
          }
          setSubscribeSuccessModal({
            show: true,
            count: products.length,
          });
        } else {
          setBusyLoader({ show: false, message: "" });
          appToast.show({
            msg: result.data?.message || "Failed to save products to inventory",
            color: "danger",
          });
        }
      } catch (error) {
        setBusyLoader({ show: false, message: "" });
        appToast.show({
          msg: "Failed to save products to inventory",
          color: "danger",
        });
      }
    }
  };

  const handleEditProductDetailModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    const action = params.action;
    const index = editProductDetailModal.index;

    setEditProductDetailModal((prev) => ({ ...prev, show: false }));

    if (action === "markAsLocal") {
      let productIndex = index;
      if (productIndex === undefined && params.data?.itemId) {
        productIndex = data.findIndex(
          (item) => item.itemId === params.data.itemId,
        );
      }
      if (productIndex !== undefined && productIndex >= 0) {
        handleMarkAsLocal(productIndex, params.data?.barcode);
      }
      return;
    }

    if (action === "createOffer") {
      // Find index from data array if not available from modal state
      let productIndex = index;
      if (productIndex === undefined && params.data?.itemId) {
        productIndex = data.findIndex(
          (item) => item.itemId === params.data.itemId,
        );
      }

      if (productIndex === undefined || productIndex < 0) {
        appToast.show({
          msg: "Product not found in cart",
          color: "danger",
        });
        return;
      }

      // Construct dealData for offer modal
      const productData = params.data;
      const calculatedPrice = AuthService.isMasterLogin()
        ? productData.mrp
        : productData.price;
      const deal: any = {
        dealName: productData.name,
        dealId: productData.dealId,
        itemId: productData.itemId,
        index: productIndex,
        gst: productData.gst,
        mrp: productData.mrp,
        b2cPrice: calculatedPrice,
        price: calculatedPrice,
        unitType: productData.unitType,
        hsnNumber: productData.hsn,
        description: productData.description,
        brand: productData.brand,
        category: productData.category,
        isConsumerOffer: productData.isConsumerOffer || false,
        consumerOfferData: productData.consumerOfferData,
        consumerOfferPrice: productData.consumerOfferPrice,
      };

      // Open offer modal
      setConsumerOfferConfigModal({
        show: true,
        deal,
      });
      return;
    }

    if (action === "clone") {
      if (index === undefined) {
        appToast.show({
          msg: "Unable to identify product for cloning",
          color: "danger",
        });
        return;
      }

      const clonedItem = params.data?.clonedItem;
      if (!clonedItem) {
        appToast.show({
          msg: "Duplicated item data missing",
          color: "danger",
        });
        return;
      }

      const clonedIndex = index + 1;
      setData(
        produce((draft: any[]) => {
          draft.splice(clonedIndex, 0, clonedItem);
        }),
      );

      setTimeout(() => {
        const el = document.getElementById(`subscribe-cart-row-${clonedIndex}`);
        if (el) {
          CommonService.scrollToView(el);
        }
      }, 100);

      setTimeout(() => {
        setData(
          produce((draft: any[]) => {
            if (draft[clonedIndex]) {
              draft[clonedIndex].duplicateItemAnimate = false;
            }
          }),
        );
      }, 3000);

      return;
    }

    if (action === "submit") {
      if (index === undefined) {
        appToast.show({
          msg: "Index is required",
          color: "danger",
        });
        return;
      }

      setData(
        produce((draft: any) => {
          Object.keys(params.data).forEach((key) => {
            if (typeof draft[index][key] !== undefined) {
              draft[index][key] = params.data[key];
            }
          });

          // Ensure cloned item's inline name input reflects edited name
          if (draft[index].isCloned && params.data?.name) {
            draft[index].dealName = params.data.name;
          }

          // Form uses `hsn`, but the row displays `hsnNumber` — keep them in sync
          if (params.data?.hsn !== undefined) {
            draft[index].hsnNumber = params.data.hsn;
          }

          // Recalculate totalPrice when price or quantity changes
          if (
            params.data?.price !== undefined ||
            params.data?.quantity !== undefined
          ) {
            const price =
              params.data?.price !== undefined
                ? params.data.price
                : draft[index].price;
            const quantity =
              params.data?.quantity !== undefined
                ? params.data.quantity
                : draft[index].quantity;
            draft[index].totalPrice =
              UomPriceService.toDisplayPrice(price, draft[index].unitType) *
              quantity;
          }
        }),
      );
    }
  };

  const handleViewToggle = (viewType: "list" | "card") => {
    setViewType(viewType);
  };

  const handleConsumerOfferConfigModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    setConsumerOfferConfigModal({ show: false, deal: null });
    if (params.action === "submit") {
      const index = params?.data?.index;

      if (index !== undefined) {
        setData(
          produce((draft: any[]) => {
            // First update the original item using an immer draft and get a fresh array
            // If a createdItem is present (clone was created), construct a new array immutably
            if (params.data?.createdItem) {
              const ci = params.data.createdItem;
              // Get images from the original product
              const originalProduct = draft[index];
              const newItem = {
                dealId: ci.clonedFrom || undefined,
                itemId: ci.itemId,
                name: ci.name || "",
                dealName: ci.name || "",
                mrp: ci.mrp,
                price: ci.price,
                originalPrice: ci.price,
                totalPrice: 0,
                unitType: ci.unitType || "unit",
                barcode: "",
                barcodeOptions: [],
                showbarcodeOption: false,
                quantity: 0,
                isCloned: true,
                clonedFrom: ci.clonedFrom,
                duplicateItemAnimate: true, // Start with animation enabled
                isConsumerOffer: true,
                consumerOfferData: params.data?.consumerOfferData,
                consumerOfferPrice: params.data?.consumerOfferPrice || null,
                gst: ci.gst,
                hsn: ci.hsn,
                description: ci.description,
                brand: ci.brand || undefined,
                category: ci.category || undefined,
                images: originalProduct?.images || [],
              } as any;

              const insertAt = Math.min(index + 1, draft.length);
              draft.splice(insertAt, 0, newItem);
            }
          }),
        );

        // Scroll to the cloned item after a short delay to ensure DOM is updated
        if (params.data?.createdItem) {
          const clonedIndex = index + 1;
          setTimeout(() => {
            const el = document.getElementById(
              `subscribe-cart-row-${clonedIndex}`,
            );
            if (el) {
              CommonService.scrollToView(el);
            }
          }, 100);

          // Remove animation after 3 seconds
          setTimeout(() => {
            setData(
              produce((draft: any[]) => {
                if (draft[clonedIndex]) {
                  draft[clonedIndex].duplicateItemAnimate = false;
                }
              }),
            );
          }, 3000);
        }
      }
      setConsumerOfferConfigModal({ show: false, deal: null });
    }
  };

  const handleImgPreviewModalCallback = () => {
    setImgPreviewModal({ show: false, images: [] });
  };

  const handleAddMoreImagesModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    const itemId = addMoreImagesModal.itemId;
    setAddMoreImagesModal((prev) => ({ ...prev, show: false }));
    if (params.action === "submit") {
      const newImages = params.data.payload?.newImages || [];
      const oldImages = params.data.payload?.oldImages || [];
      setData(
        produce((draft: any) => {
          draft.forEach((item: any) => {
            // Match by itemId to ensure we update the correct item (cloned items have unique itemId)
            if (item.itemId === itemId) {
              item.images = [...(newImages || []), ...oldImages];
            }
          });
        }),
      );
    }
  };

  // theme-2 reads the cart through a view model: display-scale prices, UOM
  // hints and badge flags per line, plus the cart-wide tally the overview and
  // the footer share. Cheap to derive, and it keeps the markup call-free.
  const theme2Rows = useMemo(() => toCartRowViews(data), [data]);
  const theme2Totals = useMemo(() => getCartTotals(theme2Rows), [theme2Rows]);

  const hasCartItems = data?.length > 0;
  const hasPending = pendingCount > 0;
  const isInitialLoading = !cartLoaded || !pendingLoaded;
  // The tab bar only earns its place when both sides have something to switch
  // between — cart items to submit AND pending products to create. With only
  // one populated, switching is meaningless, so we hide the bar and render that
  // side directly.
  const showTabs = hasCartItems && hasPending;
  // When the bar is hidden, fall back to whichever side actually has content:
  // the pending list when that's all there is (e.g. arriving from a scan whose
  // rows had no catalog match), otherwise the cart.
  const effectiveTab = showTabs
    ? activeTab
    : hasPending
      ? "pending"
      : "current";
  // Surface the continuity banner only when the user was routed here from a
  // barcode-scan flow — that's the jump that previously felt like a dead end.
  const showPendingBanner =
    false &&
    effectiveTab === "pending" &&
    (fromModule === "barcode-scan-bulk" || fromModule === "barcode-scan");

  // Show a banner on the 'current' tab when the user has both ready-to-submit
  // items and pending items to create.
  const showCurrentBanner =
    false &&
    effectiveTab === "current" &&
    (fromModule === "barcode-scan-bulk" || fromModule === "barcode-scan");

  const showSummary =
    fromModule !== "barcode-scan-bulk" && fromModule !== "barcode-scan";

  // Title reflects the active tab so the header and breadcrumb tell the user
  // which list they're looking at (ready-to-submit cart vs AI create-pending).
  const pageTitle =
    effectiveTab === "pending" ? "Create Pending" : "Subscription Cart";

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    fromModule === "barcode-scan-bulk"
      ? {
          label: "Barcode Scan",
          redirect: { path: "/dashboard/inventory/barcode-scan-bulk" },
        }
      : {
          label: "Create My Catalog",
          redirect: { path: getSubscribeHomeUrl(version) },
        },
    { label: pageTitle },
  ];

  const tabs: TabItem[] = [
    {
      key: "current",
      name: "Ready to Submit",
      count: data?.length || undefined,
      countColor: "tw:bg-green-500",
    },
    {
      key: "pending",
      name: "Create Pending",
      count: pendingCount || undefined,
      countColor: "tw:bg-blue-500",
    },
  ];

  // theme-2 top block — the page's sub-nav and its tools on one full-bleed
  // white strip pinned under the header, the same idiom the subscribe search
  // pages use. With the section chip strip commented out below, `PageTopBar` is
  // the right carrier: it pins directly under the header rather than assuming a
  // bar above it. It only renders once it has a tab row or the tools to carry —
  // an empty band would just be a white strip under the header.
  const showCartTools = effectiveTab === "current" && !loading && hasCartItems;
  const theme2TopBar =
    !showTabs && !showCartTools ? null : (
      <PageTopBar
        // Every block the strip carries is itself `app-pane-hide` — the pane
        // owns the tabs, the qty tool and the readiness split on desktop — so
        // on the pane layout the band would render with nothing in it, showing
        // as a blank white strip under the header. Drop the whole strip there.
        className="app-top-bar-flush app-top-bar-divided app-pane-hide"
        lead={
          showTabs ? (
            // `app-pane-hide`: on theme-2 desktop the split layout is active
            // and CartSidePane carries the tab row, so the strip drops its
            // copy rather than showing the same switch twice.
            <div className="app-pane-hide">
              <AppTab
                tabs={tabs}
                activeTab={effectiveTab}
                onTabChange={(tab) =>
                  setActiveTab(tab.key as "current" | "pending")
                }
                // The strip is the page's only sub-nav, so it reads as the same
                // chip row the subscribe browse pages pin under the header
                // (SubscribeNavChips) rather than a segmented control — on
                // desktop too, so the two surfaces don't switch idiom at md. The
                // lead track drops the strip's side padding below md, so the
                // leading/trailing inset comes from inside the track instead.
                variant="pills"
                slideOffset={isMobile ? 16 : 0}
              />
            </div>
          ) : null
        }
        trail={
          showCartTools ? (
            /* Also a pane resident on desktop — see CartSidePane. The list/card
               toggle used to sit alongside it here, but desktop is the only
               place it ever rendered (it hides below md) and the header reads
               cleaner without it. */
            <GlobalQtyApply
              onApply={handleGlobalQtyApply}
              className="tw:flex-1 app-pane-hide"
            />
          ) : null
        }
      >
        {/* Mirrors the "Showing x of y records" line on the search strip, but
            the cart's count is a readiness split rather than a page count — a
            flat sentence buries the one number that decides whether Save will
            go through. Read it as a bar plus two dotted counts instead: the
            fill answers "how close am I", the dots name what's left. The pane
            carries the same split on desktop, so this copy stands down there. */}
        {showCartTools ? (
          <div className="app-pane-hide tw:hidden tw:items-center tw:gap-2.5 tw:md:flex">
            <div
              className="tw:h-1 tw:w-14 tw:shrink-0 tw:overflow-hidden tw:rounded-full tw:bg-slate-200"
              role="presentation"
            >
              <div
                className="tw:h-full tw:rounded-full tw:bg-emerald-500 tw:transition-all"
                style={{ width: `${theme2Totals.readyPercent}%` }}
              />
            </div>
            <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-xs tw:tabular-nums tw:text-slate-500">
              <span>
                {theme2Totals.totalProducts} item
                {theme2Totals.totalProducts === 1 ? "" : "s"}
              </span>
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-emerald-600">
                <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-500" />
                {theme2Totals.readyCount} ready
              </span>
              {theme2Totals.pendingCount > 0 ? (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-amber-600">
                  <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-amber-500" />
                  {theme2Totals.pendingCount} need info
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </PageTopBar>
    );

  return (
    <>
      {/* Same header contract as the subscribe layout — section switcher on
          theme-2 mobile — but the cart is a drill-down, so it keeps the back
          lead rather than the layout's menu. */}
      <AppHeader title={pageTitle} sectionKey="catalog" activeTab="library" />
      <div className="page-bg app-page tw:p-4 has-footer">
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="library"
                title={t("menu:manageCatalog")}
              />
            </div>
          </aside>

          {/* Unlike the subscribe layout this page renders no chip strip of its
              own, so it doesn't take `subscribe-flush-top`: the top bar owns
              the pull-up here (`app-top-bar-flush`), which also has to clear
              the content grid's mobile top gap. */}
          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* theme-2 hides both of these (see `.app-breadcrumbs` /
                    `.app-page-description` in theme-2.css), but they'd still be
                    DOM siblings — and the column's `space-y-4` would then pay a
                    1rem gap above the top bar that its own -1rem bleed can no
                    longer cancel, showing as a page-bg band under the header.
                    Skip them so the strip is the column's first block. */}
                {!isTheme2 && (
                  <>
                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                      <AppBreadcrumbs data={breadcrumbs} />
                    </div>

                    <PageDescription
                      description={
                        effectiveTab === "pending"
                          ? "catalogCartPending"
                          : "catalogCart"
                      }
                      className="tw:mb-4"
                    />
                  </>
                )}

                {/* Sub-nav + content share one wrapper, as in the subscribe
                    layout, so the sticky top band has a tall enough parent to
                    travel over. `has-subscribe-nav` tells anything sticky below
                    that there's a strip above it to clear. */}
                <div>
                  {/* Section chip strip — commented out on the cart: it's a
                      drill-down, not a browse surface, so the strip only
                      competed with the tab row below it. */}
                  {/* <SubscribeNavChips className="tw:mb-2" /> */}

                  {isTheme2 ? (
                    theme2TopBar
                  ) : showTabs ? (
                    <AppTab
                      tabs={tabs}
                      activeTab={effectiveTab}
                      onTabChange={(tab) =>
                        setActiveTab(tab.key as "current" | "pending")
                      }
                      className="tw:mb-4"
                    />
                  ) : null}

                  {isInitialLoading ? (
                    <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
                      <AppSpinner />
                    </div>
                  ) : effectiveTab === "pending" ? (
                    <>
                      {showPendingBanner ? (
                        <div className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-violet-200 tw:bg-linear-to-r tw:from-violet-500/10 tw:via-indigo-500/5 tw:to-blue-500/10 tw:p-4 tw:flex tw:items-start tw:gap-3.5 tw:shadow-xs tw:backdrop-blur-xs tw:mb-4">
                          {/* Soft background glow decoration */}
                          <div className="tw:absolute tw:-right-10 tw:-top-10 tw:w-32 tw:h-32 tw:rounded-full tw:bg-violet-400/10 tw:blur-xl tw:pointer-events-none" />
                          <div className="tw:absolute tw:-left-10 tw:-bottom-10 tw:w-32 tw:h-32 tw:rounded-full tw:bg-blue-400/10 tw:blur-xl tw:pointer-events-none" />

                          {/* AI Purple Icon Container */}
                          <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-lg tw:bg-linear-to-br tw:from-violet-500 tw:to-indigo-600 tw:text-white tw:shrink-0 tw:shadow-md">
                            <Sparkles className="tw:w-4.5 tw:h-4.5 tw:animate-pulse" />
                            <span className="tw:absolute tw:inset-0 tw:rounded-lg tw:border tw:border-violet-300/30 tw:animate-ping tw:opacity-70" />
                          </div>

                          {/* Banner Text Content */}
                          <div className="tw:flex-1 tw:space-y-0.5">
                            <div className="tw:flex tw:items-center tw:gap-1.5">
                              <span className="tw:text-xs tw:font-bold tw:text-violet-900 tw:tracking-wide uppercase">
                                StoreKing AI Assist
                              </span>
                              <span className="tw:inline-flex tw:items-center tw:px-1.5 tw:py-0.5 tw:rounded-full tw:text-[9px] tw:font-semibold tw:bg-violet-100 tw:text-violet-800 tw:border tw:border-violet-200">
                                AI Suggestion
                              </span>
                            </div>
                            <p className="tw:text-xs tw:font-medium tw:text-indigo-950 tw:leading-relaxed">
                              These items were found by StoreKing AI but aren't
                              in the SK catalog yet. Create them below to add
                              them to your store.
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <CreatePending />
                    </>
                  ) : (
                    <>
                      {loading ? (
                        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                          <AppSpinner />
                        </div>
                      ) : null}

                      {!loading && !data?.length ? (
                        <NoData>
                          <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:max-w-sm">
                            <div className="tw:relative tw:mb-5 tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:rounded-full tw:bg-linear-to-br tw:from-violet-50 tw:to-indigo-50 tw:border tw:border-violet-100">
                              <ShoppingCart className="tw:w-7 tw:h-7 tw:text-violet-500" />
                            </div>
                            <h3 className="tw:text-sm tw:font-semibold tw:text-slate-800 tw:mb-1">
                              Your cart is empty
                            </h3>
                            <p className="tw:text-xs tw:text-slate-500 tw:leading-relaxed tw:mb-5">
                              Add products to subscribe and they'll show up
                              here, ready to save to your inventory.
                            </p>
                            <AppButton
                              color="primary"
                              size="small"
                              onClick={() =>
                                appNav.replace(
                                  "/dashboard/inventory/subscribe/main",
                                )
                              }
                            >
                              <PackagePlus className="tw:w-4 tw:h-4 tw:mr-1" />
                              Browse products
                            </AppButton>
                          </div>
                        </NoData>
                      ) : null}

                      {!loading && data?.length > 0 ? (
                        <>
                          {showCurrentBanner ? (
                            <div className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-violet-200 tw:bg-linear-to-r tw:from-violet-500/10 tw:via-indigo-500/5 tw:to-blue-500/10 tw:p-4 tw:flex tw:items-start tw:gap-3.5 tw:shadow-xs tw:backdrop-blur-xs tw:mb-4">
                              {/* Soft background glow decoration */}
                              <div className="tw:absolute tw:-right-10 tw:-top-10 tw:w-32 tw:h-32 tw:rounded-full tw:bg-violet-400/10 tw:blur-xl tw:pointer-events-none" />
                              <div className="tw:absolute tw:-left-10 tw:-bottom-10 tw:w-32 tw:h-32 tw:rounded-full tw:bg-blue-400/10 tw:blur-xl tw:pointer-events-none" />

                              {/* AI Purple Icon Container */}
                              <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-lg tw:bg-linear-to-br tw:from-violet-500 tw:to-indigo-600 tw:text-white tw:shrink-0 tw:shadow-md">
                                <Sparkles className="tw:w-4.5 tw:h-4.5 tw:animate-pulse" />
                                <span className="tw:absolute tw:inset-0 tw:rounded-lg tw:border tw:border-violet-300/30 tw:animate-ping tw:opacity-70" />
                              </div>

                              {/* Banner Text Content */}
                              <div className="tw:flex-1 tw:space-y-0.5">
                                <div className="tw:flex tw:items-center tw:gap-1.5">
                                  <span className="tw:text-xs tw:font-bold tw:text-violet-900 tw:tracking-wide uppercase">
                                    StoreKing AI Assist
                                  </span>
                                  <span className="tw:inline-flex tw:items-center tw:px-1.5 tw:py-0.5 tw:rounded-full tw:text-[9px] tw:font-semibold tw:bg-violet-100 tw:text-violet-800 tw:border tw:border-violet-200">
                                    AI Suggestion
                                  </span>
                                </div>
                                <p className="tw:text-xs tw:font-medium tw:text-indigo-950 tw:leading-relaxed">
                                  {showTabs && newPendingCount > 0
                                    ? `You have ${data.length} product${
                                        data.length > 1 ? "s" : ""
                                      } ready to submit in your cart, and ${pendingCount} scanned product${
                                        pendingCount > 1 ? "s" : ""
                                      } waiting to be created. Please review both tabs to complete the process.`
                                    : "Review your subscribed products below and click 'Save all to Inventory' at the bottom of the page to add them to your store."}
                                </p>
                              </div>
                            </div>
                          ) : null}
                          {/* Both themes open the list with what the cart adds
                              up to; theme-2 reads it off the same view model
                              the rows and the footer use, and carries margin
                              and tax on top of the item/value pair. */}
                          {showSummary ? (
                            isTheme2 ? (
                              <CartSummaryTheme2
                                totals={theme2Totals}
                                className="tw:mb-4"
                              />
                            ) : (
                              <Summary products={data} />
                            )
                          ) : null}

                          {/* theme-2 moves these onto the sticky top band with
                              the tabs (see `theme2TopBar`), so they only render
                              here for the classic themes. */}
                          {!isTheme2 ? (
                            <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:mb-4 tw:gap-3">
                              {/* <div className="tw:flex tw:items-center tw:space-x-2 tw:bg-gray-50 tw:py-2 tw:rounded-lg">
                  <Checkbox
                    id="update-price-from-mrp"
                    checked={updatePriceFromMrp}
                    onCheckedChange={handlePriceUpdateToggle}
                    className="tw:border-gray-800"
                  />
                  <label
                    htmlFor="update-price-from-mrp"
                    className="tw:text-xs tw:text-gray-700 tw:cursor-pointer tw:font-medium"
                  >
                    Update price from MRP for all products
                  </label>
                </div> */}

                              {/* Global Quantity Apply - Desktop only */}
                              <GlobalQtyApply onApply={handleGlobalQtyApply} />

                              <ViewToggle
                                viewType={viewType}
                                callback={handleViewToggle}
                              />
                            </div>
                          ) : null}

                          {isMobile || viewType === "card" ? (
                            isTheme2 ? (
                              <MobileViewTheme2
                                rows={theme2Rows}
                                totals={theme2Totals}
                                unitOptions={unitOptions}
                                callback={handleItemCallback}
                              />
                            ) : (
                              <MobileView
                                data={data}
                                callback={handleItemCallback}
                              />
                            )
                          ) : isTheme2 ? (
                            <DesktopViewTheme2
                              rows={theme2Rows}
                              totals={theme2Totals}
                              unitOptions={unitOptions}
                              callback={handleItemCallback}
                            />
                          ) : (
                            <DesktopView
                              data={data}
                              callback={handleItemCallback}
                              unitOptions={unitOptions}
                            />
                          )}
                        </>
                      ) : null}
                    </>
                  )}
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. It carries the tab row, the cart
                  summary and the apply-to-all qty tool; the top strip hides
                  its copies of those there (`app-pane-hide`). */}
              <AppPaneSide className="app-pane-only">
                <CartSidePane
                  activeTab={effectiveTab}
                  onTabChange={setActiveTab}
                  cartCount={data?.length || 0}
                  pendingCount={pendingCount || 0}
                  totals={theme2Totals}
                  pendingStats={pendingStats}
                  showTools={showCartTools}
                  onApplyQty={handleGlobalQtyApply}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Clear Cart and Save buttons */}
      {effectiveTab === "current" && !loading && data?.length ? (
        <footer className="app-footer">
          <div className="app-container">
            {isTheme2 ? (
              // The summary strip above the list already carries the tally and
              // the cart's value, so the bar is just the two actions — pushed
              // to opposite ends so the destructive one isn't next to Save.
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                <AppButton
                  fill="outline"
                  color="danger"
                  size="small"
                  className="tw:shrink-0"
                  onClick={() => handleClearCart()}
                >
                  <Trash2 className="tw:w-4 tw:h-4 tw:mr-1" />
                  Clear Entire Cart
                </AppButton>

                <AppButton
                  color="primary"
                  size="small"
                  onClick={handleSaveToInventory}
                >
                  <Save className="tw:w-4 tw:h-4 tw:mr-1" />
                  Save all to Inventory
                </AppButton>
              </div>
            ) : (
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-3 tw:flex-wrap">
                <AppButton
                  fill="outline"
                  color="danger"
                  onClick={() => handleClearCart()}
                >
                  <Trash2 className="tw:w-4 tw:h-4 tw:mr-1" />
                  Clear Entire Cart
                </AppButton>

                <AppButton color="primary" onClick={handleSaveToInventory}>
                  <Save className="tw:w-4 tw:h-4 tw:mr-1" />
                  Save all to Inventory
                </AppButton>
              </div>
            )}
          </div>
        </footer>
      ) : null}

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <AppAlertDialog
        show={showLeaveAlert}
        title="Leave this page?"
        description="You have items in your cart. Leaving will discard the details you've entered."
        okText="Leave"
        cancelText="Stay"
        onConfirm={handleLeaveConfirm}
        onCancel={handleLeaveCancel}
      />

      <GlobalQtyApplyStatusModal
        show={globalQtyApplyStatusModal.show}
        callback={handleGlobalQtyApplyStatusModalCallback}
        totalItems={data?.length}
      />

      <SaveToInventoryModal
        show={saveToInventoryModal.show}
        callback={handleSaveToInventoryModalCallback}
        products={data}
        cartId={cartDetails?._id || ""}
      />

      <SubscribeSuccessModal
        show={subscribeSuccessModal.show}
        callback={handleSubscribeSuccessModalCallback}
        count={subscribeSuccessModal.count}
        pendingCount={pendingCount}
      />

      <EditProductDetailModal
        show={editProductDetailModal.show}
        callback={handleEditProductDetailModalCallback}
        product={editProductDetailModal.product}
        mode={editProductDetailModal.mode}
        cartId={cartDetails?._id || ""}
        unitOptions={unitOptions}
      />

      <ConsumerOfferConfigModal
        show={consumerOfferConfigModal.show}
        callback={handleConsumerOfferConfigModalCallback}
        feature="subscribe"
        dealData={consumerOfferConfigModal.deal}
        cartId={cartDetails?._id || ""}
      />

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={handleImgPreviewModalCallback}
        images={imgPreviewModal.images}
      />

      <AddMoreImagesModal
        show={addMoreImagesModal.show}
        callback={handleAddMoreImagesModalCallback}
        dealName={addMoreImagesModal.dealName}
        dealId={addMoreImagesModal.dealId}
        dealRefId={addMoreImagesModal.dealRefId}
        feature="subscribe"
        oldImages={addMoreImagesModal.oldImages}
      />
    </>
  );
};

export default SubscribeCart;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Catalog Cart"),
    },
  ];
}
