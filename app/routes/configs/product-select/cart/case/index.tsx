import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import GlobalApplyModal from "./modals/GlobalApplyModal";
import GlobalConfigApplyModal from "../../modals/GlobalConfigApplyModal";
import CartSuccessModal from "../../modals/CartSuccessModal";
import ConfirmModal from "./modals/ConfirmModal";
import AppHeader from "~/components/core/header/AppHeader";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";
import AuthService from "~/services/AuthService";
import BulkCatalogCartService from "~/services/BulkCatalogCartService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import Summary from "./components/Summary";
import AppCard from "~/components/core/card/AppCard";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Save, Trash2 } from "lucide-react";
import type { FormType } from "./helper";
import { validate } from "./helper";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import { orderBy } from "lodash";
import EditModal from "./modals/EditModal";
import CommonService from "~/services/CommonService";

const ProductSelectCartCase = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") || "";

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    SellerCatalogService.getInventorySourceBreadcrumb(source) || {
      label: "Product Select",
      redirect: {
        path: `/configs/product-select?feature=PackUpdate${
          source ? `&source=${source}` : ""
        }`,
      },
    },
    { label: "Sell In Config" },
  ];
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [view, setView] = useState<ViewToggleType>("list");

  const formMethods = useForm<FormType>({
    defaultValues: {
      products: [],
    },
  });

  const products = useWatch({
    control: formMethods.control,
    name: "products",
  });

  const [editModal, setEditModal] = useState<{
    show: boolean;
    data?: FormType;
  }>({
    show: false,
    data: undefined,
  });

  const [cartId, setCartId] = useState<string>("");
  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    action?: string;
  }>({
    show: false,
    title: "",
    description: "",
    action: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    msg: string;
  }>({
    show: false,
    msg: "",
  });

  const [showGlobalApplyModal, setShowGlobalApplyModal] = useState(false);
  const [globalConfigAnimate, setGlobalConfigAnimate] = useState(false);
  const [showGlobalConfigApplyModal, setShowGlobalConfigApplyModal] =
    useState(false);
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    title: string;
    description: string;
  }>({
    show: false,
    title: "",
    description: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    data?: any;
  }>({
    show: false,
    data: {},
  });

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await BulkCatalogCartService.getCart({
        cartType: "PackUpdate",
        franchiseId: AuthService.getLoggedInUserId(),
      });

      const cartData = response.data.data?.[0];
      setCartId(cartData?._id || "");

      setTotalProducts(cartData?.data?.length || 0);

      formMethods.setValue(
        "products",
        orderBy(cartData?.data || [], "dealInfo.dealName", "asc").map(
          (e: any) => {
            const dealInfo = e?.dealInfo || {};
            const packConfig = e?.packConfig || [];

            const casePack =
              packConfig.find((p: any) => p.packType === "Case") || {};
            const innerPack =
              packConfig.find((p: any) => p.packType === "InnerCase") || {};

            const defaultPack = (packConfig || []).find(
              (p: any) => p.isDefault === true,
            );

            let initialSellIn = defaultPack?.packType || "Choose";

            return {
              _id: e?._id,
              dealInfo: {
                dealName: dealInfo?.dealName,
                dealRefId: dealInfo?.dealRefId,
                dealId: dealInfo?.dealId,
                images: dealInfo?.images,
                mrp: dealInfo?.mrp,
                purchasePrice: dealInfo?.purchasePrice,
                b2bPrice: dealInfo?.b2bPrice,
                quantity: dealInfo?.quantity,
              },
              // store original packConfig for later payload construction
              originalPackConfig: packConfig,
              formData: {
                packageType: initialSellIn,
                packageQty:
                  (initialSellIn === "Case" && casePack.quantity != null) ||
                  (initialSellIn === "InnerCase" && innerPack.quantity != null)
                    ? initialSellIn === "Case"
                      ? casePack.quantity
                      : innerPack.quantity
                    : null,
                allowPackageQtyOverride:
                  initialSellIn === "Case"
                    ? casePack.allowCaseQtyOverride === true
                    : initialSellIn === "InnerCase"
                      ? innerPack.allowInnerCaseQtyOverride === true
                      : false,
              },
            };
          },
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleClearCart = () => {
    if (!cartId) {
      appToast.show({
        msg: "Cart ID not found",
        color: "danger",
      });
      return;
    }
    setAppAlertDialog({
      show: true,
      title: "Clear Cart",
      description:
        "Are you sure you want to clear all items from the cart? This action cannot be undone.",
      action: "clear-cart",
    });
  };

  const appAlertSuccessCb = async () => {
    const action = appAlertDialog.action;
    setAppAlertDialog((p) => ({ ...p, show: false }));

    if (action === "clear-cart") {
      if (!cartId) {
        appToast.show({ msg: "Cart ID not found", color: "danger" });
        return;
      }

      setBusyLoader({ show: true, msg: "Removing items from cart..." });
      try {
        const response = await BulkCatalogCartService.clearCart(cartId);
        if (response.statusCode === 200) {
          appToast.show({
            msg: response.data?.message || "Cart cleared successfully",
            color: "success",
          });
          await fetchCartItems();

          // redirect to product select after successful clear
          appNav.replace(
            `/configs/product-select?feature=PackUpdate${
              source ? `&source=${source}` : ""
            }`,
          );
        } else {
          appToast.show({
            msg: response.data?.message || "Failed to clear cart",
            color: "danger",
          });
        }
      } catch (error) {
        console.error(error);
        appToast.show({ msg: "Failed to clear cart", color: "danger" });
      } finally {
        setBusyLoader({ show: false, msg: "" });
      }
    }
  };

  const appAlertCancelCb = () => {
    const action = appAlertDialog.action;
    setAppAlertDialog((p) => ({ ...p, show: false }));

    if (action === "clear-cart") {
      // no-op beyond closing the dialog for now
    }
  };

  const handleSave = async () => {
    const products = formMethods.getValues("products");

    const validation = validate(products);
    if (validation.msg) {
      CommonService.scrollToView(`item-${validation.index}`);
      appToast.show({
        msg: validation.msg,
        color: "danger",
      });
      return;
    }

    setConfirmModal({ show: true, data: { products } });
  };

  const handleConfirmModal = async (args: { action: string; data?: any }) => {
    if (args.action === "submit") {
      setConfirmModal({ show: false, data: {} });

      const products = formMethods.getValues("products");

      const payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        cartType: "PackUpdate",
        data: products.map((e: any) => {
          return {
            _id: e?._id,
            dealId: e.dealInfo.dealId,
            sellerId: AuthService.getLoggedInUserId(),
            packConfig: (() => {
              const selectedType = e.formData?.packageType;
              const selectedQty = e.formData?.packageQty;
              const allowOverride =
                e.formData?.allowPackageQtyOverride === true;

              const packConfig: any[] = [];
              packConfig.push({
                packType: selectedType,
                quantity: selectedQty || 1,
                isDefault: true,
                allowCaseQtyOverride: allowOverride,
              });

              return packConfig;
            })(),
          };
        }),
      };

      setBusyLoader({ show: true, msg: "Processing sell in config..." });

      const response = await BulkCatalogCartService.processCaseConfig(
        cartId,
        payload,
      );

      setBusyLoader({ show: false, msg: "" });

      if (response.statusCode === 200) {
        const failures = response.data?.data?.failure;

        if (Array.isArray(failures) && failures.length > 0) {
          appToast.show({
            msg: response.data?.message || "Failed to process some items",
            color: "danger",
          });

          // re-fetch the cart so user can see remaining/failed items
          await fetchCartItems();
        } else {
          setSuccessModal({
            show: true,
            title: "Sell In Config Updated",
            description:
              "Sell In configuration has been applied successfully to all selected products.",
          });
        }
      } else {
        appToast.show({
          msg:
            response.data?.message || "Failed to process sell in config",
          color: "danger",
        });
      }
    } else if (args.action === "close") {
      setConfirmModal({ show: false, data: {} });
    }
  };

  const removeFromCart = async (itemId?: string) => {
    if (!itemId) {
      appToast.show({ msg: "Item ID not found", color: "danger" });
      return;
    }

    if (!cartId) {
      appToast.show({ msg: "Cart ID not found", color: "danger" });
      return;
    }

    setBusyLoader({ show: true, msg: "Removing item..." });
    try {
      const response = await BulkCatalogCartService.removeFromCart(
        cartId,
        itemId,
      );

      if (response.statusCode === 200) {
        // Remove product from form only, do not re-fetch cart to avoid resetting unsaved values
        const products = formMethods.getValues("products") || [];
        const updatedProducts = products.filter((p: any) => p._id !== itemId);
        formMethods.setValue("products", updatedProducts);
        setTotalProducts(updatedProducts.length);

        appToast.show({
          msg:
            response.data?.message || "Product removed from cart successfully",
          color: "success",
        });
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to remove product from cart",
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
      appToast.show({
        msg: "Failed to remove product from cart",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const itemCallback = async (args: { action: string; data?: any }) => {
    if (args.action === "edit") {
      setEditModal({ show: true, data: args.data });
      return;
    }

    if (args.action === "fieldUpdate") {
      const products = formMethods.getValues("products");
      const { key, index } = args.data;

      // When package quantity changes -> prevent negative
      if (key === "packageQty") {
        try {
          const raw = products?.[index]?.formData?.packageQty;
          const qty = !raw ? null : Number(raw);

          if (qty !== null && (isNaN(qty) || qty < 0)) {
            formMethods.setValue(`products.${index}.formData.packageQty`, null);
          }
        } catch (e) {
          console.error("Failed to validate packageQty", e);
        }
      }

      // When package type changes -> update packageQty to original pack value for that type
      if (key === "packageType") {
        try {
          const newType = products?.[index]?.formData?.packageType;
          const orig = products?.[index]?.originalPackConfig || [];
          const found = (orig || []).find((p: any) => p.packType === newType);

          if (newType === "Unit") {
            formMethods.setValue(`products.${index}.formData.packageQty`, 1);
            formMethods.setValue(
              `products.${index}.formData.allowPackageQtyOverride`,
              false,
            );
            return;
          }

          formMethods.setValue(
            `products.${index}.formData.packageQty`,
            found?.quantity ?? null,
          );
          formMethods.setValue(
            `products.${index}.formData.allowPackageQtyOverride`,
            newType === "Case"
              ? found?.allowCaseQtyOverride === true
              : newType === "InnerCase"
                ? found?.allowInnerCaseQtyOverride === true
                : false,
          );
        } catch (e) {
          console.error("Failed to handle packageType change", e);
        }
      }
    }

    if (args.action === "remove-from-cart") {
      const { itemId } = args.data || {};
      await removeFromCart(itemId);
    }
  };

  const handleGlobalApplyModal = (args: { action: string; data?: any }) => {
    setShowGlobalApplyModal(false);

    if (args.action === "submit") {
      const data = args.data || {};
      const products = formMethods.getValues("products") || [];
      // Batch update all products at once to avoid many re-renders
      const updated = (products || []).map((p: any) => {
        return {
          ...p,
          formData: {
            ...p.formData,
            packageType: data.packageType,
            packageQty: data.packageQty,
            allowPackageQtyOverride: data.allowPackageOverride,
          },
        };
      });

      formMethods.setValue("products", updated);
      setShowGlobalConfigApplyModal(true);
    }
  };

  const handleEditModalCallback = (args: { action: string; data?: any }) => {
    if (args.action === "submit") {
      const payload = args.data || {};
      const products = formMethods.getValues("products") || [];

      const updated = (products || []).map((p: any) => {
        if (p._id && payload._id && p._id === payload._id) {
          return {
            ...p,
            formData: {
              ...p.formData,
              packageType: payload.packageType,
              packageQty: payload.packageQty,
              allowPackageQtyOverride: payload.allowPackageOverride,
            },
          };
        }
        return p;
      });

      formMethods.setValue("products", updated);
      setEditModal({ show: false, data: undefined });
      return;
    }

    // default: close without changes
    setEditModal({ show: false, data: undefined });
  };

  return (
    <>
      <AppHeader title="Cart - Sell In Config" />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          {!loading && totalProducts === 0 ? (
            <NoData />
          ) : (
            <>
              <div className="tw:mb-4 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center">
                <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                <div className="tw:flex tw:items-center tw:gap-2">
                  <ViewToggle viewType={view} callback={setView} />
                  <AppButton
                    color="primary"
                    fill="outline"
                    onClick={() => setShowGlobalApplyModal(true)}
                    disabled={totalProducts === 0}
                  >
                    Apply Global
                  </AppButton>
                </div>
              </div>

              <FormProvider {...formMethods}>
                <Summary loading={loading} />
                {isMobile || view === "card" ? (
                  <MobileView
                    callback={itemCallback}
                    loading={loading}
                    animateApply={globalConfigAnimate}
                    products={products}
                  />
                ) : (
                  <AppCard noPadding={true}>
                    <DesktopView
                      callback={itemCallback}
                      loading={loading}
                      animateApply={globalConfigAnimate}
                      products={products}
                    />
                  </AppCard>
                )}
              </FormProvider>
            </>
          )}
        </div>
      </div>

      {!loading && totalProducts > 0 && (
        <div className="app-footer tw:text-right">
          <div className="tw:flex tw:justify-between">
            <AppButton
              color="danger"
              onClick={handleClearCart}
              disabled={!cartId}
              fill="outline"
            >
              <Trash2 size={16} />
              Clear Cart
            </AppButton>
            <AppButton color="success" onClick={handleSave}>
              <Save size={16} />
              Save
            </AppButton>
          </div>
        </div>
      )}

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertSuccessCb}
        onCancel={appAlertCancelCb}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />

      <GlobalConfigApplyModal
        show={showGlobalConfigApplyModal}
        totalItems={totalProducts}
        callback={(args: { action: string; data?: any }) => {
          setShowGlobalConfigApplyModal(false);
          if (args.action === "close") {
            setGlobalConfigAnimate(true);
            setTimeout(() => setGlobalConfigAnimate(false), 3000);
          }
        }}
      />

      <CartSuccessModal
        show={successModal.show}
        title={successModal.title}
        description={successModal.description}
        callback={() => {
          setSuccessModal({ ...successModal, show: false });
          appNav.replace("/dashboard/inventory/products/list");
        }}
      />

      <GlobalApplyModal
        show={showGlobalApplyModal}
        callback={handleGlobalApplyModal}
      />
      <ConfirmModal
        show={confirmModal.show}
        products={confirmModal.data?.products}
        callback={handleConfirmModal}
      />

      <EditModal
        show={editModal.show}
        callback={handleEditModalCallback}
        data={editModal.data}
      />
    </>
  );
};

export default ProductSelectCartCase;
