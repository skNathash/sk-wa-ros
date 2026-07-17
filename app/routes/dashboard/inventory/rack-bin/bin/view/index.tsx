import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AppTab from "~/components/core/tab/AppTab";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import Summary from "./components/Summary";
import ActivityLog from "./components/activity-log/ActivityLog";
import Products from "./components/products/Products";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-LOCATIONS"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "All Items",
    langKey: "allItems",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  {
    label: "Godown",
    langKey: "godown",
    redirect: { path: "/dashboard/inventory/rack-bin" },
  },
  { label: "Bin View" },
];

const tabItems: TabItem[] = [
  { key: "products", name: "Products", langKey: "products" },
  { key: "activity-log", name: "Activity Log", langKey: "activityLog" },
];

const BinView = () => {
  const { binId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busyLoading, setBusyLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [bin, setBin] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("products");

  // Get dealId from query params
  const dealId = searchParams.get("dealId");

  const fetchData = async (isReFetch = false) => {
    if (isReFetch) {
      setBusyLoading(true);
    } else {
      setLoading(true);
    }

    const response = await RackBinService.getBin(
      AuthService.getLoggedInUserId() || "",
      binId || "",
    );
    if (response.statusCode === 200) {
      const d = response.data?.data;
      if (d.items.length) {
        d.items = d.items.sort((a: any, b: any) => {
          return a.dealName.localeCompare(b.dealName);
        });
      }

      // Add readable bin name to the bin data
      const locationType = d.locationId === "L1" ? "Sellable" : "Non-Sellable";
      const rackName = d.rackName || "";
      const binCode = d.binCode || "";
      d._binName = `${locationType} - ${rackName} - ${binCode}`;

      setBin({ ...d });
    } else {
      setBin(null);
    }

    if (isReFetch) {
      setBusyLoading(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (binId) {
      fetchData();
    }
  }, [binId]);

  // Effect to scroll to specific deal when dealId is provided
  useEffect(() => {
    if (dealId && bin?.items) {
      // Set active tab to products if not already
      setActiveTab("products");

      // Small delay to ensure the products are rendered
      setTimeout(() => {
        const dealElement = document.querySelector(
          `[data-deal-id="${dealId}"]`,
        );
        if (dealElement) {
          dealElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Add highlight effect
          dealElement.classList.add(
            "tw:ring-2",
            "tw:ring-blue-500",
            "tw:ring-opacity-50",
          );
          setTimeout(() => {
            dealElement.classList.remove(
              "tw:ring-2",
              "tw:ring-blue-500",
              "tw:ring-opacity-50",
            );
          }, 3000);
        }
      }, 500);
    }
  }, [dealId, bin?.items]);

  const handleCallback = (a: { action: string }) => {
    // Debug: trace callbacks from child components
    // eslint-disable-next-line no-console
    console.debug("BinView.handleCallback -> received:", a);
    // Refresh bin data after any data modification actions
    if (
      a.action === "stock-moved" ||
      a.action === "adjust-stock" ||
      a.action === "move-to-non-sellable" ||
      a.action === "barcode-added" ||
      a.action === "batch-updated" ||
      a.action === "batch-created"
    ) {
      fetchData(true);
      setRefresh((prev) => prev + 1);
    }
  };

  return (
    <>
      <AppHeader
        title={`Bin - ${
          bin?.locationId === "L1" ? "Sellable" : "Non-Sellable"
        } - ${bin?.rackName || ""} - ${bin?.binCode || ""}`}
      />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          {loading ? <PageLoader /> : null}

          {!loading && bin ? (
            <>
              <Summary
                binId={binId || ""}
                isSellable={bin?.isSellable}
                refresh={refresh}
              />
              <div className="tw:mt-4">
                <AppTab
                  tabs={tabItems}
                  activeTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab.key)}
                  variant="tabs"
                />
              </div>
              <div className="tw:mt-4">
                {activeTab === "products" && (
                  <Products
                    data={bin.items}
                    binId={binId || ""}
                    binName={bin._binName}
                    callback={handleCallback}
                    dealId={dealId || undefined}
                    refresh={refresh}
                  />
                )}
                {activeTab === "activity-log" && (
                  <ActivityLog binId={binId || ""} />
                )}
              </div>
            </>
          ) : (
            <NoData />
          )}
        </div>
      </div>

      <BusyLoader show={busyLoading} message="Refreshing data..." />
    </>
  );
};

export default BinView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Bin View"),
    },
  ];
}
