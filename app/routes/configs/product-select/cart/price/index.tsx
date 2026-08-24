import { Save, Trash2, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import BulkCatalogCartService from "~/services/BulkCatalogCartService";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BreadcrumbItem, ViewToggleType } from "~/types/CommonTypes";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import PriceCartSidePane from "./components/PriceCartSidePane";
import CartSuccessModal from "../../modals/CartSuccessModal";
import GlobalConfigApplyModal from "../../modals/GlobalConfigApplyModal";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import type { FormType } from "./helper";
import { validate } from "./helper";
import EditModal from "./modals/EditModal";
import GlobalApplyModal from "./modals/GlobalApplyModal";

const PriceCart = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") || "";

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    SellerCatalogService.getInventorySourceBreadcrumb(source) || {
      label: "Product Select",
      redirect: {
        path: `/configs/product-select?feature=PriceUpdate${
          source ? `&source=${source}` : ""
        }`,
      },
    },
    { label: "Price Update" },
  ];
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const appNav = useAppNav();
  const formMethods = useForm<FormType>({
    defaultValues: {
      products: [],
    },
  });

  const { getValues } = formMethods;

  const { remove: removeField } = useFieldArray({
    control: formMethods.control,
    name: "products",
  });

  const [view, setView] = useState<ViewToggleType>("list");

  const [cartId, setCartId] = useState<string>("");

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: string;
  }>({
    show: false,
    title: "",
    description: "",
    action: "",
  });

  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [showGlobalApplyModal, setShowGlobalApplyModal] = useState(false);

  const [editModal, setEditModal] = useState<{
    show: boolean;
    data?: any;
  }>({
    show: false,
    data: undefined,
  });

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    msg: string;
  }>({
    show: false,
    msg: "",
  });

  const [globalConfigAnimate, setGlobalConfigAnimate] = useState(false);

  const [showGlobalConfigApplyModal, setShowGlobalConfigApplyModal] =
    useState(false);

  const [cartSuccessModal, setCartSuccessModal] = useState({
    show: false,
    title: "",
    description: "",
  });

  const dataContainerRef = useRef<HTMLDivElement>(null);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const response = await BulkCatalogCartService.getCart({
        cartType: "PriceUpdate",
        franchiseId: AuthService.getLoggedInUserId(),
      });

      const cartData = response.data.data?.[0];
      setCartId(cartData?._id || "");

      setTotalProducts(cartData?.data?.length || 0);

      const mappedProducts = (cartData?.data || []).map((e: any) => {
        const dealInfo = e?.dealInfo || {};

        const networkSellingPrice = dealInfo?.networkSellingPrice || {};

        const isFixedPrice = networkSellingPrice.discountType === "Fixed";

        return {
          _id: e?._id,
          dealInfo: {
            dealName: dealInfo?.dealName,
            dealRefId: dealInfo?.dealRefId,
            dealId: dealInfo?.dealId,
            images: dealInfo?.images,
            mrp: dealInfo?.mrp,
            purchasePrice: networkSellingPrice?.basePrice,
            b2bPrice: networkSellingPrice?.price,
            tax: dealInfo?.tax || 0,
          },
          formData: {
            discount: networkSellingPrice?.discount || 0,
            profit: 0,
            price: networkSellingPrice.price || 0,
            type: isFixedPrice ? "fixed" : "on_mrp",
          },
        };
      });

      formMethods.reset({ products: mappedProducts });
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

  const doClearCart = async () => {
    if (!cartId) {
      appToast.show({ msg: "Cart ID not found", color: "danger" });
      return;
    }
    try {
      const response = await BulkCatalogCartService.clearCart(cartId);
      if (response.statusCode === 200) {
        appToast.show({
          msg: response.data?.message || "Cart cleared successfully",
          color: "success",
        });
        if (source === "missing-config") {
          appNav.replace(`/dashboard/inventory/products/missing-config`);
        } else {
          appNav.replace(
            `/configs/product-select?feature=PriceUpdate${
              source ? `&source=${source}` : ""
            }`,
          );
        }
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to clear cart",
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: "Failed to clear cart",
        color: "danger",
      });
    }
  };

  const alertSuccessCb = async () => {
    setAppAlertDialog((prev) => ({ ...prev, show: false }));

    if (appAlertDialog.action === "clear-cart") {
      await doClearCart();
    }
  };

  const alertCancelCb = () => {
    setAppAlertDialog((prev) => ({ ...prev, show: false }));
  };

  const handleSave = async () => {
    const products = formMethods.getValues("products");

    const validation = validate(products);

    if (validation.msg) {
      appToast.show({
        msg: validation.msg,
        color: "danger",
      });
      if (validation.index !== -1) {
        CommonService.scrollToView(
          dataContainerRef.current?.querySelector(`#item-${validation.index}`),
        );
      }
      return;
    }

    const payload = {
      franchiseId: AuthService.getLoggedInUserId(),
      cartType: "PriceUpdate",
      data: products.map((e: any) => {
        const deal = e.dealInfo || {};
        const form = e.formData || {};
        const isFixed = form.type === "fixed";

        return {
          _id: e?._id,
          id: deal.dealId,
          dealId: deal.dealId,
          applicableFor: "Network",
          configOnType: "Deal",
          discount: isFixed ? 0 : form.discount || 0,
          isFixedPrice: isFixed,
          fixedPrice: isFixed ? Number(form.price) || 0 : 0,
        };
      }),
    };

    setBusyLoader({ show: true, msg: "Processing price update..." });

    const response = await BulkCatalogCartService.processScheme(
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
        setCartSuccessModal({
          show: true,
          title: "Price update processed successfully",
          description: response.data?.message || "All items have been updated.",
        });
      }
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to process price update",
        color: "danger",
      });
    }
  };

  const handleRemoveFromCart = async (index: number) => {
    const products = formMethods.getValues("products");
    const product = products[index] || {};
    const itemId = product?._id || "";

    if (!itemId) {
      appToast.show({ msg: "Item ID not found", color: "danger" });
      return;
    }

    setBusyLoader({ show: true, msg: "Removing item..." });
    try {
      const response = await BulkCatalogCartService.removeFromCart(
        cartId,
        itemId,
      );
      if (response.statusCode === 200) {
        const idx = index;
        if (typeof idx === "number") {
          removeField(idx);
        }
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

    if (args.action === "remove-from-cart") {
      handleRemoveFromCart(args.data.index);
    }
  };

  const handleEditModalCallback = (args: { action: string; data?: any }) => {
    if (args.action === "submit") {
      const payload = args.data || {};
      const products = formMethods.getValues("products") || [];

      const updated = (products || []).map((p: any) => {
        if (p._id && payload._id && p._id === payload._id) {
          const deal = p.dealInfo || {};
          const oldType = p.formData?.type;

          // if type changed, clear discount, price and profit
          if (payload.type !== oldType) {
            return {
              ...p,
              formData: {
                ...p.formData,
                price: null,
                type: payload.type,
                discount: null,
                profit: null,
              },
            };
          }

          // type didn't change: apply edits and cap discount
          let newPrice = Number(p.formData.price) || 0;

          if (payload.type === "fixed") {
            newPrice = Number(payload.price) || 0;
            // keep discount cleared for fixed mode
            p.formData.discount = 0;
          } else {
            let disc = Number(payload.discount) || 0;
            if (disc > 100) disc = 100;
            newPrice = deal.mrp - (deal.mrp * disc) / 100;
            p.formData.discount = disc;
          }

          const purchasePrice = Number(deal.purchasePrice) || 0;

          const pnl = SellerCatalogService.calculatePnL(
            "network",
            Number(newPrice) || 0,
            purchasePrice,
          );

          return {
            ...p,
            formData: {
              ...p.formData,
              price: Number(newPrice) || 0,
              type: payload.type,
              discount: p.formData.discount,
              profit: Number(pnl.profit || 0),
            },
          };
        }
        return p;
      });

      formMethods.reset({ products: updated });
      setEditModal({ show: false, data: undefined });
      return;
    }

    setEditModal({ show: false, data: undefined });
  };

  return (
    <>
      <AppHeader title="Cart - Price Update" />
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
                      <div className="tw:mb-4 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center">
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
                      <div className="tw:mb-4 tw:text-sm tw:text-gray-700">
                        Total Products:{" "}
                        <span className="tw:font-bold">{totalProducts}</span>
                      </div>
                      <div className="tw:mb-4">
                        <InfoBlock size="sm" variant="info" bordered>
                          <span className="tw:text-xs tw:font-medium">
                            Note: This is applicable only for B2B customers
                          </span>
                        </InfoBlock>
                      </div>
                      <div ref={dataContainerRef}>
                        {isMobile || view === "card" ? (
                          <MobileView
                            callback={itemCallback}
                            loading={loading}
                            animateApply={globalConfigAnimate}
                          />
                        ) : (
                          <AppCard noPadding={true}>
                            <DesktopView
                              callback={itemCallback}
                              loading={loading}
                              animateApply={globalConfigAnimate}
                            />
                          </AppCard>
                        )}
                      </div>
                    </>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed pane
                  beside the icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <PriceCartSidePane />
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
        onConfirm={alertSuccessCb}
        onCancel={alertCancelCb}
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
        show={cartSuccessModal.show}
        title={cartSuccessModal.title}
        description={cartSuccessModal.description}
        callback={() => {
          setCartSuccessModal({ ...cartSuccessModal, show: false });
          appNav.to("/dashboard/inventory/products/missing-config");
        }}
      />
      <GlobalApplyModal
        show={showGlobalApplyModal}
        callback={(args: { action: string; data?: any }) => {
          setShowGlobalApplyModal(false);
          if (args.action === "submit") {
            const data = args.data || {};
            const products = formMethods.getValues("products") || [];
            const updated = (products || []).map((p: any) => {
              const deal = p.dealInfo || {};
              let price = Number(data.price) || 0;
              const isFixed = data.type === "fixed";

              // For fixed price type ensure price does not exceed product MRP
              if (isFixed) {
                const mrp = Number(deal.mrp) || 0;
                if (price > mrp) price = mrp;
                if (price < 0) price = 0;
              }

              const purchasePrice = Number(deal.purchasePrice) || 0;

              const pnl = SellerCatalogService.calculatePnL(
                "network",
                price,
                purchasePrice,
              );

              return {
                ...p,
                formData: {
                  ...p.formData,
                  price,
                  type: data.type,
                  profit: Number(pnl.profit || 0),
                },
              };
            });

            formMethods.reset({ products: updated });
            setShowGlobalConfigApplyModal(true);
          }
        }}
      />
      <EditModal
        show={editModal.show}
        callback={handleEditModalCallback}
        data={editModal.data}
      />
    </>
  );
};

export default PriceCart;
