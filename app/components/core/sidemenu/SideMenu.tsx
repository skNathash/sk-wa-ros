import { PlayCircleIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ImgRender from "~/components/core/img/ImgRender";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "~/components/ui/sidebar";
import { CLUB_STORE_URL } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import { useLocation } from "react-router";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import SidemenuService from "~/services/SidemenuService";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import LearnAppModal from "~/shared/others/modals/LearnAppModal";
import ViewMyClubModal from "~/shared/store/view-my-club/ViewMyClubModal";
import { attachCountsToMenu } from "./helper";
import LanguageSelector from "./LanguageSelector";
import SideMenuButton from "./SideMenuButton";
import ThemeSelector from "./ThemeSelector";
import UserProfile from "./UserProfile";
import MiscService from "~/services/MiscService";

const normalizePath = (path: string) =>
  path.split("?")[0].split("#")[0].replace(/\/$/, "");

const isMenuPathActive = (
  currentPath: string,
  currentSearch: string,
  menuPath?: string,
) => {
  if (!menuPath) return false;

  const [menuPathOnly, menuQuery] = menuPath.split("#")[0].split("?");
  const normalizedMenuPath = normalizePath(menuPathOnly);
  const pathMatches =
    currentPath === normalizedMenuPath ||
    (currentPath.startsWith(normalizedMenuPath) &&
      (!currentPath[normalizedMenuPath.length] ||
        currentPath[normalizedMenuPath.length] === "/"));
  if (!pathMatches) return false;

  if (menuQuery) {
    const current = new URLSearchParams(currentSearch);
    const required = new URLSearchParams(menuQuery);
    const requiredKeys = new Set<string>();

    for (const [key, value] of required) {
      requiredKeys.add(key);
      if (current.get(key) !== value) return false;
    }

    for (const key of current.keys()) {
      if (!requiredKeys.has(key) && key === "assisted") return false;
    }
  }

  return true;
};

const hasActiveDescendant = (
  item: any,
  currentPath: string,
  currentSearch: string,
): boolean => {
  if (isMenuPathActive(currentPath, currentSearch, item.path)) return true;
  return (item.children || []).some((child: any) =>
    hasActiveDescendant(child, currentPath, currentSearch),
  );
};

export default function SideMenu() {
  const appNav = useAppNav();

  const initialMenu = SidemenuService.getSidemenu();
  const [menuItems, setMenuItems] = useState(initialMenu);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { t: tMenu } = useTranslation("menu");

  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [viewMyClubModal, setViewMyClubModal] = useState<{
    show: boolean;
    value: string;
  }>({ show: false, value: "" });

  const [whatsappTemplateModal, setWhatsappTemplateModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const appToast = useAppToast();

  const [isFranchiseProfileComplete, setIsFranchiseProfileComplete] =
    useState<boolean>(true);

  const [hasSubscribedToAnyDeal, setHasSubscribedToAnyDeal] =
    useState<boolean>(false);

  const [hasActivePlan, setHasActivePlan] = useState<boolean>(false);
  useEffect(() => {
    setHasActivePlan(FranchiseService.isActivePlanAvailable());
  }, []);

  useEffect(() => {
    // Ensure parent groups are expanded when any child route is active
    const currentPath = normalizePath(location.pathname);
    const currentSearch = location.search;

    const activeParents: string[] = [];

    const collectActiveParents = (items: any[]) => {
      items.forEach((item) => {
        if (item.key && item.children && item.children.length > 0) {
          if (
            item.children.some((child) =>
              hasActiveDescendant(child, currentPath, currentSearch),
            )
          ) {
            activeParents.push(item.key);
          }
          collectActiveParents(item.children);
        }
      });
    };

    collectActiveParents(menuItems);

    if (activeParents.length > 0) {
      setExpandedGroups((prev) => {
        const newSet = new Set(prev);
        activeParents.forEach((k) => newSet.add(k));
        return newSet;
      });
    }
  }, [location.pathname, location.search, menuItems]);

  useEffect(() => {
    const handlePlanSubscribed = (event: CustomEvent) => {
      // When a new plan is purchased, refresh active plan availability
      try {
        setHasActivePlan(FranchiseService.isActivePlanAvailable());
        setHasSubscribedToAnyDeal(AuthService.hasSubscribedToAnyDeal());
      } catch (e) {
        setHasActivePlan(true);
      }
    };

    // listen to the global event created by MiscService
    document.addEventListener(
      "platform-plan",
      handlePlanSubscribed as EventListener,
    );

    return () => {
      document.removeEventListener(
        "platform-plan",
        handlePlanSubscribed as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchAndUpdate = async () => {
      try {
        const updated = await attachCountsToMenu(initialMenu);
        if (mounted) setMenuItems(updated);
      } catch (e) {
        // ignore
      }
    };

    // initial immediate fetch
    fetchAndUpdate();

    // poll every 60 seconds
    const interval = window.setInterval(fetchAndUpdate, 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // read profile completeness from AuthService (sync)
    try {
      const resp = AuthService.isFranchiseProfileComplete();
      if (AuthService.isMasterLogin()) {
        setIsFranchiseProfileComplete(true);
      } else {
        setIsFranchiseProfileComplete(!!resp.status);
      }
    } catch (e) {
      setIsFranchiseProfileComplete(true);
    }

    setHasSubscribedToAnyDeal(AuthService.hasSubscribedToAnyDeal());
  }, []);

  useEffect(() => {
    const handleSubscribeAdded = (event: CustomEvent) => {
      const detail = event?.detail || {};

      if (detail?.bulk) {
        if (detail?.count > 0) {
          setHasSubscribedToAnyDeal(true);
        } else {
          setHasSubscribedToAnyDeal(true);
        }
      }
    };

    document.addEventListener(
      "subscribe-success",
      handleSubscribeAdded as EventListener,
    );

    return () => {
      document.removeEventListener(
        "subscribe-success",
        handleSubscribeAdded as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdated = () => {
      if (AuthService.isMasterLogin()) {
        setIsFranchiseProfileComplete(true);
      } else {
        setIsFranchiseProfileComplete(
          AuthService.isFranchiseProfileComplete().status,
        );
      }
    };

    MiscService.listenEvent("profile-updated", handleProfileUpdated);

    return () => {
      MiscService.removeEvent("profile-updated", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const handleShowInvite = (event: any) => {
      try {
        const user = AuthService.getLoggedInUser();
        const mobile = (user && (user as any).mobile) || null;
        if (mobile) {
          const url = CLUB_STORE_URL + mobile;
          setOpenMobile(false);
          setViewMyClubModal({ show: true, value: url });
        }
      } catch (e) {
        // ignore
      }
    };

    MiscService.listenEvent("showInviteModal", handleShowInvite);

    return () => {
      MiscService.removeEvent("showInviteModal", handleShowInvite);
    };
  }, [setOpenMobile]);

  const handleLogoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpenMobile(false);
    appNav.to("/pos/billing");
  };

  const handleShareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const waUrl = CommonService.prepareWhatsappMessage(
      `Hi! 👋You can now explore our latest products and offers on our online store.Visit us here: ${window.location.origin}`,
      "",
    );
    CommonService.windowOpenHandler(waUrl, () => {});
  };

  const openLearnModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowLearnModal(true);
  };

  const closeLearnModal = () => setShowLearnModal(false);

  const handleViewMyClubCallback = ({ action, data }: any) => {
    if (action === "whatsapp") {
      setViewMyClubModal({ show: false, value: "" });
      setWhatsappTemplateModal({
        show: true,
        data: {
          dynamicData: {
            ...data,
            franchiseId: AuthService.getLoggedInUserId(),
          },
        },
      });
    }
  };

  const handleWhatsappTemplateCallback = ({ action }: any) => {
    if (action === "close") {
      setWhatsappTemplateModal({ show: false, data: null });
    } else if (action === "send") {
      setWhatsappTemplateModal({ show: false, data: null });
      appToast.show({ msg: "WhatsApp message sent", color: "success" });
    } else if (action === "send_error") {
      setWhatsappTemplateModal({ show: false, data: null });
      appToast.show({ msg: "Failed to send WhatsApp", color: "danger" });
    }
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const renderMenuItems = (
    items: any[],
    depth = 0,
  ): React.ReactNode[] => {
    return items.flatMap((item) => {
      const isExpanded = item.key ? expandedGroups.has(item.key) : false;
      const hasChildren = !!(item.children && item.children.length > 0);
      const childNodes =
        hasChildren && item.key && isExpanded ? (
          <SidebarMenuSub key={`${item.id || item.label}-children`}>
            {renderMenuItems(item.children, depth + 1)}
          </SidebarMenuSub>
        ) : null;

      const itemNode =
        depth > 0 ? (
          <SidebarMenuSubItem key={item.id || item.label}>
            <SideMenuButton
              item={item}
              tMenu={tMenu}
              className=""
              hideIcon={!hasChildren}
              setOpenMobile={setOpenMobile}
              hasActivePlan={true}
              hasSubscribedToAnyDeal={hasSubscribedToAnyDeal}
              isFranchiseProfileComplete={isFranchiseProfileComplete}
              disabled={
                (hasSubscribedToAnyDeal === false &&
                  item.key !== "createMyCatalog" &&
                  item.key !== "accountSummary") ||
                !isFranchiseProfileComplete
              }
              isExpanded={isExpanded}
              onToggleExpand={() => item.key && toggleGroup(item.key)}
            />
            {childNodes}
          </SidebarMenuSubItem>
        ) : (
          <React.Fragment key={item.id || item.label}>
            <SideMenuButton
              item={item}
              tMenu={tMenu}
              hideIcon={!hasChildren}
              setOpenMobile={setOpenMobile}
              hasActivePlan={true}
              hasSubscribedToAnyDeal={hasSubscribedToAnyDeal}
              isFranchiseProfileComplete={isFranchiseProfileComplete}
              disabled={
                (hasSubscribedToAnyDeal === false &&
                  item.key !== "createMyCatalog" &&
                  item.key !== "accountSummary") ||
                !isFranchiseProfileComplete
              }
              isExpanded={isExpanded}
              onToggleExpand={() => item.key && toggleGroup(item.key)}
            />
            {childNodes}
          </React.Fragment>
        );

      return [
        itemNode,
      ];
    });
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="tw:bg-white tw:border-b tw:border-b-gray-200">
          <div className="tw:flex tw:items-center tw:gap-3 tw:px-2">
            <ImgRender src="logo.svg" alt="Logo" className="tw:w-10 tw:h-10" />
            <div
              className="tw:flex tw:flex-col tw:cursor-pointer"
              onClick={handleLogoClick}
            >
              <span className="tw:text-lg tw:font-bold tw:flex tw:gap-1 tw:items-center">
                StoreKing ROS
                <button
                  className="tw:text-xs tw:text-sidebar-foreground/70 tw:flex tw:items-center tw:justify-center tw:cursor-pointer tw:ml-2"
                  onClick={openLearnModal}
                  aria-label="Learn about the app"
                  title="Listen to app overview"
                >
                  <PlayCircleIcon size={18} />
                </button>
              </span>
              <span className="tw:text-xs tw:text-sidebar-foreground/70">
                Retail Operating System
              </span>
            </div>
          </div>
        </SidebarHeader>
        {/* <SidebarSeparator /> */}
        <SidebarContent className="tw:bg-white tw:overflow-y-hidden tw:relative">
          <ScrollArea className="tw:h-[calc(100vh-14rem)] tw:px-4 tw:pb-0">
            <SidebarMenu>
              {/* Language Selector - Compact */}
              <SidebarMenuItem className="tw:py-1">
                <LanguageSelector />
              </SidebarMenuItem>

              {/* Theme switcher — swaps the whole app to theme-2 (Modern). */}
              <SidebarMenuItem className="tw:py-1">
                <ThemeSelector />
              </SidebarMenuItem>

              <SidebarSeparator />

              {/* Existing Menu Items */}
              {renderMenuItems(menuItems)}
            </SidebarMenu>
          </ScrollArea>

          {/* Compact Invite Customer Block */}
          <div className="tw:absolute tw:bottom-0 tw:left-0 tw:right-0 tw:bg-gray-50/25 tw:border-t tw:border-gray-200 tw:z-10">
            <button
              onClick={() => {
                const user = AuthService.getLoggedInUser();
                const mobile = user?.mobile;
                if (mobile) {
                  const url = CLUB_STORE_URL + mobile;
                  setOpenMobile(false);
                  setViewMyClubModal({ show: true, value: url });
                }
              }}
              className="tw:w-full tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-1 hover:tw:bg-gray-100 tw:transition-colors tw:group tw:cursor-pointer"
            >
              <div className="tw:flex-1 tw:text-left">
                <span className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:leading-tight tw:flex tw:items-center tw:gap-1">
                  Invite to
                  <ImgRender src="logo/club-logo.png" className="tw:h-5" />
                </span>
              </div>
              <ImgRender src="whatsapp-logo.png" className="tw:w-6" />
            </button>
          </div>
        </SidebarContent>
        <SidebarFooter className="tw:bg-white tw:border-t tw:border-t-gray-200 tw:relative">
          <UserProfile
            onInviteCustomer={(url) =>
              setViewMyClubModal({ show: true, value: url })
            }
          />
        </SidebarFooter>
        <LearnAppModal
          show={showLearnModal}
          callback={({ action }) => action === "close" && closeLearnModal()}
        />
      </Sidebar>
      <ViewMyClubModal
        show={viewMyClubModal.show}
        value={viewMyClubModal.value}
        title={tMenu("clubLink")}
        onClose={() => setViewMyClubModal({ show: false, value: "" })}
        callback={handleViewMyClubCallback}
      />

      {whatsappTemplateModal.show && (
        <WhatsappTemplateModal
          show={whatsappTemplateModal.show}
          data={whatsappTemplateModal.data}
          callback={handleWhatsappTemplateCallback}
          categories={["Invite"]}
          showTemplateForSelect={true}
          showCategoryDropdown={false}
        />
      )}
    </>
  );
}
