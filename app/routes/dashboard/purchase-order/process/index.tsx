import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ConfirmReceiveModal from "~/modals/receive/ConfirmReceiveModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import PageAccessService from "~/services/PageAccessService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import RackBinService from "~/services/RackBinService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import PlatformFeeRequiredBlock from "~/shared/accounts/platform-fee/components/PlatformFeeRequiredBlock";
import OrderSnapshotCard from "./components/OrderSnapshotCard";
import PoInvoice from "./components/PoInvoice";
import POScanSummary from "./components/POScanSummary";
import ProductItem from "./components/ProductItem";
import ProductsDesktopTable from "./components/ProductsDesktopTable";
import ReceivingHeader from "./components/ReceivingHeader";
import ScanFab from "./components/ScanFab";
import { loadDetails, preparePayload, resolvePurchasePrice, validateProducts } from "./helper";
import AssignBarcodeModal from "./modals/AssignBarcodeModal";
import EditProductModal from "./modals/EditProductModal";
import InsufficientBalanceModal from "./modals/InsufficientBalanceModal";
import ProductForBarcodeModal from "./modals/ProductForBarcodeModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["PURCHASE-ORDER.RECEIVE"], {
    blockForMasterLogin: true,
  });
}

type FormValues = {
  products: any[];
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date | undefined;
    invoiceUpload: any;
    amount?: number | string;
    paymentMode: string;
    paymentDate: Date | undefined;
    referenceNumber: string;
    paymentUpload: any;
    paymentStatus: string; // Added paymentStatus
  };
};

const ProcessPurchaseOrder = () => {
  const { id } = useParams();
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    type: "alert" | "confirm";
    okText: string;
    cancelText: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    type: "alert",
    okText: "",
    cancelText: "",
    successCb: () => {},
    cancelCb: () => {},
  });

  const formMethods = useForm<FormValues & { invoice: any }>({
    defaultValues: {
      products: [],
      invoice: {
        invoiceNumber: "",
        invoiceDate: undefined,
        invoiceUpload: null,
        amount: "",
        paymentMode: "",
        paymentDate: undefined,
        referenceNumber: "",
        paymentUpload: null,
        paymentStatus: "UnPaid", // Default to 'UnPaid'
      },
    },
  });

  const [products] = useWatch({
    control: formMethods.control,
    name: ["products"],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [receiveAllLoading, setReceiveAllLoading] = useState<boolean>(false);
  const [insufficientBalance, setInsufficientBalance] =
    useState<boolean>(false);
  const [commissionData, setCommissionData] = useState<{
    commissionAmount: number;
    commissionPercentage: number;
    planName?: string;
    planType?: string;
    availableAmount?: number;
    hasSufficientBalance?: boolean;
  }>({
    commissionAmount: 0,
    commissionPercentage: 0,
  });
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] =
    useState<boolean>(false);
  const [poDetails, setPODetails] = useState<any>({});
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: t("dashboard"), redirect: { path: "/dashboard" } },
    {
      label: t("purchaseOrders"),
      redirect: { path: "/dashboard/purchase-order/summary" },
    },
    { label: t("process") },
  ]);

  const [editIndex, setEditIndex] = useState<number>(-1);

  const currentBarcode = useRef<string>("");
  const productRefs = useRef<HTMLDivElement | null>(null);
  const scanFabRef = useRef<HTMLDivElement | null>(null);

  const [assignBarcode, setAssignBarcode] = useState<{
    show: boolean;
    barcode: string;
  }>({ show: false, barcode: "" });

  const [productForBarcode, setProductForBarcode] = useState<{
    show: boolean;
    barcode: string;
    products: any[];
  }>({ show: false, barcode: "", products: [] });

  const [autoAllocate, setAutoAllocate] = useState<boolean>(false);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    fetchPODetails();
    fetchPlan();
  }, [id]);

  // Auto-fill invoice amount based on products
  useEffect(() => {
    if (products && products.length > 0) {
      const totalAmount = products.reduce((sum, product) => {
        const purchasePrice = parseFloat(product.formData?.purchasePrice) || 0;
        const receivedQty = parseFloat(product.formData?.receivedQty) || 0;
        let productTotal = purchasePrice * receivedQty;

        // Add variations
        const variations = product.formData?.variations || [];
        variations.forEach((variation: any) => {
          const variationPurchasePrice =
            parseFloat(variation.formData?.purchasePrice) || purchasePrice;
          const variationQty = parseFloat(variation.formData?.qty) || 0;
          productTotal += variationPurchasePrice * variationQty;
        });

        return sum + productTotal;
      }, 0);
      formMethods.setValue(
        "invoice.amount",
        CommonService.roundedByDecimalPlace(totalAmount),
      );
    }
  }, [products, formMethods]);

  const handlePlatformFeeCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "balance_check") {
      setInsufficientBalance(!data.hasSufficientBalance);
    }
  };

  const handleBuyPlan = () => {
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  const fetchPODetails = async () => {
    if (!id) {
      appToast.show({
        msg: t("purchaseOrderIdRequired"),
        color: "danger",
      });
      return;
    }

    try {
      setLoading(true);
      const poResp = await loadDetails(id);

      if (poResp && poResp._id) {
        const deals = poResp.items || [];

        setPODetails({
          ...poResp,
          dealIds: deals.map((d: any) => d.dealId),
        });
        setBreadcrumbs((prevBreadcrumbs) => [
          ...prevBreadcrumbs.slice(0, -1),
          {
            label: poResp.orderId
              ? `${t("process")} - ${poResp.orderId}`
              : t("process"),
          },
        ]);

        const updatedProducts = (deals || []).map((e: any) => {
          const loc = e._locationDetails || {};
          // determine invoiceQty and receivedQty from available deal fields
          // prefer explicit invoiceQty/receivedQty if present, otherwise fallback to ordered quantity

          const invoiceQty = e.quantity;

          const receivedQty = e.quantity;

          const locationDetail = loc.locationDetail || {};

          return {
            ...e,
            _scanned: true,
            formData: {
              invoiceQty: invoiceQty,
              receivedQty: receivedQty,
              damageQty: "",
              damageRemarks: "",
              damageImages: [],
              location: loc.location || "",
              locationDetail,
              // preparePayload / buildLocationObj reads locationDetails
              locationDetails: locationDetail,
              rack: loc.rack || "",
              rackDetails: loc.rackDetails || {},
              bin: loc.bin || "",
              binDetails: loc.binDetails || {},
              manufactureDate: "",
              expiryMonth: "",
              expiryDays: "",
              expRemDays: "",
              expiryDate: "",
              variations: [],
              purchasePrice:
                Number(e.purchasePrice) > 0
                  ? e.purchasePrice
                  : e.mrp || "",
              mrp: e.mrp || "",
            },
          };
        });

        formMethods.setValue("products", updatedProducts);
        // Trigger auto allocation after loading PO details
        setAutoAllocate({ enabled: true, silent: true } as any);

        // Fetch commission details after loading PO
        await fetchCommission(updatedProducts);
      } else {
        appToast.show({
          msg: "Purchase order not found",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error fetching PO details:", error);
      appToast.show({
        msg: "Failed to load purchase order details",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const activePlan = await FranchiseService.getActivePlan();
      setHasPlan(activePlan?.isPlanActive || false);
    } catch (error) {
      console.error("Error fetching plan:", error);
      setHasPlan(false);
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchCommission = async (deals: any[]) => {
    try {
      // Prepare deals for commission calculation
      const dealsForCalc = deals.filter((item) => item.dealId);

      if (dealsForCalc.length > 0) {
        // Build payload expected by the endpoint
        const dealsPayload: any[] = [];

        dealsForCalc.forEach((item) => {
          // Add main product
          dealsPayload.push({
            dealId: item.dealId || "",
            quantity: item.formData?.receivedQty || 0,
            mrp: item.formData?.mrp || 0,
            purchasePrice: item.formData?.purchasePrice || 0,
          });

          // Add variations if any
          const variations = item.formData?.variations || [];

          variations.forEach((variation: any) => {
            dealsPayload.push({
              dealId: item.dealId || "",
              quantity: variation.formData?.qty || 0,
              mrp: variation.formData?.mrp || item.formData?.mrp || 0,
              purchasePrice:
                variation.formData?.purchasePrice ||
                item.formData?.purchasePrice ||
                0,
            });
          });
        });

        const payload = {
          deals: dealsPayload,
        };

        const resp = await FranchiseService.getChargeByDeal(payload);

        setCommissionData({
          commissionAmount: resp.commissionAmount,
          commissionPercentage: resp.commissionPercentage,
          planName: resp.planName,
          planType: resp.planType,
          availableAmount: resp.availableAmount,
          hasSufficientBalance: resp.hasSufficientBalance,
        });

        // If insufficient balance, show modal
        if (!resp.hasSufficientBalance) {
          setShowInsufficientModal(true);
        }
      }
    } catch (error) {
      console.error("Error calculating commission:", error);
      setCommissionData({
        commissionAmount: 0,
        commissionPercentage: 0,
      });
      // On error, assume insufficient and show modal
      setShowInsufficientModal(true);
    }
  };

  const validateInvoiceAndPayment = (invoice: any) => {
    let msg = "";
    // Invoice level required fields
    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === "") {
      return "Invoice number is required";
    }
    if (!invoice.invoiceDate) {
      return "Invoice date is required";
    }
    if (!invoice.amount || Number(invoice.amount) <= 0) {
      return "Invoice amount is required";
    }
    const isPaid = invoice.paymentStatus === "Paid";
    if (isPaid) {
      if (!invoice.paymentMode || invoice.paymentMode.trim() === "") {
        msg = "Payment mode is required";
      } else if (!invoice.paymentDate) {
        msg = "Payment date is required";
      } else if (
        invoice.paymentMode !== "Cash" &&
        (!invoice.referenceNumber || invoice.referenceNumber.trim() === "")
      ) {
        msg = "Reference number is required";
      } else if (!invoice.amount || invoice.amount <= 0) {
        msg = "Payment amount is required";
      }
    }
    return msg;
  };

  const receiveAll = async () => {
    if (!products || products.length === 0) {
      appToast.show({ msg: "No products to receive", color: "warning" });
      return;
    }

    setAppAlertDialog({
      show: true,
      title: "Receive All Products",
      description:
        "You are about to receive all products for this purchase order. Do you want to continue?",
      type: "confirm",
      okText: "Continue",
      cancelText: "Cancel",
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, 800));

        try {
          setReceiveAllLoading(true);

          const items = products.map((product: any) => ({
            dealId: product.dealId,
            quantity: product.quantity,
          }));

          const response = await RackBinService.getRecommendedBinsBulk({
            franchiseId: AuthService.getLoggedInUserId() || "",
            deals: [...items],
          });

          if (response.statusCode === 200) {
            const deals = response.data?.data?.deals || [];

            let temp: Record<string, any> = {};
            deals.forEach((deal: any) => {
              const recommended = deal.recommendations?.[0] || {};
              if (recommended.locationId) {
                temp[deal.dealId] = {
                  location: recommended.locationId,
                  locationDetail: {
                    id: recommended.locationId,
                    name: recommended.location,
                  },
                  rack: recommended.rackId,
                  rackDetails: {
                    rackId: recommended.rackId,
                    rackName: recommended.rackName,
                  },
                  bin: recommended.binId,
                  binDetails: {
                    binId: recommended.binId,
                    binName: recommended.binName,
                    binCode: recommended.binCode,
                  },
                };
              }
            });

            // Update products in form: set locations, invoiceQty = ordered qty, set receivedQty and mark scanned
            const updatedProducts = formMethods.getValues("products") || [];

            updatedProducts.forEach((product: any) => {
              const loc = temp[product.dealId] || {};
              if (loc.location) {
                product.formData = product.formData || {};
                product.formData.location = loc.location;
                product.formData.locationDetail = loc.locationDetail;
                product.formData.locationDetails = loc.locationDetail;
                product.formData.rack = loc.rack;
                product.formData.rackDetails = loc.rackDetails;
                product.formData.bin = loc.bin;
                product.formData.binDetails = loc.binDetails;
              }

              // Set invoiceQty equal to ordered quantity
              product.formData = product.formData || {};
              product.formData.invoiceQty = product.quantity;
              // Also set receivedQty so summary and UI reflect it
              product.formData.receivedQty = product.quantity;
              // Mark the product as scanned/processed
              product._scanned = true;
            });

            formMethods.setValue("products", updatedProducts);

            appToast.show({
              msg: "All products updated for receive",
              color: "success",
            });
          } else {
            appToast.show({
              msg: response.data?.message || "Failed to auto-fill all products",
              color: "danger",
            });
          }
        } catch (error) {
          console.error("Error in receiveAll:", error);
          appToast.show({
            msg: "Failed to receive all products",
            color: "danger",
          });
        } finally {
          setReceiveAllLoading(false);
        }
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleProceed = async () => {
    if (insufficientBalance) {
      return;
    }

    const productErrorMsg = validateProducts(products);
    if (productErrorMsg) {
      appToast.show({
        msg: productErrorMsg,
        color: "danger",
      });
      return;
    }
    // Invoice and payment validation
    const invoice = formMethods.getValues("invoice");
    const invoiceErrorMsg = validateInvoiceAndPayment(invoice);
    if (invoiceErrorMsg) {
      appToast.show({
        msg: invoiceErrorMsg,
        color: "danger",
      });
      return;
    }

    // Open confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmReceipt = async () => {
    setShowConfirmModal(false);

    try {
      setSubmitting(true);

      const invoice = formMethods.getValues("invoice");

      // Prepare payload using the helper function
      const payload = preparePayload(
        products.filter((p) => p._scanned),
        poDetails.notes || "",
        invoice,
      );

      const response = await PurchaseOrderService.confirmReceipt(
        id || "",
        payload,
      );

      if (response.statusCode === 200) {
        appToast.show({
          msg: "Purchase order processed successfully",
          color: "success",
        });

        // Land on the receipt screen for the PO that was just closed
        appNav.replace(`/dashboard/purchase-order/received?poId=${id}`);
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to process purchase order",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error processing PO:", error);
      appToast.show({
        msg: "Failed to process purchase order",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = (index: number) => {
    const updatedProducts = [...(formMethods.getValues("products") || [])];
    if (updatedProducts[index]) {
      const product = updatedProducts[index];
      const purchasePrice = resolvePurchasePrice(product);
      updatedProducts[index] = {
        ...product,
        _scanned: true,
        formData: {
          ...(product.formData || {}),
          purchasePrice,
          mrp: product.formData?.mrp || "",
        },
      };
      formMethods.setValue("products", updatedProducts);
    }
    setEditIndex(index);
  };

  const handleCloseEditModal = () => {
    setEditIndex(-1);
  };

  const handleScanNextItem = () => {
    // Prefer ScanFab if present; otherwise nudge the user toward the list.
    const fabButton = scanFabRef.current?.querySelector("button");
    if (fabButton instanceof HTMLElement) {
      fabButton.click();
      return;
    }
    appToast.show({
      msg: t("scanNextItemHint", {
        defaultValue: "Use the scanner or edit an item to continue receiving",
      }),
      color: "info",
    });
  };

  const handleAutoCountFromPhotos = () => {
    appNav.to("/dashboard/scan/invoice-scan");
  };

  const onBarcodeChange = (a: { action: string; data: any }) => {
    if (a.action === "scan") {
      const { product, barcode } = a.data;
      currentBarcode.current = barcode;
      if (product) {
        // Find matching product in the list (ignore already scanned products)
        const matchingIndex = products.findIndex(
          (p) => p.dealId === product.dealId && !p._scanned,
        );

        if (matchingIndex !== -1) {
          // Update the product using form methods
          const updatedProducts = [...products];
          updatedProducts[matchingIndex] = {
            ...updatedProducts[matchingIndex],
            barcode: barcode,
            _scanned: true,
            _anim: true,
            showAssignBarcode: false,
          };

          formMethods.setValue("products", updatedProducts);

          appToast.show({
            msg: `Product scanned successfully: ${updatedProducts[matchingIndex].dealName}`,
            color: "success",
          });

          // Remove animation after a short delay
          setTimeout(() => {
            const currentProducts = formMethods.getValues("products");
            if (currentProducts[matchingIndex]) {
              const updatedProducts = [...currentProducts];
              updatedProducts[matchingIndex] = {
                ...updatedProducts[matchingIndex],
                _anim: false,
              };
              formMethods.setValue("products", updatedProducts);
            }
          }, 1000);

          setEditIndex(Number(matchingIndex));
        } else {
          appToast.show({
            msg: `Product already scanned or not found in this PO`,
            color: "warning",
          });
        }
      } else {
        // Show AssignBarcodeModal
        setAssignBarcode({ show: true, barcode });
      }
    }
  };

  // Callback function for AssignBarcodeModal
  const handleAssignBarcodeCallback = ({
    action,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "add-to-existing") {
      // Close AssignBarcodeModal and open ProductForBarcodeModal
      setAssignBarcode((prev) => ({ ...prev, show: false }));

      // Filter products that do NOT have a barcode value (undefined, null or empty string)
      const availableProducts = products.filter((product) => !product.barcode);

      setProductForBarcode({
        show: true,
        barcode: assignBarcode.barcode,
        products: availableProducts,
      });
    } else if (action === "close") {
      // Just close the AssignBarcodeModal
      setAssignBarcode((prev) => ({ ...prev, show: false }));
    }
  };

  // Callback function for ProductForBarcodeModal
  const handleProductForBarcodeCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "select" && data?.product) {
      // Handle product selection
      const selectedProduct = data.product;
      const barcode = productForBarcode.barcode;

      // Find the product in the products array and update it (match on dealId or _id)
      const productIndex = products.findIndex(
        (p) => p.dealId === selectedProduct.dealId,
      );

      if (productIndex !== -1) {
        const updatedProducts = [...products];
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          barcode: barcode,
          _scanned: true,
          _anim: true,
          showAssignBarcode: false,
        };

        formMethods.setValue("products", updatedProducts);

        // Open edit modal for the selected product
        setEditIndex(productIndex);

        appToast.show({
          msg: `Barcode ${barcode} assigned to ${selectedProduct.dealName}`,
          color: "success",
        });

        // Scroll to the selected product after a short delay to ensure DOM is updated
        setTimeout(() => {
          const productElement = productRefs.current?.querySelector(
            `#product-${selectedProduct.dealId}-${productIndex}`,
          ) as HTMLDivElement;
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);

        // Remove animation after a short delay
        setTimeout(() => {
          const currentProducts = formMethods.getValues("products");
          if (currentProducts[productIndex]) {
            const updatedProducts = [...currentProducts];
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              _anim: false,
            };
            formMethods.setValue("products", updatedProducts);
          }
        }, 1000);
      }
    }

    // Close the ProductForBarcodeModal
    setProductForBarcode((prev) => ({ ...prev, show: false }));
  };

  const handleInsufficientBalanceCallback = (action: string) => {
    if (action === "buy_plan") {
      // Navigate to buy plan
      appNav.to(FranchiseService.getBuyPlanLink());
    }
    setShowInsufficientModal(false);
  };

  // Header subtitle: the PO being received, which box is on the counter, and
  // who it came from — what a receiver checks against the physical carton.
  const latestPackage =
    Array.isArray(poDetails.receivedPackages) &&
    poDetails.receivedPackages.length > 0
      ? poDetails.receivedPackages[poDetails.receivedPackages.length - 1]
      : null;
  const headerSubtitle = [
    poDetails.orderId,
    latestPackage?.packageId,
    poDetails.vendorInfo?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  const summaryCallback = (a: { action: string; data?: any }) => {
    if (a.action === "autoFillAll") {
      const updatedProducts = formMethods.getValues("products");
      updatedProducts.forEach((product) => {
        const loc = a.data[product.dealId] || {};
        if (loc.location) {
          product.formData.location = loc.location;
          product.formData.locationDetail = loc.locationDetail;
          product.formData.locationDetails = loc.locationDetail;
          product.formData.rack = loc.rack;
          product.formData.rackDetails = loc.rackDetails;
          product.formData.bin = loc.bin;
          product.formData.binDetails = loc.binDetails;
        }
      });
      formMethods.setValue("products", updatedProducts);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader
          title={t("localPurchaseOrderReceiveInward")}
          showAudioNote={true}
          audioNoteTitle={t("localPurchaseOrderReceiveInward")}
          audioFeature="receivePo"
        />
        <div className="page-bg">
          <div className="app-container">
            <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
              <BusyLoader show={true} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={t("purchaseOrderReceiveInward")}
        subtitle={
          headerSubtitle ? (
            <span className="tw:truncate tw:opacity-80">{headerSubtitle}</span>
          ) : undefined
        }
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrderReceiveInward")}
        audioFeature="receivePo"
      />
      <div
        className={`page-padding page-bg app-page ${hasPlan !== false ? "has-footer" : ""}`}
      >
        <div className="app-container">
          {/* Section tab rail hidden here — this is a receive detail screen,
              not a section landing page. */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="receive-stock"
            noShadow
            sticky
          /> */}

          <div className="section-layout page-content-gap">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="receive-stock"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

                  <ReceivingHeader poDetails={poDetails} />

                  {/* What the vendor was asked for — the fixed reference the
                      receive counters below are read against. Mobile only: on
                      desktop the same numbers already sit in the side pane. */}
                  <OrderSnapshotCard
                    poDetails={poDetails}
                    className="tw:lg:hidden"
                  />

                  <FormProvider {...formMethods}>
                    <POScanSummary
                      products={products}
                      callback={summaryCallback}
                      autoAllocate={autoAllocate}
                    />

                    {isMobile ? (
                      <>
                        {/* The list is an instruction, not a heading: a quiet
                            left-aligned caption telling the receiver what to do
                            with the bubbles below it. */}
                        <div className="tw:mb-2 tw:px-0.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
                          {t("verifyEachItem", {
                            defaultValue: "Verify each item",
                          })}
                          <span className="tw:ml-1.5 tw:text-slate-400">
                            ({products.length})
                          </span>
                        </div>
                        <div ref={productRefs} className="tw:mb-3">
                          {products.length > 0 ? (
                            products.map((product, index) => (
                              <div
                                id={`product-${product.dealId}-${index}`}
                                key={`${product.dealId}-${index}`}
                              >
                                <ProductItem
                                  product={product}
                                  index={index}
                                  onEdit={handleEditProduct}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="app-msg-bubble tw:text-center tw:py-8 tw:text-gray-500">
                              {t("noProductsFoundInPurchaseOrder")}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div ref={productRefs}>
                        <ProductsDesktopTable
                          products={products}
                          onEdit={handleEditProduct}
                          onScanNext={handleScanNextItem}
                          onAutoCount={handleAutoCountFromPhotos}
                        />
                      </div>
                    )}

                    <PoInvoice />

                    <EditProductModal
                      show={editIndex >= 0}
                      product={
                        editIndex >= 0 ? products?.[editIndex] : null
                      }
                      productIndex={editIndex}
                      onClose={handleCloseEditModal}
                    />
                  </FormProvider>

                  {/* Scan FAB */}
                  {["F225830", "F324872"].includes(
                    AuthService.getLoggedInUserId(true) || "",
                  ) && (
                    <div ref={scanFabRef}>
                      <ScanFab
                        callback={onBarcodeChange}
                        dealIds={poDetails.dealIds}
                        vendorId={poDetails.vendorInfo?.id}
                      />
                    </div>
                  )}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      {hasPlan === false ? (
        <div className="app-footer">
          <div className="app-container">
            <PlatformFeeRequiredBlock onSubscribe={handleBuyPlan} />
          </div>
        </div>
      ) : (
        <footer className="app-footer">
          <div className="app-container">
            {/* Scan Summary above ScanInput */}

            <div className="tw:flex tw:justify-between tw:gap-2">
              <div>
                {/* <AppButton
                  expand="block"
                  fill="outline"
                  onClick={receiveAll}
                  disabled={receiveAllLoading}
                  isLoading={receiveAllLoading}
                  color="light"
                >
                  <Package />
                  {receiveAllLoading ? "Receiving..." : "Receive All Products"}
                </AppButton> */}
              </div>

              <AppButton
                expand="block"
                onClick={handleProceed}
                disabled={submitting}
                isLoading={submitting}
                color="primary"
                className="tw:rounded-full tw:px-6 tw:font-semibold tw:shadow-sm"
              >
                {submitting ? "Processing..." : "Proceed"}
                <ArrowRight />
              </AppButton>
            </div>
          </div>
        </footer>
      )}

      {/* PO Details Modal */}
      {/* <PODetailsModal show={poDetailsModal} poDetails={poDetails} /> */}
      <AssignBarcodeModal
        show={assignBarcode.show}
        barcode={assignBarcode.barcode}
        callback={handleAssignBarcodeCallback}
      />
      <ProductForBarcodeModal
        show={productForBarcode.show}
        barcode={productForBarcode.barcode}
        products={productForBarcode.products}
        callback={handleProductForBarcodeCallback}
      />
      <InsufficientBalanceModal
        show={showInsufficientModal}
        commissionData={commissionData}
        poTotal={Number(formMethods.getValues("invoice.amount")) || 0}
        callback={handleInsufficientBalanceCallback}
      />

      <ConfirmReceiveModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmReceipt}
        products={products.filter((p) => p._scanned)}
        totalValue={formMethods.getValues("invoice.amount") || 0}
      />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        type={appAlertDialog.type}
        okText={appAlertDialog.okText}
        cancelText={appAlertDialog.cancelText}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />
    </>
  );
};

export default ProcessPurchaseOrder;
