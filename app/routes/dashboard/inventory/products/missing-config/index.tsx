import { Info, Package, Plus, Tag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppTab from "~/components/core/tab/AppTab";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import BulkCatalogCartService from "~/services/BulkCatalogCartService";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import UnitConfigurationModal from "~/shared/catalog/modals/unit-configuration/UnitConfigurationModal";
import type {
  BreadcrumbItem,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import AppliedFilters from "./components/AppliedFilters";
import {
  defaultFilterValues,
  getCount,
  getData,
  prepareParams,
  type FilterFormFields,
} from "./helper";
import type { SellerDeal } from "~/types/CommonTypes";

const MAX_SELECTION = 50;

const tabs: TabItem[] = [
  { name: "Set Sell In", key: "packaging", icon: <Package /> },
  { name: "Set B2B Margins", key: "margin", icon: <Tag /> },
  // { name: "Add Stock", key: "stock", icon: <Plus /> },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Items",
    langKey: "items",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  {
    label: "Configs",
    langKey: "configs",
  },
];

const MissingConfig = () => {
  const { t } = useTranslation(["common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [products, setProducts] = useState<(SellerDeal & { _raw?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewType, setViewType] = useState<ViewToggleType>("list");
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, SellerDeal & { _raw?: any }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [priceConfigModal, setPriceConfigModal] = useState<{
    show: boolean;
    dealId?: string;
  }>({ show: false });
  const [unitConfigModal, setUnitConfigModal] = useState<{
    show: boolean;
    dealId?: string;
  }>({ show: false });
  const [stockModal, setStockModal] = useState<{
    show: boolean;
    product?: any;
  }>({ show: false });

  const [selectAllDisplayed, setSelectAllDisplayed] = useState(false);

  const selectedCount = Object.keys(selectedProducts).length;

  const methods = useForm<FilterFormFields>({
    defaultValues: defaultFilterValues,
  });

  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 10,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 10,
  });

  const activeTab = searchParams.get("tab") || "packaging";

  const applyFilter = useCallback(async () => {
    paginationRef.current.activePage = 1;
    setLoading(true);
    try {
      const params = prepareParams(methods.getValues(), paginationRef.current);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const productsData = await getData(params);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [methods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current.activePage += 1;
      const params = prepareParams(methods.getValues(), paginationRef.current);
      const productsData = await getData(params);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore, methods]);

  useEffect(() => {
    const paramsObject = Object.fromEntries(searchParams?.entries() || []);

    const formData =
      InventoryDealFilterService.prepareInventoryParamToFormData(paramsObject);

    const search = searchParams.get("search") || "";

    const nextValues: FilterFormFields = {
      ...defaultFilterValues,
      ...formData,
      search,
      configPendingType: activeTab,
    };

    methods.reset(nextValues);
    applyFilter();
  }, [searchParams, activeTab, applyFilter, methods]);

  const handleTabChange = useCallback(
    (tab: TabItem) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", tab.key);
      setSelectedProducts({});
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const toggleSelectItem = useCallback((checked: boolean, product: any) => {
    setSelectedProducts((prev) => {
      const copy = { ...prev };
      if (checked) {
        if (Object.keys(copy).length >= MAX_SELECTION) return copy;
        copy[product._id] = product;
      } else {
        delete copy[product._id];
      }
      return copy;
    });
  }, []);

  const toggleSelectAllDisplayed = useCallback((checked: boolean) => {
    setSelectAllDisplayed(checked);
  }, []);

  useEffect(() => {
    if (!products.length) return;

    if (selectAllDisplayed) {
      setSelectedProducts((prev) => {
        const copy = { ...prev };
        for (const p of products) {
          if (Object.keys(copy).length >= MAX_SELECTION) break;
          copy[p._id] = p;
        }
        return copy;
      });
    } else {
      setSelectedProducts((prev) => {
        const copy = { ...prev };
        for (const p of products) {
          if (copy[p._id]) delete copy[p._id];
        }
        return copy;
      });
    }
  }, [selectAllDisplayed, products]);

  const handleBulkAddToCart = useCallback(async () => {
    if (selectedCount === 0) {
      appToast.show({
        msg: t("pleaseSelectAtleastOneItem"),
        color: "danger",
      });
      return;
    }

    setIsSubmitting(true);
    const itemsArr: any[] = [];
    const values = Object.values(selectedProducts);

    // Map tab to cart feature
    const featureMap: Record<string, string> = {
      packaging: "PackUpdate",
      margin: "PriceUpdate",
      stock: "ReserveConfig",
    };

    const cartType = featureMap[activeTab] || "PriceUpdate";

    for (const deal of values) {
      const networkSellingPrice = deal?._raw?.networkSellingPrice || {};
      if (activeTab === "packaging") {
        itemsArr.push({
          dealId: deal._id,
          sellerId: AuthService.getLoggedInUserId(),
          packConfig: [],
        });
      } else if (activeTab === "stock") {
        itemsArr.push({
          dealId: deal._id,
          sellerId: AuthService.getLoggedInUserId(),
          configType: "Deal",
          isActive: true,
        });
      } else {
        // Default to margin/PriceUpdate
        itemsArr.push({
          dealId: deal._id,
          discount: networkSellingPrice?.discount || 0,
          applicableFor: "Network",
          configOnType: "Deal",
          isFixedPrice: networkSellingPrice.discountType === "Fixed",
          fixedPrice: networkSellingPrice.price || 0,
        });
      }
    }

    const payload: Record<string, any> = {
      franchiseId: AuthService.getLoggedInUserId(),
      cartType: cartType,
      items: itemsArr,
    };

    try {
      const response = await BulkCatalogCartService.createCart(payload);
      if (response.statusCode === 200) {
        appToast.show({
          msg: response.data?.message || t("addedSuccessfully"),
          color: "success",
        });
        setSelectedProducts({});

        // Redirect based on feature
        if (cartType === "PriceUpdate") {
          appNav.to(`/configs/product-select/cart/price?source=missing-config`);
        } else if (cartType === "PackUpdate") {
          appNav.to(`/configs/product-select/cart/case?source=missing-config`);
        } else if (cartType === "ReserveConfig") {
          appNav.to(
            `/configs/product-select/cart/reserve?source=missing-config`,
          );
        }
      } else {
        appToast.show({
          msg: response.data?.message || t("failedToAdd"),
          color: "danger",
        });
      }
    } catch (err) {
      appToast.show({ msg: t("failedToAddItems"), color: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCount, selectedProducts, activeTab, appNav, appToast, t]);

  const handleProceed = useCallback(() => {
    handleBulkAddToCart();
  }, [handleBulkAddToCart]);

  const handleAddToCart = useCallback(
    async (product: any) => {
      // Map tab to cart feature
      const featureMap: Record<string, string> = {
        packaging: "PackUpdate",
        margin: "PriceUpdate",
        stock: "ReserveConfig",
      };

      const cartType = featureMap[activeTab];

      if (!cartType) {
        appToast.show({
          msg: "Invalid type",
          color: "danger",
        });
        return;
      }

      const networkSellingPrice = product?._raw?.networkSellingPrice || {};
      let itemPayload: any = {
        dealId: product._id,
        sellerId: AuthService.getLoggedInUserId(),
      };

      if (activeTab === "packaging") {
        itemPayload.packConfig = product?._raw?.packConfig || [];
      } else if (activeTab === "stock") {
        itemPayload.configType = "Deal";
        itemPayload.isActive = true;
      } else {
        itemPayload.discount = networkSellingPrice?.discount || 0;
        itemPayload.applicableFor = "Network";
        itemPayload.configOnType = "Deal";
        itemPayload.isFixedPrice = networkSellingPrice.discountType === "Fixed";
        itemPayload.fixedPrice = networkSellingPrice.price || 0;
      }

      const payload: Record<string, any> = {
        franchiseId: AuthService.getLoggedInUserId(),
        cartType: cartType,
        items: [itemPayload],
      };

      try {
        const response = await BulkCatalogCartService.createCart(payload);
        if (response.statusCode === 200) {
          appToast.show({
            msg: response.data?.message || t("addedSuccessfully"),
            color: "success",
          });
          // Mark product as in-cart locally
          setProducts((prev) =>
            prev.map((p) =>
              p._id === product._id ? { ...p, isInCart: true } : p,
            ),
          );
        } else {
          appToast.show({
            msg: response.data?.message || t("failedToAdd"),
            color: "danger",
          });
        }
      } catch (err) {
        appToast.show({ msg: t("failedToAddItems"), color: "danger" });
      }
    },
    [activeTab, appToast, t],
  );

  const handleAction = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "update") {
        const product = payload.data;
        if (activeTab === "margin") {
          setPriceConfigModal({ show: true, dealId: product?._id });
        } else if (activeTab === "packaging") {
          setUnitConfigModal({ show: true, dealId: product?._id });
        } else if (activeTab === "stock") {
          setStockModal({ show: true, product });
        }
      }
    },
    [activeTab],
  );

  const onFilterCallback = useCallback(
    (payload: { action: string; data?: FilterFormFields }) => {
      const formData: FilterFormFields = {
        ...defaultFilterValues,
        ...(payload.data || {}),
      };

      const params =
        InventoryDealFilterService.prepareInventoryFilterQueryParams(formData);

      const search = formData.search || "";
      if (search) {
        params.set("search", search);
      }

      const current = new URLSearchParams(searchParams);
      const tab = current.get("tab") || activeTab;
      if (tab) {
        params.set("tab", tab);
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, activeTab],
  );

  return (
    <>
      <AppHeader title={t("missingConfigItems")} />
      <div className="page-bg app-page has-footer tw:p-4">
        <div className="app-container">
          <div className="tw:mb-6">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
            <PageDescription
              description="missingConfigItems"
              className="tw:mt-1"
            />
          </div>

          <InfoBlock variant="info" size="sm" className="tw:mb-6">
            <div className="tw:flex tw:items-start tw:gap-3">
              <Info
                size={16}
                className="tw:text-blue-600 tw:flex-shrink-0 tw:mt-0.5"
              />
              <p className="tw:text-xs tw:text-blue-800 tw:leading-relaxed tw:m-0">
                {t("chooseItemForFurtherUpdates")}
              </p>
            </div>
          </InfoBlock>

          <AppTab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="tabs"
            className="tw:mb-6"
          />

          <FormProvider {...methods}>
            <Filter callback={onFilterCallback} className="tw:mb-6" />
            <AppliedFilters callback={onFilterCallback} />
          </FormProvider>

          <div className="tw:flex tw:justify-between tw:mb-4 tw:items-center">
            <div>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={products.length}
                fwSize="sm"
              />
              {!loading && products.length > 0 ? (
                <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                  <input
                    type="checkbox"
                    checked={selectAllDisplayed}
                    onChange={(e) => toggleSelectAllDisplayed(e.target.checked)}
                    className="tw:w-4 tw:h-4"
                  />
                  <label className="tw:text-xs tw:text-gray-500">
                    {t("selectAllDisplayedItems")}
                  </label>
                </div>
              ) : null}
            </div>
            <ViewToggle
              viewType={viewType}
              callback={setViewType}
              hideInMobile={false}
              showOnlyIcon={isMobile}
            />
          </div>

          {isMobile || viewType == "card" ? (
            <MobileView
              products={products}
              loading={loading}
              loadMore={loadMore}
              hasMoreData={hasMoreData}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={products.length}
              viewType={viewType}
              selectedIds={Object.keys(selectedProducts)}
              disabled={selectedCount >= MAX_SELECTION}
              onToggle={toggleSelectItem}
              activeTab={activeTab}
              onAddToCart={handleAddToCart}
              onAction={handleAction}
            />
          ) : (
            <DesktopView
              products={products}
              loading={loading}
              loadMore={loadMore}
              hasMoreData={hasMoreData}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={products.length}
              viewType={viewType}
              selectedIds={Object.keys(selectedProducts)}
              disabled={selectedCount >= MAX_SELECTION}
              onToggle={toggleSelectItem}
              activeTab={activeTab}
              onAddToCart={handleAddToCart}
              onAction={handleAction}
            />
          )}

          {/* Modals opened from action column */}
          <PriceConfigModal
            show={priceConfigModal.show}
            dealId={priceConfigModal.dealId}
            type={"network"}
            callback={(p) => {
              setPriceConfigModal({ show: false });
              if (p.action === "update") {
                const id = priceConfigModal.dealId || "";
                if (id) {
                  setProducts((prev) =>
                    prev.map((prod) =>
                      prod._id === id ? { ...prod, isUpdated: true } : prod,
                    ),
                  );
                  setSelectedProducts((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                }
              }
            }}
          />

          <UnitConfigurationModal
            show={unitConfigModal.show}
            dealId={unitConfigModal.dealId || ""}
            callback={(p) => {
              setUnitConfigModal({ show: false });
              if (p.action === "submit") {
                const id = unitConfigModal.dealId || "";
                if (id) {
                  setProducts((prev) =>
                    prev.map((prod) =>
                      prod._id === id ? { ...prod, isUpdated: true } : prod,
                    ),
                  );
                  setSelectedProducts((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                }
                setUnitConfigModal({ show: false });
              }
            }}
          />

          <InventoryAddStockModal
            show={stockModal.show}
            productId={stockModal.product?._id}
            productName={stockModal.product?.name}
            mrp={stockModal.product?.mrp}
            callback={(p) => {
              if (p.action === "close") setStockModal({ show: false });
              if (p.action === "success" || p.action === "added") {
                const id = stockModal.product?._id;
                if (id) {
                  setProducts((prev) =>
                    prev.map((prod) =>
                      prod._id === id ? { ...prod, isUpdated: true } : prod,
                    ),
                  );
                  setSelectedProducts((prev) => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  });
                }
                setStockModal({ show: false });
                applyFilter();
              }
            }}
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="app-footer">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-sm tw:font-medium">
              <span className="tw:text-blue-600">
                {selectedCount} {t("itemsSelected")}
              </span>
            </div>
            <AppButton
              onClick={handleProceed}
              isLoading={isSubmitting}
              className="tw:px-10"
              color="primary"
            >
              {t("proceed")}
            </AppButton>
          </div>
        </div>
      )}
    </>
  );
};

export default MissingConfig;
