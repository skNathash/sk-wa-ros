import { Plus } from "lucide-react";
import { Outlet, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SubscribeApprovalTab from "../components/tabs/SubscribeApprovalTab";
import AppButton from "~/components/core/button/AppButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import Rbac from "~/components/core/rbac/Rbac";
import AuthService from "~/services/AuthService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SubscribeNavChips from "~/shared/inventory/components/subscribe-nav-chips/SubscribeNavChips";
import SubscribeSidePane from "~/shared/inventory/components/subscribe-side-pane/SubscribeSidePane";
import { getSubscribeHomeUrl } from "../../helper";

export default function SubscribeApprovalLayout() {
  const location = useLocation();
  const { t } = useTranslation(["common", "inventorySubscribe", "menu"]);
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version");

  // Titled with the chip that leads here from the catalog side pane / nav strip
  // ("Approval History"), so the header matches what was tapped.
  const approvalTitle = t("inventorySubscribe:tabs.history", {
    defaultValue: "Approval History",
  });

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    {
      label: "Create My Catalog",
      langKey: "inventorySubscribe:breadcrumbs.subscription",
      redirect: { path: getSubscribeHomeUrl(version) },
    },
    { label: approvalTitle },
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
      <AppHeader
        title={approvalTitle}
        renderActions={
          isTheme2 && !isMobile ? (
            <Rbac
              roles={["CATALOG.ADD-PRODUCTS"]}
              forceDisplay={AuthService.isMasterLogin()}
            >
              <AppButton
                onClick={() =>
                  appNav.to("/dashboard/inventory/subscribe/add-product")
                }
                color="primary"
                size="small"
                className="tw:flex tw:items-center tw:gap-1"
              >
                <Plus />
                {t("inventorySubscribe:actions.addProduct")}
              </AppButton>
            </Rbac>
          ) : undefined
        }
      />
      <div
        // theme-2 mobile hides the action footer, so don't reserve room for it.
        className={
          "app-page tw:p-4 page-bg" +
          (isMobile && !isTheme2 ? " has-footer" : "")
        }
      >
        {/* Section tabs — replaced on mobile by the SubscribeNavChips strip
            below, so the two sticky bars don't stack (same as the subscribe
            layout). */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="library"
                title={t("menu:manageCatalog")}
              />
            </div>
          </aside>

          {/* `subscribe-flush-top` cancels the page's 1rem top gutter on
              theme-2 mobile so the chip strip sits flush under the sticky
              header (see theme-2.css). */}
          <div className="section-content app-container subscribe-flush-top">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {/* theme-2 hides the breadcrumbs, page description and the
                    top-right actions (the side pane carries those entries), so
                    the whole row would collapse to an empty band that still
                    pays its bottom margin — skip it entirely there. */}
                {!isTheme2 && (
                  <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:md:items-center tw:md:justify-between tw:gap-4 tw:mb-2">
                    <div>
                      <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
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
                )}

                {/* The sub-nav and the routed content share this wrapper so the
                    sticky chip strip has a tall enough parent to travel over as
                    the page scrolls (position:sticky is bounded by its parent's
                    box). `has-subscribe-nav` tells the pages' sticky bars there
                    is a chip strip above them to pin under. */}
                <div className="app-tabs-flush has-subscribe-nav">
                  {/* Mobile sub-nav — the same catalog chip strip the other
                      subscribe pages carry, so History is reachable from (and
                      leads back to) Discover / Search / Menus on mobile. */}
                  <SubscribeNavChips className="tw:mb-2" />

                  {/* Approval history specific tabs (Products / Bulk / Subscribe
                      Pending). `app-tabs-band` keeps the row on the same white
                      sheet as the chip strip above on theme-2 mobile. */}
                  <div className="tw:mb-4 app-tabs-band">
                    <SubscribeApprovalTab activeTab={activeApprovalTab} />
                  </div>

                  <Outlet />
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <SubscribeSidePane scopeLabel="Approval" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
      {isMobile && (
        <div className="app-footer theme-2-mobile-hide tw:p-2">
          {renderButtons("tw:flex tw:gap-2")}
        </div>
      )}
    </div>
  );
}
