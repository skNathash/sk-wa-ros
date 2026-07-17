import InventoryProductCard from "app/components/feature/inventory/products/InventoryProductCard";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useParams, useRevalidator } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import PageLoader from "~/components/core/page-loader/PageLoader";
import { getDetails } from "./helper";

import {
  Copy,
  History,
  IndianRupee,
  LayoutDashboard,
  PackageSearch,
  Plus,
  Settings,
} from "lucide-react";
import { clone as cloneCartItem } from "../../subscribe/cart/helper";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import OmsService from "~/services/OmsService";
import PageAccessService from "~/services/PageAccessService";
import useAppToast from "~/hooks/useAppToast";
import { RefreshCw } from "lucide-react";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";
import ConsumerOfferConfigModal from "~/shared/catalog/modals/consumer-offer-config/ConsumerOfferConfigModal";
import UnitConfigurationModal from "~/shared/catalog/modals/unit-configuration/UnitConfigurationModal";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import type { Route } from "./+types/layout";

export async function clientLoader({ params }: { params: { id: string } }) {
  if (PageAccessService.canAccessPage(["INVENTORY.VIEW-INVENTORY"])) {
    return;
  }
  if (!params?.id) throw new Error("Product ID is required");
  const details = await getDetails(params.id);
  return details;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "All Items",
    langKey: "allItems",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Product Details", langKey: "itemDetails" },
];

const tabs: TabItem[] = [
  { key: "overview", name: "Overview", icon: <LayoutDashboard /> },
  // { key: "analytics", name: "Analytics", icon: "bar-chart-3" },
  { key: "vendors", name: "Vendors & Purchasing", icon: <IndianRupee /> },
  { key: "audit", name: "Audit History", icon: <History /> },
];

const InventoryProductLayout = ({ loaderData }: Route.ComponentProps) => {
  const { t } = useTranslation(["common"]);

  const { id } = useParams();

  const { revalidate } = useRevalidator();

  // Keep deal in state so child components can update it (e.g. status)
  const [dealState, setDealState] = useState<any>(loaderData);
  const deal = dealState;
  const appNav = useAppNav();

  const [consumerRequest, setConsumerRequest] = useState<any>(null);
  const [consumerRequestLoading, setConsumerRequestLoading] = useState(false);
  const [showConsumerOfferModal, setShowConsumerOfferModal] = useState(false);
  const [showUnitConfigModal, setShowUnitConfigModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const { show: showToast } = useAppToast();

  const handleClone = async () => {
    if (!deal?._id) return;
    setShowCloneConfirm(false);
    setCloneLoading(true);
    try {
      const result = await cloneCartItem({
        name: deal.name || "",
        dealName: deal.name || "",
        quantity: 0,
        isCloned: true,
        clonedFrom: deal._id,
        mrp: deal.mrp,
        price: deal.price,
        unitType: deal._raw?.unit || "unit",
      });
      if (result.status === "success") {
        showToast({ msg: result.msg, color: "success" });
        appNav.to("/dashboard/inventory/subscribe/cart");
      } else {
        showToast({ msg: result.msg, color: "error" });
      }
    } finally {
      setCloneLoading(false);
    }
  };

  const fetchSyncStatus = async (dealId: string) => {
    try {
      const resp = await OmsService.getSellerDealSyncStatus(dealId);
      setSyncStatus(resp?.data?.data || null);
    } catch (e) {
      setSyncStatus(null);
    }
  };

  const handleSyncStock = async () => {
    if (!deal?._id) return;
    setIsSyncing(true);
    try {
      const resp = await OmsService.updateSellerDealQuantity({
        sellerId: AuthService.getLoggedInUserId(),
        action: "STOCKCORRECTION_UPDATE",
        remarks: "Stock sync from inventory",
        dealId: deal._id,
        quantity: 1,
      });
      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        showToast({ msg: "Stock synced successfully", color: "success" });
        await fetchSyncStatus(deal._id);
        revalidate();
      } else {
        showToast({
          msg: resp?.data?.message || "Failed to sync stock",
          color: "error",
        });
      }
    } catch (err: any) {
      showToast({
        msg: err?.message || "Failed to sync stock",
        color: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setDealState(loaderData);
  }, [loaderData]);

  useEffect(() => {
    if (id) {
      revalidate();
    }
  }, [id, revalidate]);

  const location = useLocation();

  let activeTab =
    tabs.find((item) => item.key === location.pathname.split("/").pop())?.key ||
    "overview";
  if (
    ["sales-history", "purchase-history", "stock-ledger", "price-changes"].some(
      (segment) => location.pathname.includes(segment),
    )
  ) {
    activeTab = "audit";
  }

  const showViewBins = activeTab === "overview";

  const fetchConsumerRequests = async (id: string) => {
    setConsumerRequestLoading(true);
    const response = await InventorySubscribeService.getSellerImportProducts({
      filter: {
        isConsumerOffer: true,
        "orgData.dealId": id,
      },
      sort: {
        createdAt: -1,
      },
    });
    const d = InventorySubscribeService.formatSellerImportProducts(
      response.data?.data || [],
    )?.[0];
    setConsumerRequest(d);
    setConsumerRequestLoading(false);
  };

  const handleConsumerOfferClick = () => {
    setShowConsumerOfferModal(true);
  };

  const handleConsumerOfferModalCallback = ({
    action,
    data: modalData,
  }: {
    action: string;
    data?: any;
  }) => {
    setShowConsumerOfferModal(false);
    if (action === "submit") {
      fetchConsumerRequests(deal?._id || "");
    }
  };

  React.useEffect(() => {
    const id = deal?._id || "";
    if (id && !deal?.consumerOffer?.enabled) {
      fetchConsumerRequests(id);
    }
  }, [deal?._id, deal?.consumerOffer?.enabled]);

  React.useEffect(() => {
    if (deal?._id) {
      fetchSyncStatus(deal._id);
    }
  }, [deal?._id]);

  const onTabChange = (tab: TabItem) => {
    if (!deal?._id) return;
    if (tab.key == "overview") {
      appNav.to(`/dashboard/inventory/products/view/${deal._id}`);
    } else if (tab.key == "analytics") {
      appNav.to(`/dashboard/inventory/products/view/${deal._id}/analytics`);
    } else if (tab.key == "vendors") {
      appNav.to(`/dashboard/inventory/products/view/${deal._id}/vendors`);
    } else if (tab.key == "audit") {
      appNav.to(`/dashboard/inventory/products/view/${deal._id}/sales-history`);
    }
  };

  const handleViewBins = () => {
    if (!deal?._id) return;

    const scrollToBins = () => {
      setTimeout(() => {
        const element = document.getElementById("product-bin-block");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    };

    scrollToBins();
  };

  return (
    <>
      <AppHeader title={t("itemDetails")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {!deal ? (
            <PageLoader />
          ) : !deal._id ? (
            <NoData />
          ) : (
            <>
              <InventoryProductCard
                data={deal}
                className="tw:mb-4"
                onEdit={() => {}}
                onStatusChange={(newStatus: string) => {
                  // update local state to reflect new status so the InfoBlock updates
                  setDealState((prev: any) => ({ ...prev, status: newStatus }));
                }}
                consumerOfferId={consumerRequest?._id}
                consumerOfferStatus={consumerRequest?.status}
                onEnableOfferClick={handleConsumerOfferClick}
                onViewBins={handleViewBins}
                showViewBins={showViewBins}
                onUnitConfigClick={() => setShowUnitConfigModal(true)}
                onClone={() => setShowCloneConfirm(true)}
                cloneLoading={cloneLoading}
              />
              {syncStatus && syncStatus.isSynced === false && (
                <InfoBlock
                  className="tw:mb-4"
                  variant="warning"
                  size="sm"
                  bordered
                >
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2">
                    <div>
                      Stock is out of sync. Seller deal qty:{" "}
                      {syncStatus.sellerDealQuantity ?? "-"}, Stock master qty:{" "}
                      {syncStatus.stockMasterQuantity ?? "-"}.
                    </div>
                    <AppButton
                      size="small"
                      color="warning"
                      fill="solid"
                      isLoading={isSyncing}
                      onClick={handleSyncStock}
                    >
                      <RefreshCw size={16} />
                      Sync Stock
                    </AppButton>
                  </div>
                </InfoBlock>
              )}
              {deal?.status === "Inactive" && (
                <InfoBlock
                  className="tw:mb-4"
                  variant="danger"
                  size="sm"
                  bordered
                >
                  Product is currently “Inactive”, Sales activity for this
                  product is currently paused
                </InfoBlock>
              )}
              <AppTab
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={onTabChange}
                className="tw:mb-4"
              />
              <Outlet />
            </>
          )}
        </div>
      </div>

      {deal && deal._id && (
        <div className="app-footer tw:md:hidden tw:p-4">
          {!deal.isKCStoreEnabled && (
            <AppSwiper
              config={{
                slidesPerView: "auto",
                spaceBetween: 8,
                freeMode: true,
              }}
            >
              <AppSwiper.Slide isAutoWidth>
                <ToggleProductStatus
                  dealId={deal._raw?._id}
                  status={deal.status}
                  size="small"
                  callback={(res) => {
                    if (res?.action === "submit") {
                      const nextStatus =
                        String(deal.status || "").toLowerCase() === "active"
                          ? "Inactive"
                          : "Active";
                      setDealState((prev: any) => ({
                        ...prev,
                        status: nextStatus,
                      }));
                    }
                  }}
                />
              </AppSwiper.Slide>
              {showViewBins && (
                <AppSwiper.Slide isAutoWidth>
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={handleViewBins}
                  >
                    <PackageSearch size={16} />
                    Bins
                  </AppButton>
                </AppSwiper.Slide>
              )}
              <AppSwiper.Slide isAutoWidth>
                <AppButton
                  size="small"
                  color="primary"
                  fill="outline"
                  onClick={() => setShowCloneConfirm(true)}
                  isLoading={cloneLoading}
                >
                  <Copy size={16} />
                  Duplicate
                </AppButton>
              </AppSwiper.Slide>
              {/* {!deal.consumerOffer?.enabled && !consumerRequest?._id ? (
                <AppSwiper.Slide isAutoWidth>
                  <AppButton
                    color="success"
                    fill="solid"
                    size="small"
                    onClick={handleConsumerOfferClick}
                  >
                    <Plus className="tw:text-white" size={16} />
                    Enable Offer
                  </AppButton>
                </AppSwiper.Slide>
              ) : null} */}
            </AppSwiper>
          )}
        </div>
      )}

      <AppAlertDialog
        show={showCloneConfirm}
        title="Duplicate this product?"
        description="A copy of this product will be added to your Catalog Cart for editing."
        okText="Duplicate"
        onConfirm={handleClone}
        onCancel={() => setShowCloneConfirm(false)}
      />

      {/* Consumer Offer Modal */}
      <ConsumerOfferConfigModal
        show={showConsumerOfferModal}
        callback={handleConsumerOfferModalCallback}
        feature="inventory"
        dealData={{
          dealName: deal?.name || "-",
          dealId: deal?._id || "-",
          mrp: deal?.mrp || 0,
          b2cPrice: deal?.b2cPrice || 0,
          brand: deal?.brand,
          category: deal?.category,
          price: deal?.price || 0,
        }}
      />

      <UnitConfigurationModal
        show={showUnitConfigModal}
        dealId={deal?._id}
        callback={({ action }) => {
          setShowUnitConfigModal(false);
          if (action === "submit") {
            revalidate();
          }
        }}
      />
    </>
  );
};

export default InventoryProductLayout;
