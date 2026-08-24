import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SellerCard from "./components/SellerCard";
import SuccessBanner from "./components/SuccessBanner";
import { fetchOrders, groupBySeller, type SellerGroup } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/main" } },
  { label: "Order Placed" },
];

const OrderSuccessPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { to } = useAppNav();
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get("ids") || "";

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<SellerGroup[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    const load = async () => {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const orders = await fetchOrders(ids);
        setTotalOrders(orders.length);
        setGroups(groupBySeller(orders));
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [idsParam]);

  const hasData = !loading && groups.length > 0 && idsParam;

  return (
    <>
      <AppHeader title={t("orderPlaced") || "Order Placed"} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="sellers"
            noShadow
            sticky
          /> */}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="sellers"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

              {loading && (
                <div className="tw:flex tw:justify-center tw:items-center tw:py-16">
                  <AppSpinner className="tw:w-8 tw:h-8" />
                </div>
              )}

              {!loading && !hasData && (
                <AppCard>
                  <div className="tw:py-10">
                    <NoData />
                  </div>
                </AppCard>
              )}

              {hasData && (
                <div className="tw:max-w-2xl tw:mx-auto">
                  <SuccessBanner
                    totalOrders={totalOrders}
                    totalSellers={groups.length}
                  />

                  <div className="tw:space-y-4">
                    {groups.map((group) => (
                      <SellerCard key={group.key} group={group} />
                    ))}
                  </div>

                  <div className="tw:mt-6 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:gap-2">
                    <AppButton
                      fill="outline"
                      className="tw:flex-1"
                      onClick={() => to("/products/main")}
                    >
                      Buy More
                    </AppButton>
                    <AppButton
                      className="tw:flex-1"
                      onClick={() =>
                        to("/dashboard/orders/list", { tab: "my-orders" })
                      }
                    >
                      My Orders
                    </AppButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSuccessPage;
