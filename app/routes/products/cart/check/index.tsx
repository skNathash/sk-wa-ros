import { useEffect } from "react";
import { useSearchParams } from "react-router";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import SellerCatalogService from "~/services/SellerCatalogService";

const CartCheck = () => {
  const appNav = useAppNav();

  const [searchParams] = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") || "";

  useEffect(() => {
    const fetchData = async () => {
      const promises = [
        CartService.fetchCartDetails({
          type: "B2B",
          id: AuthService.getLoggedInUserId(true) || "",
        }),
        SellerCatalogService.getMultiCarts({ outputType: "count" }),
      ];

      const responses = await Promise.all(promises);

      const cartDetails = responses[0].data?.count || 0;
      const multiCarts = responses[1].data?.count || 0;

      const hasSKCart = cartDetails > 0;
      const hasMultiCarts = multiCarts > 0;

      let redirectData = {
        url: "",
        params: {},
      };

      if (hasSKCart && hasMultiCarts) {
        redirectData.url = redirectTo || "/products/cart";
        redirectData.params = { tab: 1 };
      } else if (hasSKCart && !hasMultiCarts) {
        redirectData.url = "/products/cart";
      } else if (!hasSKCart && hasMultiCarts) {
        redirectData.url = "/products/buy-from-other-retailer/products/cart";
      }

      appNav.replace(redirectData.url, redirectData.params);
    };

    fetchData();
  }, [redirectTo]);

  return (
    <>
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:h-[calc(100vh-64px)] tw:items-center tw:justify-center">
            <div className="tw:flex tw:flex-col tw:items-center">
              <AppSpinner />
              <div className="tw:mt-4 tw:text-center tw:text-xs">
                Checking your cart...
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartCheck;
