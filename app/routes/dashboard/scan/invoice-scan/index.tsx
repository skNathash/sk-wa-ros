import {
  ArrowLeft,
  CheckCircle2,
  FileSearch,
  FileText,
  Plus,
  Rocket,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import AppHeader from "~/components/core/header/AppHeader";
import { ASSET } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AjaxService from "~/services/AjaxService";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AiFlowSteps from "./components/AiFlowSteps";
import Buyer from "./components/Buyer";
import InvoiceDetails from "./components/InvoiceDetails";
import DesktopView from "./components/items/DesktopView";
import MobileView from "./components/items/MobileView";
import TaxSummary from "./components/TaxSummary";
import TotalsSummary from "./components/TotalsSummary";
import Vendor from "./components/Vendor";
import { preparePurchaseOrderPayload } from "./helper";
import AddProductModal from "~/shared/catalog/modals/AddProductModal";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import ChooseDealModal from "./modals/choose-deal/ChooseDealModal";import ConfirmModal from "./modals/ConfirmModal";
import ChooseVendorModal from "./modals/ChooseVendorModal";
import CreateVendorModal from "./modals/CreateVendorModal";
import EditItemModal from "./modals/EditItemModal";
import EditInvoiceModal from "./modals/EditInvoiceModal";
import EditVendorModal from "./modals/EditVendorModal";
import type {
  InvoiceInfo,
  InvoiceItem,
  InvoiceScanResponse,
  ItemFormData,
  ParsedInvoice,
  SimilarDeal,
  SimilarVendor,
  VendorFormData,
} from "./types";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Purchase Orders",
    redirect: {
      path: "/dashboard/purchase-order/main",
    },
  },
  {
    label: "SK Invoice AI",
  },
];

const SAMPLE_INVOICES = [
  "inv-1.png",
  "inv-2.png",
  "inv-3.png",
  "inv-4.png",
  "inv-5.png",
  "inv-6.png",
  "inv-7.png",
];

const InvoiceScan = () => {
  const [display, setDisplay] = useState<"upload" | "processing" | "result">(
    "upload",
  );

  const { t } = useTranslation(["menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const [, setSearchParams] = useSearchParams();

  const [uploadedFile, setUploadedFile] = useState<Array<{ id: string }>>([]);
  const [invoiceData, setInvoiceData] = useState<ParsedInvoice | null>(null);

  // Alert dialog state
  const [showNewScanAlert, setShowNewScanAlert] = useState(false);

  // Selected vendor state
  const [selectedVendor, setSelectedVendor] = useState<
    SimilarVendor | undefined
  >(undefined);

  // Preview mode state
  const [isPreview, setIsPreview] = useState(false);

  // Confirm modal & busy loader state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [busyLoader, setBusyLoader] = useState({ show: false, message: "" });

  // Modal states
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [chooseVendorModal, setChooseVendorModal] = useState<{
    show: boolean;
    items: SimilarVendor[];
  }>({ show: false, items: [] });
  const [createVendorModal, setCreateVendorModal] = useState<{
    show: boolean;
    initialData?: any;
  }>({ show: false });

  // Invoice edit modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Image preview modal state
  const [imgPreview, setImgPreview] = useState<{
    show: boolean;
    initialId?: string;
  }>({ show: false });

  // Deal modal states
  const [chooseDealModal, setChooseDealModal] = useState<{
    show: boolean;
    index: number | null;
    hsn?: string;
  }>({ show: false, index: null });
  const [addProductModal, setAddProductModal] = useState<{
    show: boolean;
    index: number | null;
    data?: any;
  }>({ show: false, index: null });

  const handleFileUpload = (response: any) => {
    setUploadedFile([...uploadedFile, { id: response._id }]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFile(uploadedFile.filter((_, i) => i !== index));
  };

  const handleUseSample = async (fileName: string) => {
    try {
      setBusyLoader({ show: true, message: "Loading sample invoice..." });
      const res = await fetch(`/assets/images/invoice-samples/${fileName}`);
      const blob = await res.blob();
      const file = new File([blob], fileName, {
        type: blob.type || "image/png",
      });
      const response = await AjaxService.request(
        `${ASSET}/upload`,
        "POST",
        { file },
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setBusyLoader({ show: false, message: "" });
      if (
        (response.statusCode === 200 || response.statusCode === 201) &&
        response.data?._id
      ) {
        setUploadedFile([{ id: response.data._id }]);
      } else {
        appToast.show({ msg: "Failed to load sample.", color: "danger" });
      }
    } catch (err: any) {
      setBusyLoader({ show: false, message: "" });
      appToast.show({
        msg: err?.message || "Failed to load sample.",
        color: "danger",
      });
    }
  };

  const handleSubmit = async () => {
    if (uploadedFile.length === 0) {
      appToast.show({
        msg: "Please upload an invoice image before submitting.",
        color: "danger",
      });
      return;
    }

    setDisplay("processing");

    try {
      const fileUrls = uploadedFile.map((file) => `${ASSET}/${file.id}.jpg`);

      const r = await CommonService.scanInvoice(fileUrls, false);

      if (r?.statusCode === 200) {
        const response = r.data as InvoiceScanResponse;
        const invoice = response.invoice;

        // Populate selected on each item from similarDeals
        if (invoice?.items) {
          invoice.items = invoice.items.map((item) => {
            const matchedDeal = item.similarDeals?.find((d) => d.isMatched);
            return {
              ...item,
              selected: matchedDeal
                ? {
                    dealId: matchedDeal._id || matchedDeal.dealId,
                    skId: matchedDeal.dealId,
                    dealName: matchedDeal.dealName,
                    hsn: item.hsn,
                    barcode: matchedDeal.barcode || item.barcode,
                    mrp: item.mrp,
                    price: item.price,
                    qty: item.qty,
                    discount: item.discountAmount,
                    gst:
                      (item.cgstPercent ?? 0) +
                      (item.sgstPercent ?? 0) +
                      (item.igstPercent ?? 0),
                    isMatched: true,
                  }
                : undefined,
            };
          });
        }

        // Map root-level similarVendors (API uses _id/vendorId) into vendor.similarVendors
        if (invoice?.similarVendors?.length) {
          const mapped: SimilarVendor[] = invoice.similarVendors.map(
            (v: any) => {
              const addr = v.address || {};
              const addressLine = [
                addr.doorNo,
                addr.street,
                addr.landmark,
                addr.city,
                addr.town,
                addr.district,
                addr.state,
                addr.postcode,
              ]
                .filter(Boolean)
                .join(", ");
              return {
                id: v._id || v.id || "",
                name: v.name || "",
                gstin: v.gstin || "",
                address: { ...addr, addressLine },
                mobileNumber: v.mobile || v.mobileNumber || "",
                contactPerson: v.contactPerson || "",
              };
            },
          );
          invoice.vendor = { ...invoice.vendor, similarVendors: mapped };
        }

        setInvoiceData(invoice);

        // If the API matched a vendor, auto-select it
        // Fallback: match from vendor.similarVendors by gstin
        if (invoice?.vendor?.matchedVendor) {
          const mv = invoice.vendor.matchedVendor;
          const mAddr = mv.address || {};
          if (!mAddr.addressLine) {
            mAddr.addressLine = [
              mAddr.doorNo,
              mAddr.street,
              mAddr.landmark,
              mAddr.city,
              mAddr.town,
              mAddr.district,
              mAddr.state,
              mAddr.postcode,
            ]
              .filter(Boolean)
              .join(", ");
          }
          invoice.vendor.matchedVendor = {
            ...mv,
            id: mv.id || (mv as any)._id || "",
            address: { ...mAddr },
            mobileNumber: mv.mobileNumber || (mv as any).mobile || "",
          };
          setSelectedVendor(invoice.vendor.matchedVendor);
        } else if (
          invoice?.vendor?.gstin &&
          invoice.vendor?.similarVendors?.length
        ) {
          const gstinMatch = invoice.vendor.similarVendors.find(
            (v) => v.gstin === invoice.vendor.gstin,
          );
          if (gstinMatch) {
            setSelectedVendor(gstinMatch);
          }
        }

        setDisplay("result");
        setSearchParams((prev) => {
          prev.set("hideSideMenu", "true");
          return prev;
        });
      } else {
        setDisplay("upload");
        appToast.show({
          msg: r?.data?.message || "Failed to scan invoice",
          color: "danger",
        });
      }
    } catch (err: any) {
      setDisplay("upload");
      appToast.show({
        msg: err?.message || "Failed to scan invoice",
        color: "danger",
      });
    }
  };

  const handleVendorEdit = (params: {
    action: string;
    data?: VendorFormData;
  }) => {
    if (params.action === "submit" && params.data && invoiceData) {
      setInvoiceData({
        ...invoiceData,
        vendor: { ...invoiceData.vendor, ...params.data },
      });
    }
    setShowVendorModal(false);
  };

  const handleInvoiceEdit = (params: {
    action: string;
    data?: InvoiceInfo;
  }) => {
    if (params.action === "submit" && params.data && invoiceData) {
      setInvoiceData({
        ...invoiceData,
        invoice: params.data,
      });
    }
    setShowInvoiceModal(false);
  };

  const handleItemEdit = (params: {
    action: string;
    data?: ItemFormData;
    selectedDeal?: SimilarDeal;
  }) => {
    if (
      params.action === "submit" &&
      params.data &&
      invoiceData &&
      editingItemIndex !== null
    ) {
      const updatedItems = [...invoiceData.items];
      const item = updatedItems[editingItemIndex];
      const gst =
        (item.cgstPercent ?? 0) +
        (item.sgstPercent ?? 0) +
        (item.igstPercent ?? 0);
      let selected = item.selected;
      if (params.selectedDeal) {
        selected = {
          dealId: params.selectedDeal._id || params.selectedDeal.dealId,
          skId: params.selectedDeal.dealId,
          dealName: params.selectedDeal.dealName,
          hsn: params.data.hsn,
          barcode: params.selectedDeal.barcode || params.data.barcode,
          mrp: params.data.mrp,
          price: params.data.price,
          qty: params.data.qty,
          discount: params.data.discount,
          gst:
            (params.selectedDeal as any).tax ??
            (params.selectedDeal as any).gst ??
            gst,
          isMatched: true,
        };
      } else if (selected) {
        // Keep existing match but sync edited fields
        selected = {
          ...selected,
          dealName: params.data.name,
          hsn: params.data.hsn,
          barcode: params.data.barcode,
          mrp: params.data.mrp,
          price: params.data.price,
          qty: params.data.qty,
          discount: params.data.discount,
          gst,
        };
      }
      updatedItems[editingItemIndex] = recalculateItem({
        ...item,
        name: params.data.name,
        hsn: params.data.hsn,
        barcode: params.data.barcode,
        price: params.data.price,
        mrp: params.data.mrp,
        discountAmount: params.data.discount,
        qty: params.data.qty,
        quantity: params.data.qty,
        selected,
      });

      // Recalculate invoice totals/tax summary
      const items = updatedItems;
      const subtotal = items.reduce((s, i) => s + (i.subtotal ?? 0), 0);
      const tax = items.reduce((s, i) => s + (i.tax ?? 0), 0);
      const grandTotal = items.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
      const roundOff = Math.round(grandTotal) - grandTotal;
      const cgst = items.reduce((s, i) => s + (i.cgstAmount ?? 0), 0);
      const sgst = items.reduce((s, i) => s + (i.sgstAmount ?? 0), 0);
      const igst = items.reduce((s, i) => s + (i.igstAmount ?? 0), 0);

      setInvoiceData({
        ...invoiceData,
        items,
        totals: {
          subtotal,
          tax,
          roundOff: Math.round(roundOff * 100) / 100,
          grandTotal: Math.round(grandTotal + roundOff),
        },
        taxSummary: {
          ...invoiceData.taxSummary,
          cgst: Math.round(cgst * 100) / 100,
          sgst: Math.round(sgst * 100) / 100,
          igst: Math.round(igst * 100) / 100,
        },
      });
    }
    setShowItemModal(false);
    setEditingItemIndex(null);
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowItemModal(true);
  };

  const recalculateItem = (item: InvoiceItem): InvoiceItem => {
    const qty = item.qty ?? 0;
    const price = item.price || item.mrp || 0;
    // Total is simply price × qty. The discount is already reflected in the
    // price (price = mrp − discount/qty), so it is NOT subtracted again here.
    const subtotal = price * qty;
    const taxableAmount = subtotal;
    // GST-based calculation intentionally excluded from totals.
    // const cgstPercent = item.cgstPercent ?? 0;
    // const sgstPercent = item.sgstPercent ?? 0;
    // const igstPercent = item.igstPercent ?? 0;
    // const cgstAmount = (taxableAmount * cgstPercent) / 100;
    // const sgstAmount = (taxableAmount * sgstPercent) / 100;
    // const igstAmount = (taxableAmount * igstPercent) / 100;
    // const tax = cgstAmount + sgstAmount + igstAmount;
    const cgstAmount = 0;
    const sgstAmount = 0;
    const igstAmount = 0;
    const tax = 0;
    const totalAmount = subtotal;

    return {
      ...item,
      quantity: qty,
      subtotal,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      tax,
      totalAmount,
    };
  };

  const handleInlineUpdate = (index: number, data: Partial<InvoiceItem>) => {
    if (!invoiceData) return;
    const updatedItems = [...invoiceData.items];
    const current = updatedItems[index];
    const merged = recalculateItem({ ...current, ...data });

    // Keep selected.* in sync so inputs don't read stale values from selected.
    // Only sync the fields that were actually edited in this update — otherwise
    // untouched fields (e.g. the matched deal's barcode/hsn) would be clobbered
    // by the top-level OCR item values on unrelated edits (mrp/price/qty/etc).
    if (current.selected) {
      const sel = { ...current.selected };
      if ("name" in data) sel.dealName = merged.name;
      if ("hsn" in data) sel.hsn = merged.hsn;
      if ("barcode" in data) sel.barcode = merged.barcode;
      if ("mrp" in data) sel.mrp = merged.mrp;
      if ("price" in data) sel.price = merged.price;
      if ("qty" in data) sel.qty = merged.qty;
      if ("discountAmount" in data) sel.discount = merged.discountAmount;
      merged.selected = sel;
    }
    updatedItems[index] = merged;

    // Recalculate invoice totals from items
    const subtotal = updatedItems.reduce(
      (sum, i) => sum + (i.subtotal ?? 0),
      0,
    );
    const tax = updatedItems.reduce((sum, i) => sum + (i.tax ?? 0), 0);
    const grandTotal = updatedItems.reduce(
      (sum, i) => sum + (i.totalAmount ?? 0),
      0,
    );
    const roundOff = Math.round(grandTotal) - grandTotal;

    // Recalculate tax summary
    const cgst = updatedItems.reduce((sum, i) => sum + (i.cgstAmount ?? 0), 0);
    const sgst = updatedItems.reduce((sum, i) => sum + (i.sgstAmount ?? 0), 0);
    const igst = updatedItems.reduce((sum, i) => sum + (i.igstAmount ?? 0), 0);

    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      totals: {
        subtotal,
        tax,
        roundOff: Math.round(roundOff * 100) / 100,
        grandTotal: Math.round(grandTotal + roundOff),
      },
      taxSummary: {
        ...invoiceData.taxSummary,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
      },
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!invoiceData) return;
    const updatedItems = invoiceData.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, lineNumber: i + 1 }));

    // Sum totals from remaining items (preserve original item values)
    const subtotal = updatedItems.reduce(
      (sum, i) => sum + (i.subtotal ?? 0),
      0,
    );
    const tax = updatedItems.reduce((sum, i) => sum + (i.tax ?? 0), 0);
    const grandTotal = updatedItems.reduce(
      (sum, i) => sum + (i.totalAmount ?? 0),
      0,
    );
    const roundOff = Math.round(grandTotal) - grandTotal;
    const cgst = updatedItems.reduce((sum, i) => sum + (i.cgstAmount ?? 0), 0);
    const sgst = updatedItems.reduce((sum, i) => sum + (i.sgstAmount ?? 0), 0);
    const igst = updatedItems.reduce((sum, i) => sum + (i.igstAmount ?? 0), 0);

    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      totals: {
        subtotal,
        tax,
        roundOff: Math.round(roundOff * 100) / 100,
        grandTotal: Math.round(grandTotal + roundOff),
      },
      taxSummary: {
        ...invoiceData.taxSummary,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
      },
    });
  };

  const handleNewScan = () => {
    setUploadedFile([]);
    setInvoiceData(null);
    setSelectedVendor(undefined);
    setDisplay("upload");
    setSearchParams((prev) => {
      prev.delete("hideSideMenu");
      return prev;
    });
  };

  // Shift the buyer to the logged-in store ("my store"). The invoice buyer is
  // often the head-office/parent entity, but the PO is raised by the franchise
  // that is currently logged in — so allow a one-tap switch.
  const handleUseMyStore = () => {
    if (!invoiceData) return;
    const f = AuthService.getLoggedInUser() || {};

    // Build the address from the store's own fields. `f.address` may be a plain
    // string (franchise doc) or a structured object, so handle both shapes.
    const addr = f.address;
    const addressLine =
      typeof addr === "string"
        ? [addr, f.town || f.city, f.district, f.state, f.postcode]
            .filter(Boolean)
            .join(", ")
        : [
            addr?.addressLine,
            addr?.doorNo,
            addr?.street,
            addr?.landmark,
            addr?.city || addr?.town || f.town,
            addr?.district || f.district,
            addr?.state || f.state,
            addr?.postcode,
          ]
            .filter(Boolean)
            .join(", ");

    // Fully replace the buyer with the logged-in store's details. Do NOT fall
    // back to the invoice buyer — that leaks stale invoice data (e.g. the old
    // GSTIN) when the store has no value for a field.
    setInvoiceData({
      ...invoiceData,
      buyer: {
        name: f.name || "",
        gstin:
          f.gstNumber || f.finance_details?.gstNo || f.gst_no || f.gstin || "",
        mobileNumber: f.mobile?.toString() || f.mobileNumber || "",
        contactPerson: f.contactPerson || f.name || "",
        franchiseId: f._id || "",
        address: {
          addressLine,
          doorNo: "",
          street: "",
          landmark: "",
          city: f.city || f.town || "",
          town: f.town || "",
          district: f.district || "",
          state: f.state || "",
          postcode: f.postcode || "",
        },
      },
    });
  };

  const handleChooseVendorCallback = (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "select") {
      setSelectedVendor(params.data);
      setChooseVendorModal({ show: false, items: [] });
    } else if (params.action === "create") {
      setChooseVendorModal({ show: false, items: [] });
      setCreateVendorModal({ show: true, initialData: invoiceData?.vendor });
    } else {
      setChooseVendorModal({ show: false, items: [] });
    }
  };

  const handleCreateVendorCallback = async (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "success" && params.data) {
      const vendorId = params.data.vendorId || params.data._id;
      if (vendorId) {
        try {
          const resp = await VendorService.getDetail(vendorId);
          const v = resp.data?.data || resp.data || {};
          setSelectedVendor({
            id: v._id || v.id || "",
            name: v.name || "",
            gstin: v.gst_no || v.gstin || "",
            mobileNumber: v.mobile?.toString() || v.mobileNumber || "",
            contactPerson: v.contact?.[0]?.name || v.contactPerson || "",
            address: {
              addressLine: v.address?.street || v.address?.addressLine || "",
              doorNo: v.address?.doorNo || "",
              street: v.address?.street || "",
              district: v.address?.district || "",
              city: v.address?.city || v.address?.town || "",
              town: v.address?.town || "",
              state: v.address?.state || "",
              postcode: v.address?.postcode || "",
              landmark: v.address?.landmark || "",
            },
          });
        } catch {
          // Fallback to create response data
          const v = params.data;
          setSelectedVendor({
            id: v._id || v.id || "",
            name: v.name || "",
            gstin: v.gst_no || v.gstin || "",
            mobileNumber: v.mobile?.toString() || v.mobileNumber || "",
            contactPerson: v.contact?.[0]?.name || v.contactPerson || "",
            address: {
              addressLine: v.address?.street || v.address?.addressLine || "",
              doorNo: v.address?.doorNo || "",
              street: v.address?.street || "",
              district: v.address?.district || "",
              city: v.address?.city || v.address?.town || "",
              town: v.address?.town || "",
              state: v.address?.state || "",
              postcode: v.address?.postcode || "",
              landmark: v.address?.landmark || "",
            },
          });
        }
      }
    }
    setCreateVendorModal({ show: false });
  };

  const handleSelectDeal = (index: number) => {
    const hsn = invoiceData?.items[index]?.hsn || "";
    setChooseDealModal({ show: true, index, hsn });
  };

  const handleChooseDealCallback = (params: { action: string; data?: any }) => {
    const index = chooseDealModal.index;
    if (params.action === "select" && index !== null && invoiceData) {
      const deal = params.data as SimilarDeal;
      const updatedItems = [...invoiceData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        name: deal.dealName,
        selected: {
          dealId: deal._id || deal.dealId,
          skId: deal.dealId,
          dealName: deal.dealName,
          hsn: deal.hsn,
          barcode: deal.barcode,
          mrp: updatedItems[index].mrp,
          price: updatedItems[index].price,
          qty: updatedItems[index].qty,
          discount: updatedItems[index].discountAmount,
          gst:
            (deal as any).tax ??
            (deal as any).gst ??
            (updatedItems[index].cgstPercent ?? 0) +
              (updatedItems[index].sgstPercent ?? 0) +
              (updatedItems[index].igstPercent ?? 0),
          isMatched: true,
        },
      };
      setInvoiceData({ ...invoiceData, items: updatedItems });
      setChooseDealModal({ show: false, index: null });
    } else if (params.action === "create" && index !== null && invoiceData) {
      const item = invoiceData.items[index];
      setChooseDealModal({ show: false, index: null });
      setAddProductModal({
        show: true,
        index,
        data: {
          name: item.name,
          mrp: item.mrp,
          barcode: item.barcode,
          uom: "unit",
          description: "",
        },
      });
    } else {
      setChooseDealModal({ show: false, index: null });
    }
  };

  const handleAddProductCallback = (params: { action: string; data?: any }) => {
    const index = addProductModal.index;
    if (
      params.action === "created" &&
      index !== null &&
      invoiceData &&
      params.data?.product
    ) {
      const product = params.data.product;
      const item = invoiceData.items[index];
      const updatedItems = [...invoiceData.items];
      updatedItems[index] = {
        ...item,
        name: product.name || product.dealName || item.name,
        selected: {
          dealId: product._id || product.id || product.dealId || "",
          skId: product.dealId || product.pid || "",
          dealName: product.name || product.dealName || item.name,
          hsn: product.hsn || item.hsn,
          barcode: product.barcode || item.barcode,
          mrp: item.mrp,
          price: item.price,
          qty: item.qty,
          discount: item.discountAmount,
          gst:
            (item.cgstPercent ?? 0) +
            (item.sgstPercent ?? 0) +
            (item.igstPercent ?? 0),
          isMatched: true,
          isPending: true,
        },
      };
      setInvoiceData({ ...invoiceData, items: updatedItems });
    }
    setAddProductModal({ show: false, index: null });
  };

  const validate = (): { msg: string } | null => {
    if (!selectedVendor?.id && !invoiceData?.vendor?.matchedVendor?.id) {
      return { msg: "Please select or create a vendor before submitting." };
    }
    if (!invoiceData?.items?.length) {
      return { msg: "No items to submit." };
    }
    const unmatchedItem = invoiceData.items.find(
      (item) => !item.selected?.isMatched,
    );
    if (unmatchedItem) {
      return {
        msg: `Item "${unmatchedItem.name}" is not matched. Please select or create a deal for all items.`,
      };
    }
    return null;
  };

  const handleInvoiceSubmit = () => {
    const error = validate();
    if (error) {
      appToast.show({ msg: error.msg, color: "danger" });
      return;
    }
    setIsPreview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmCallback = async (params: {
    action: string;
    data?: any;
  }) => {
    setShowConfirmModal(false);

    if (params.action !== "confirm" || !invoiceData) return;

    const vendor = selectedVendor || invoiceData.vendor.matchedVendor;
    if (!vendor) return;

    setBusyLoader({ show: true, message: "Creating purchase order..." });

    try {
      // Step 1: Create PO
      const poPayload = preparePurchaseOrderPayload(invoiceData, vendor);
      const poResp = await PurchaseOrderService.create(poPayload);

      if (
        !(
          (poResp.statusCode === 200 || poResp.statusCode === 201) &&
          poResp.data?.data?._id
        )
      ) {
        setBusyLoader({ show: false, message: "" });
        appToast.show({
          msg:
            typeof poResp.data?.message === "string"
              ? poResp.data.message
              : "Failed to create purchase order.",
          color: "danger",
        });
        return;
      }

      const poId = poResp.data.data._id;

      setBusyLoader({ show: false, message: "" });

      appToast.show({
        msg: "Purchase order created successfully!",
        color: "success",
      });
      appNav.to(`/dashboard/purchase-order/process/${poId}`);
    } catch (err: any) {
      setBusyLoader({ show: false, message: "" });
      console.error(err);
      appToast.show({
        msg: err?.message || "Failed to process invoice.",
        color: "danger",
      });
    }
  };

  return (
    <>
      <AppHeader
        title={
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <Sparkles size={16} className="tw:text-fuchsia-500" />
            <span className="tw:bg-linear-to-r tw:from-fuchsia-600 tw:to-violet-600 tw:bg-clip-text tw:text-transparent tw:font-bold">
              SK Invoice AI
            </span>
          </span>
        }
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* PO section tab bar. Mobile shows the horizontal tab scroller;
              desktop shows the left rail below. Hidden in result mode so the
              scanned invoice review gets the full width. */}
          {display !== "result" && (
            <PoSectionTabs activeTab="scan-ai" outerClassName="tw:mb-3" />
          )}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            {display !== "result" && (
              <aside className="section-menu-aside">
                <div className="tw:sticky tw:top-20">
                  <SectionMenu
                    sectionKey="supply"
                    activeTab="receive-stock"
                    title={t("manageSupply", { ns: "menu" })}
                  />
                </div>
              </aside>
            )}

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
                <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
              <AppBreadcrumbs data={breadcrumbs} />

              <div className="tw:mb-4">
                <div className="tw:text-base tw:font-semibold tw:text-gray-800">
                  Process your Invoice using StoreKing AI Scanner.
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  Upload your invoice image and let StoreKing AI Scanner process
                  it.
                </div>
              </div>

          {display === "processing" && (
            <AppCard>
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-14 tw:px-4 tw:gap-5">
                {/* Animated icon */}
                <div className="tw:relative tw:w-20 tw:h-20 tw:flex tw:items-center tw:justify-center">
                  <div className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-blue-100 tw:animate-ping tw:opacity-20" />
                  <div className="tw:absolute tw:inset-1 tw:rounded-full tw:bg-blue-50 tw:animate-pulse" />
                  <div className="tw:relative tw:w-14 tw:h-14 tw:rounded-full tw:bg-gradient-to-br tw:from-blue-500 tw:to-indigo-600 tw:flex tw:items-center tw:justify-center tw:shadow-lg">
                    <FileSearch
                      size={26}
                      className="tw:text-white tw:animate-bounce"
                      style={{ animationDuration: "2s" }}
                    />
                  </div>
                  <Sparkles
                    size={14}
                    className="tw:absolute tw:-top-1 tw:-right-1 tw:text-amber-400 tw:animate-pulse"
                  />
                  <Sparkles
                    size={10}
                    className="tw:absolute tw:-bottom-0.5 tw:-left-1 tw:text-blue-400 tw:animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>

                {/* Title & description */}
                <div className="tw:text-center tw:space-y-1.5">
                  <div className="tw:text-base tw:font-semibold tw:text-gray-900">
                    Reading Your Invoice...
                  </div>
                  <div className="tw:text-sm tw:text-gray-500 tw:max-w-xs tw:leading-relaxed">
                    Our AI is extracting vendor details, line items, and tax
                    information from {uploadedFile.length} image
                    {uploadedFile.length > 1 ? "s" : ""}.
                  </div>
                </div>

                {/* Steps indicator */}
                <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2.5 tw:md:gap-6 tw:mt-1">
                  {[
                    { icon: ScanLine, label: "Scanning document" },
                    { icon: FileText, label: "Extracting data" },
                    { icon: CheckCircle2, label: "Verifying accuracy" },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className="tw:flex tw:items-center tw:gap-2.5 tw:text-xs tw:text-gray-500"
                      style={{ animation: `fadeIn 0.4s ease ${i * 0.6}s both` }}
                    >
                      <div className="tw:w-7 tw:h-7 tw:rounded-full tw:bg-blue-50 tw:flex tw:items-center tw:justify-center">
                        <step.icon
                          size={14}
                          className="tw:text-blue-500 tw:animate-pulse"
                          style={{ animationDelay: `${i * 0.3}s` }}
                        />
                      </div>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="tw:w-48 tw:h-1.5 tw:bg-gray-100 tw:rounded-full tw:overflow-hidden tw:mt-1">
                  <div
                    className="tw:h-full tw:bg-gradient-to-r tw:from-blue-500 tw:to-indigo-500 tw:rounded-full"
                    style={{
                      animation: "progressBar 8s ease-in-out infinite",
                    }}
                  />
                </div>

                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes progressBar {
                    0% { width: 5%; }
                    50% { width: 75%; }
                    100% { width: 95%; }
                  }
                `}</style>
              </div>
            </AppCard>
          )}

          {display === "upload" && (
            <AppCard>
              <AiFlowSteps className="tw:mb-3 tw:rounded-lg tw:border tw:border-violet-200 tw:bg-linear-to-r tw:from-fuchsia-50 tw:to-violet-50 tw:p-3" />
              <div className="tw:border tw:border-dashed tw:border-blue-300 tw:rounded-lg tw:bg-blue-50/60 tw:p-5 tw:mb-3">
                <FileUpload
                  maxSizeMB={10}
                  allowedExtensions={["jpg", "jpeg", "png", "webp"]}
                  onFileUpload={handleFileUpload}
                >
                  <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1.5">
                    <div className="tw:w-9 tw:h-9 tw:rounded-full tw:bg-blue-100 tw:flex tw:items-center tw:justify-center">
                      <Upload size={18} className="tw:text-blue-500" />
                    </div>
                    <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                      Upload Invoice Images
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:text-center tw:leading-relaxed">
                      Upload multiple images of the same invoice (e.g.
                      multi-page invoices).
                      <br />
                      Supported: JPG, PNG, WEBP — Max 10MB per file.
                    </div>
                    <AppButton size="small" className="tw:mt-1">
                      <Upload size={14} />
                      Choose Files
                    </AppButton>
                  </div>
                </FileUpload>
              </div>

              {uploadedFile.length === 0 && !MiscService.hasCordova() && (
                <div className="tw:mb-3">
                  <div className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:mb-1.5">
                    Sample Invoices
                  </div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
                    Reference samples showing supported invoice format.
                  </div>
                  <div className="tw:flex tw:flex-wrap tw:gap-2">
                    {SAMPLE_INVOICES.map((f, idx) => (
                      <div
                        key={f}
                        className="tw:relative tw:w-24 tw:h-24 tw:rounded-md tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-gray-50 tw:group"
                      >
                        <a
                          href={`/assets/images/invoice-samples/${f}`}
                          target="_blank"
                          rel="noreferrer"
                          className="tw:block tw:w-full tw:h-full"
                        >
                          <img
                            src={`/assets/images/invoice-samples/${f}`}
                            alt={`Sample invoice ${idx + 1}`}
                            className="tw:w-full tw:h-full tw:object-cover"
                          />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleUseSample(f);
                          }}
                          className="tw:absolute tw:top-1 tw:left-1 tw:right-1 tw:bg-blue-600 tw:hover:bg-blue-700 tw:text-white tw:text-[10px] tw:font-semibold tw:rounded tw:py-0.5 tw:px-1 tw:flex tw:items-center tw:justify-center tw:gap-1 tw:shadow"
                        >
                          <Upload size={10} />
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedFile.length > 0 && (
                <div className="tw:mb-3">
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
                    <div className="tw:text-xs tw:font-semibold tw:text-gray-700">
                      Uploaded ({uploadedFile.length} file
                      {uploadedFile.length > 1 ? "s" : ""})
                    </div>
                  </div>
                  <FileUploadedSlide
                    images={uploadedFile}
                    onRemove={handleRemoveFile}
                  />
                </div>
              )}

              <div className="tw:flex tw:items-center tw:justify-between tw:pt-2 tw:border-t tw:border-gray-100">
                <div className="tw:text-xs tw:text-gray-400">
                  {uploadedFile.length === 0
                    ? "No files uploaded yet"
                    : `${uploadedFile.length} file${uploadedFile.length > 1 ? "s" : ""} ready`}
                </div>
                <AppButton
                  color="primary"
                  size="small"
                  disabled={uploadedFile.length === 0}
                  onClick={handleSubmit}
                >
                  <Rocket size={14} />
                  Process Invoice
                </AppButton>
              </div>
            </AppCard>
          )}

          {display === "result" &&
            invoiceData &&
            (() => {
              const visibleItems = isPreview
                ? invoiceData.items.filter((i) => !i.selected?.isPending)
                : invoiceData.items;
              const previewSubtotal = visibleItems.reduce(
                (s, i) => s + (i.subtotal ?? 0),
                0,
              );
              const previewTax = visibleItems.reduce(
                (s, i) => s + (i.tax ?? 0),
                0,
              );
              const previewGrand = visibleItems.reduce(
                (s, i) => s + (i.totalAmount ?? 0),
                0,
              );
              const previewRoundOff = Math.round(previewGrand) - previewGrand;
              const previewCgst = visibleItems.reduce(
                (s, i) => s + (i.cgstAmount ?? 0),
                0,
              );
              const previewSgst = visibleItems.reduce(
                (s, i) => s + (i.sgstAmount ?? 0),
                0,
              );
              const previewIgst = visibleItems.reduce(
                (s, i) => s + (i.igstAmount ?? 0),
                0,
              );
              const displayedTotals = isPreview
                ? {
                    subtotal: previewSubtotal,
                    tax: previewTax,
                    roundOff: Math.round(previewRoundOff * 100) / 100,
                    grandTotal: Math.round(previewGrand + previewRoundOff),
                  }
                : invoiceData.totals;
              const displayedTaxSummary = isPreview
                ? {
                    ...invoiceData.taxSummary,
                    cgst: Math.round(previewCgst * 100) / 100,
                    sgst: Math.round(previewSgst * 100) / 100,
                    igst: Math.round(previewIgst * 100) / 100,
                  }
                : invoiceData.taxSummary;
              return (
                <div className={`tw:space-y-4 ${isPreview ? "tw:pb-20" : ""}`}>
                  {/* SK AI end-to-end flow */}
                  <AiFlowSteps />

                  {/* Scanned Invoice Images + Invoice Info */}
                  {!isPreview && (
                    <div className="tw:flex tw:items-start tw:gap-4 tw:bg-white tw:rounded-lg tw:border tw:border-gray-200 tw:p-4">
                      {uploadedFile.length > 0 && (
                        <div className="tw:flex tw:gap-2 tw:shrink-0">
                          {uploadedFile.map((file, idx) => (
                            <div
                              key={idx}
                              className="tw:w-14 tw:h-14 tw:rounded-md tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-gray-50 tw:flex tw:items-center tw:justify-center tw:cursor-pointer"
                              onClick={() =>
                                setImgPreview({
                                  show: true,
                                  initialId: file.id,
                                })
                              }
                            >
                              <img
                                src={`${ASSET}/${file.id}.jpg`}
                                alt={`Invoice page ${idx + 1}`}
                                className="tw:w-full tw:h-full tw:object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                          {invoiceData.invoice.invoiceNumber || "Invoice"}
                        </div>
                        <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                          {invoiceData.invoice.invoiceDate || ""}{" "}
                          {invoiceData.vendor.name
                            ? `from ${invoiceData.vendor.name}`
                            : ""}
                        </div>
                        <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                          {uploadedFile.length} scanned page
                          {uploadedFile.length > 1 ? "s" : ""} &middot; AI
                          processed
                        </div>
                      </div>
                      <AppButton
                        size="small"
                        onClick={() => setShowNewScanAlert(true)}
                      >
                        <Plus size={16} />
                        New Scan
                      </AppButton>
                    </div>
                  )}

                  {/* Preview mode indicator */}
                  {isPreview && (
                    <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3 tw:flex tw:items-center tw:gap-2">
                      <CheckCircle2 size={16} className="tw:text-blue-600" />
                      <span className="tw:text-sm tw:font-medium tw:text-blue-800">
                        Preview Mode — Review your invoice before submitting
                      </span>
                    </div>
                  )}

                  {/* Vendor, Buyer, Invoice Details */}
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
                    <Vendor
                      vendor={invoiceData.vendor}
                      selectedVendor={selectedVendor}
                      onChangeVendor={
                        isPreview
                          ? undefined
                          : () =>
                              setChooseVendorModal({
                                show: true,
                                items: invoiceData.vendor.similarVendors || [],
                              })
                      }
                      onCreateVendor={
                        isPreview
                          ? undefined
                          : () =>
                              setCreateVendorModal({
                                show: true,
                                initialData: invoiceData.vendor,
                              })
                      }
                    />
                    <Buyer
                      buyer={invoiceData.buyer}
                      onUseMyStore={isPreview ? undefined : handleUseMyStore}
                    />
                    <InvoiceDetails
                      invoice={invoiceData.invoice}
                      onEdit={
                        isPreview ? undefined : () => setShowInvoiceModal(true)
                      }
                    />
                  </div>

                  {/* Line Items */}
                  <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:p-4">
                    <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
                      <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                        Line Items
                      </div>
                      <div className="tw:text-xs tw:text-gray-500">
                        {visibleItems.length} item
                        {visibleItems.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    {visibleItems.length === 0 ? (
                      <div className="tw:text-sm tw:text-gray-500 tw:py-6 tw:text-center">
                        No items detected from the invoice.
                      </div>
                    ) : isMobile ? (
                      <MobileView
                        items={visibleItems}
                        onEditItem={handleEditItem}
                        onRemoveItem={isPreview ? undefined : handleRemoveItem}
                        onSelectDeal={isPreview ? undefined : handleSelectDeal}
                      />
                    ) : (
                      <DesktopView
                        items={visibleItems}
                        isPreview={isPreview}
                        onUpdateItem={
                          isPreview ? undefined : handleInlineUpdate
                        }
                        onRemoveItem={isPreview ? undefined : handleRemoveItem}
                        onSelectDeal={isPreview ? undefined : handleSelectDeal}
                      />
                    )}
                  </div>

                  {/* Tax & Totals Summary */}
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
                    <TaxSummary taxSummary={displayedTaxSummary} />
                    <TotalsSummary totals={displayedTotals} />
                  </div>

                  {/* Submit button (non-preview) */}
                  {!isPreview && (
                    <div className="tw:flex tw:justify-end">
                      <AppButton color="primary" onClick={handleInvoiceSubmit}>
                        <Rocket size={16} />
                        Submit Invoice
                      </AppButton>
                    </div>
                  )}

                  {/* Sticky bottom action bar (preview mode) */}
                  {isPreview && (
                    <div className="tw:fixed tw:bottom-0 tw:left-0 tw:right-0 tw:bg-white tw:border-t tw:border-gray-200 tw:shadow-lg tw:p-4 tw:z-50">
                      <div className="tw:flex tw:items-center tw:justify-between">
                        <AppButton
                          fill="outline"
                          color="secondary"
                          onClick={() => setIsPreview(false)}
                        >
                          <ArrowLeft size={16} />
                          Back
                        </AppButton>
                        <AppButton
                          color="primary"
                          onClick={() => setShowConfirmModal(true)}
                        >
                          <Rocket size={16} />
                          Submit
                        </AppButton>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
                </AppPaneMain>

                {/* Side pane — theme-2 desktop only. Hidden in result mode so
                    the scanned invoice review keeps full width, matching the
                    section menu behavior above. */}
                {display !== "result" && (
                  <AppPaneSide className="app-pane-only">
                    <PurchaseOrderSidePane />
                  </AppPaneSide>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppAlertDialog
        show={showNewScanAlert}
        title="Start New Scan?"
        description="All the scanned invoice data including vendor details, line items, and tax information will be lost. This action cannot be undone."
        okText="Yes, Start New Scan"
        cancelText="Cancel"
        onConfirm={() => {
          setShowNewScanAlert(false);
          handleNewScan();
        }}
        onCancel={() => setShowNewScanAlert(false)}
      />

      {/* Modals */}
      {invoiceData && (
        <>
          <EditInvoiceModal
            show={showInvoiceModal}
            invoice={invoiceData.invoice}
            callback={handleInvoiceEdit}
          />
          <EditVendorModal
            show={showVendorModal}
            vendor={invoiceData.vendor}
            callback={handleVendorEdit}
          />
          <EditItemModal
            show={showItemModal}
            item={
              editingItemIndex !== null
                ? invoiceData.items[editingItemIndex]
                : null
            }
            callback={handleItemEdit}
          />
          <ChooseVendorModal
            show={chooseVendorModal.show}
            callback={handleChooseVendorCallback}
            vendors={chooseVendorModal.items}
          />
          <CreateVendorModal
            show={createVendorModal.show}
            callback={handleCreateVendorCallback}
            initialData={createVendorModal.initialData}
          />
          <ChooseDealModal
            show={chooseDealModal.show}
            callback={handleChooseDealCallback}
            hsn={chooseDealModal.hsn}
          />
          <AddProductModal
            show={addProductModal.show}
            data={addProductModal.data}
            callback={handleAddProductCallback}
            title="Create New Product"
            allowImageUpload
          />
          <ConfirmModal
            show={showConfirmModal}
            callback={handleConfirmCallback}
            items={invoiceData.items.filter((i) => !i.selected?.isPending)}
          />
        </>
      )}

      <ImgPreviewModal
        show={imgPreview.show}
        callback={() => setImgPreview({ show: false })}
        images={uploadedFile}
        initialImageId={imgPreview.initialId}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default InvoiceScan;
