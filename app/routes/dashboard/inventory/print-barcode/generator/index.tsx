import { useDebouncedCallback } from "use-debounce";
import { CircleAlert, Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import SellerCatalogService from "~/services/SellerCatalogService";
import StorageService from "~/services/StorageService";
import BarcodeSidePane from "~/shared/catalog/components/barcode-side-pane/BarcodeSidePane";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import ProductInfoCard, {
  type ProductInfo,
} from "./components/ProductInfoCard";
import PrintSettingsForm, {
  type PrintSettingsValue,
} from "./components/PrintSettingsForm";
import { sizeOptionsMap } from "~/services/PrintBarcodeService";
import BarcodePrintHistoryService from "~/services/BarcodePrintHistoryService";
import { PRINT_BARCODE_BULK_STORAGE_KEY } from "~/constants";
import { buildPayload, type BulkBarcodeItem } from "./helper";
import BulkSummary from "./components/BulkSummary";

type BarcodeFormState = Omit<ProductInfo, "quantity"> & PrintSettingsValue;

type BarcodePreviewState = BarcodeFormState;

type PreviewState = {
  loading: boolean;
  error: string;
  html: string;
  url: string;
  downloadUrl: string;
  fileName: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Inventory",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  {
    label: "Barcode Generator",
    redirect: { path: "/dashboard/inventory/print-barcode" },
  },
  { label: "Generate" },
];

// In bulk mode the user arrives from the Bulk Print page, so point the
// "Barcode Generator" crumb there instead of the single-product deal page.
const bulkBreadcrumbs: BreadcrumbItem[] = [
  ...breadcrumbs.slice(0, 2),
  {
    label: "Barcode Generator",
    redirect: { path: "/dashboard/inventory/print-barcode/bulk" },
  },
  { label: "Bulk Print" },
];

const STORAGE_KEY = "print-barcode-prefs";

type StoredPrefs = {
  printType?: string;
  size?: string;
  template?: string;
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-INVENTORY"]);
}

/** Adapts the single-product form state into a one-item bulk list. */
const toSingleItem = (values: BarcodeFormState): BulkBarcodeItem => ({
  id: values.id,
  refId: values.refId,
  name: values.name,
  barcode: values.barcode,
  mrp: Number(values.mrp) || 0,
  expiry: values.expiry || "",
  quantity: Number(values.quantity) || 1,
});

const BarcodeGeneratorPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const bulkMode = searchParams.get("bulk") === "1";

  const [bulkItems, setBulkItems] = useState<BulkBarcodeItem[]>(() =>
    bulkMode
      ? StorageService.get<BulkBarcodeItem[]>(PRINT_BARCODE_BULK_STORAGE_KEY) ||
        []
      : [],
  );

  const handleRemoveBulkItem = useCallback((target: BulkBarcodeItem) => {
    setBulkItems((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(
        (it) => !(it.id === target.id && it.barcode === target.barcode),
      );
      StorageService.set(PRINT_BARCODE_BULK_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const productInfo = useMemo<ProductInfo>(
    () => ({
      name: searchParams.get("name") || "",
      id: searchParams.get("id") || "",
      refId: searchParams.get("refId") || "",
      barcode: searchParams.get("barcode") || "",
      mrp: searchParams.get("mrp") || "",
      expiry: searchParams.get("expiry") || "",
      quantity: searchParams.get("quantity") || "1",
    }),
    [searchParams],
  );

  const initialPrintSettings = useMemo<PrintSettingsValue>(() => {
    const saved = StorageService.get<StoredPrefs>(STORAGE_KEY);
    const printType =
      saved?.printType && sizeOptionsMap[saved.printType]
        ? saved.printType
        : "1ups";
    const size =
      saved?.size &&
      sizeOptionsMap[printType]?.some((o) => o.value === saved.size)
        ? saved.size
        : sizeOptionsMap[printType][0].value;

    return {
      printType,
      size,
      template: saved?.template === "retail" ? "retail" : "full",
      priceType: "B2C",
      quantity: Number(productInfo.quantity) || 1,
    };
  }, [productInfo.quantity]);

  const methods = useForm<PrintSettingsValue>({
    defaultValues: initialPrintSettings,
  });

  const [preview, setPreview] = useState<PreviewState>({
    loading: false,
    error: "",
    html: "",
    url: "",
    downloadUrl: "",
    fileName: "",
  });
  const requestSeq = useRef(0);
  // The preview endpoint only returns inline HTML, so remember the payload that
  // produced the current preview to fetch the actual PDF on download.
  const previewPayloadRef = useRef<Record<string, any> | null>(null);
  // The payload carries ids and copies but no product names, so keep the items
  // that produced it too — the print log reads back as a list of names.
  const previewItemsRef = useRef<BulkBarcodeItem[]>([]);
  const [downloading, setDownloading] = useState(false);

  const hasRequiredFields = useMemo(
    () =>
      bulkMode
        ? bulkItems.length > 0
        : Boolean(
            productInfo.name.trim() &&
            productInfo.id.trim() &&
            productInfo.barcode.trim(),
          ),
    [
      bulkMode,
      bulkItems.length,
      productInfo.barcode,
      productInfo.id,
      productInfo.name,
    ],
  );

  const fetchPreview = useCallback(
    async (values: BarcodePreviewState) => {
      if (bulkMode) {
        if (bulkItems.length === 0) {
          setPreview({
            loading: false,
            error: "No products selected for bulk printing.",
            html: "",
            url: "",
            downloadUrl: "",
            fileName: "",
          });
          return;
        }
      } else if (
        !values.name.trim() ||
        !values.id.trim() ||
        !values.barcode.trim()
      ) {
        setPreview({
          loading: false,
          error: "Fill name, id and barcode to see the live preview.",
          html: "",
          url: "",
          downloadUrl: "",
          fileName: "",
        });
        return;
      }

      const seq = ++requestSeq.current;
      setPreview((prev) => ({ ...prev, loading: true, error: "" }));

      try {
        const items = bulkMode ? bulkItems : [toSingleItem(values)];
        const payload = buildPayload(values, items);
        const resp = await SellerCatalogService.barcodePrintPreview(payload);
        if (seq !== requestSeq.current) return;

        if (resp?.statusCode === 200) {
          const result = resp.data?.data;
          // viewUrl renders inline; downloadUrl forces the browser to save the file.
          const previewUrl: string | undefined = result?.viewUrl;
          const downloadUrl: string = result?.downloadUrl
            ? SellerCatalogService.barcodeAbsoluteUrl(result.downloadUrl)
            : "";
          const fileName: string = result?.fileName || "";
          const html: string | undefined =
            typeof resp.data === "string" ? resp.data : resp.data?.html;

          if (previewUrl) {
            previewPayloadRef.current = payload;
            previewItemsRef.current = items;
            setPreview({
              loading: false,
              error: "",
              html: "",
              url: SellerCatalogService.barcodeAbsoluteUrl(previewUrl),
              downloadUrl,
              fileName,
            });
            return;
          }

          if (html) {
            previewPayloadRef.current = payload;
            previewItemsRef.current = items;
            setPreview({
              loading: false,
              error: "",
              html,
              url: "",
              downloadUrl,
              fileName,
            });
            return;
          }

          previewPayloadRef.current = null;
          previewItemsRef.current = [];

          setPreview({
            loading: false,
            error: "Preview is not available for the current barcode.",
            html: "",
            url: "",
            downloadUrl: "",
            fileName: "",
          });
          return;
        }

        setPreview({
          loading: false,
          error: resp?.data?.message || "Failed to generate preview.",
          html: "",
          url: "",
          downloadUrl: "",
          fileName: "",
        });
      } catch (error: unknown) {
        if (seq !== requestSeq.current) return;
        setPreview({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate preview.",
          html: "",
          url: "",
          downloadUrl: "",
          fileName: "",
        });
      }
    },
    [bulkMode, bulkItems],
  );

  const handleDownload = useCallback(async () => {
    const payload = previewPayloadRef.current;
    if (!payload || downloading) return;

    setDownloading(true);
    try {
      // The preview endpoint only renders inline HTML, so ask the print
      // endpoint for the real PDF and open its download URL (mirrors
      // PrintBarcodeModal, where this reliably downloads the file).
      const resp = await SellerCatalogService.barcodePrint(payload);
      const downloadUrl: string | undefined = resp?.data?.data?.downloadUrl;
      if (resp?.statusCode === 200 && downloadUrl) {
        CommonService.windowOpenHandler(
          SellerCatalogService.barcodeAbsoluteUrl(downloadUrl),
          () => {},
        );
        // The print endpoints keep no history, so log the sheet locally — the
        // generator's side pane reads the month's totals back out of it.
        BarcodePrintHistoryService.recordPrint(
          previewItemsRef.current,
          payload.size || "",
        );
      }
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  const debouncedPreview = useDebouncedCallback(
    (values: BarcodePreviewState) => {
      fetchPreview(values);
    },
    450,
  );

  const schedulePreview = useCallback(
    (values: BarcodePreviewState) => {
      if (
        !bulkMode &&
        (!values.name.trim() || !values.id.trim() || !values.barcode.trim())
      ) {
        debouncedPreview.cancel();
        setPreview({
          loading: false,
          error: "Fill name, id and barcode to see the live preview.",
          html: "",
          url: "",
          downloadUrl: "",
          fileName: "",
        });
        return;
      }

      debouncedPreview(values);
    },
    [bulkMode, debouncedPreview],
  );

  useEffect(() => {
    schedulePreview({ ...productInfo, ...methods.getValues() });
    return () => debouncedPreview.cancel();
  }, [debouncedPreview, methods, productInfo, schedulePreview]);

  return (
    <>
      <AppHeader title="Barcode Generator" />
      <div className="page-bg app-page page-padding barcode-gen-page">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs
          sectionKey="catalog"
          activeTab="barcode-generator"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="barcode-generator"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid; the side pane only exists in
                  theme-2 desktop, where the CSS lifts it out into the fixed
                  list pane (see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* The theme-2 pane header carries this context instead. */}
                {!isTheme2 && (
                  <AppBreadcrumbs
                    data={bulkMode ? bulkBreadcrumbs : breadcrumbs}
                    className="tw:mb-4"
                  />
                )}

                <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] tw:xl:items-start tw:xl:gap-6">
                  <AppCard
                    className="tw:xl:sticky tw:xl:top-4 tw:xl:self-start tw:border-slate-200 tw:bg-white"
                    noPadding
                    noShadow
                    bodyClassName="tw:p-4"
                  >
                    <div className="tw:space-y-3">
                      {bulkMode ? (
                        <BulkSummary
                          items={bulkItems}
                          onRemove={handleRemoveBulkItem}
                        />
                      ) : (
                        <ProductInfoCard productInfo={productInfo} />
                      )}

                      <FormProvider {...methods}>
                        <PrintSettingsForm
                          className="tw:space-y-0"
                          compact
                          hideQuantity={bulkMode}
                          callback={({ action, data }) => {
                            if (action === "change" && data) {
                              schedulePreview({ ...productInfo, ...data });
                            }
                          }}
                        />
                      </FormProvider>
                    </div>
                  </AppCard>

                  <div>
                    {!hasRequiredFields ? (
                      <div className="tw:flex tw:min-h-[640px] tw:flex-col tw:items-center tw:justify-center tw:rounded-[28px] tw:bg-slate-50 tw:px-6 tw:text-center">
                        <div className="tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-rose-50 tw:p-3 tw:text-rose-600">
                          <CircleAlert size={22} />
                        </div>
                        <div className="tw:mt-4 tw:text-sm tw:font-semibold tw:text-slate-900">
                          Preview is waiting for the required fields
                        </div>
                        <div className="tw:mt-1 tw:max-w-md tw:text-xs tw:leading-5 tw:text-slate-500">
                          Add the name, id and barcode above. The canvas will
                          update automatically once they are present.
                        </div>
                      </div>
                    ) : preview.error ? (
                      <div className="tw:flex tw:min-h-[640px] tw:flex-col tw:items-center tw:justify-center tw:rounded-[28px] tw:bg-slate-50 tw:px-6 tw:text-center">
                        <div className="tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-rose-50 tw:p-3 tw:text-rose-600">
                          <CircleAlert size={22} />
                        </div>
                        <div className="tw:mt-4 tw:text-sm tw:font-semibold tw:text-slate-900">
                          Preview unavailable
                        </div>
                        <div className="tw:mt-1 tw:max-w-md tw:text-xs tw:leading-5 tw:text-slate-500">
                          {preview.error}
                        </div>
                      </div>
                    ) : preview.loading ? (
                      <div className="tw:flex tw:min-h-[640px] tw:flex-col tw:items-center tw:justify-center tw:rounded-[28px] tw:bg-slate-50 tw:px-6">
                        <AppSpinner size="lg" />
                        <div className="tw:mt-3 tw:text-sm tw:text-slate-500">
                          Generating preview...
                        </div>
                      </div>
                    ) : (
                      <>
                        {(preview.url || preview.html) && (
                          <div className="tw:mb-3 tw:flex tw:justify-end">
                            <AppButton
                              size="small"
                              color="primary"
                              onClick={handleDownload}
                              disabled={downloading}
                              className="tw:gap-2"
                            >
                              <Download size={14} />
                              {downloading ? "Preparing..." : "Download PDF"}
                            </AppButton>
                          </div>
                        )}
                        {/* Direct preview canvas: zoom plugin wraps the iframe without extra stage chrome. */}
                        <TransformWrapper
                          initialScale={1}
                          minScale={1}
                          maxScale={5}
                          centerOnInit
                          doubleClick={{ mode: "toggle" }}
                        >
                          <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentStyle={{ width: "100%", height: "100%" }}
                          >
                            <iframe
                              title="Barcode preview"
                              src={preview.url || undefined}
                              srcDoc={preview.html || undefined}
                              sandbox="allow-scripts allow-modals"
                              className="tw:block tw:h-[72vh] tw:min-h-[640px] tw:w-full tw:rounded-[28px] tw:border tw:border-slate-200 tw:bg-white"
                            />
                          </TransformComponent>
                        </TransformWrapper>
                      </>
                    )}
                  </div>
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <BarcodeSidePane
                  queued={
                    bulkMode
                      ? {
                          count: bulkItems.length,
                          title: `${bulkItems.length} on this sheet`,
                          hint: "Ready to print",
                        }
                      : undefined
                  }
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BarcodeGeneratorPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Barcode Generator"),
    },
  ];
}
