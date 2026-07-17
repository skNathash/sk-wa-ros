import { CreditCard, FileText, Package, PencilIcon } from "lucide-react";
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
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import PageLoader from "~/components/core/page-loader/PageLoader";
import Rbac from "~/components/core/rbac/Rbac";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import PageAccessService from "~/services/PageAccessService";
import VendorService from "~/services/VendorService";
import RecordPaymentSuccessModal from "~/shared/accounts/modals/record-payment/success/RecordPaymentSuccessModal";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";

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
    name: "Purchase Order",
    key: "purchase-order",
    langKey: "purchaseOrder",
  },
  {
    name: "Products/Brands",
    key: "products",
    langKey: "productsBrands",
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

  const vendorCtx = useMemo(() => {
    return {
      sourceAllBrands: vendor?.sourceAllBrands,
      sourceableBrands: vendor?.sourceableBrands,
    };
  }, [vendor]);

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "overview") {
      appNav.to(`/dashboard/vendor/view/${id}`);
    } else {
      appNav.to(`/dashboard/vendor/view/${id}/${tab.key}`, {
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

        setVendor({
          ...data,
          contact: {
            contactPerson: data.contact?.[0]?.name || "",
            email: data.contact?.[0]?.email || "",
            phone: data.contact?.[0]?.mobile || "",
            address: data?._fullAddress || "",
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
      <AppHeader title={t("vendorDetail")} />
      <div className="app-page page-bg page-padding">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="supply"
            activeTab="vendors"
            noShadow
            sticky
          />

          <div className="section-layout">
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
              <div className="theme-2-mobile-only tw:h-4" />
              <div className="tw:mb-2">
                <AppBreadcrumbs data={breadcrumbs} className="tw:mb-1!" />
                <PageDescription description="vendorDetails" />
              </div>
              {loading ? (
                <PageLoader message={t("loading")} />
              ) : !vendor ? (
                <div className="tw:text-center tw:py-8 tw:text-gray-500">
                  {t("noDataFound")}
                </div>
              ) : (
                <>
              <AppCard bodyClassName="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2">
                <div>
                  <div className="tw:font-semibold tw:text-2xl tw:mb-1 tw:flex tw:items-center tw:gap-2">
                    {vendor?.name || t("vendorName")}
                  </div>
                  <div className="tw:flex tw:gap-2 tw:items-center tw:mb-1">
                    <AppBadge
                      variant={
                        vendor.status === "Active" ? "success" : "danger"
                      }
                      className="tw:mt-1"
                    >
                      {vendor.status}
                    </AppBadge>

                    {vendor._vendorType && (
                      <VendorTypeBadge
                        type={vendor._vendorType}
                        color={vendor._vendorTypeColor}
                        description={vendor._vendorTypeInfo}
                      />
                    )}

                    <span className="tw:text-sm tw:text-gray-500">
                      ID: {vendor.vendorId}
                    </span>
                  </div>
                </div>
                <div className="tw:flex tw:gap-2 tw:flex-wrap">
                  {/* {vendor?._isCreatedByMe && vendor?.vendorType !== "OWN" && (
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={() =>
                        appNav.to("/dashboard/vendor/manage", { id: vendorId })
                      }
                    >
                      <PencilIcon />
                      {t("editVendor")}
                    </AppButton>
                  )} */}
                  {vendor?.vendorType !== "OWN" && (
                    <Rbac roles={rbacRoles.recordPayment}>
                      <AppButton
                        size="small"
                        color="light"
                        fill="outline"
                        onClick={() => setShowRecordPayment(true)}
                      >
                        <CreditCard /> {t("recordPayment")}
                      </AppButton>
                    </Rbac>
                  )}
                  <Rbac roles={rbacRoles.viewStatement}>
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={() =>
                        appNav.to("/dashboard/vendor/statement/" + vendorId)
                      }
                    >
                      {/* You can replace with a statement icon if available */}
                      <FileText /> {t("viewStatement")}
                    </AppButton>
                  </Rbac>
                  {vendor?.vendorType !== "OWN" && (
                    <Rbac roles={rbacRoles.newPO}>
                      <AppButton
                        size="small"
                        color="dark"
                        onClick={handleNewPO}
                      >
                        <Package /> {t("newPO")}
                      </AppButton>
                    </Rbac>
                  )}
                </div>
              </AppCard>

              <AppTab
                activeTab={activeTab}
                tabs={tabs}
                onTabChange={handleTabChange}
                className="tw:mb-4"
              />

              <Outlet context={vendorCtx} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
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

type ContextType = { sourceAllBrands: boolean; sourceableBrands: any[] };

export const useVendorCtx = () => {
  return useOutletContext<ContextType>();
};
