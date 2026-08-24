import clsx from "clsx";
import {
  ArrowLeft,
  IndianRupee,
  LockOpenIcon,
  Search,
  ShoppingCart,
  User,
  PanelLeftIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import { useSidebar } from "~/components/ui/sidebar";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import LearnAppModal from "~/shared/others/modals/LearnAppModal";
import SkSellerAvailableNote from "~/shared/vendor/components/sk-seller-available/SkSellerAvailableNote";
import AppBadge from "../badge/AppBadge";
import ImgRender from "../img/ImgRender";
import HeaderNavChips from "./HeaderNavChips";
import HeaderClock from "./HeaderClock";
import { useTranslation } from "react-i18next";
import SellerCatalogService from "~/services/SellerCatalogService";
import MiscService from "~/services/MiscService";
import { EVENTS } from "~/constants";
import { useIsMobile } from "~/hooks/use-mobile";
import type { SectionTabKey } from "~/types/CommonTypes";
import SectionSwitcherTitle from "./section-switcher/SectionSwitcherTitle";

const AppHeader = ({
  title,
  subtitle,
  sectionKey,
  activeTab,
  sectionBadges,
  showCart,
  hideMenu,
  mobileLead = "back",
  showSearch,
  noPadding = false,
  showRecordPayment = true,
  showSkSellerNote = false,
  showAudioNote = false,
  showNavChips = true,
  audioNoteTitle,
  audioFeature,
  renderActions,
  showHeaderClock: showHeaderClockProp = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /**
   * Section this page belongs to (bill/business/supply/catalog). When set,
   * theme-2 mobile replaces the plain title with the tappable section switcher
   * ({@link SectionSwitcherTitle}); every other theme/breakpoint keeps the
   * plain title.
   */
  sectionKey?: SectionTabKey;
  /** Active tab key inside the section; derived from the route when omitted. */
  activeTab?: string;
  /** Live counts keyed by tab key, shown as badges in the switcher sheet. */
  sectionBadges?: Record<string, number | string | undefined>;
  showCart?: boolean;
  hideMenu?: boolean;
  /**
   * theme-2 lead button on mobile: `back` (default) navigates back, `menu`
   * opens the account menu — for top-level section pages with no meaningful
   * back target — and `none` drops the button entirely. Desktop always shows
   * the hamburger regardless; use `hideMenu` to remove it at every breakpoint.
   */
  mobileLead?: "back" | "menu" | "none";
  showSearch?: boolean;
  showRecordPayment?: boolean;
  /** Show the section nav chips (Home/Catalog/…) centered in the header.
   *  On by default; the chips themselves render only in theme-2 desktop
   *  (see `.header-nav-chips` in theme-2.css). */
  showNavChips?: boolean;
  noPadding?: boolean;
  showSkSellerNote?: boolean;
  showAudioNote?: boolean;
  audioNoteTitle?: string;
  audioFeature?: string;
  /**
   * Replaces the whole right-side action block (record payment / search / cart /
   * profile) with this content. When passed, none of the default actions render.
   */
  renderActions?: React.ReactNode;
  /**
   * Show the live date/time clock on the header subtitle line. The clock only
   * renders in theme-2 desktop regardless of this flag.
   */
  showHeaderClock?: boolean;
}) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const hideSideMenu = searchParams.get("hideSideMenu") !== null;

  const { toggleSidebar, setOpen } = useSidebar();
  const prevHideSideMenu = useRef(false);
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";
  const isMobile = useIsMobile();
  // The switcher is a theme-2 mobile affordance only — desktop navigates the
  // section through the side rail (SectionMenu) and the header nav chips.
  const showSectionSwitcher = !!sectionKey && isTheme2 && isMobile;
  // Live date/time rides the subtitle line — theme-2 desktop only, and only
  // when the calling page opts in (currently POS billing desktop).
  const showHeaderClock = showHeaderClockProp && isTheme2 && !isMobile;
  // In theme-2 the classic side menu is disabled (bottom tab bar is used
  // instead), so the shadcn menu-toggle buttons have nothing to open — hide
  // them. theme-2 gets its own hamburger that opens the overlay account menu.
  const showMenuToggle = !hideMenu && !isTheme2;
  const showTheme2MenuToggle = !hideMenu && isTheme2;
  // theme-2 mobile leads with a back arrow so pages stay navigable without the
  // side rail; `mobileLead` swaps it for the account-menu hamburger or nothing.
  const showTheme2BackOnMobile =
    showTheme2MenuToggle && isMobile && mobileLead === "back";
  const showTheme2Hamburger = showTheme2MenuToggle && !showTheme2BackOnMobile;

  const openTheme2Menu = () => {
    MiscService.createEvent(EVENTS.OPEN_APP_MENU, null);
  };

  useEffect(() => {
    if (hideSideMenu && !prevHideSideMenu.current) {
      setOpen(false);
    }
    prevHideSideMenu.current = hideSideMenu;
  }, [hideSideMenu, setOpen]);

  const [cartCount, setCartCount] = useState(0);

  const [learnModal, setLearnModal] = useState({
    show: false,
  });

  const fetchCartCount = async () => {
    try {
      // If a manpower user is logged in, do not call cart APIs — keep count zero
      if (AuthService.isManpowerLoggedIn()) {
        setCartCount(0);
        return;
      }

      let fid = AuthService.getLoggedInUserId(true);

      const promises = [
        CartService.fetchCartDetails({
          type: "B2B",
          id: fid,
        }),
        SellerCatalogService.getMultiCarts({ outputType: "count" }),
      ];

      const responses = await Promise.all(promises);

      const cartDetails = responses[0].data?.count || 0;
      const multiCarts = responses[1].data?.itemCount || 0;

      setCartCount(cartDetails + multiCarts);
    } catch (error) {
      console.error("Failed to fetch cart details", error);
    }
  };

  useEffect(() => {
    const eventHandler = () => {
      fetchCartCount();
    };

    document.addEventListener(EVENTS.CART_ITEM_ADDED, eventHandler);
    document.addEventListener(EVENTS.CART_ITEM_REMOVED, eventHandler);

    return () => {
      document.removeEventListener(EVENTS.CART_ITEM_ADDED, eventHandler);
      document.removeEventListener(EVENTS.CART_ITEM_REMOVED, eventHandler);
    };
  }, []);

  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      fetchCartCount();
    }
  }, []);

  const handleCartClick = () => {
    // Send postMessage to parent window for navigation
    appNav.to("/products/cart/check");
  };

  const handleMasterLogin = () => {
    appNav.to("/auth/master/login");
  };

  return (
    <header className="app-header tw:bg-white tw:border-b tw:border-gray-200 tw:sticky tw:top-0 tw:z-50 tw:left-0 tw:right-0">
      {/* MASTER login button - visible only for master users, fixed centered at top */}
      {AuthService.isMasterLogin() && (
        <div className="tw:fixed tw:-top-1 tw:left-1/2 tw:transform tw:-translate-x-1/2 tw:z-60">
          <span onClick={handleMasterLogin} className="tw:cursor-pointer">
            <AppBadge
              variant="warning"
              className="tw:text-[10px] tw:items-center"
            >
              <LockOpenIcon />
              MASTER LOGIN
            </AppBadge>
          </span>
        </div>
      )}
      <div
        className={clsx("tw:relative", {
          "tw:px-4": !noPadding,
        })}
      >
        <div className="tw:flex tw:justify-between tw:items-center tw:h-15">
          {/* Left side - Menu button and title */}
          <div className="header-lead tw:flex tw:items-center tw:min-w-0">
            {showTheme2BackOnMobile ? (
              <AppButton
                size="default"
                fill="clear"
                color="dark"
                noShadow
                className="tw:inline-flex tw:ps-0! tw:py-0! tw:mr-2"
                onClick={() => appNav.back()}
                title="Back"
                aria-label="Go back"
              >
                <ArrowLeft className="tw:w-5 tw:h-5" />
              </AppButton>
            ) : null}

            {showTheme2Hamburger ? (
              <AppButton
                size="default"
                fill="clear"
                color="dark"
                noShadow
                className={clsx("tw:ps-0! tw:py-0! tw:mr-2", {
                  "tw:hidden tw:md:inline-flex": mobileLead === "none",
                  "tw:inline-flex": mobileLead !== "none",
                })}
                onClick={openTheme2Menu}
                title="Menu"
                aria-label="Open menu"
              >
                <ImgRender
                  src="/hamburger-icon/3.svg"
                  className="tw:w-5 tw:h-5"
                />
              </AppButton>
            ) : null}

            {showMenuToggle ? (
              <>
                <AppButton
                  size="default"
                  fill="clear"
                  color="dark"
                  noShadow
                  className="tw:inline-flex tw:md:hidden tw:ps-0! tw:py-0!"
                  onClick={toggleSidebar}
                >
                  <ImgRender
                    src="/hamburger-icon/3.svg"
                    className="tw:w-5 tw:h-5"
                  />
                </AppButton>

                <AppButton
                  size="default"
                  fill="clear"
                  color="dark"
                  noShadow
                  className="tw:hidden tw:md:inline-flex tw:ps-0! tw:py-0! tw:mr-2"
                  onClick={toggleSidebar}
                  title="Toggle sidebar"
                >
                  <PanelLeftIcon className="tw:w-5 tw:h-5" />
                </AppButton>
              </>
            ) : null}

            <div
              className={clsx(
                "tw:flex tw:items-start tw:flex-col tw:justify-start tw:min-w-0",
                {
                  "tw:pl-0": showMenuToggle || showTheme2MenuToggle,
                },
              )}
            >
              {showSectionSwitcher ? (
                <SectionSwitcherTitle
                  sectionKey={sectionKey!}
                  activeTab={activeTab}
                  title={title}
                  subtitle={subtitle}
                  badges={sectionBadges}
                />
              ) : (
                <>
                  <h1 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:line-clamp-1 tw:flex tw:items-center tw:gap-1.5 tw:min-w-0 tw:max-w-full">
                    <div
                      className="tw:line-clamp-1 tw:min-w-0"
                      title={typeof title === "string" ? title : undefined}
                    >
                      {title}
                    </div>
                    {/* {showAudioNote ? (
                  <button
                    className="tw:cursor-pointer"
                    onClick={() =>
                      setLearnModal({
                        show: true,
                      })
                    }
                  >
                    <ImgRender src="others/audio.gif" className="tw:h-5" />
                  </button>
                ) : null} */}
                  </h1>
                  {subtitle || showHeaderClock ? (
                    <div className="tw:mt-0.5 tw:text-xs tw:flex tw:items-center tw:gap-1 tw:min-w-0 tw:max-w-full">
                      {subtitle}
                      {subtitle && showHeaderClock ? (
                        <span className="tw:opacity-40">|</span>
                      ) : null}
                      {showHeaderClock ? <HeaderClock /> : null}
                    </div>
                  ) : null}
                </>
              )}
              {showSkSellerNote ? (
                <div>
                  <SkSellerAvailableNote template={2} className="tw:mt-1" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Center - section nav chips (theme-2 desktop only, on by default) */}
          {showNavChips ? (
            <HeaderNavChips className="tw:absolute tw:left-1/2 tw:top-1/2 tw:-translate-x-1/2 tw:-translate-y-1/2" />
          ) : null}

          {/* Right side - Action buttons (or caller-supplied replacement) */}
          <div className="header-actions tw:flex tw:items-center tw:shrink-0">
            {renderActions ? (
              renderActions
            ) : (
              <>
                {/* Record Payment button - visible when logged in */}
                {/* Record Payment button - visible when logged in and enabled by prop */}
                {showRecordPayment && AuthService.isLoggedIn() && (
                  <AppButton
                    onClick={() =>
                      appNav.to("/dashboard/accounts/record-payment")
                    }
                    size="default"
                    fill="outline"
                    color="dark"
                    noShadow
                    className="tw:flex tw:items-center tw:gap-2 tw:ml-2 tw:lg:bg-white"
                  >
                    <IndianRupee className="tw:h-5 tw:w-5" />
                    <span className="tw:hidden tw:md:inline">
                      {t("recordPayment")}
                    </span>
                  </AppButton>
                )}

                {showSearch ? (
                  <AppButton
                    onClick={() => appNav.to("/products/search")}
                    size="default"
                    fill="clear"
                    color="dark"
                    noShadow
                  >
                    <Search className="tw:h-5 tw:w-5" />
                  </AppButton>
                ) : null}

                {showCart ? (
                  <AppButton
                    onClick={handleCartClick}
                    size="default"
                    fill="clear"
                    color="dark"
                    noShadow
                    className="tw:relative"
                  >
                    <ShoppingCart className="tw:h-5 tw:w-5" />
                    {cartCount > 0 && (
                      <span className="tw:absolute tw:-top-1 tw:-right-1 tw:bg-red-500 tw:text-white tw:rounded-full tw:text-xs tw:px-1.5 tw:py-0.5 tw:flex tw:items-center tw:justify-center tw:min-w-[18px] tw:h-[18px]">
                        {cartCount}
                      </span>
                    )}
                  </AppButton>
                ) : null}

                {/* Notification Icon - Only show when logged in */}
                {/* {AuthService.isLoggedIn() && (
              <AppButton
                onClick={() => appNav.to("/auth/notifications")}
                size="icon"
                fill="clear"
              >
                <Bell className="tw:h-5 tw:w-5" />
              </AppButton>
            )} */}

                {/* Profile Icon - Only show when logged in */}
                {AuthService.isLoggedIn() && (
                  <AppButton
                    onClick={() => appNav.to("/user/my-profile")}
                    size="icon"
                    fill="clear"
                  >
                    <User className="tw:h-5 tw:w-5" />
                  </AppButton>
                )}
              </>
            )}

            {/* Logout Icon - Only show when logged in */}
            {/* {AuthService.isLoggedIn() && (
              <AppButton
                onClick={() => appNav.to("/auth/logout")}
                size="icon"
                fill="clear"
              >
                <Power className="tw:h-5 tw:w-5" />
              </AppButton>
            )} */}
          </div>
        </div>
      </div>
      {learnModal.show && (
        <LearnAppModal
          show={learnModal.show}
          title={audioNoteTitle}
          feature={audioFeature}
          callback={() =>
            setLearnModal({
              show: false,
            })
          }
        />
      )}
    </header>
  );
};

export default AppHeader;
