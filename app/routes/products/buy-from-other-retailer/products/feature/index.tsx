import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { useSidebar } from "~/components/ui/sidebar";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import CommonService from "~/services/CommonService";
import ProductSlabModal from "~/shared/catalog/modals/product-slab/ProductSlabModal";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { PaginationState } from "~/types/CommonTypes";
import CatalogOverview, {
  useCatalogOverviewCounts,
} from "~/shared/catalog/components/supply-catalog-pane/CatalogOverview";
import SupplyCatalogPane from "~/shared/catalog/components/supply-catalog-pane/SupplyCatalogPane";
import SupplyCatalogSectionTabs from "~/shared/catalog/components/supply-catalog-section-tabs/SupplyCatalogSectionTabs";
import CatalogSearchBar from "../components/CatalogSearchBar";
import Footer from "../components/Footer";
import FeatureRows from "./components/FeatureRows";
import {
  defaultFilter,
  type FilterFormData,
  getCount,
  getData,
  getFeatureItem,
  getFirstSeller,
  prepareParams,
} from "./helper";

const FeatureList = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { setOpen } = useSidebar();

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  const [searchParams] = useSearchParams();

  // Data-point key from the tapped CatalogOverview tile.
  const featureKey = searchParams.get("key") || "fast-movers";
  const featureItem = getFeatureItem(featureKey);
  const pageTitle = featureItem?.title || "Catalog";
  // Compare tab lands here with `from=compare` — keep that tab active and
  // skip the per-feature title/subtitle (tabs already convey context).
  const fromCompare = searchParams.get("from") === "compare";

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [priceSlabModal, setPriceSlabModal] = useState<{
    show: boolean;
    dealId: string;
    sellerId: string;
  }>({ show: false, dealId: "", sellerId: "" });

  const [sellersModal, setSellersModal] = useState<{
    show: boolean;
    dealId: string;
  }>({ show: false, dealId: "" });

  const distance =
    searchParams.get("distance") || String(DEFAULT_BROWSE_DISTANCE);

  // Counts shared by the desktop side-pane list and the mobile tab bar.
  const { counts, countsLoading } = useCatalogOverviewCounts(distance);

  // Brand / category ids arrive as query params from the browse pages that
  // deep-link into this feed; the page itself no longer renders a facet rail.
  const selectedBrandIdsParam = searchParams.get("selectedBrandIds") || "";
  const selectedCatIdsParam = searchParams.get("selectedCatIds") || "";
  const selectedBrandIds = selectedBrandIdsParam.split(",").filter(Boolean);
  const selectedCatIds = selectedCatIdsParam.split(",").filter(Boolean);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        { ...formMethods.getValues(), selectedBrandIds, selectedCatIds },
        paginationRef.current,
        featureKey,
      );

      const totalRecords = await getCount(params, distance);
      paginationRef.current.totalRecords = totalRecords;

      const result = await getData(params, distance);
      setData(result || []);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
    // The selected-id params are serialised so a changed deep-link selection
    // rebuilds this callback (and retriggers the effect below).
  }, [distance, featureKey, selectedBrandIdsParam, selectedCatIdsParam]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...formMethods.getValues(), selectedBrandIds, selectedCatIds },
        paginationRef.current,
        featureKey,
      );
      const result = await getData(params, distance);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMoreData,
    distance,
    featureKey,
    selectedBrandIdsParam,
    selectedCatIdsParam,
  ]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    formMethods.setValue("search", search);

    applyFilter();
  }, [searchParams, applyFilter]);

  // Callback for item actions (price slab, cart updates, etc)
  const handleItemCallback = useCallback(
    ({ action, data: payload }: { action: string; data: any }) => {
      if (action === "buy" && payload) {
        // ADD on the row — open the seller list for the deal.
        setSellersModal({ show: true, dealId: payload });
      } else if (action === "price-slab") {
        const product = payload?.product;
        const seller = getFirstSeller(product);
        setPriceSlabModal({
          show: true,
          dealId: product?._id || product?.id || "",
          sellerId: seller?.id || "",
        });
      } else if (action === CART_ITEM_ADDED) {
        const dealId = payload?.dealId;
        if (dealId) {
          setData((prev) =>
            prev.map((p) => {
              if (p._id === dealId || p.id === dealId) {
                return {
                  ...p,
                  inCart: { status: true, qty: payload?.qty || 1 },
                };
              }
              return p;
            }),
          );
        }
      }
    },
    [],
  );

  const handlePriceSlabModalCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "close") {
        setPriceSlabModal({ show: false, dealId: "", sellerId: "" });
      }
    },
    [],
  );

  return (
    <>
      <AppHeader title={pageTitle} showCart={true} />
      <div className="page-bg app-page tw:p-4">
        <SupplyCatalogSectionTabs
          activeTab={fromCompare ? "compare" : "reorder"}
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="browse"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              <AppPaneMain className="tw:lg:col-span-12">
                <FormProvider {...formMethods}>
                  <CatalogSearchBar />
                </FormProvider>

                {/* Mobile data-point tabs — hidden where the fixed pane holds
                    the list instead (theme-2 desktop), and when Compare
                    deep-links in (price-drops only, no data-point switcher). */}
                {!fromCompare && (
                  <CatalogOverview
                    className="app-pane-hide tw:mb-3"
                    variant="tabs"
                    activeKey={featureKey}
                    counts={counts}
                    countsLoading={countsLoading}
                    distance={distance}
                  />
                )}

                {!fromCompare && (
                  <div className="tw:mb-3 tw:px-1">
                    <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">
                      Top of {pageTitle}
                    </h2>
                    <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                      {featureItem?.subtitle}
                      {!loading && paginationRef.current.totalRecords > 0 ? (
                        <> · {paginationRef.current.totalRecords} products</>
                      ) : null}
                    </p>
                  </div>
                )}

                {fromCompare && (
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={data.length}
                    fwSize="sm"
                    className="tw:mb-3 tw:px-1"
                  />
                )}

                <FeatureRows
                  data={data}
                  loading={loading}
                  callback={handleItemCallback}
                />

                {hasMoreData && !loading && (
                  <div className="tw:text-center tw:mt-4">
                    <LoadMoreButton
                      loadMore={loadMore}
                      loading={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                    />
                  </div>
                )}
              </AppPaneMain>

              <AppPaneSide className="app-pane-only">
                <div className="tw:flex tw:flex-col tw:gap-4">
                  <SupplyCatalogPane
                    title="Catalog"
                    subtitle="Network"
                    distance={distance}
                    showPurchaseCart
                    showCatalogOverview={!fromCompare}
                    catalogOverviewActiveKey={featureKey}
                    catalogOverviewCounts={counts}
                    catalogOverviewCountsLoading={countsLoading}
                  />
                </div>
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ProductSlabModal
        show={priceSlabModal.show}
        dealId={priceSlabModal.dealId}
        sellerId={priceSlabModal.sellerId}
        callback={handlePriceSlabModalCallback}
      />

      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        distance={distance}
        callback={(payload: { action: string }) => {
          if (payload.action === "close") {
            setSellersModal({ show: false, dealId: "" });
          }
        }}
      />
    </>
  );
};

export default FeatureList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Catalog"),
    },
  ];
}
