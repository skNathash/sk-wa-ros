import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { useSidebar } from "~/components/ui/sidebar";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import CommonService from "~/services/CommonService";
import ProductSlabModal from "~/shared/catalog/modals/product-slab/ProductSlabModal";
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
import SmartCartCard from "../components/SmartCartCard";
import ReorderRows from "./components/ReorderRows";
import {
  defaultFilter,
  type FilterFormData,
  getCount,
  getData,
  getFirstSeller,
  prepareParams,
} from "./helper";

const ReorderList = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { setOpen } = useSidebar();

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  const [searchParams] = useSearchParams();

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

  const distance =
    searchParams.get("distance") || String(DEFAULT_BROWSE_DISTANCE);

  // One counts fetch shared with the catalog pane categories list + mobile tabs.
  const { counts, countsLoading } = useCatalogOverviewCounts(distance);

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
        formMethods.getValues(),
        paginationRef.current,
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
  }, [distance]);

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
        formMethods.getValues(),
        paginationRef.current,
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
  }, [loadingMore, hasMoreData, distance]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    formMethods.setValue("search", search);

    applyFilter();
  }, [searchParams, applyFilter]);

  // Callback for item actions (price slab, cart updates, etc)
  const handleItemCallback = useCallback(
    ({ action, data: payload }: { action: string; data: any }) => {
      if (action === "price-slab") {
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

  // Desktop side pane — shared supply catalog pane plus the smart cart card.
  // Mobile uses CatalogOverview tabs instead (see below).
  const catalogPane = (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <SupplyCatalogPane
        title="Catalog"
        subtitle="Network"
        distance={distance}
        showPurchaseCart
        showCatalogOverview
        catalogOverviewActiveKey="reorder"
        catalogOverviewCounts={counts}
        catalogOverviewCountsLoading={countsLoading}
      />

      <SmartCartCard />
    </div>
  );

  return (
    <>
      <AppHeader
        title={t("topOfReorder", { defaultValue: "Top of Reorder" })}
        showCart={true}
      />
      <div className="page-bg app-page tw:p-4">
        <SupplyCatalogSectionTabs activeTab="reorder" />

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
                    the list instead (theme-2 desktop). */}
                <CatalogOverview
                  className="app-pane-hide tw:mb-3"
                  variant="tabs"
                  activeKey="reorder"
                  counts={counts}
                  countsLoading={countsLoading}
                  distance={distance}
                />

                <div className="tw:mb-3 tw:px-1">
                  <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">
                    Top of Reorder
                  </h2>
                  <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                    Sorted by run-out risk
                    {!loading && paginationRef.current.totalRecords > 0 ? (
                      <> · {paginationRef.current.totalRecords} products</>
                    ) : null}
                  </p>
                </div>

                <ReorderRows
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

              <AppPaneSide className="app-pane-only">{catalogPane}</AppPaneSide>
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
    </>
  );
};

export default ReorderList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Top of Reorder"),
    },
  ];
}
