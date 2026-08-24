import { Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import Rbac from "~/components/core/rbac/Rbac";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import PageAccessService from "~/services/PageAccessService";
import VendorService from "~/services/VendorService";
import VendorNavService from "~/services/VendorNavService";
import RecordPaymentSuccessModal from "~/shared/accounts/modals/record-payment/success/RecordPaymentSuccessModal";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import VendorSidePane from "~/shared/vendor/components/vendor-side-pane/VendorSidePane";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import BasicInfo from "../overview/components/BasicInfo";

const rbacRoles = {
  recordPayment: ["ACCOUNTS.RECORD-PAYMENT"],
  viewStatement: ["VENDOR.VIEW-STATEMENT"],
  newPO: ["PURCHASE-ORDER.CREATE"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

const tabs: TabItem[] = [
  {
    name: "Overview",
    key: "overview",
    langKey: "overview",
  },
  {
    name: "Money",
    key: "money",
    langKey: "money",
  },
  {
    name: "Reorder",
    key: "reorder",
    langKey: "reorder",
  },
  {
    name: "Statement",
    key: "statement",
    langKey: "statement",
    rbac: rbacRoles.viewStatement,
  },
  {
    name: "Catalog",
    key: "products",
    langKey: "catalog",
  },
  {
    name: "Purchase Order",
    key: "purchase-order",
    langKey: "purchaseOrder",
  },

  // {
  //   name: "Payments & Transactions",
  //   key: "payments-transactions",
  //   langKey: "paymentsTransactions",
  // },
  // {
  //   name: "Returns",
  //   key: "returns",
  //   langKey: "returns",
  // },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "Vendors",
    redirect: {
      path: "/dashboard/vendor/list",
    },
    langKey: "vendors",
  },
  {
    label: "Vendor Detail",
    langKey: "vendorDetail",
  },
];

const VendorDetailLayout = () => {
  const { t } = useTranslation(["common", "menu"]);

  const location = useLocation();

  const appNav = useAppNav();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const vendorId = id || "";

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showInactiveVendorAlert, setShowInactiveVendorAlert] = useState(false);

  const [recordPaymentSuccessModal, setRecordPaymentSuccessModal] = useState({
    show: false,
    data: {
      name: "",
      isPayout: false,
      amount: 0,
    },
  });

  const activeTab = searchParams.get("tab") || "overview";

  const referesh = searchParams.get("refresh");

  const vendorName = vendor?.name || t("vendorDetail");
  const vendorLocation = useMemo(() => {
    const town = vendor?.address?.town || vendor?.address?.city || "";
    const pincode = vendor?.address?.pincode || vendor?.address?.postcode || "";
    return [town, pincode].filter(Boolean).join(" - ") || "-";
  }, [vendor]);

  const vendorCtx = useMemo(() => {
    return {
      sourceAllBrands: vendor?.sourceAllBrands,
      sourceableBrands: vendor?.sourceableBrands,
      vendorType: vendor?.vendorType,
      vendorName: vendor?.name,
      vendorPhone: vendor?.contact?.phone,
    };
  }, [vendor]);

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "overview") {
      appNav.replace(`/dashboard/vendor/view/${id}`);
    } else {
      appNav.replace(`/dashboard/vendor/view/${id}/${tab.key}`, {
        tab: tab.key,
      });
    }
  };

  const handleNewPO = () => {
    if (vendor?.status !== "Active") {
      setShowInactiveVendorAlert(true);
      return;
    }

    appNav.to("/dashboard/purchase-order/manage", {
      vid: vendor._id,
    });
  };

  useEffect(() => {
    const fetchVendor = async () => {
      if (!vendorId && !referesh) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const resp = await VendorService.getDetail(vendorId);

        const data = resp.data?.data || {};

        // Remember the vendor so the desktop rail's "Vendors" item can jump
        // straight back here (see VendorNavService).
        VendorNavService.rememberLastVendor(data._id || vendorId);

        setVendor({
          ...data,
          contact: {
            contactPerson: data.contact?.[0]?.name || "",
            email: data.contact?.[0]?.email || "",
            phone: data.contact?.[0]?.mobile || "",
            address: data?._fullAddress || "",
            // Locality-level line (state, district, town, pincode) shown in the
            // hero next to the distance; the full address stays for maps/contact.
            shortAddress: data?._shortAddress || "",
            distance: data?._distance != null ? `${data._distance} km` : "",
            categories: data.contact?.[0]?.categories || [],
          },
          finance: {
            gstNo: data.gst_no || "",
            panNo: data.pan || "",
          },
          overall: {},
        });
      } catch (e) {
        console.error("Error fetching vendor details:", e);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [vendorId, referesh]);

  const handleRecordPaymentModalCallback = (args: {
    action: string;
    data?: any;
  }) => {
    const { action, data } = args;

    setShowRecordPayment(false);
    if (action === "success") {
      setRecordPaymentSuccessModal({
        show: true,
        data: {
          name: data.name,
          isPayout: data.isPayout,
          amount: data.amount,
        },
      });
    }
  };

  const handleRecordPaymentSuccessModalCallback = (args: {
    action: string;
    data?: any;
  }) => {
    const { action, data } = args;

    setRecordPaymentSuccessModal({
      show: false,
      data: {
        name: "",
        isPayout: false,
        amount: 0,
      },
    });
  };

  return (
    <>
      <AppHeader
        title={vendorName}
        subtitle={
          vendor?._id ? (
            <span className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:truncate">{vendorLocation}</span>
              {vendor?.vendorId ? (
                <>
                  <span>·</span>
                  <span>#{vendor.vendorId}</span>
                </>
              ) : null}
            </span>
          ) : null
        }
      />
      <div
        className={`app-page page-bg page-padding${
          activeTab === "statement" ||
          activeTab === "money" ||
          activeTab === "reorder"
            ? " has-footer"
            : ""
        }`}
      >
        <div className="app-container">
          {/* No section tab bar here — the vendor identity band + tabs pin
              directly under the app header as one hero (see `.detail-hero*`
              in theme-2.css), the same way the seller detail page reads. */}

          <div className="section-layout section-layout--tight">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="vendors"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane). */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <div className="tw:mb-2 hide-in-theme-2">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:mb-1!" />
                  </div>
                  {loading ? (
                    <ContentLoader cards={3} lines={4} />
                  ) : !vendor ? (
                    <div className="tw:text-center tw:py-8 tw:text-gray-500">
                      {t("noDataFound")}
                    </div>
                  ) : (
                    <>
                      {/* Vendor info sits above the tabs on every breakpoint,
                          and the two pin together under the header as one
                          full-bleed band — see `.detail-hero*` in theme-2.css.
                          The wrapper is `display: contents` below md, so the
                          tab bar keeps its own sticky behaviour there. */}
                      <div className="detail-hero">
                        <div className="tw:mb-4 app-bleed-x detail-hero-bleed">
                          <BasicInfo data={vendor} />
                        </div>

                        <AppTab
                          activeTab={activeTab}
                          tabs={tabs}
                          onTabChange={handleTabChange}
                          variant="underline"
                          className="tw:mb-4 tw:sticky tw:top-15 tw:z-30 edge-tabs vendor-tab-sticky detail-hero-tabs"
                        />
                      </div>

                      <Outlet context={vendorCtx} />
                    </>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    vendor list pane beside the section icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <VendorSidePane activeVendorId={vendorId} />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* New PO FAB — rounded pill pinned above the bottom tab bar (mirrors
          the shared AddVendorFab). Replaces the in-card New PO button. */}
      {activeTab !== "statement" &&
        activeTab !== "money" &&
        activeTab !== "reorder" &&
        vendor &&
        vendor?.vendorType !== "OWN" && (
          <div
            className="tw:fixed tw:right-4 tw:z-50"
            style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          >
            <Rbac roles={rbacRoles.newPO}>
              <button
                type="button"
                onClick={handleNewPO}
                aria-label={t("newPO")}
                className="tw:bg-primary tw:text-primary-foreground tw:h-11 tw:px-4 tw:rounded-full tw:shadow-lg tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold tw:cursor-pointer"
              >
                <Package className="tw:w-5 tw:h-5" />
                {t("newPO")}
              </button>
            </Rbac>
          </div>
        )}
      {/* Record Payment Modal */}
      <RecordPaymentModal
        show={showRecordPayment}
        callback={handleRecordPaymentModalCallback}
        entityId={vendorId}
        entityType={"vendor"}
        hideTabs={true}
        paymentType="makePayout"
      />

      {/* Inactive Vendor Alert Dialog */}
      <AppAlertDialog
        show={showInactiveVendorAlert}
        title={t("cannotCreatePurchaseOrder")}
        description={t("purchaseOrderInactiveVendor")}
        type="alert"
        okText={t("ok")}
        onConfirm={() => setShowInactiveVendorAlert(false)}
        onCancel={() => setShowInactiveVendorAlert(false)}
      />

      <RecordPaymentSuccessModal
        show={recordPaymentSuccessModal.show}
        callback={handleRecordPaymentSuccessModalCallback}
        counterpartyName={recordPaymentSuccessModal.data?.name}
        isPayout={recordPaymentSuccessModal.data?.isPayout}
        amount={recordPaymentSuccessModal.data?.amount}
      />
    </>
  );
};

export default VendorDetailLayout;

type ContextType = {
  sourceAllBrands: boolean;
  sourceableBrands: any[];
  vendorType?: string;
  vendorName?: string;
  vendorPhone?: string;
};

export const useVendorCtx = () => {
  return useOutletContext<ContextType>();
};
