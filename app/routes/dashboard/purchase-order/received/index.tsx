import { ArrowRight, PackagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InvoiceReconciliation from "./components/InvoiceReconciliation";
import InwardedList from "./components/InwardedList";
import ReceivedHeader from "./components/ReceivedHeader";
import ReceivedSummary from "./components/ReceivedSummary";
import ReturnedList from "./components/ReturnedList";
import { loadReceivedDetails } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["PURCHASE-ORDER.PO-VIEW-ORDERS"]);
}

/**
 * Receipt screen — the page the receive flow lands on once a PO is confirmed.
 * Reads the PO from the `poId` query param and reports what closed: the four
 * headline counts, what went into stock, and what is still owed by the vendor.
 */
const PurchaseOrderReceived = () => {
  const [searchParams] = useSearchParams();
  const poId = searchParams.get("poId") || searchParams.get("id") || "";

  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [loading, setLoading] = useState<boolean>(true);
  const [poDetails, setPoDetails] = useState<any>(null);

  const vendorName =
    poDetails?.vendorDetails?.name || poDetails?.vendorInfo?.name || "";

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("dashboard"), redirect: { path: "/dashboard" } },
    {
      label: t("purchaseOrders"),
      redirect: { path: "/dashboard/purchase-order/summary" },
    },
    {
      label: poDetails?.orderId
        ? `${t("received")} - ${poDetails.orderId}`
        : t("received"),
    },
  ];

  useEffect(() => {
    fetchDetails();
  }, [poId]);

  const fetchDetails = async () => {
    if (!poId) {
      setLoading(false);
      appToast.show({
        msg: t("purchaseOrderIdRequired"),
        color: "danger",
      });
      return;
    }

    try {
      setLoading(true);
      const details = await loadReceivedDetails(poId);

      if (!details) {
        appToast.show({ msg: "Purchase order not found", color: "danger" });
      }

      setPoDetails(details);
    } catch (error) {
      console.error("Error fetching received PO details:", error);
      appToast.show({
        msg: "Failed to load purchase order details",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptPdf = () => {
    if (!poDetails?._id) return;
    PurchaseOrderService.printOrder(poDetails._id);
  };

  const handleViewPoLog = () => {
    if (!poDetails?._id) return;
    appNav.to(`/dashboard/purchase-order/view/${poDetails._id}`);
  };

  const handleRaiseNextPo = () => {
    const vendorId =
      poDetails?.vendorDetails?.id || poDetails?.vendorInfo?.id || "";
    appNav.to(
      vendorId
        ? `/dashboard/purchase-order/manage?vid=${vendorId}`
        : "/dashboard/purchase-order/manage",
    );
  };

  const handleSendToVendor = () => {
    if (!poDetails) return;

    const vendor = poDetails.vendorDetails || poDetails.vendorInfo || {};
    const summary = poDetails._summary;

    const message = [
      `Purchase order ${poDetails.orderId} has been received.`,
      `Ordered: ${summary.ordered} units`,
      `Inwarded: ${summary.inwarded} units`,
      summary.damaged > 0 ? `Damaged: ${summary.damaged} units` : "",
      summary.pending > 0 ? `Pending: ${summary.pending} units` : "",
    ]
      .filter(Boolean)
      .join("\n");

    CommonService.openInNewWindow(
      CommonService.prepareWhatsappMessage(
        message,
        vendor.mobileNumber || vendor.mobile || vendor.phone || "",
      ),
    );
  };

  return (
    <>
      <AppHeader
        title={t("purchaseOrderReceived", {
          defaultValue: "Purchase Order - Received",
        })}
      />

      <div
        className={`page-padding page-bg app-page ${poDetails ? "has-footer" : ""}`}
      >
        <div className="app-container">
          {/* Section tab rail hidden here — this is a receipt detail screen,
              not a section landing page. */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="receive-stock"
            noShadow
            sticky
          /> */}

          <div className="section-layout page-content-gap">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="receive-stock"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

                  {loading ? (
                    <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
                      <BusyLoader show={true} />
                    </div>
                  ) : !poDetails ? (
                    <NoData
                      title={t("purchaseOrderNotFound", {
                        defaultValue: "Purchase order not found",
                      })}
                      description={t("purchaseOrderNotFoundHint", {
                        defaultValue:
                          "We couldn't load the receipt for this purchase order.",
                      })}
                    />
                  ) : (
                    <>
                      <ReceivedHeader
                        poDetails={poDetails}
                        onReceiptPdf={handleReceiptPdf}
                        onSendToVendor={handleSendToVendor}
                      />

                      <ReceivedSummary summary={poDetails._summary} />

                      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4">
                        <InwardedList items={poDetails._inwardedItems} />
                        <ReturnedList items={poDetails._returnedItems} />
                      </div>

                      <InvoiceReconciliation
                        poDetails={poDetails}
                        summary={poDetails._summary}
                      />
                    </>
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

      {/* Footer Section — the two places a store goes next once a PO closes. */}
      {poDetails && (
        <footer className="app-footer">
          <div className="app-container">
            {/* Mobile stacks the two actions full width (primary at the
                bottom, closest to the thumb); from `sm` up they sit on one
                right-aligned row. */}
            <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center tw:sm:justify-end">
              <AppButton
                fill="outline"
                color="light"
                onClick={handleViewPoLog}
                className="tw:w-full tw:bg-white tw:sm:w-auto"
              >
                {t("viewInPoLog", { defaultValue: "View in PO log" })}
                <ArrowRight />
              </AppButton>

              <AppButton
                color="primary"
                onClick={handleRaiseNextPo}
                className="tw:w-full tw:min-w-0 tw:sm:w-auto"
              >
                <PackagePlus className="tw:shrink-0" />
                <span className="tw:truncate">
                  {t("raiseNextPoTo", {
                    defaultValue: "Raise next PO to {{vendor}}",
                    vendor: vendorName,
                  })}
                </span>
              </AppButton>
            </div>
          </div>
        </footer>
      )}
    </>
  );
};

export default PurchaseOrderReceived;
