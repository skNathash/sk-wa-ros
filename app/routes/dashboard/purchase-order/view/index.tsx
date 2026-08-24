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
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import OrderBoxes from "~/shared/orders/order-boxes/OrderBoxes";
import SkSellerAvailableNote from "~/shared/vendor/components/sk-seller-available/SkSellerAvailableNote";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
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
  const { t } = useTranslation(["common", "menu"]);
  const { id } = useParams<{ id: string }>();
  const appNav = useAppNav();
  const isTheme2 = useTheme() === "theme-2";
  const { isMobile } = useScreenView();

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

  const hasData = !!data?._id;

  return (
    <>
      <AppHeader title="Purchase Order Details" />
      <div className="app-page page-padding page-bg">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="purchase-orders"
            noShadow
            sticky
          /> */}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="purchase-orders"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
                  <SkSellerAvailableNote />
                  {/* `app-detail-head` turns this row into the record's
                      identity band on theme-2 mobile — a white strip flush
                      under the app header carrying the order id and its
                      actions. No-op elsewhere. */}
                  <div className="app-detail-head tw:flex tw:flex-col tw:sm:flex-row tw:justify-between tw:items-start tw:sm:items-center tw:gap-2 tw:mb-4">
                    <div>
                      <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                      <PageHeading
                        title={
                          data?.orderId ? `#${data.orderId}` : t("viewOrder")
                        }
                        description="purchaseOrder"
                      />
                    </div>
                    {hasData && (
                      <ActionButtons
                        purchaseOrder={data}
                        onRefresh={fetchPurchaseOrder}
                        refreshing={loading}
                      />
                    )}
                  </div>

                  {!hasData ? (
                    loading ? (
                      <div className="tw:flex tw:justify-center tw:items-center tw:min-h-[400px]">
                        <AppSpinner />
                      </div>
                    ) : (
                      <div className="tw:min-h-[400px]">
                        <NoData
                          title="Purchase Order Not Found"
                          description={
                            "The requested purchase order could not be found."
                          }
                        />
                      </div>
                    )
                  ) : (
                    <div className="tw:relative">
                      {loading && (
                        <div className="tw:absolute tw:inset-0 tw:bg-white/60 tw:z-10 tw:flex tw:justify-center tw:items-start tw:pt-24">
                          <AppSpinner size="sm" />
                        </div>
                      )}
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

                      {/* `app-detail-sheet` collapses this card grid into a
                          stack of full-bleed settings-style groups on theme-2
                          mobile. The grid is untouched from md up. */}
                      <div className="app-detail-sheet tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:md:gap-6 tw:md:mb-6 tw:mb-4 tw:items-stretch">
                        <OrderInfo
                          orderInfo={data.orderInfo}
                          showMoreInfo={true}
                        />
                        <VendorInfo vendor={data.vendorInfo} />
                        <FinanceInfo financeInfo={data.financeInfo} />
                      </div>

                      {/* Summary Cards */}
                      {/* <div className="tw:mb-6">
                        <Summary data={summary || undefined} />
                      </div> */}

                      {/* Tabs Section — theme-2 uses the underline variant on
                          desktop; on a phone the free-standing pills read as
                          the chip row WhatsApp puts under a header, matching
                          the section bar above. */}
                      <div className="tw:mb-6">
                        <AppTab
                          tabs={tabs}
                          activeTab={activeTab}
                          onTabChange={handleTabChange}
                          variant={
                            isTheme2
                              ? isMobile
                                ? "pills"
                                : "underline"
                              : "tabs"
                          }
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
                        <Timeline
                          logs={data?.auditLog || []}
                          createdAt={data?.createdAt}
                        />
                      )}

                      {activeTab === "returns" && (
                        <div>
                          <h3 className="tw:text-lg tw:font-semibold tw:mb-4">
                            Returns
                          </h3>
                          <ReturnsTab returns={data.orderInfo?.returns || []} />
                        </div>
                      )}

                      {activeTab === "documents" && (
                        <div>
                          <h3 className="tw:text-lg tw:font-semibold tw:mb-4">
                            Documents
                          </h3>
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
                  )}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
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
