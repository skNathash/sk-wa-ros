import { Barcode, Boxes, Layers, Package, Printer, Tag, X } from "lucide-react";
import { useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import StorageService from "~/services/StorageService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import {
  PRINT_BARCODE_BULK_STORAGE_KEY,
  PRINT_BARCODE_MAX_BULK_ITEMS,
} from "~/constants";
import { type BulkBarcodeItem } from "../generator/helper";
import BarcodeTabs from "../components/BarcodeTabs";
import Products, {
  type ProductsCallbackPayload,
} from "./components/products/Products";
import type { BulkProductItem } from "./components/products/helper";

type SourceType = "brand" | "category";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Inventory",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  {
    label: "Barcode Generator",
    redirect: { path: "/dashboard/inventory/print-barcode" },
  },
  { label: "Bulk" },
];

type SelectedSource = { type: SourceType; id: string; name: string };

const BulkPrintBarcodePage = () => {
  const toast = useAppToast();
  const appNav = useAppNav();

  const [sourceType, setSourceType] = useState<SourceType>("brand");
  const [source, setSource] = useState<SelectedSource | null>(null);

  const [selectedData, setSelectedData] = useState<BulkProductItem[]>([]);

  const selectedCount = selectedData.length;
  const capReached = selectedCount >= PRINT_BARCODE_MAX_BULK_ITEMS;

  const sourceValues = source
    ? [{ label: source.name, value: { id: source.id, name: source.name } }]
    : [];

  const handleSourceSelect = (item: any, action: "add" | "remove") => {
    if (action === "remove") {
      setSource(null);
      return;
    }
    const v = item?.value || {};
    if (!v?.id) return;
    setSource({
      type: sourceType,
      id: v.id,
      name: v.name || item?.label || "",
    });
  };

  const handleSourceTypeChange = (type: SourceType) => {
    if (type === sourceType) return;
    setSourceType(type);
    setSource(null);
  };

  const handleProductsCallback = ({
    action,
    data,
  }: ProductsCallbackPayload) => {
    setSelectedData((prev) => {
      if (action === "deselect") {
        return prev.filter((p) => p.id !== data.id);
      }
      if (action === "barcode" || action === "quantity") {
        // Update the chosen barcode / copies for an already-selected product;
        // if it isn't selected yet, select it carrying the chosen values.
        if (prev.some((p) => p.id === data.id)) {
          return prev.map((p) =>
            p.id === data.id
              ? {
                  ...p,
                  ...(action === "barcode"
                    ? {
                        selectedBarcode:
                          data.selectedBarcode ?? p.selectedBarcode,
                      }
                    : { quantity: data.quantity ?? null }),
                }
              : p,
          );
        }
        if (prev.length >= PRINT_BARCODE_MAX_BULK_ITEMS) {
          toast.show({
            msg: `You can select at most ${PRINT_BARCODE_MAX_BULK_ITEMS} products at a time.`,
            color: "warning",
          });
          return prev;
        }
        return [
          ...prev,
          {
            ...data,
            selectedBarcode: data.selectedBarcode || data.barcodes[0] || "",
            quantity: data.quantity ?? 1,
          },
        ];
      }
      if (prev.some((p) => p.id === data.id)) return prev;
      if (prev.length >= PRINT_BARCODE_MAX_BULK_ITEMS) {
        toast.show({
          msg: `You can select at most ${PRINT_BARCODE_MAX_BULK_ITEMS} products at a time.`,
          color: "warning",
        });
        return prev;
      }
      return [
        ...prev,
        {
          ...data,
          selectedBarcode: data.selectedBarcode || data.barcodes[0] || "",
          quantity: 1,
        },
      ];
    });
  };

  const handleSubmit = () => {
    // First ticked product that had its print quantity cleared.
    const missingQty = selectedData.find((p) => p.quantity == null);
    if (missingQty) {
      toast.show({
        msg: `Enter the number of prints for "${missingQty.name || missingQty.refId}".`,
        color: "warning",
      });
      return;
    }

    const items: BulkBarcodeItem[] = selectedData
      .map((p) => {
        const barcode = p.selectedBarcode || p.barcodes[0] || "";
        if (!barcode) return null;
        return {
          id: p.id,
          refId: p.refId,
          name: p.name,
          barcode,
          mrp: p.mrp,
          expiry: "",
          quantity: Math.max(Number(p.quantity) || 1, 1),
        } as BulkBarcodeItem;
      })
      .filter((x): x is BulkBarcodeItem => Boolean(x));

    if (items.length === 0) {
      toast.show({
        msg: "Select at least one product with a barcode.",
        color: "warning",
      });
      return;
    }

    StorageService.set(PRINT_BARCODE_BULK_STORAGE_KEY, items);
    appNav.to("/dashboard/inventory/print-barcode/generator?bulk=1");
  };

  return (
    <>
      <AppHeader title="Bulk Barcode Print" />
      <div
        className={`page-bg app-page tw:p-4 ${
          selectedCount > 0 ? "has-footer" : ""
        }`}
      >
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          <BarcodeTabs active="bulk" className="tw:mb-4" />

          {/* Hero */}
          <div className="tw:relative tw:mb-4 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-linear-to-br tw:from-primary/10 tw:via-white tw:to-primary/5 tw:px-5 tw:py-5 tw:shadow-sm">
            <div className="tw:absolute tw:-right-12 tw:-top-12 tw:h-40 tw:w-40 tw:rounded-full tw:bg-primary/10 tw:blur-3xl tw:pointer-events-none" />
            <div className="tw:relative tw:flex tw:items-center tw:gap-4">
              <div className="tw:relative tw:inline-flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary tw:text-white tw:shadow-md tw:shadow-primary/30">
                <Boxes size={20} />
                <span className="tw:absolute tw:-right-1 tw:-bottom-1 tw:inline-flex tw:h-5 tw:w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-primary tw:shadow-sm tw:border tw:border-primary/20">
                  <Barcode size={11} />
                </span>
              </div>
              <div className="tw:min-w-0">
                <h1 className="tw:text-base tw:font-semibold tw:text-slate-900 tw:md:text-lg tw:leading-tight">
                  Bulk Barcode Print
                </h1>
                <p className="tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-600 tw:md:text-sm">
                  Pick a brand or category, select up to{" "}
                  {PRINT_BARCODE_MAX_BULK_ITEMS} products, and print them in one
                  sheet.
                </p>
              </div>
            </div>
          </div>

          {/* Source picker */}
          <AppCard
            className="tw:mb-4 tw:border-slate-200 tw:bg-white"
            bodyClassName="tw:px-4 tw:py-0"
          >
            <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center">
              {/* By Brand / By Category toggle */}
              <div className="tw:inline-flex tw:shrink-0 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-0.5">
                {(
                  [
                    { key: "brand", label: "By Brand", icon: Tag },
                    { key: "category", label: "By Category", icon: Layers },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = sourceType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSourceTypeChange(opt.key)}
                      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-md tw:px-3 tw:py-1.5 tw:text-sm tw:font-semibold tw:transition ${
                        active
                          ? "tw:bg-white tw:text-primary tw:shadow-sm"
                          : "tw:text-slate-500 tw:hover:text-slate-700"
                      }`}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="tw:flex-1 tw:min-w-0">
                {sourceType === "brand" ? (
                  <BrandSearchInput
                    key="brand"
                    feature="pos"
                    placeholder="Search brand…"
                    values={sourceValues}
                    callback={handleSourceSelect}
                  />
                ) : (
                  <CategorySearchInput
                    key="category"
                    feature="pos"
                    placeholder="Search category…"
                    values={sourceValues}
                    callback={handleSourceSelect}
                  />
                )}
              </div>
            </div>
          </AppCard>

          {!source ? (
            <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:py-12 tw:px-6 tw:text-center">
              <div className="tw:inline-flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-primary/10 tw:mb-3">
                <Package size={22} className="tw:text-primary" />
              </div>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                Pick a {sourceType} to begin
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                Its products will appear here — select the ones to print.
              </div>
            </div>
          ) : (
            <div>
              <Products
                key={`${source.type}:${source.id}`}
                brandId={source.type === "brand" ? source.id : undefined}
                categoryId={source.type === "category" ? source.id : undefined}
                selectedData={selectedData}
                callback={handleProductsCallback}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit bar */}
      {selectedCount > 0 && (
        <div className="app-footer">
          <div className="app-container tw:flex tw:items-center tw:justify-between tw:gap-2 tw:sm:gap-3">
            <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:text-sm">
              <span className="tw:inline-flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
                <Barcode size={16} />
              </span>
              <span className="tw:min-w-0 tw:truncate">
                <span className="tw:font-semibold tw:text-slate-900">
                  {selectedCount}
                </span>{" "}
                <span className="tw:text-slate-500">
                  selected
                  {capReached ? " (max)" : ""}
                </span>
              </span>
            </div>
            <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
              <AppButton
                fill="outline"
                color="light"
                onClick={() => setSelectedData([])}
                className="tw:gap-1.5"
              >
                <X size={14} />
                <span className="tw:hidden tw:sm:inline">Clear</span>
              </AppButton>
              <AppButton onClick={handleSubmit} className="tw:gap-2">
                <Printer size={16} />
                Preview &amp; Print
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkPrintBarcodePage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Bulk Barcode Print"),
    },
  ];
}
