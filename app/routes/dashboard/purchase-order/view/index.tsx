import { produce } from "immer";
import {
  Clock,
  Coins,
  FileText,
  Package,
  Percent,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import PageHeading from "~/components/core/page-heading/PageHeading";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import OrderBoxes from "~/shared/orders/order-boxes/OrderBoxes";
import SkSellerAvailableNote from "~/shared/vendor/components/sk-seller-available/SkSellerAvailableNote";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import ActionButtons from "./components/ActionButtons";
import DocumentsTab from "./components/DocumentsTab";
import FinanceInfo from "./components/FinanceInfo";
import OrderInfo from "./components/OrderInfo";
import ReturnsTab from "./components/ReturnsTab";
import Invoices from "./components/tabs/invoices/Invoices";
import Products from "./components/tabs/products/Products";
import PurchaseCommission from "./components/tabs/purchase-commission/PurchaseCommission";
import Timeline from "./components/Timeline";
import VendorInfo from "./components/VendorInfo";
import { getData } from "./helper";

const initialBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Purchase Orders",
    redirect: { path: "/dashboard/purchase-order/summary" },
  },
  {
    label: "View Order",
  },
];

const PurchaseOrderView = () => {
  const { t } = useTranslation(["common"]);
  const { id } = useParams<{ id: string }>();
  const appNav = useAppNav();

  const [breadcrumbs, setBreadcrumbs] =
    useState<BreadcrumbItem[]>(initialBreadcrumbs);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("products");

  const [tabs, setTabs] = useState<TabItem[]>([
    {
      name: "Products",
      key: "products",
      icon: <Package />,
    },
    {
      name: "Boxes",
      key: "boxes",
      icon: <Package />,
    },
    {
      name: "Invoices",
      key: "invoices",
      icon: <FileText />,
    },
    {
      name: "Timeline",
      key: "timeline",
      icon: <Clock />,
    },
    {
      name: "Returns",
      key: "returns",
      icon: <RefreshCcw />,
    },
    {
      name: "Documents",
      key: "documents",
      icon: <FileText />,
    },
    {
      name: "Platform Fee",
      key: "purchase-commission",
      icon: <Percent />,
    },
  ]);

  // Fetch purchase order details
  const fetchPurchaseOrder = async () => {
    if (!id) {
      setError("Purchase Order ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getData(id);

      if (data) {
        setData(data);

        // Update breadcrumbs to show PO id/orderId when data is loaded
        setBreadcrumbs((prev) =>
          prev && prev.length > 0
            ? [
                ...prev.slice(0, -1),
                {
                  label: data?._id ? `#${data.orderId}` : "",
                },
              ]
            : prev,
        );

        const notReceivedCount = data?.boxes?.needToReceive ?? 0;

        setTabs(
          produce((draft) => {
            const boxesTabIndex = draft.findIndex((tab) => tab.key === "boxes");
            const invoicesTabIndex = draft.findIndex(
              (tab) => tab.key === "invoices",
            );

            if (invoicesTabIndex != -1) {
              if (!data.receivedPackages?.length) {
                draft.splice(invoicesTabIndex, 1);
              }
            }

            if (boxesTabIndex != -1) {
              if (data._isFromSk) {
                draft[boxesTabIndex].count = notReceivedCount;
              } else {
                draft.splice(boxesTabIndex, 1);
              }
            }
          }),
        );
      } else {
        setError("Purchase Order not found");
      }
    } catch (err) {
      console.error("Error fetching purchase order:", err);
      setError("Failed to load purchase order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const handleProductClick = (data: { action: string; data: any }) => {
    if (data.action === "view") {
      appNav.to(`/dashboard/inventory/products/view/${data.data.dealId}`);
    }
  };

  // Callback from OrderBoxes when boxes are received so we can refresh PO details
  const handleOrderBoxesCallback = async (a: {
    action: string;
    data?: any;
  }) => {
    if (a?.action === "receive") {
      await fetchPurchaseOrder();
    }
  };

  if (loading) {
    return (
      <div className="tw:min-h-screen tw:bg-gray-50">
        <AppHeader title="Purchase Order Details" />
        <div className="tw:max-w-7xl tw:mx-auto tw:px-4 tw:sm:px-6 tw:lg:px-8 tw:py-6">
          <div className="tw:flex tw:justify-center tw:items-center tw:min-h-[400px]">
            <AppSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?._id) {
    return (
      <div className="tw:min-h-screen tw:bg-gray-50">
        <AppHeader title="Purchase Order Details" />
        <div className="tw:max-w-7xl tw:mx-auto tw:px-4 tw:sm:px-6 tw:lg:px-8 tw:py-6">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:min-h-[400px]">
            <NoData
              title="Purchase Order Not Found"
              description={"The requested purchase order could not be found."}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Purchase Order Details" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <SkSellerAvailableNote />
          <div className="tw:flex tw:flex-col tw:sm:flex-row tw:justify-between tw:items-start tw:sm:items-center tw:gap-2 tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
              <PageHeading
                title={data?.orderId ? `#${data.orderId}` : t("viewOrder")}
                description="purchaseOrder"
              />
            </div>
            <ActionButtons
              purchaseOrder={data}
              onRefresh={fetchPurchaseOrder}
              refreshing={loading}
            />
          </div>

          {data?.isCoinStoreOrder && (
            <InfoBlock
              variant="warning"
              className="tw:mb-6 tw:flex tw:items-center tw:gap-2"
              size="sm"
            >
              <Coins size={16} className="tw:flex-shrink-0" />
              <span className="tw:font-semibold">
                This order was placed through the Coin Store
              </span>
            </InfoBlock>
          )}

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-1 tw:md:gap-6 tw:md:mb-6">
            <OrderInfo orderInfo={data.orderInfo} showMoreInfo={true} />
            <VendorInfo vendor={data.vendorInfo} />
            <FinanceInfo financeInfo={data.financeInfo} />
          </div>

          {/* Summary Cards */}
          {/* <div className="tw:mb-6">
            <Summary data={summary || undefined} />
          </div> */}

          {/* Tabs Section */}
          <div className="tw:mb-6">
            <AppTab
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {activeTab === "products" && (
            <>
              <Products
                items={data.formattedProducts}
                callback={handleProductClick}
              />
            </>
          )}

          {/* Tab Content */}

          {activeTab === "timeline" && (
            <Timeline logs={data?.auditLog || []} createdAt={data?.createdAt} />
          )}

          {activeTab === "returns" && (
            <div>
              <h3 className="tw:text-lg tw:font-semibold tw:mb-4">Returns</h3>
              <ReturnsTab returns={data.orderInfo?.returns || []} />
            </div>
          )}

          {activeTab === "documents" && (
            <div>
              <h3 className="tw:text-lg tw:font-semibold tw:mb-4">Documents</h3>
              <DocumentsTab
                invoiceDetails={data.financeInfo?.invoiceDetails}
                paymentSummary={data.financeInfo?.paymentSummary}
                damagedImages={data.damagedImages}
              />
            </div>
          )}

          {activeTab === "purchase-commission" && (
            <PurchaseCommission poId={String(data._id)} />
          )}

          {activeTab === "boxes" && (
            <OrderBoxes
              orderId={String(data._id)}
              notReceivedCount={data?.boxes?.needToReceive}
              receivedCount={data?.boxes?.received}
              callback={handleOrderBoxesCallback}
            />
          )}

          {activeTab === "invoices" && (
            <Invoices invoices={data.receivedPackages} />
          )}
        </div>
      </div>
    </>
  );
};

export default PurchaseOrderView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Purchase Order Details"),
    },
  ];
}
