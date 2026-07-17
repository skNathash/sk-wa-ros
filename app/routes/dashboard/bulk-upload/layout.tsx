import { ClipboardEdit, Download, IndianRupee, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";
import DownloadInventoryModal from "./modals/DownloadInventoryModal";

export async function clientLoader() {
  return {};
}

const BulkUploadLayout = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [downloadModal, setDownloadModal] = useState<{
    show: boolean;
  }>({ show: false });

  const sourcePage = searchParams.get("from");
  const isFromBulkUpdate = sourcePage === "bulk-update";

  // Determine active tab based on current location
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/add-stock")) return "add-stock";
    if (path.includes("/pricing")) return "pricing";
    if (path.includes("/barcode")) return "barcode";
    if (path.includes("/stock-correction")) return "stock-correction";
    return "add-stock"; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const breadcrumbs = useMemo(() => {
    const childLabelMap: Record<string, string> = {
      "add-stock": t("addStock"),
      pricing: t("pricing"),
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
      key: "pricing",
      name: "Update Pricing",
      icon: <IndianRupee size={16} />,
      langKey: "pricing",
    },
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
    const fromParam = isFromBulkUpdate ? "?from=bulk-update" : "";
    appNav.to(`/dashboard/bulk-upload/${tab.key}${fromParam}`);
  };

  const handleDownloadModal = ({ action }: any) => {
    if (action === "close") {
      setDownloadModal({ show: false });
    }
  };

  return (
    <>
      <AppHeader title={pageTitle} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-6 tw:gap-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:text-gray-600 tw:text-sm tw:mt-2">
                Upload and manage your inventory data in bulk using Excel
                templates
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

          <AppTab
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="tabs"
            className="tw:mb-4"
          />

          <Outlet />
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
