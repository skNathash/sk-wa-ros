import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Store } from "lucide-react";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import OrderCard from "./components/order-card/OrderCard";
import Runners from "./components/runners/Runners";
import AssignRunnerSidePane from "./components/side-pane/AssignRunnerSidePane";
import { getOrderDetail, type AssignRunnerOrder } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

/**
 * Assign runner desk — the ready-order list lives in the theme-2 side pane and
 * the picked order (from the `orderId` query param) is worked on in the main
 * column.
 */
const AssignRunner = () => {
  const [searchParams] = useSearchParams();
  const appNav = useAppNav();
  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<AssignRunnerOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    try {
      setOrder(await getOrderDetail(orderId));
    } catch (e) {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return (
    <>
      <AppHeader title="Assign Runner" activeTab="logistics" />

      <div className="app-page page-bg page-padding">
        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — bill section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="bill"
                activeTab="logistics"
                title="Bill"
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid; the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane (see AppPane). */}
              <AppPaneMain className="tw:lg:col-span-12">
                {loading ? (
                  <BusyLoader show={true} />
                ) : !orderId ? (
                  <NoData
                    title="No order picked"
                    description="Pick a ready order from the list to see the runners nearest to its drop."
                  />
                ) : !order ? (
                  <NoData
                    title="Order not found"
                    description="This order could not be loaded. It may have been shipped or cancelled already — pick another one from the list."
                  />
                ) : (
                  <>
                    <OrderCard order={order} />
                    <Runners order={order} onAssigned={fetchOrder} />
                  </>
                )}
              </AppPaneMain>

              {/* Ready-order list — theme-2 desktop split layout only. */}
              <AppPaneSide className="app-pane-only">
                <AssignRunnerSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only CTA — hire a marketplace runner when none are nearby. */}
      <div className="app-footer tw:md:hidden">
        <div className="app-container">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <p className="tw:text-sm tw:font-semibold tw:text-slate-900">
              No runners nearby?
            </p>
            <AppButton
              size="small"
              color="primary"
              onClick={() =>
                appNav.to("/dashboard/delivery/marketplace-runners", {
                  orderId,
                })
              }
            >
              <Store size={14} />
              Try marketplace runners
            </AppButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignRunner;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Assign Runner"),
    },
  ];
}
