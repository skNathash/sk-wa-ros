import { Check, Printer, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppHeader from "~/components/core/header/AppHeader";
import PoSteps from "~/components/feature/inventory/po-steps/PoSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PurchaseCartService from "~/services/PurchaseCartService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import PoOverview from "./components/preview/PoOverview";
import PoPreview from "./components/preview/PoPreview";
import ProductList from "./components/product-list/ProductList";
import CartFooter from "./components/cart/CartFooter";
import CartModal from "./components/cart/CartModal";
import { preparePayload } from "./helper";
import { getCart } from "./components/product-list/helper";
import AppLink from "~/components/core/link/AppLink";
import FranchiseService from "~/services/FranchiseService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import CommissionDisplay from "./components/preview/CommissionDisplay";
import { useIsMobile } from "~/hooks/use-mobile";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Purchase Order",
    langKey: "purchaseOrder",
    redirect: {
      path: "/dashboard/purchase-order/list",
    },
  },
];

/** Hold the preview loader before reading the cart, so edits settle server-side. */
const PREVIEW_DELAY = 3000;

const paymentDefaultValues = {
  paymentStatus: "Pending",
  paymentMethod: "",
  paymentDate: undefined,
  paymentReference: "",
  paymentNotes: "",
  expectedDate: "",
  remarks: "",
};

const ManagePurchaseOrder = () => {
  const paymentForm = useForm({
    defaultValues: paymentDefaultValues,
    mode: "onChange",
  });
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const appToast = useAppToast();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const id = searchParams.get("id");
  const vid = searchParams.get("vid");

  const [vendor, setVendor] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [display, setDisplay] = useState<"select" | "preview" | "success">(
    "select",
  );

  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, any>[]
  >([]);
  const [cartSummary, setCartSummary] = useState<Record<string, any>>({});
  const [cartId, setCartId] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cartRefreshToken, setCartRefreshToken] = useState(0);
  const [showCartModal, setShowCartModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [createdPo, setCreatedPo] = useState<any>(null);
  const [isCheckingPlan, setIsCheckingPlan] = useState(false);
  const [planAlertDialog, setPlanAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    okText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
    okText: undefined,
    cancelText: undefined,
  });

  const [hasSufficientBalance, setHasSufficientBalance] =
    useState<boolean>(true);

  useEffect(() => {
    const fetchVendor = async (vendorId: string) => {
      setLoading(true);
      const vendorResp = await VendorService.getDetail(vendorId);
      const data = vendorResp.data?.data;
      if (data) {
        setVendor({ ...data });
      } else {
        setVendor({});
        setSelectedProducts([]);
      }
      setLoading(false);
    };

    const fetchPo = async () => {
      setLoading(true);
      const poResp = await PurchaseOrderService.getDetails(id || "");
      if (poResp.data?._id) {
        await fetchVendor(poResp.data.vendorDetails.id);
      } else {
        setLoading(false);
      }
    };

    if (id) {
      fetchPo();
    } else if (vid) {
      fetchVendor(vid);
    } else {
      appNav.replace("/dashboard/purchase-order/vendors", {
        from: "po",
      });
    }
  }, [vid, id]);

  /** Pull the cart and mirror it into the preview state (no FE recalculation). */
  const applyCart = (cart: Record<string, any> | null) => {
    setCartId(cart?._id || "");
    setSelectedProducts(Array.isArray(cart?.items) ? cart.items : []);
    setCartSummary(cart?.cartSummary || {});
  };

  const handlePreviewCallback = async ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action !== "remove") return;

    const dealId = String(data?.dealId || "");
    if (!cartId || !dealId) return;

    setPreviewLoading(true);
    try {
      await PurchaseCartService.removeItem(cartId, dealId);
    } catch (err: any) {
      appToast.show({
        msg: err?.message || "Failed to remove cart item",
        color: "danger",
      });
    }
    applyCart(await getCart(vendorId));
    setPreviewLoading(false);
  };

  const handleCommissionCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "balance_check") {
      setHasSufficientBalance(data.hasSufficientBalance);
    }
  };

  const handleNextClick = async () => {
    if (!vendorId) return;

    // Show the preview step with a loader, hold for 3s, then read the cart.
    setPreviewLoading(true);
    setDisplay("preview");
    try {
      if (typeof window !== "undefined" && window?.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      // ignore in non-browser env
    }

    await new Promise((resolve) => setTimeout(resolve, PREVIEW_DELAY));

    const cart = await getCart(vendorId);
    const items = Array.isArray(cart?.items) ? cart.items : [];
    setPreviewLoading(false);

    if (items.length === 0) {
      applyCart(null);
      setDisplay("select");
      appToast.show({
        msg: t(
          "atLeastOneProductRequired",
          "At least one product must be selected",
        ),
        color: "danger",
      });
      return;
    }

    applyCart(cart);
  };

  const handleBackClick = () => {
    if (display === "preview") {
      setDisplay("select");
    } else {
      appNav.back();
    }
  };

  const handleFooterCallback = ({ action }: { action: string; data: any }) => {
    if (action === "edit") {
      setShowCartModal(true);
    } else if (action === "next") {
      handleNextClick();
    } else if (action === "back") {
      handleBackClick();
    }
  };

  const handleCartModalCallback = ({ action }: { action: string }) => {
    if (action === "close") {
      setShowCartModal(false);
    } else if (action === "change") {
      // Cart mutated inside the modal — refresh the footer and product list.
      setCartRefreshToken((n) => n + 1);
    }
  };

  const validatePurchaseOrder = () => {
    const formData = paymentForm.getValues();
    if (selectedProducts.length === 0) {
      return {
        isValid: false,
        message: "At least one product must be selected",
      };
    }

    if (!vendor || !vendor.name) {
      return { isValid: false, message: "Vendor details are required" };
    }

    if (!formData.expectedDate) {
      return { isValid: false, message: "Expected delivery date is required" };
    }

    if (!formData.paymentStatus || formData.paymentStatus === "Choose") {
      return { isValid: false, message: "Payment status is required" };
    }

    if (
      formData.paymentStatus === "Paid" ||
      formData.paymentStatus === "Partially Paid"
    ) {
      if (!formData.paymentMethod || formData.paymentMethod === "Choose") {
        return { isValid: false, message: "Payment method is required" };
      }
      if (!formData.paymentDate) {
        return { isValid: false, message: "Payment date is required" };
      }
      if (!formData.paymentReference) {
        return { isValid: false, message: "Payment reference is required" };
      }
    }

    return { isValid: true, message: "" };
  };

  const handleCreatePurchaseOrder = async () => {
    const validation = validatePurchaseOrder();

    if (!validation.isValid) {
      appToast.show({
        msg: validation.message,
        color: "danger",
      });
      return;
    }

    if (!hasSufficientBalance) {
      appToast.show({
        msg: "Insufficient plan balance to create purchase order.",
        color: "danger",
      });
      const commissionElement = document.getElementById("commission-display");
      CommonService.scrollToView(commissionElement);
      return;
    }

    setIsCheckingPlan(true);
    const planResp = await FranchiseService.getActivePlan();
    setIsCheckingPlan(false);

    if (!planResp || !planResp.isPlanActive || planResp.availableAmount <= 0) {
      setPlanAlertDialog({
        show: true,
        title: "Buy Platform Fee Plan",
        description:
          "An active platform fee plan is required to create purchase orders. Subscribe to a plan now to proceed with your order.",
        okText: "Buy Plan",
        onConfirm: () => {
          setPlanAlertDialog((prev) => ({ ...prev, show: false }));
          appNav.to(FranchiseService.getBuyPlanLink());
        },
        onCancel: () => {
          setPlanAlertDialog((prev) => ({ ...prev, show: false }));
        },
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = paymentForm.getValues();
      const payload = preparePayload(selectedProducts, vendor, formData);
      const resp = await PurchaseOrderService.create(payload);
      if (
        (resp.statusCode === 200 || resp.statusCode === 201) &&
        resp.data?.data?.orderId
      ) {
        setCreatedPo(resp.data?.data);
        setDisplay("success");
      } else {
        appToast.show({
          msg:
            typeof resp.data?.message === "string"
              ? resp.data?.message
              : "Failed to create purchase order.",
          color: "danger",
        });
      }
    } catch (err: any) {
      console.error(err);
      appToast.show({
        msg: err?.message || "Failed to create purchase order.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const vendorId = vendor._id || vid || "";

  // Keep footer Next badge in sync when ProductList mutates the cart.
  useEffect(() => {
    if (!vendorId || display !== "select") return;
    let cancelled = false;
    (async () => {
      const cart = await getCart(vendorId);
      if (cancelled) return;
      setSelectedProducts(Array.isArray(cart?.items) ? cart.items : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorId, cartRefreshToken, display]);

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="purchase-orders"
        mobileLead="menu"
        title={t("managePurchaseOrder")}
      />
      <div
        className={`app-page page-bg page-padding ${
          display === "success" ? "" : "has-footer"
        }`}
      >
        <div className="app-container">
          <div className="theme-2-mobile-hide">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>

          {/* PO tab bar — theme-2 mobile only (see theme-2.css). */}
          {/* <PoSectionTabs /> */}

          <div className="section-layout">
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="purchase-orders"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0!">
                  {/* Mobile keeps the PO stepper band pinned under the sticky
                      header while the page content scrolls beneath it. The
                      desktop stepper stays a normal card with its usual gap. */}
                  <div className="tw:md:my-6">
                    {/* The pull-up lives on an inner node: `space-y-0!` above
                        forces `margin-block-start: 0` on every direct child,
                        which would cancel it here. */}
                    <div className="tw:-mt-4 tw:md:mt-0">
                      <PoSteps
                        type={isMobile ? "mobile" : "desktop"}
                        activeStep={
                          display === "preview"
                            ? 2
                            : display === "success"
                              ? 3
                              : 1
                        }
                      />
                    </div>
                  </div>

                  {display === "select" ? (
                    <div className="tw:mt-0 tw:md:mt-4">
                      {/* Compact vendor bar — `app-bleed-x` runs it edge to edge
                          on theme-2 mobile, so it reads as a band, not a card. */}
                      <div className="app-bleed-x tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-none tw:border-y tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2 tw:md:rounded-lg tw:md:border-x">
                        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-emerald-700">
                          <ShoppingCart className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-gray-500" />
                          <span className="tw:truncate">{vendor.name || "…"}</span>
                          {vendor?._vendorType ? (
                            <VendorTypeBadge
                              type={vendor._vendorType}
                              color={vendor._vendorTypeColor}
                              description={vendor._vendorTypeInfo}
                            />
                          ) : null}
                        </div>
                        <AppLink
                          asLink
                          href="/dashboard/purchase-order/vendors"
                          showLinkColor
                          className="tw:shrink-0 tw:text-xs tw:font-medium"
                        >
                          {t("changeVendor", "Change vendor")}
                        </AppLink>
                      </div>

                      {!loading && vendorId ? (
                        <ProductList
                          vendorId={vendorId}
                          vendorName={vendor.name}
                          refreshToken={cartRefreshToken}
                          onCartChange={() => setCartRefreshToken((n) => n + 1)}
                          onViewCart={() => setShowCartModal(true)}
                        />
                      ) : (
                        <div className="tw:h-64 tw:animate-pulse tw:rounded-xl tw:bg-gray-100" />
                      )}
                    </div>
                  ) : display === "preview" ? (
                    <div className="tw:mt-2 tw:md:mt-4">
                      {previewLoading ? (
                        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:py-20">
                          <AppSpinner size="lg" />
                          <span className="tw:text-sm tw:text-gray-500">
                            {t("preparingPo", "Preparing your purchase order…")}
                          </span>
                        </div>
                      ) : (
                        <FormProvider {...paymentForm}>
                          <PoOverview
                            vendor={vendor}
                            products={selectedProducts}
                            summary={cartSummary}
                          />
                          <div id="commission-display">
                            <CommissionDisplay
                              deals={selectedProducts}
                              callback={handleCommissionCallback}
                            />
                          </div>
                          <PoPreview
                            products={selectedProducts}
                            summary={cartSummary}
                            callback={handlePreviewCallback}
                          />
                        </FormProvider>
                      )}
                    </div>
                  ) : display === "success" ? (
                    <div className="tw:mt-12">
                      <AppCard className="tw:text-center">
                        <div className="tw:flex tw:justify-center tw:mt-6">
                          <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-20 tw:h-20 tw:bg-green-100 tw:rounded-full tw:mb-6">
                            <Check className="tw:w-12 tw:h-12 tw:text-green-500" />
                          </span>
                        </div>
                        <div className="tw:text-2xl tw:font-bold tw:mb-2">
                          {t("purchaseOrderCreated")}
                        </div>
                        <div className="tw:mb-6 tw:text-gray-700">
                          <span>{t("poId")}: </span>
                          <span className="tw:font-semibold">
                            {createdPo?.orderId ? (
                              <AppLink
                                asLink
                                href={`/dashboard/purchase-order/view/${createdPo._id}`}
                              >
                                {createdPo.orderId}
                              </AppLink>
                            ) : (
                              "-"
                            )}
                          </span>
                        </div>
                        <div className="tw:flex tw:justify-center tw:gap-4 tw:mb-6">
                          <AppButton
                            color="light"
                            fill="outline"
                            onClick={() =>
                              createdPo &&
                              PurchaseOrderService.printOrder(createdPo._id)
                            }
                          >
                            <span className="tw:inline-flex tw:items-center tw:gap-2">
                              <Printer className="tw:w-5 tw:h-5" />
                              {t("printPo")}
                            </span>
                          </AppButton>
                          <AppButton
                            color="dark"
                            fill="solid"
                            onClick={() =>
                              appNav.replace(
                                "/dashboard/purchase-order/summary",
                              )
                            }
                          >
                            View all Purchase Orders
                          </AppButton>
                        </div>
                      </AppCard>
                    </div>
                  ) : null}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
      {display === "select" && (
        <CartFooter
          vendorId={vendorId}
          refreshToken={cartRefreshToken}
          callback={handleFooterCallback}
        />
      )}

      <CartModal
        show={showCartModal}
        vendorId={vendorId}
        callback={handleCartModalCallback}
      />

      {display === "preview" && (
        <footer className="app-footer">
          <div className="app-container">
            <div className="tw:flex tw:justify-between tw:items-center">
              <AppButton color="light" fill="outline" onClick={handleBackClick}>
                {t("back")}
              </AppButton>
              <AppButton
                color="dark"
                fill="solid"
                onClick={handleCreatePurchaseOrder}
                isLoading={submitting || isCheckingPlan}
                disabled={submitting || isCheckingPlan || previewLoading}
              >
                {t("createPurchaseOrder")}
              </AppButton>
            </div>
          </div>
        </footer>
      )}

      <AppAlertDialog
        title={planAlertDialog.title}
        description={planAlertDialog.description}
        show={planAlertDialog.show}
        onConfirm={planAlertDialog.onConfirm}
        onCancel={planAlertDialog.onCancel}
        okText={planAlertDialog.okText}
        cancelText={planAlertDialog.cancelText}
      />
    </>
  );
};

export default ManagePurchaseOrder;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Manage Purchase Order"),
    },
  ];
}
