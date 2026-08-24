import { sortBy } from "lodash";
import {
  Barcode,
  Layers,
  Package,
  Plus,
  Printer,
  Scan,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { Input } from "~/components/ui/input";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import BarcodePrintHistoryService from "~/services/BarcodePrintHistoryService";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import RackBinService from "~/services/RackBinService";
import SectionTabService from "~/services/SectionTabService";
import SellerCatalogService from "~/services/SellerCatalogService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import BarcodeSidePane from "~/shared/catalog/components/barcode-side-pane/BarcodeSidePane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import AddDealBarcodeModal from "~/shared/catalog/modals/add-deal-barcode/AddDealBarcodeModal";
import DealSearchInput from "~/shared/catalog/components/search-input/deal/DealSearchInput";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import DesktopView, { type GroupedRow } from "./components/DesktopView";
import MobileView from "./components/MobileView";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Inventory",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Barcode Generator" },
];

type SelectedDeal = { id: string; name: string; dealId: string };

const computeExpiryFlags = (expiry: string) => {
  if (!expiry) return { expired: false, expiringSoon: false };
  const d = new Date(expiry).getTime();
  if (Number.isNaN(d)) return { expired: false, expiringSoon: false };
  const now = Date.now();
  if (d < now) return { expired: true, expiringSoon: false };
  const days = (d - now) / (1000 * 60 * 60 * 24);
  return { expired: false, expiringSoon: days <= 30 };
};

const normalizeBarcode = (value: any) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return String(value.barcode || value.value || value.code || "").trim();
};

/** Barcodes configured on the catalog deal itself (no stock/expiry attached) */
const getDealBarcodeRows = (deal: any): GroupedRow[] => {
  const mrp = Number(deal?.mrp) || 0;
  const seen = new Set<string>();
  const rows: GroupedRow[] = [];
  for (const item of deal?.barcodes || []) {
    const barcode = normalizeBarcode(item);
    if (!barcode || seen.has(barcode)) continue;
    seen.add(barcode);
    rows.push({
      key: `deal__${barcode}`,
      mrp,
      expiry: "",
      barcode,
      totalQuantity: 0,
      expired: false,
      expiringSoon: false,
      lowStock: false,
      outOfStock: true,
      source: "deal",
    });
  }
  return rows.sort((a, b) => a.barcode.localeCompare(b.barcode));
};

const groupMasterData = (data: any[]): GroupedRow[] => {
  const grouped: Record<
    string,
    Pick<GroupedRow, "key" | "mrp" | "expiry" | "barcode" | "totalQuantity">
  > = {};
  for (const item of data || []) {
    const mrp = Number(item.mrp) || 0;
    const expiry = item.expiry || "";
    const barcode = normalizeBarcode(item.barcode);
    const key = `${mrp}__${expiry}__${barcode}`;
    if (!grouped[key]) {
      grouped[key] = { key, mrp, expiry, barcode, totalQuantity: 0 };
    }
    grouped[key].totalQuantity += Number(item.quantity) || 0;
  }
  return Object.values(grouped)
    .sort((a, b) => {
      if (a.mrp !== b.mrp) return a.mrp - b.mrp;
      if (a.expiry !== b.expiry) return a.expiry.localeCompare(b.expiry);
      return a.barcode.localeCompare(b.barcode);
    })
    .map((row) => {
      const { expired, expiringSoon } = computeExpiryFlags(row.expiry);
      return {
        ...row,
        expired,
        expiringSoon,
        outOfStock: row.totalQuantity === 0,
        lowStock: row.totalQuantity > 0 && row.totalQuantity < 5,
        source: "master" as const,
      };
    });
};

const PrintBarcodePage = () => {
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("id") || "";
  const queryName = searchParams.get("name") || "";
  const queryDealId = searchParams.get("dealId") || "";

  const toast = useAppToast();
  const { t } = useTranslation(["common", "menu"]);
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const [selectedDeal, setSelectedDeal] = useState<SelectedDeal | null>(
    queryId ? { id: queryId, name: queryName, dealId: queryDealId } : null,
  );
  const [rows, setRows] = useState<GroupedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState<"list" | "card">("list");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [addBarcodeModal, setAddBarcodeModal] = useState(false);
  const appNav = useAppNav();

  const dealValues = useMemo(() => {
    if (!selectedDeal) return [];
    return [
      {
        label: selectedDeal.name,
        value: {
          id: selectedDeal.id,
          name: selectedDeal.name,
          dealId: selectedDeal.dealId,
        },
      },
    ];
  }, [selectedDeal]);

  const filteredRows = useMemo(() => {
    const q = barcodeQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.barcode.toLowerCase().includes(q));
  }, [rows, barcodeQuery]);

  const totalUnits = useMemo(
    () => filteredRows.reduce((sum, r) => sum + (r.totalQuantity || 0), 0),
    [filteredRows],
  );

  const fetchMasterData = useCallback(
    async (dealId: string) => {
      const fid = AuthService.getLoggedInUserId();
      if (!fid || !dealId) return;
      setLoading(true);
      setRows([]);
      setBarcodeQuery("");
      try {
        const [res, dealRes] = await Promise.all([
          RackBinService.getMasterData(fid, {
            filter: { dealId },
            sort: { createdAt: -1 },
          }),
          SellerCatalogService.getProducts(
            { filter: { dealId }, showAllDeals: true },
            { showOutOfStock: true },
          ),
        ]);
        const data = (res?.data?.data || []).filter((item: any) =>
          Boolean(item?.barcode),
        );
        const sorted = sortBy(data, (item) => item?.barcode || "");
        const masterRows = groupMasterData(sorted);

        const deal = SellerCatalogService.formatProductResponse(
          dealRes?.data?.data || [],
        )[0];
        const masterBarcodes = new Set(masterRows.map((row) => row.barcode));
        // Master data barcodes win — only surface deal barcodes not already in stock
        const dealRows = getDealBarcodeRows(deal).filter(
          (row) => !masterBarcodes.has(row.barcode),
        );

        setRows([...masterRows, ...dealRows]);
      } catch (e: any) {
        toast.show({
          msg: e?.message || "Failed to fetch master data",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (queryId) fetchMasterData(queryId);
  }, [queryId, fetchMasterData]);

  const handleDealSelect = (item: any, action: "add" | "remove") => {
    if (action === "remove") {
      setSelectedDeal(null);
      setRows([]);
      setBarcodeQuery("");
      return;
    }
    const v = item?.value || {};
    if (!v?.id) return;
    setSelectedDeal({
      id: v.id,
      name: v.name || item?.label || "",
      dealId: v.dealId || "",
    });
    fetchMasterData(v.id);
  };

  const printRow = (row: GroupedRow) => {
    if (!selectedDeal?.id) return;
    const params = new URLSearchParams({
      id: selectedDeal.id,
      refId: selectedDeal.dealId,
      name: selectedDeal.name || "",
      barcode: row.barcode || "",
      mrp: String(row.mrp ?? ""),
      expiry: row.expiry || "",
    });
    appNav.to(
      `/dashboard/inventory/print-barcode/generator?${params.toString()}`,
    );
  };

  return (
    <>
      <AppHeader
        title="Barcode Generator"
        sectionKey="catalog"
        activeTab="barcode-generator"
        mobileLead="menu"
      />
      <div className="page-bg app-page page-padding barcode-gen-page">
        {/* Sub-nav for the two barcode surfaces — the shared tab data lives
            in SectionTabService so both pages strip from one source. Mobile
            only (see theme-2.css); on desktop the side pane carries it. */}
        <SectionTabs
          tabs={SectionTabService.getBarcodeTabs()}
          activeTab="single"
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
                {!isTheme2 && <AppBreadcrumbs data={breadcrumbs} />}

                <div className="barcode-gen-hero tw:relative tw:mb-4 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-primary/20 tw:bg-linear-to-br tw:from-primary/10 tw:via-white tw:to-primary/5 tw:px-5 tw:py-5 tw:shadow-sm">
                  <div className="barcode-gen-hero-glow tw:absolute tw:-right-12 tw:-top-12 tw:h-40 tw:w-40 tw:rounded-full tw:bg-primary/10 tw:blur-3xl tw:pointer-events-none" />
                  <div className="barcode-gen-hero-glow tw:absolute tw:-bottom-16 tw:left-1/3 tw:h-32 tw:w-32 tw:rounded-full tw:bg-primary/10 tw:blur-3xl tw:pointer-events-none" />
                  <div className="tw:relative tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between">
                    <div className="tw:flex tw:items-center tw:gap-4 tw:min-w-0">
                      <div className="tw:relative tw:inline-flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary tw:text-white tw:shadow-md tw:shadow-primary/30">
                        <Printer size={20} />
                        <span className="tw:absolute tw:-right-1 tw:-bottom-1 tw:inline-flex tw:h-5 tw:w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-primary tw:shadow-sm tw:border tw:border-primary/20">
                          <Barcode size={11} />
                        </span>
                      </div>
                      <div className="tw:min-w-0">
                        <h1 className="tw:text-base tw:font-semibold tw:text-slate-900 tw:md:text-lg tw:leading-tight">
                          Barcode Generator
                        </h1>
                        <p className="tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-600 tw:md:text-sm">
                          Find a product, generate barcodes for its stock
                          batches, and print labels.
                        </p>
                      </div>
                    </div>
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:text-xs">
                      {[
                        { label: "Find", icon: Search },
                        { label: "Generate", icon: Barcode },
                        { label: "Print", icon: Printer },
                      ].map((step, index, arr) => {
                        const Icon = step.icon;
                        return (
                          <div
                            key={step.label}
                            className="tw:flex tw:items-center tw:gap-2"
                          >
                            <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-white tw:border tw:border-primary/20 tw:px-3 tw:py-1.5 tw:font-semibold tw:text-slate-700 tw:shadow-sm">
                              <span className="tw:inline-flex tw:h-5 tw:w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
                                <Icon size={11} />
                              </span>
                              {step.label}
                            </span>
                            {index < arr.length - 1 && (
                              <span className="tw:text-primary/40">→</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {!selectedDeal ? (
                  <>
                    <AppCard
                      className="tw:mb-4 tw:border-slate-200 tw:bg-white"
                      bodyClassName="tw:p-4"
                    >
                      <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center">
                        <div className="tw:flex tw:items-center tw:gap-2.5 tw:min-w-0 tw:md:w-56 tw:md:shrink-0">
                          <div className="tw:inline-flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
                            <Search size={15} />
                          </div>
                          <div className="tw:min-w-0">
                            <div className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:leading-tight">
                              Find a product
                            </div>
                            <p className="tw:text-[11px] tw:text-slate-500 tw:leading-snug">
                              Search by name, code or barcode
                            </p>
                          </div>
                        </div>

                        <div className="tw:flex tw:flex-1 tw:items-stretch tw:gap-2">
                          <div className="tw:flex-1 tw:min-w-0">
                            <DealSearchInput
                              feature="pos"
                              placeholder="Search by name, barcode or ID…"
                              values={dealValues}
                              callback={handleDealSelect}
                            />
                          </div>
                          {MiscService.getCordova() && (
                            <button
                              type="button"
                              onClick={() => {
                                // TODO: Wire up barcode scanner integration
                                console.log("Scan barcode clicked");
                              }}
                              className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-md tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:text-sm tw:font-semibold tw:text-slate-700 tw:transition tw:hover:border-primary/40 tw:hover:bg-primary/5 tw:hover:text-primary"
                              title="Scan barcode"
                            >
                              <Scan size={15} />
                              <span className="tw:hidden tw:sm:inline">
                                Scan
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </AppCard>

                    <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:py-12 tw:px-6 tw:text-center">
                      <div className="tw:inline-flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-primary/10 tw:mb-3">
                        <Package size={22} className="tw:text-primary" />
                      </div>
                      <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                        Pick a product to begin
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                        Once selected, its stock batches appear here — print
                        labels in one click.
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="tw:mb-4 tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3">
                    <div className="tw:inline-flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
                      <Package size={18} />
                    </div>
                    <div className="tw:min-w-0 tw:flex-1">
                      <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
                        Selected product
                      </div>
                      <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900 tw:leading-snug">
                        {selectedDeal.name || "—"}
                      </div>
                      {selectedDeal.dealId && (
                        <div className="tw:text-[11px] tw:font-mono tw:text-slate-500 tw:truncate">
                          {selectedDeal.dealId}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDealSelect(null, "remove")}
                      className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-slate-600 tw:transition tw:hover:border-slate-300 tw:hover:bg-slate-50 tw:hover:text-slate-900"
                      title="Change product"
                    >
                      <X size={14} />
                      <span className="tw:hidden tw:sm:inline">Change</span>
                    </button>
                  </div>
                )}

                {/* Stock records */}
                {selectedDeal && (
                  <>
                    <div className="tw:mb-3 tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-dashed tw:border-slate-300 tw:bg-linear-to-r tw:from-slate-50 tw:to-white tw:px-4 tw:py-3">
                      <div className="tw:inline-flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:text-primary tw:ring-1 tw:ring-slate-200 tw:shadow-sm">
                        <Barcode size={18} />
                      </div>
                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:text-xs tw:md:text-sm tw:font-semibold tw:text-slate-900">
                          Don't see the barcode you need?
                        </div>
                        <div className="tw:mt-0.5 tw:text-[11px] tw:md:text-xs tw:text-slate-500 tw:leading-snug">
                          Generate a custom barcode with your own MRP &amp;
                          expiry.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddBarcodeModal(true)}
                        className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-primary tw:text-white tw:px-3.5 tw:py-2 tw:text-xs tw:font-semibold tw:shadow-sm tw:transition tw:hover:brightness-110 tw:active:brightness-95"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span className="tw:hidden tw:sm:inline">Generate</span>
                      </button>
                    </div>

                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-3 tw:flex-wrap">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                        <Layers size={16} className="tw:text-gray-700" />
                        <span className="tw:font-semibold">
                          Barcodes in stock
                        </span>
                        {!loading && rows.length > 0 && (
                          <>
                            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-gray-600 tw:bg-gray-100 tw:rounded-full tw:px-2 tw:py-0.5">
                              {filteredRows.length}{" "}
                              {filteredRows.length === 1
                                ? "barcode"
                                : "barcodes"}
                            </span>
                            {totalUnits > 0 && (
                              <span className="tw:text-xs tw:text-gray-500">
                                · {totalUnits} units in stock
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-2 tw:w-full tw:md:w-auto">
                        {rows.length > 0 && (
                          <div className="tw:relative tw:w-full tw:md:w-48">
                            <Search
                              size={14}
                              className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400 tw:pointer-events-none"
                            />
                            <Input
                              type="text"
                              value={barcodeQuery}
                              onChange={(e) => setBarcodeQuery(e.target.value)}
                              placeholder="Search barcode"
                              className="tw:h-8 tw:pl-7 tw:w-full tw:text-sm"
                            />
                          </div>
                        )}
                        <div className="tw:hidden tw:md:block">
                          <ViewToggle
                            viewType={viewType}
                            callback={setViewType}
                            hideInMobile={false}
                          />
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <AppCard
                        noPadding
                        className="tw:border-slate-200 tw:bg-white"
                      >
                        <div className="tw:py-14 tw:flex tw:flex-col tw:items-center tw:justify-center">
                          <AppSpinner size="lg" />
                          <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
                            Loading barcodes…
                          </div>
                        </div>
                      </AppCard>
                    ) : rows.length === 0 ? (
                      <AppCard
                        noPadding
                        className="tw:border-slate-200 tw:bg-white"
                      >
                        <div className="tw:py-14 tw:px-6 tw:text-center">
                          <div className="tw:inline-flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-gray-100 tw:mb-3">
                            <Barcode size={22} className="tw:text-gray-400" />
                          </div>
                          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                            No barcodes in stock
                          </div>
                          <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                            This product has no stock entries yet.
                          </div>
                        </div>
                      </AppCard>
                    ) : filteredRows.length === 0 ? (
                      <AppCard
                        noPadding
                        className="tw:border-slate-200 tw:bg-white"
                      >
                        <div className="tw:py-14 tw:px-6 tw:text-center">
                          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                            No barcodes match “{barcodeQuery}”
                          </div>
                          <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                            Try a different search term.
                          </div>
                        </div>
                      </AppCard>
                    ) : (
                      <>
                        <div className="tw:md:hidden">
                          <MobileView rows={filteredRows} onPrint={printRow} />
                        </div>
                        <div className="tw:hidden tw:md:block">
                          {viewType === "list" ? (
                            <AppCard noPadding>
                              <DesktopView
                                rows={filteredRows}
                                onPrint={printRow}
                              />
                            </AppCard>
                          ) : (
                            <MobileView
                              rows={filteredRows}
                              onPrint={printRow}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <BarcodeSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <AddDealBarcodeModal
        show={addBarcodeModal}
        dealId={selectedDeal?.id || ""}
        callback={({ action, data }: any) => {
          setAddBarcodeModal(false);
          if (action === "submit" && selectedDeal?.id) {
            // Logged locally so the side pane can count this month's minted
            // codes — the API keeps no such history. One session can add
            // several codes, so each one is its own entry.
            const minted: string[] = data?.addedBarcodes || [];
            for (const barcode of minted) {
              BarcodePrintHistoryService.recordMint({
                id: selectedDeal.id,
                refId: selectedDeal.dealId,
                name: selectedDeal.name,
                barcode,
              });
            }
            fetchMasterData(selectedDeal.id);
          }
        }}
      />
    </>
  );
};

export default PrintBarcodePage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Barcode Generator"),
    },
  ];
}
