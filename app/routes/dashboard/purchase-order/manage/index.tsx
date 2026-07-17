import { produce } from "immer";
import { Check, Printer, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import PoSteps from "~/components/feature/inventory/po-steps/PoSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import PoOverview from "./components/preview/PoOverview";
import PoPreview from "./components/preview/PoPreview";
import SelectProductsFilter from "./components/select-products/SelectProductsFilter";
import SelectProductsMobile from "./components/select-products/SelectProductsMobile";
import SelectProductsTable from "./components/select-products/SelectProductsTable";
import {
  getData,
  getCount,
  mapSelectedProducts,
  prepareParams,
  preparePayload,
} from "./helper";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppLink from "~/components/core/link/AppLink";
import FranchiseService from "~/services/FranchiseService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CommissionDisplay from "./components/preview/CommissionDisplay";

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

// Payment form default values
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
  const { isMobile } = useScreenView();

  const appToast = useAppToast();
  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");
  const vid = searchParams.get("vid");

  const [vendor, setVendor] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState<Record<string, any>>({});
  const [display, setDisplay] = useState<"select" | "preview" | "success">(
    "select"
  );

  const [products, setProducts] = useState<Record<string, any>[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, any>[]
  >([]);

  const filterRef = useRef<Record<string, any>>({
    search: "",
  });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const vendorBrandsRef = useRef<string[]>([]);
  const vendorCategoriesRef = useRef<string[]>([]);

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
    filterRef.current = {
      ...filterRef.current,
      vendorId: vid,
    };

    const fetchVendor = async (vendorId: string) => {
      const vendorResp = await VendorService.getDetail(vendorId);
      const data = vendorResp.data?.data;
      if (data) {
        const margin = data.margins || [];
        const vendorBrands = margin.map((m: any) => m.brand);
        const vendorCategories = margin.map((m: any) => m.category);
        vendorBrandsRef.current = vendorBrands.filter(Boolean);
        vendorCategoriesRef.current = vendorCategories.filter(Boolean);

        setVendor({
          ...data,
        });

        applyFilter();
      } else {
        setVendor({});
      }
    };

    const fetchPo = async () => {
      setLoading(true);
      const poResp = await PurchaseOrderService.getDetails(id || "");
      if (poResp.data?._id) {
        setPo(poResp.data);
        await fetchVendor(poResp.data.vendorDetails.id);
      } else {
        setPo({});
      }
      setLoading(false);
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
  }, [vid]);

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };

    setLoadingProducts(true);
    setProducts([]);
    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      vendorBrandsRef.current,
      vendorCategoriesRef.current
    );
    try {
      const totalRecords = await getCount(filterRef.current.vendorId, params);
      paginationRef.current.totalRecords = totalRecords;
    } catch (err) {
      paginationRef.current.totalRecords = 0;
    }

    const resp = await getData(filterRef.current.vendorId, params);
    setProducts(mapSelectedProducts(resp, selectedProducts));
    setHasMoreProducts(resp.length === paginationRef.current.rowsPerPage);
    setLoadingProducts(false);
  };

  const handleCallback = ({ action, data }: { action: string; data: any }) => {
    if (action === "update") {
      let { index, purchasePrice, discount, quantity, key, mrp } = data;

      // Convert values to numbers
      purchasePrice = Number(purchasePrice) || "";
      discount = Number(discount) || "";
      quantity = Number(quantity) || "";
      mrp = Number(mrp) || "";

      // Prevent negative values
      if (purchasePrice < 0) purchasePrice = 0;
      if (discount < 0) discount = 0;
      if (quantity < 0) quantity = 0;

      const updatedProducts = produce(products, (draft) => {
        const productMrp = draft[index].mrp;

        const product = draft[index];

        if (key === "quantity") {
          product.quantity = quantity;
        }

        if (key === "mrp") {
          product.mrp = mrp;
          if (product.purchasePrice > mrp) {
            product.purchasePrice = mrp;
            purchasePrice = mrp;
          }
        }

        // Clamp purchasePrice to not exceed mrp
        if (key === "purchasePrice") {
          if (purchasePrice > productMrp) {
            purchasePrice = productMrp;
          }
          product.purchasePrice = purchasePrice;
        }

        // Clamp discount to not exceed 100
        if (key === "discount") {
          if (discount > 100) {
            discount = 100;
          }
          // Calculate purchasePrice based on discount and mrp
          product.purchasePrice = CommonService.roundedByDecimalPlace(
            productMrp - (productMrp * discount) / 100,
            2
          );
        }

        product.discount = CommonService.calculateDiscount(
          product.mrp,
          product.purchasePrice
        );

        product.total = (product.purchasePrice || 0) * (product.quantity || 0);
      });

      // update selected products
      setSelectedProducts(
        produce((draft) => {
          const alreadySelected = draft.find(
            (p) => p.dealId === updatedProducts[index].dealId
          );
          if (!Number(updatedProducts[index].quantity)) {
            if (alreadySelected) {
              return draft.filter(
                (p) => p.dealId !== updatedProducts[index].dealId
              );
            }
          } else {
            if (!alreadySelected) {
              return [...draft, updatedProducts[index]];
            } else {
              // Update already selected product data
              return draft.map((p) =>
                p.dealId === updatedProducts[index].dealId
                  ? updatedProducts[index]
                  : p
              );
            }
          }
        })
      );

      setProducts(updatedProducts);
    }
  };

  const loadMore = async () => {
    paginationRef.current.activePage++;
    setIsLoadingMoreProducts(true);
    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      vendorBrandsRef.current,
      vendorCategoriesRef.current
    );
    const resp = await getData(filterRef.current.vendorId, params);
    setProducts([...products, ...mapSelectedProducts(resp, selectedProducts)]);
    setHasMoreProducts(resp.length === paginationRef.current.rowsPerPage);
    setIsLoadingMoreProducts(false);
  };

  const handleFilterCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "search") {
      filterRef.current = {
        ...filterRef.current,
        ...data,
      };
      applyFilter();
    }
  };

  const handlePreviewCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "remove") {
      const { index } = data;
      const updatedSelectedProducts = selectedProducts.filter(
        (_, i) => i !== index
      );
      setSelectedProducts(updatedSelectedProducts);
    }
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

  const handleNextClick = () => {
    if (selectedProducts.length > 0) {
      // Scroll to top so preview is visible on smaller screens
      try {
        if (typeof window !== "undefined" && window?.scrollTo) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (e) {
        // ignore in non-browser env
      }
      setDisplay("preview");
    }
  };

  const handleBackClick = () => {
    if (display === "preview") {
      applyFilter();
      setDisplay("select");
    } else {
      appNav.back();
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

    // validate paymet status
    if (!formData.paymentStatus || formData.paymentStatus === "Choose") {
      return { isValid: false, message: "Payment status is required" };
    }

    // Validate payment fields if paymentStatus is 'Paid' or 'Partially Paid' or paymentMethod is set
    if (
      formData.paymentStatus === "Paid" ||
      formData.paymentStatus === "Partially Paid"
    ) {
      if (!formData.paymentMethod || formData.paymentMethod === "Choose") {
        return { isValid: false, message: "Payment method is required" };
      }
      // paymentDate is an array, check 0th index
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

    // Check for sufficient balance
    if (!hasSufficientBalance) {
      appToast.show({
        msg: "Insufficient plan balance to create purchase order.",
        color: "danger",
      });
      // Scroll to commission display block
      const commissionElement = document.getElementById("commission-display");
      CommonService.scrollToView(commissionElement);
      return;
    }

    //plan check
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

  return (
    <>
      <AppHeader title={t("managePurchaseOrder")} />
      <div className="page-padding page-bg app-page has-footer">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab="purchase-orders"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
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
              <div className="theme-2-mobile-hide">
                <AppBreadcrumbs data={breadcrumbs} />
              </div>

              <div className="tw:my-6 tw:flex tw:justify-center">
                <div className="tw:inline">
                  <PoSteps
                    activeStep={
                      display === "preview" ? 2 : display === "success" ? 3 : 1
                    }
                  />
                </div>
              </div>

              {display === "select" ? (
            <div className="tw:mt-4">
              <div className="tw:text-lg tw:font-bold tw:mb-4 tw:flex tw:items-center tw:gap-2">
                <ShoppingCart className="tw:w-6 tw:h-6" />
                <span>
                  {t("chooseProductsForPo")} - {t("vendor")}: &quot;
                  <span className="tw:inline-flex tw:items-center tw:gap-2">
                    <span>{vendor.name}</span>
                    {vendor && vendor._vendorType ? (
                      <VendorTypeBadge
                        type={vendor._vendorType}
                        color={vendor._vendorTypeColor}
                        description={vendor._vendorTypeInfo}
                      />
                    ) : null}
                  </span>
                  &quot;
                </span>
                {selectedProducts.length > 0 && (
                  <AppBadge variant="success">
                    {t("inCart", { count: selectedProducts.length })}
                  </AppBadge>
                )}
              </div>
              <SelectProductsFilter
                callback={handleFilterCallback}
                vendorId={vid || ""}
              />
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loadingProducts}
                loadedCount={products.length}
                fwSize="sm"
                className="tw:mb-2"
              />
              {isMobile ? (
                <>
                  <SelectProductsMobile
                    data={products}
                    loading={loadingProducts}
                    callback={handleCallback}
                  />
                  {!loadingProducts && hasMoreProducts && (
                    <div className="tw:flex tw:justify-center tw:mt-4">
                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={isLoadingMoreProducts}
                        totalCount={paginationRef.current.totalRecords}
                        loadedCount={products.length}
                      />
                    </div>
                  )}
                </>
              ) : (
                <AppCard noPadding>
                  <SelectProductsTable
                    data={products}
                    loading={loadingProducts}
                    callback={handleCallback}
                    showLoadMore={hasMoreProducts}
                    loadMore={loadMore}
                    loadingMore={isLoadingMoreProducts}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={products.length}
                  />
                </AppCard>
              )}
            </div>
          ) : display === "preview" ? (
            <div className="tw:mt-4">
              <FormProvider {...paymentForm}>
                <PoOverview vendor={vendor} products={selectedProducts} />
                <div id="commission-display">
                  <CommissionDisplay
                    deals={selectedProducts}
                    callback={handleCommissionCallback}
                  />
                </div>
                {/* <PoPayment /> */}
                <PoPreview
                  products={selectedProducts}
                  callback={handlePreviewCallback}
                />
              </FormProvider>
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
                      createdPo && PurchaseOrderService.printOrder(createdPo._id)
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
                      appNav.replace("/dashboard/purchase-order/summary")
                    }
                  >
                    View all Purchase Orders
                  </AppButton>
                </div>
              </AppCard>
            </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <footer className="app-footer">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            {display !== "success" && (
              <>
                <AppButton
                  color="light"
                  fill="outline"
                  onClick={handleBackClick}
                >
                  {display === "preview" ? t("back") : t("back")}
                </AppButton>
                {display === "select" && (
                  <AppButton
                    color="dark"
                    fill="solid"
                    className="tw:relative"
                    onClick={handleNextClick}
                    disabled={selectedProducts.length === 0}
                  >
                    {selectedProducts.length > 0 && (
                      <div className="tw:absolute tw:-top-2 tw:-right-1 tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-blue-500 tw:text-white tw:text-xs">
                        {selectedProducts.length}
                      </div>
                    )}
                    {t("next")}
                  </AppButton>
                )}
                {display === "preview" && (
                  <AppButton
                    color="dark"
                    fill="solid"
                    onClick={handleCreatePurchaseOrder}
                    isLoading={submitting || isCheckingPlan}
                    disabled={submitting || isCheckingPlan}
                  >
                    {t("createPurchaseOrder")}
                  </AppButton>
                )}
              </>
            )}
          </div>
        </div>
      </footer>

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
