import clsx from "clsx";
import {
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
import { useTranslation } from "react-i18next";
import SellerCatalogService from "~/services/SellerCatalogService";
import MiscService from "~/services/MiscService";
import { EVENTS } from "~/constants";

const AppHeader = ({
  title,
  showCart,
  hideMenu,
  showSearch,
  noPadding = false,
  showRecordPayment = true,
  showSkSellerNote = false,
  showAudioNote = false,
  audioNoteTitle,
  audioFeature,
}: {
  title: React.ReactNode;
  showCart?: boolean;
  hideMenu?: boolean;
  showSearch?: boolean;
  showRecordPayment?: boolean;
  noPadding?: boolean;
  showSkSellerNote?: boolean;
  showAudioNote?: boolean;
  audioNoteTitle?: string;
  audioFeature?: string;
}) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const hideSideMenu = searchParams.get("hideSideMenu") !== null;

  const { toggleSidebar, setOpen } = useSidebar();
  const prevHideSideMenu = useRef(false);
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";
  // In theme-2 the classic side menu is disabled (bottom tab bar is used
  // instead), so the shadcn menu-toggle buttons have nothing to open — hide
  // them. theme-2 gets its own hamburger that opens the overlay account menu.
  const showMenuToggle = !hideMenu && !isTheme2;
  const showTheme2MenuToggle = !hideMenu && isTheme2;

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
          <div className="tw:flex tw:items-center">
            {showTheme2MenuToggle ? (
              <AppButton
                size="default"
                fill="clear"
                color="dark"
                noShadow
                className="tw:inline-flex tw:ps-0! tw:py-0! tw:mr-2"
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
                "tw:flex tw:items-start tw:flex-col tw:justify-start",
                {
                  "tw:pl-0": showMenuToggle || showTheme2MenuToggle,
                },
              )}
            >
              <h1 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:line-clamp-1 tw:flex tw:items-center tw:gap-1.5">
                <div className="tw:line-clamp-1">{title}</div>
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
              {showSkSellerNote ? (
                <div>
                  <SkSellerAvailableNote template={2} className="tw:mt-1" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="tw:flex tw:items-center">
            {/* Record Payment button - visible when logged in */}
            {/* Record Payment button - visible when logged in and enabled by prop */}
            {showRecordPayment && AuthService.isLoggedIn() && (
              <AppButton
                onClick={() => appNav.to("/dashboard/accounts/record-payment")}
                size="default"
                fill="outline"
                color="dark"
                noShadow
                className="tw:flex tw:items-center tw:gap-2 tw:ml-2"
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
