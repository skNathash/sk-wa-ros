import { Mic, Plus, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import CustomerService from "~/services/CustomerService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import DirectorySidePane from "~/shared/network/components/directory-side-pane/DirectorySidePane";
import type { QuickAddKey } from "~/shared/network/components/directory-side-pane/QuickAdd";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import LinkCustomerRetailerModal from "~/shared/users/modals/link-customer-retailer/LinkCustomerRetailerModal";
import type {
  BreadcrumbItem,
  SectionTab,
  TabItem,
} from "~/types/CommonTypes";
// import CounterQrTab from "./components/CounterQrTab";
import OnboardedToday from "./components/OnboardedToday";
import PaylaterFirstTab from "./components/PaylaterFirstTab";
import VoiceAddTab from "./components/VoiceAddTab";
import WhyItWorks from "./components/WhyItWorks";
import ZeroFormTab from "./components/ZeroFormTab";
import {
  defaultFormData,
  MODE_BY_PARAM,
  preparePayload,
  validateForm,
  type OnboardMode,
} from "./helper";
import CustomerCreatedSuccessModal from "./modals/CustomerCreatedSuccessModal";

const breadcrumbData: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Customer Management",
    langKey: "networkManagement",
    redirect: {
      path: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
    },
  },
  {
    label: "Manage B2C Customer",
    langKey: "manageB2cCustomer",
  },
];

/** The four onboarding routes, in the order the counter should try them. */
const TABS: TabItem[] = [
  { key: "zero-form", name: "A · Zero-form", icon: <Plus /> },
  { key: "voice", name: "B · Voice add", icon: <Mic /> },
  // { key: "qr", name: "C · Counter QR", icon: <QrCode /> },
  { key: "paylater", name: "D · Paylater-first", icon: <Unlock /> },
];

/** Rail copy — why the active route beats asking for a form. */
const WHY_IT_WORKS: Record<OnboardMode, string> = {
  "zero-form":
    "The mobile number is the entire customer record on day one. Everything else — name, KYC, preferences — accretes over time from bills and WhatsApp. Ideal for the counter rush.",
  voice:
    "Mic tap → say the name and number. The retailer never puts the phone down, and a mishear is corrected in place before the customer is created.",
  qr: "Show the counter QR. Customer scans, WhatsApp opens, one tap saves. You see them join live. Also printable as a tent card.",
  paylater:
    "Start the customer with credit — the credit unlock IS the sign-up. No forms, no KYC. Consent via WhatsApp. Bill history becomes the credit score from bill #1.",
};

export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    blockForMasterLogin: true,
  });
}

const ManageB2c = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  // theme-2 mobile is the only view that gets the pill bar in the sticky slot.
  const theme2Mobile = useTheme() === "theme-2" && isMobile;
  const [searchParams, setSearchParams] = useSearchParams();
  const sourcePage = searchParams.get("sourcePage");
  const customerType = searchParams.get("customerType");

  const activeTab: OnboardMode =
    MODE_BY_PARAM[searchParams.get("mode") || ""] || "zero-form";

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMobile, setCreatedMobile] = useState("");
  const [linkModal, setLinkModal] = useState({ show: false, cid: "" });
  // Bumped after every successful onboarding so the rail re-pulls the list.
  const [onboardedKey, setOnboardedKey] = useState(0);

  const tabs = useMemo(() => TABS, []);

  /** theme-2 mobile hands the sticky section-tab slot over to these routes. */
  const onboardSectionTabs: SectionTab[] = useMemo(
    () =>
      TABS.map((tab) => ({
        key: tab.key,
        label: tab.name,
        icon: tab.icon,
        redirect: { url: "" },
      })),
    [],
  );

  /** `?mode=` is the single source of truth for the active route — the tab bar
   * and the side pane's picker both write it. */
  const handleModeChange = (mode: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("mode", mode);
    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (tab: TabItem) => handleModeChange(tab.key);

  /**
   * The one creation path all the form-shaped routes share — zero-form and
   * voice both land here, so validation, the toast and the success modal stay
   * identical between them.
   */
  const createCustomer = async (data: Record<string, any>) => {
    const values = { ...defaultFormData, ...data };

    const validation = validateForm(values, t);
    if (!validation.status) {
      appToast.show({ msg: validation.msg, color: "danger" });
      return false;
    }

    setSubmitting(true);
    try {
      const response = await CustomerService.createCustomer(
        preparePayload(values),
      );

      if (response?.statusCode === 200) {
        appToast.show({
          msg: t("customerCreatedSuccessfully"),
          color: "success",
        });
        setCreatedMobile(values.mobile || "");
        setShowSuccessModal(true);
        setOnboardedKey((key) => key + 1);
        return true;
      }

      appToast.show({
        msg: response?.data?.message || t("errorCreatingCustomer"),
        color: "danger",
      });
      return false;
    } catch (error: any) {
      console.error("Error creating customer:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("errorCreatingCustomer"),
        color: "danger",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title={t("manageB2cCustomer")} />
      <LinkCustomerRetailerModal
        show={linkModal.show}
        cid={linkModal.cid}
        callback={({ action }) => {
          setLinkModal({ show: false, cid: "" });
          if (action === "success") {
            appToast.show({
              msg: t("customerLinkedSuccessfully"),
              color: "success",
            });
            appNav.to("/dashboard/network/management/b2c-customers", {
              tab: "b2c-customers",
            });
          }
        }}
      />
      <CustomerCreatedSuccessModal
        show={showSuccessModal}
        hideAddAnother={sourcePage === "paylater-assign"}
        callback={({ action }) => {
          if (action === "close") {
            setShowSuccessModal(false);
            if (sourcePage === "paylater-assign") {
              appNav.to(
                `/dashboard/paylater/assign?type=${customerType || "b2c"}&mobile=${createdMobile}`,
              );
            } else {
              appNav.to("/dashboard/network/management/b2c-customers", {
                tab: "b2c-customers",
              });
            }
          } else if (action === "add_other") {
            setShowSuccessModal(false);
          }
        }}
      />
      <div className="app-page page-bg page-padding tw:min-h-screen">
        <div className="app-container">
          {/* Sticky bar — only shown in theme-2 mobile view (see theme-2.css).
              On that view the onboarding routes take the slot instead of the
              section tabs, so the page shows one tab bar, not two. */}
          {theme2Mobile ? (
            <SectionTabs
              tabs={onboardSectionTabs}
              activeTab={activeTab}
              onTabChange={(tab) => handleModeChange(tab.key)}
              variant="pills"
              noShadow
              sticky
            />
          ) : (
            <SectionTabs
              sectionKey="business"
              activeTab="customers"
              noShadow
              sticky
            />
          )}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="customers"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="theme-2-mobile-only tw:h-4" />
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — spans the full grid; in theme-2 desktop the
                    CSS lifts the side pane out of the grid into the fixed
                    list pane beside the section icon rail. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbData} />

                  {/* Skipped on theme-2 mobile — the sticky bar above already
                      carries these routes. */}
                  {theme2Mobile ? null : (
                    <AppTab
                      tabs={tabs}
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                      variant="underline"
                      cardClassName="tw:mb-0"
                    />
                  )}

                  <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="tw:min-w-0">
                      {activeTab === "zero-form" ? (
                        <ZeroFormTab
                          onCreate={createCustomer}
                          submitting={submitting}
                        />
                      ) : null}
                      {activeTab === "voice" ? (
                        <VoiceAddTab
                          onCreate={createCustomer}
                          submitting={submitting}
                        />
                      ) : null}
                      {/* {activeTab === "qr" ? (
                        <CounterQrTab refreshKey={onboardedKey} />
                      ) : null} */}
                      {activeTab === "paylater" ? (
                        <PaylaterFirstTab
                          onCreate={createCustomer}
                          submitting={submitting}
                        />
                      ) : null}
                    </div>

                    <div className="tw:space-y-4">
                      <WhyItWorks>{WHY_IT_WORKS[activeTab]}</WhyItWorks>
                      <OnboardedToday refreshKey={onboardedKey} />
                    </div>
                  </div>
                </AppPaneMain>

                {/* Side column — only rendered inside the theme-2 split layout,
                    where the CSS lifts it into the fixed pane. Same pane the
                    directory pages use; the quick-add rows are intercepted so
                    they switch this page's route instead of navigating to it.
                    Re-keyed after each create so the newly-added list re-pulls. */}
                <AppPaneSide className="app-pane-only">
                  <DirectorySidePane
                    key={onboardedKey}
                    title="Onboard"
                    scopeLabel={`${tabs.length} ways in`}
                    showChips={false}
                    showRecentActivity={false}
                    onQuickAddSelect={(key: QuickAddKey) =>
                      handleModeChange(MODE_BY_PARAM[key] || "zero-form")
                    }
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageB2c;
