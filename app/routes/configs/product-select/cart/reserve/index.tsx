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
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import ReserveCartSidePane from "./components/ReserveCartSidePane";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import Summary from "./components/Summary";
import AppCard from "~/components/core/card/AppCard";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Save, Trash2, Wand2 } from "lucide-react";
import type { FormType } from "./helper";
import { validate } from "./helper";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import { orderBy } from "lodash";
import CommonService from "~/services/CommonService";

const ProductSelectCartReserve = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") || "";

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    SellerCatalogService.getInventorySourceBreadcrumb(source) || {
      label: "Product Select",
      redirect: {
        path: `/configs/product-select?feature=ReserveConfig${
          source ? `&source=${source}` : ""
        }`,
      },
    },
    { label: "Reserve Config" },
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
        cartType: "ReserveConfig",
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
              formData: {
                enableReserve:
                  dealInfo?.reserveConfig?.isActive === true ? "yes" : "no",
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

          appNav.replace(
            `/configs/product-select?feature=ReserveConfig${
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
    setAppAlertDialog((p) => ({ ...p, show: false }));
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
        cartType: "ReserveConfig",
        items: products.map((e: any) => {
          return {
            configType: "Deal",
            sellerId: AuthService.getLoggedInUserId(),
            dealId: e.dealInfo.dealId,
            isActive: e.formData.enableReserve === "yes",
          };
        }),
      };

      setBusyLoader({ show: true, msg: "Processing reserve configuration..." });

      // Using processCaseConfig from BulkCatalogCartService since it invokes the exact desired endpoint
      // and only passes the payload to `${API}catalog/bulk-catalog-cart/${cartId}/process`
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

          await fetchCartItems();
        } else {
          setSuccessModal({
            show: true,
            title: "Update Successful",
            description:
              response.data?.message ||
              "Reserve configuration processed successfully",
          });
        }
      } else {
        appToast.show({
          msg:
            response.data?.message || "Failed to process reserve configuration",
          color: "danger",
        });
      }
    } else if (args.action === "close") {
      setConfirmModal({ show: false, data: {} });
    }
  };

  const removeFromCart = async (itemId?: string, index?: number) => {
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
        appToast.show({
          msg:
            response.data?.message || "Product removed from cart successfully",
          color: "success",
        });

        if (typeof index === "number") {
          const updatedProducts = (products || []).filter(
            (_: any, i: number) => i !== index,
          );
          formMethods.setValue("products", updatedProducts);

          setTotalProducts((prev) => {
            const newVal = prev - 1;
            if (newVal === 0) {
              appNav.replace(
                `/configs/product-select?feature=ReserveConfig${
                  source ? `&source=${source}` : ""
                }`,
              );
            }
            return newVal;
          });
        } else {
          await fetchCartItems();
        }
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
    if (args.action === "remove-from-cart") {
      const { itemId, index } = args.data || {};
      await removeFromCart(itemId, index);
    } else if (args.action === "update-index-form") {
      const { index, key, value } = args.data || {};
      formMethods.setValue(`products.${index}.formData.${key}` as any, value);
    }
  };

  const handleGlobalApplyModal = (args: { action: string; data?: any }) => {
    setShowGlobalApplyModal(false);

    if (args.action === "submit") {
      const data = args.data || {};
      const products = formMethods.getValues("products") || [];
      const updated = (products || []).map((p: any) => {
        return {
          ...p,
          formData: {
            ...p.formData,
            enableReserve: data.enableReserve,
          },
        };
      });

      formMethods.setValue("products", updated);
      setShowGlobalConfigApplyModal(true);
    }
  };

  return (
    <>
      <AppHeader title="Cart - Reserve Configuration" />
      <div className="tw:p-4 app-page page-bg">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs sectionKey="catalog" activeTab="pricing" noShadow sticky />

        <div className="section-layout">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="pricing"
                title="Manage Catalog"
              />
            </div>
          </aside>

          <div className="section-content app-container">
            {/* The form wraps both columns — the side pane reads the same live
                values the table edits. */}
            <FormProvider {...formMethods}>
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
                <AppPaneMain className="tw:lg:col-span-12">
                  {!loading && totalProducts === 0 ? (
                    <NoData />
                  ) : (
                    <>
                      <div className="tw:mb-4 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-4">
                        <AppBreadcrumbs
                          data={breadcrumbs}
                          className="tw:mb-0! theme-2-mobile-hide"
                        />
                        <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:ml-auto">
                          <ViewToggle viewType={view} callback={setView} />
                          <AppButton
                            color="primary"
                            onClick={() => setShowGlobalApplyModal(true)}
                            disabled={totalProducts === 0}
                          >
                            <Wand2 size={16} />
                            Apply Global
                          </AppButton>
                        </div>
                      </div>

                      <div className="app-pane-hide">
                        <Summary loading={loading} />
                      </div>
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
                    </>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <ReserveCartSidePane />
                </AppPaneSide>
              </div>
            </FormProvider>
          </div>
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
          // Adjust navigation here as necessary, assuming we have a dashboard/inventory/reserve section
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
    </>
  );
};

export default ProductSelectCartReserve;
