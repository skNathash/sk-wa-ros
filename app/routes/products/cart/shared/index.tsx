import { Phone, ShoppingCartIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import FranchiseService from "~/services/FranchiseService";
import SellerService from "~/services/SellerService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import CartItem from "./components/CartItem";
import Summary from "./components/Summary";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Products", redirect: { path: "/products/sk" } },
  { label: "Shared Cart" },
];

const SharedCart = () => {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any | null>(null);

  const { id } = useParams();

  const summary = useMemo(() => {
    return {
      totalItems: cart?.items?.length || 0,
      totalUnits:
        cart?.items?.reduce(
          (acc: number, item: any) => acc + item.quantity,
          0,
        ) || 0,
      totalValue:
        cart?.items?.reduce(
          (acc: number, item: any) => acc + item.purchasePrice * item.quantity,
          0,
        ) || 0,
    };
  }, [cart]);

  useEffect(() => {
    const fetchSharedCart = async () => {
      try {
        setLoading(true);
        setCart(null);
        const resp: any = await SellerService.getSharedCart(id || "");
        const data = resp?.data?.data;
        if (data?.franchiseInfo?.id) {
          const franchiseResp = await FranchiseService.getFranchise(
            data?.franchiseInfo?.id,
          );
          data.franchiseInfo = franchiseResp?.data?.data;
        }
        setCart(data);
      } catch (e: any) {
        setCart(null);
      } finally {
        setLoading(false);
      }
    };

    if (!id) {
      setLoading(false);
      return;
    }

    fetchSharedCart();
  }, [id]);

  return (
    <>
      <AppHeader title="Shared Cart" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : null}

          {!loading && !cart ? <NoData /> : null}

          {!loading && cart ? (
            <>
              <InfoBlock size="sm" bordered className="tw:mb-4">
                <div className="tw:flex tw:gap-2 tw:md:items-center tw:flex-col tw:md:flex-row">
                  <div className="tw:flex-1">
                    <div className="tw:text-sm tw:font-semibold">
                      Please Note:
                    </div>
                    <div className="tw:text-sm tw:mt-2">
                      This cart is shared by{" "}
                      <span className="tw:font-semibold tw:mr-1">
                        &quot;{cart.franchiseInfo.name}&quot;
                      </span>
                      . Please review the items if any changes are required
                      please contact the seller.
                    </div>
                  </div>

                  <div className="tw:self-end tw:md:self-center">
                    <AppLink href={`tel:${cart.franchiseInfo.mobile}`} asLink>
                      <AppButton size="small" color="primary">
                        <Phone size={16} />
                        Contact Seller
                      </AppButton>
                    </AppLink>
                  </div>
                </div>
              </InfoBlock>
              <Summary summary={summary} />
              <AppCard
                title={`Cart Items (${cart.items.length})`}
                icon={<ShoppingCartIcon size={16} />}
                subtitle="Review the items in the cart"
              >
                <div className="tw:mt-4">
                  {cart.items.map((item: any, index: number) => (
                    <div key={index}>
                      <CartItem item={item} />
                    </div>
                  ))}
                </div>
              </AppCard>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default SharedCart;
