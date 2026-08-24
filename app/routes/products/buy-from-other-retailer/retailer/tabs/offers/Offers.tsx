import { Tag } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import NoData from "~/components/core/no-data/NoData";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import OfferCard from "./components/OfferCard";
import { getData } from "./helper";

type OffersProps = {
  retailerId: string;
  className?: string;
};

/**
 * Seller Offers tab — lists promotional deals for this retailer via
 * SellerCatalogService (same API as the catalog PromotionalDeals strip).
 */
const Offers = ({ retailerId, className }: OffersProps) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<{
    show: boolean;
    dealId: string;
  }>({ show: false, dealId: "" });

  useEffect(() => {
    if (!retailerId) {
      setOffers([]);
      return;
    }

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getData(retailerId);
        if (active) setOffers(result || []);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [retailerId]);

  const handleApply = (deal: any) => {
    const dealId = deal?._id || deal?.id;
    if (!dealId) return;
    setDetailModal({ show: true, dealId });
  };

  const handleDetailCallback = () => {
    setDetailModal({ show: false, dealId: "" });
  };

  return (
    <div className={clsx("tw:space-y-3", className)}>
      {loading ? (
        <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2 tw:xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`offer-skeleton-${idx}`}
              className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70"
            >
              <div className="tw:h-1.5 tw:bg-slate-100" />
              <div className="tw:space-y-3 tw:bg-orange-50/50 tw:px-4 tw:py-4">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-8 tw:w-8 tw:animate-pulse tw:rounded-lg tw:bg-slate-100" />
                  <div className="tw:h-5 tw:w-12 tw:animate-pulse tw:rounded-md tw:bg-slate-100" />
                </div>
                <div className="tw:h-4 tw:w-4/5 tw:animate-pulse tw:rounded tw:bg-slate-100" />
              </div>
              <div className="tw:space-y-4 tw:px-4 tw:py-4">
                <div className="tw:h-3 tw:w-3/5 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                <div className="tw:h-8 tw:w-16 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                <div className="tw:h-10 tw:w-full tw:animate-pulse tw:rounded-full tw:bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && offers.length === 0 ? (
        <NoData
          title="No active offers"
          description="No promotional deals are available from this retailer right now."
          icon={
            <div className="tw:rounded-full tw:border tw:border-orange-100 tw:bg-orange-50 tw:p-4">
              <Tag className="tw:text-orange-400" size={32} />
            </div>
          }
        />
      ) : null}

      {!loading && offers.length > 0 ? (
        <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2 tw:xl:grid-cols-3">
          {offers.map((deal) => (
            <OfferCard
              key={deal._id || deal.id}
              deal={deal}
              onApply={handleApply}
            />
          ))}
        </div>
      ) : null}

      <ProductDetailModal
        show={detailModal.show}
        dealId={detailModal.dealId}
        callback={handleDetailCallback}
        cartType="buy-from-other-retailer"
        retailerId={retailerId}
      />
    </div>
  );
};

export default Offers;
export type { OffersProps };
