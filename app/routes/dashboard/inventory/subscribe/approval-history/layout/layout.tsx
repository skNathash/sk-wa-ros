import { Outlet, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SubscribeTabs from "../../components/tabs/SubscribeTabs";
import SubscribeApprovalTab from "../components/tabs/SubscribeApprovalTab";
import AppButton from "~/components/core/button/AppButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import Rbac from "~/components/core/rbac/Rbac";
import AuthService from "~/services/AuthService";
import { getSubscribeHomeUrl } from "../../helper";

export default function SubscribeApprovalLayout() {
  const location = useLocation();
  const { t } = useTranslation(["common", "inventorySubscribe"]);
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version");

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    {
      label: "Create My Catalog",
      langKey: "inventorySubscribe:breadcrumbs.subscription",
      redirect: { path: getSubscribeHomeUrl(version) },
    },
    { label: "Subscribe Approval History" },
  ];

  // Determine active tab from pathname
  const path = location.pathname || "";
  let activeApprovalTab = "products";
  if (path.includes("/bulk-upload")) {
    activeApprovalTab = "bulk";
  } else if (path.includes("/subscribe-pending")) {
    activeApprovalTab = "subscribe-pending";
  } else if (path.includes("/products")) {
    activeApprovalTab = "products";
  }

  const renderButtons = (className = "") => {
    return (
      <div className={className}>
        <AppButton
          onClick={() => appNav.to(`/dashboard/inventory/subscribe/main`)}
          color="primary"
          size="small"
          className="tw:w-full tw:flex-1 tw:md:w-auto"
        >
          {t("subscribe", { ns: "common" })}
        </AppButton>

        <Rbac
          roles={["CATALOG.ADD-PRODUCTS"]}
          forceDisplay={AuthService.isMasterLogin()}
        >
          <AppButton
            onClick={() =>
              appNav.to("/dashboard/inventory/subscribe/add-product")
            }
            color="success"
            size="small"
            className="tw:w-full tw:flex-1 tw:md:w-auto"
          >
            {t("inventorySubscribe:actions.createProduct")}
          </AppButton>
        </Rbac>
      </div>
    );
  };

  return (
    <div>
      <AppHeader title="Subscribe Approval" />
      <div
        className={"app-page tw:p-4 page-bg" + (isMobile ? " has-footer" : "")}
      >
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:md:justify-between tw:gap-4 tw:mb-2">
            <div>
              <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
              <PageDescription
                description="approvalHistory"
                className="tw:mb-2"
              />
            </div>
            {!isMobile && (
              <div className="tw:flex tw:gap-2 tw:md:justify-start tw:w-full tw:md:w-auto tw:self-start">
                {renderButtons("tw:flex tw:gap-2 tw:items-center")}
              </div>
            )}
          </div>

          {/* {activeApprovalTab !== "products" && (
            <div className="tw:mb-4">
              <SubscribeTabs />
            </div>
          )} */}

          {/* Approval history specific tabs (Products / Bulk / Subscribe Pending) */}
          <div className="tw:mb-4">
            <SubscribeApprovalTab activeTab={activeApprovalTab} />
          </div>

          <Outlet />
        </div>
      </div>
      {isMobile && (
        <div className="app-footer tw:p-2">
          {renderButtons("tw:flex tw:gap-2")}
        </div>
      )}
    </div>
  );
}
