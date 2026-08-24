import {
  Building2,
  ClipboardEdit,
  Download,
  Package,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import { useIsMobile } from "~/hooks/use-mobile";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SettingsSidePane from "~/shared/settings/components/settings-side-pane/SettingsSidePane";
import { settingsSectionTabs } from "~/shared/settings/components/settings-side-pane/helper";
import type { TabItem } from "~/types/CommonTypes";
import DownloadInventoryModal from "./modals/DownloadInventoryModal";

export async function clientLoader() {
  return {};
}

const BulkUploadLayout = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const isTheme2 = useTheme() === "theme-2";
  const isMobile = useIsMobile();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [downloadModal, setDownloadModal] = useState<{
    show: boolean;
  }>({ show: false });

  const isBuyer = AuthService.isBuyerUser() || AuthService.isSkBuyer();

  const sourcePage = searchParams.get("from");
  const isFromBulkUpdate = sourcePage === "bulk-update";

  // Determine active tab based on current location
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/add-stock")) return "add-stock";
    // Pricing is one route split into two tabs by the `tab` query param.
    if (path.includes("/pricing")) {
      return searchParams.get("tab") === "b2b" && !isBuyer
        ? "pricing-b2b"
        : "pricing-b2c";
    }
    if (path.includes("/barcode")) return "barcode";
    if (path.includes("/stock-correction")) return "stock-correction";
    return "add-stock"; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname, location.search]);

  const breadcrumbs = useMemo(() => {
    const childLabelMap: Record<string, string> = {
      "add-stock": t("addStock"),
      "pricing-b2c": "B2C Pricing",
      "pricing-b2b": "B2B Pricing",
      "stock-correction": t("stockCorrection"),
      barcode: t("manageBarcodes"),
    };

    const childLabel = childLabelMap[activeTab] || t("bulkUpload");

    const rootBreadcrumb = { label: t("dashboard"), redirect: { path: "/dashboard" } };

    if (!isFromBulkUpdate) {
      return [rootBreadcrumb, { label: childLabel }];
    }

    return [
      rootBreadcrumb,
      { label: t("bulkUpdate"), redirect: { path: "/dashboard/inventory/bulk-update" } },
      { label: childLabel },
    ];
  }, [activeTab, isFromBulkUpdate, t]);

  const tabItems: TabItem[] = [
    {
      key: "add-stock",
      name: "Stock",
      icon: <Package size={16} />,
      langKey: "stock",
    },
    {
      key: "pricing-b2c",
      name: "B2C Pricing",
      icon: <User size={16} />,
    },
    // B2B pricing is not offered to buyer users.
    ...(isBuyer
      ? []
      : [
          {
            key: "pricing-b2b",
            name: "B2B Pricing",
            icon: <Building2 size={16} />,
          },
        ]),
    // {
    //   key: "barcode",
    //   name: "Manage Barcodes",
    //   icon: <QrCode size={16} />,
    //   langKey: "barcode",
    // },
    {
      key: "stock-correction",
      name: "Stock Correction",
      icon: <ClipboardEdit size={16} />,
      langKey: "stockCorrection",
    },
  ];

  // Prepare a dynamic title based on the active tab
  const activeTabItem = tabItems.find((t) => t.key === activeTab);
  const pageTitle = `${t("bulkUpload")} - ${
    activeTabItem?.langKey ? t(activeTabItem.langKey) : activeTabItem?.name
  }`;

  useEffect(() => {
    // keep the browser title in sync with active tab
    if (pageTitle) document.title = pageTitle;
  }, [pageTitle]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    // B2C/B2B share the pricing route and are told apart by `tab`.
    const [segment, priceType] = tab.key.startsWith("pricing-")
      ? ["pricing", tab.key.replace("pricing-", "")]
      : [tab.key, ""];
    const query = new URLSearchParams();
    if (priceType) query.set("tab", priceType);
    if (isFromBulkUpdate) query.set("from", "bulk-update");
    const queryString = query.toString();
    appNav.to(
      `/dashboard/bulk-upload/${segment}${queryString ? `?${queryString}` : ""}`,
    );
  };

  const handleDownloadModal = ({ action }: any) => {
    if (action === "close") {
      setDownloadModal({ show: false });
    }
  };

  return (
    <>
      <AppHeader
        title={pageTitle}
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          {/* Settings menu on mobile — theme-2 only (see theme-2.css); the
              desktop equivalent is the side pane below. */}
          <SectionTabs
            tabs={settingsSectionTabs}
            activeTab={"bulk-upload"}
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail. Bulk upload is reached from Settings,
                which is a tab of the Profile section, so the rail keeps
                listing the profile entries with "Settings" highlighted;
                moving between the individual config pages is the side pane's
                job. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="settings"
                  title={t("bulkUpload")}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Full span: in theme-2 desktop the pane is lifted out of the
                    grid, so the main column owns all 12 columns. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Page header + inventory download — dropped entirely in
                      theme-2: the breadcrumbs and description are hidden there
                      anyway, and each tab's own card carries the inventory
                      download. Not rendered (rather than CSS-hidden) so the tab
                      strip below is the column's first child and lands flush
                      under the sticky section bar. */}
                  {!isTheme2 && (
                    <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:gap-4">
                      <div>
                        <AppBreadcrumbs data={breadcrumbs} />
                        <div className="tw:text-gray-600 tw:text-sm tw:mt-2">
                          Upload and manage your inventory data in bulk using
                          Excel templates
                        </div>
                      </div>
                      {activeTab !== "stock-correction" && (
                        <div className="tw:flex tw:items-center tw:gap-4">
                          <AppButton
                            size="small"
                            color="primary"
                            onClick={() => setDownloadModal({ show: true })}
                          >
                            <Download size={16} />
                            <span>Download Inventory</span>
                          </AppButton>
                        </div>
                      )}
                    </div>
                  )}

                  {/* theme-2 mobile renders the sub-nav as the full-bleed
                      underlined tray (`edge-tabs app-tabs-tray`) pinned right
                      below the sticky section pill bar (`app-tabs-sticky`);
                      theme-2 desktop pins the pills on their own white band
                      (`barcode-tabs-pills`, same treatment as the barcode scan
                      sub-nav) so they don't float on page-bg; the other themes
                      keep the segmented control. */}
                  <AppTab
                    tabs={tabItems}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    variant={
                      isTheme2 ? (isMobile ? "underline" : "pills") : "tabs"
                    }
                    className={
                      isTheme2
                        ? isMobile
                          ? "edge-tabs app-tabs-tray app-tabs-sticky"
                          : "subscribe-tabs-sticky barcode-tabs-pills"
                        : ""
                    }
                    scrollable={isTheme2 && isMobile}
                  />

                  <Outlet />
                </AppPaneMain>

                <SettingsSidePane activeKey="bulk-upload" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab !== "stock-correction" && (
        <DownloadInventoryModal
          show={downloadModal.show}
          callback={handleDownloadModal}
        />
      )}
    </>
  );
};

export default BulkUploadLayout;

export function meta() {
  return [
    {
      title: "Bulk Upload",
    },
  ];
}
