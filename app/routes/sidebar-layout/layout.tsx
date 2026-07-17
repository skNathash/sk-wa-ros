import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import BottomTab from "~/components/core/bottom-tab/BottomTab";
import ImgRender from "~/components/core/img/ImgRender";
import SideMenu from "~/components/core/sidemenu/SideMenu";
import Theme2SideMenu from "~/components/core/sidemenu/Theme2SideMenu";
import { SidebarProvider } from "~/components/ui/sidebar";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import "../../i18n";
import ConfirmationCodeModal from "./modals/ConfirmationCodeModal";
import JoinRequestApprovedModal from "./modals/JoinRequestApprovedModal";
import OmsService from "~/services/OmsService";
import StorageService from "~/services/StorageService";
import CommonService from "~/services/CommonService";

// export async function clientLoader({ request }: { request: Request }) {
//   if (AuthService.isUserLoggedIn()) {
//     const profileComplete = AuthService.isFranchiseProfileComplete();
//     if (profileComplete.status) {
//       const url = new URL(request.url);
//       if (
//         url.pathname !== "/dashboard/accounts/platform-fee" &&
//         url.pathname !== "/auth/init" &&
//         url.pathname !== "/dashboard/deposit-money/options"
//       ) {
//         const activePlan = await FranchiseService.getActivePlan();
//         if (!activePlan || activePlan?.usagePercentage >= 100) {
//           throw redirect(
//             "/dashboard/accounts/platform-fee?tab=commission-invoices"
//           );
//         }
//       }
//     }
//   }
//   return null;
// }

const AppLayout: React.FC = () => {
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [sellerName, setSellerName] = useState<string | undefined>(undefined);
  const [pendingCodes, setPendingCodes] = useState<any[]>([]);
  const appNav = useAppNav();
  const theme = useTheme();
  // theme-2 uses the bottom tab bar for navigation, so the side menu is disabled.
  const showSideMenu = theme !== "theme-2";

  useEffect(() => {
    const fetchFranchise = async () => {
      const franchiseResponse = await AuthService.getLoggedInFranchiseDetails();
      const franchise = franchiseResponse?.data?.data || {};
      const name = franchise?.linkedFranchise?.name as string | undefined;
      setSellerName(name);
      if (!AuthService.isSkBuyer() && franchise?.networkType === "SKBUYER") {
        setShowApprovedModal(true);
      }
    };
    fetchFranchise();
  }, []);

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // order polling for the web notification
  useEffect(() => {
    const fetchOrder = async () => {
      const fid = AuthService.getLoggedInUserId() || "";
      let statuses = ["Created", "Pending"];
      if (AuthService.isBuyerUser()) {
        statuses.push("Shipped");
      }
      const params = {
        filter: {
          status: {
            $in: statuses,
          },
        },
      };

      const resp = await OmsService.getSalesOrders(fid, params);
      const d = resp?.data?.data || [];
      const firstOrder = d[0] || null;
      const localLastSeenOrder = StorageService.get("lastSeenOrder") || "";
      if (firstOrder && firstOrder.orderId !== localLastSeenOrder) {
        StorageService.set("lastSeenOrder", firstOrder?.orderId || "");
        const formattedAmount = CommonService.formattedAmount(
          firstOrder.orderAmount || 0,
          2,
        );
        // show notification
        const notification = new Notification("New Order", {
          body: `Order #${firstOrder.orderRefNo} from ${firstOrder.customerInfo?.name} (Rs.${formattedAmount})`,
          tag: "new-order",
          data: {
            url: `/dashboard/orders/view/${firstOrder.orderId}`,
          },
          requireInteraction: true,
        });
        notification.addEventListener("click", (e) => {
          e.preventDefault();
          window.focus();
          appNav.to(notification.data.url);
        });
      }
    };
    fetchOrder();

    let t: ReturnType<typeof setTimeout> | null = null;

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      t = setInterval(() => {
        fetchOrder();
      }, 60 * 1000);
    }

    return () => {
      if (t) {
        clearInterval(t);
      }
    };
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;

    const fetchCodes = async () => {
      if (!AuthService.isUserLoggedIn()) {
        setPendingCodes([]);
        return;
      }
      const receiverId = AuthService.getLoggedInUserId() || "";
      if (!receiverId) return;
      try {
        const resp =
          await CommonService.getPendingConfirmationCodes(receiverId);
        const d = resp?.data?.data || [];
        setPendingCodes(Array.isArray(d) ? d : []);
      } catch (e) {
        console.debug("confirmation-codes poll error", e);
      }
    };

    fetchCodes();
    if (AuthService.isUserLoggedIn()) {
      t = setInterval(fetchCodes, 10 * 1000);
    }

    return () => {
      if (t) clearInterval(t);
    };
  }, []);

  return (
    <>
      <ConfirmationCodeModal
        codes={pendingCodes}
        onRejected={(id) =>
          setPendingCodes((prev) => prev.filter((c) => c._id !== id))
        }
      />
      <div
        id="app-progress-bar"
        className="tw:fixed tw:top-0 tw:left-0 tw:right-0 tw:z-50 tw:h-screen tw:bg-black/50 hide"
      >
        {/* <AppProgressBar type="indeterminate" /> */}
      </div>

      <SidebarProvider>
        {showSideMenu && <SideMenu />}
        {/* theme-2 uses its own overlay account menu, opened from the header. */}
        {!showSideMenu && <Theme2SideMenu />}

        <main className="tw:flex-1 tw:relative tw:min-w-0">
          <Outlet />
          <BottomTab />
        </main>

        <div className="tw:fixed tw:right-1/2 tw:transform tw:translate-x-1/2 tw:bottom-0 tw:text-xs tw:text-slate-600 tw:font-semibold tw:z-30">
          <span className="tw:bg-white/80 tw:px-2 tw:rounded-b-md">
            Powered by{" "}
            <ImgRender
              src="/ai/ai.gif"
              className="tw:h-8 tw:inline-block tw:rounded-full"
            />
          </span>
        </div>
      </SidebarProvider>

      <JoinRequestApprovedModal
        show={showApprovedModal}
        sellerName={sellerName}
        callback={(e) => {
          if (e.action === "close") {
            setShowApprovedModal(false);
          } else if (e.action === "continue") {
            setShowApprovedModal(false);
            appNav.replace("/auth/logout");
          }
        }}
      />
    </>
  );
};

export default AppLayout;
