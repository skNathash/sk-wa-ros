import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import GlobalApplyModal from "./modals/GlobalApplyModal";
import GlobalConfigApplyModal from "../../modals/GlobalConfigApplyModal";
import CartSuccessModal from "../../modals/CartSuccessModal";
import EditModal from "./modals/EditModal";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";
import AppHeader from "~/components/core/header/AppHeader";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AuthService from "~/services/AuthService";
import BulkCatalogCartService from "~/services/BulkCatalogCartService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import MobileView from "./components/MobileView";
import DesktopView from "./components/DesktopView";
import AppCard from "~/components/core/card/AppCard";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Save, Trash2 } from "lucide-react";
import type { FormType } from "./helper";
import { validate } from "./helper";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import { endOfDay, startOfDay } from "date-fns";

const ProductSelectCart = () => {
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
    { label: "B2B Scheme" },
  ];
  const appToast = useAppToast();
  const appNav = useAppNav();
  const formMethods = useForm<FormType>({
    defaultValues: {
      products: [],
    },
  });

  const { isMobile } = useScreenView();
  const [view, setView] = useState<ViewToggleType>("list");

  const { getValues, setValue } = formMethods;

  const products = useWatch({
    control: formMethods.control,
    name: "products",
  });

  const totalProducts = products.length;

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

      const mappedProducts = (cartData?.data || []).map((e: any) => {
        const dealInfo = e?.dealInfo || {};

        const networkSellingPrice = dealInfo?.networkSellingPrice || {};
        const offerOfTheDay = networkSellingPrice?.offerOfTheDay || {};

        let calculateOn = "afterTax";
        if (!offerOfTheDay?.isTaxInclusive) {
          calculateOn = "beforeTax";
        }

        return {
          _id: e?._id,
          dealInfo: {
            dealName: dealInfo?.dealName,
            dealRefId: dealInfo?.dealRefId,
            dealId: dealInfo?.dealId,
            images: dealInfo?.images,
            mrp: dealInfo?.mrp,
            purchasePrice: dealInfo?.latestPurchasePrice,
            b2bPrice: networkSellingPrice?.price,
            tax: dealInfo?.tax || 0,
            additionalCess: dealInfo?.additionalCess || 0,
          },
          formData: {
            offerStartDate: offerOfTheDay?.offerStartDate,
            offerEndDate: offerOfTheDay?.offerEndDate,
            offerDiscount: offerOfTheDay?.offerDiscount || null,
            calculateOn: calculateOn,
            schemePrice: 0,
            profit: 0,
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
        appNav.replace(
          `/configs/product-select?feature=PriceUpdate${
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
        return {
          _id: e?._id,
          dealId: e.dealInfo.dealId,
          offerOfTheDay: {
            isOfferOfTheDay: e.formData.isOfferOfTheDay,
            offerStartDate: startOfDay(
              new Date(e.formData.offerStartDate as Date),
            ),
            offerEndDate: endOfDay(new Date(e.formData.offerEndDate as Date)),
            offerDiscount: e.formData.offerDiscount,
            isTaxInclusive: e.formData.calculateOn === "afterTax",
          },
        };
      }),
    };

    setBusyLoader({ show: true, msg: "Processing scheme..." });

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
          title: "B2B Price Scheme Updated",
          description:
            response.data?.message ||
            "B2B price scheme has been applied successfully to all selected products.",
        });
      }
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to process scheme",
        color: "danger",
      });
    }
  };

  const handleFieldUpdate = (key: string, index: number) => {
    const tmpProducts = [...getValues("products")];

    if (key === "offerDiscount") {
      const value = tmpProducts[index]?.formData?.offerDiscount;

      if (!value || value < 0) {
        tmpProducts[index].formData.offerDiscount = null;
      }

      if (value && value > 100) {
        tmpProducts[index].formData.offerDiscount = 100;
      }

      // calculate the scheme price
      const deal = tmpProducts[index].dealInfo;
      const formData = tmpProducts[index].formData;
      const schemePrice = CommonService.calculateScheme(
        deal.b2bPrice,
        formData.offerDiscount || 0,
        formData.calculateOn === "afterTax",
        deal.tax,
        deal.purchasePrice,
        deal.additionalCess,
      );
      tmpProducts[index].formData.schemePrice = Number(
        schemePrice?.offerPrice || 0,
      );
      tmpProducts[index].formData.profit = Number(schemePrice?.profit || 0);
      setValue("products", tmpProducts);
    }

    if (key === "offerStartDate") {
      const value = tmpProducts[index]?.formData?.offerStartDate;
      tmpProducts[index].formData.offerEndDate = value;
      setValue("products", tmpProducts);
    }
  };

  const itemCallback = async (args: { action: string; data?: any }) => {
    if (args.action === "edit") {
      setEditModal({ show: true, data: args.data });
      return;
    }

    if (args.action === "fieldUpdate") {
      handleFieldUpdate(args.data.key, args.data.index);
      return;
    }

    if (args.action === "remove-from-cart") {
      const { itemId } = args.data || {};
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
          // Remove product from form only, do not re-fetch cart
          const products = formMethods.getValues("products");
          const updatedProducts = products.filter((p: any) => p._id !== itemId);
          formMethods.setValue("products", updatedProducts);
          appToast.show({
            msg:
              response.data?.message ||
              "Product removed from cart successfully",
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
              offerDiscount: payload.offerDiscount,
              offerStartDate: payload.offerStartDate,
              offerEndDate: payload.offerEndDate,
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
      <AppHeader title="Cart - B2B Scheme" />
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
              <div className="tw:mb-4 tw:text-sm tw:text-gray-700">
                Total Products:{" "}
                <span className="tw:font-bold">{totalProducts}</span>
              </div>
              <div className="tw:mb-4">
                <InfoBlock size="sm" variant="info" bordered>
                  <span className="tw:text-xs tw:font-medium">
                    Note: This is applicable only for B2B customers. The scheme
                    discount is calculated on the B2B price.
                  </span>
                </InfoBlock>
              </div>
              <FormProvider {...formMethods}>
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
                        products={products}
                      />
                    </AppCard>
                  )}
                </div>
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
          appNav.to("/configs/schemes");
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
              const deal = p.dealInfo;
              const schemePrice = CommonService.calculateScheme(
                deal.b2bPrice,
                data.offerDiscount || 0,
                data.calculateOn === "afterTax",
                deal.tax,
                deal.purchasePrice,
                deal.additionalCess,
              );

              return {
                ...p,
                formData: {
                  ...p.formData,
                  offerDiscount: data.offerDiscount,
                  offerStartDate: data.offerStartDate,
                  offerEndDate: data.offerEndDate,
                  calculateOn: data.calculateOn,
                  schemePrice: Number(schemePrice?.offerPrice || 0),
                  profit: Number(schemePrice?.profit || 0),
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

export default ProductSelectCart;
