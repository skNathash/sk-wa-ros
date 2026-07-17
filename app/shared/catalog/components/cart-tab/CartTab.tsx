import { useEffect, useState } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import SellerCatalogService from "~/services/SellerCatalogService";
import MiscService from "~/services/MiscService";
import { EVENTS } from "~/constants";
import { produce } from "immer";

const defaultTabs: TabItem[] = [
  { key: "sk", name: "SK Cart" },
  { key: "others", name: "Sellers Cart" },
];

const CartTab = ({
  activeTab,
  className,
}: {
  activeTab: string;
  className?: string;
}) => {
  const appNav = useAppNav();

  const [tabs, setTabs] = useState<TabItem[]>([...defaultTabs]);

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      try {
        const promises = [
          CartService.fetchCartDetails({
            type: "B2B",
            id: AuthService.getLoggedInUserId(true) || "",
          }),
          SellerCatalogService.getMultiCarts({ outputType: "count" }),
        ];

        const responses = await Promise.all(promises);

        const cartDetailsData = responses[0].data;

        // If the cart details response contains sellers with deals arrays,
        // sum all deals across sellers. Otherwise fall back to the count field.
        const cartDetails = Array.isArray(cartDetailsData?.sellers)
          ? cartDetailsData.sellers.reduce(
              (acc: number, seller: any) => acc + (seller?.deals?.length || 0),
              0,
            )
          : cartDetailsData?.count || 0;

        const multiCartsData = responses[1].data;

        // If the response contains sellers with deals arrays, sum all deals
        // across sellers. Otherwise fall back to the itemCount field.
        const multiCarts = Array.isArray(multiCartsData?.sellers)
          ? multiCartsData.sellers.reduce(
              (acc: number, seller: any) => acc + (seller?.deals?.length || 0),
              0,
            )
          : multiCartsData?.itemCount || 0;

        setTabs(
          produce((draft) => {
            draft[0].count = cartDetails;
            draft[1].count = multiCarts;
          }),
        );
      } catch (e) {
        // ignore errors silently
      }
    };

    fetchCounts();

    const handleCartChange = () => {
      fetchCounts();
    };

    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, handleCartChange);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, handleCartChange);
    MiscService.listenEvent(EVENTS.CART_ITEM_UPDATED, handleCartChange);

    return () => {
      mounted = false;
      MiscService.removeEventListener(EVENTS.CART_ITEM_ADDED, handleCartChange);
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_REMOVED,
        handleCartChange,
      );
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_UPDATED,
        handleCartChange,
      );
    };
  }, []);

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "sk") {
      appNav.replace("/products/cart", { tab: 1 });
    } else if (tab.key === "others") {
      appNav.replace("/products/buy-from-other-retailer/products/cart", {
        tab: 1,
      });
    }
  };

  return (
    <AppTab
      tabs={tabs}
      onTabChange={onTabChange}
      activeTab={activeTab}
      className={className}
    />
  );
};

export default CartTab;
