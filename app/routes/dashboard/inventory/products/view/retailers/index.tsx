import { Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import TintTile from "~/components/core/tint/TintTile";
import { getData, type DealPerformance } from "./helper";

const EMPTY: DealPerformance = { retailers: [], count: 0, avgSellerPrice: 0 };

/**
 * Retailers within the search radius that stock this deal, with the town they
 * sell from, how fast it moves for them and what they charge — the peer view of
 * a single item.
 */
const ProductRetailers = () => {
  const { id } = useParams();

  const [performance, setPerformance] = useState<DealPerformance>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchRetailers = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setPerformance(await getData(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRetailers();
  }, [fetchRetailers]);

  if (loading) return <ContentLoader />;

  const { retailers, count, avgSellerPrice } = performance;

  if (!retailers.length) {
    return (
      <NoData
        title="Retailers"
        description="Retailers buying this product will appear here."
        icon={
          <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
            <Store className="tw:text-slate-400" size={32} />
          </div>
        }
      />
    );
  }

  return (
    <section className="tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3">
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
        <div className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-500">
          {count} retailers in your area stock this
        </div>
        {!!avgSellerPrice && (
          <div className="tw:text-[11px] tw:text-slate-400">
            Avg <Amount value={avgSellerPrice} className="tw:font-semibold" />
          </div>
        )}
      </div>

      <div className="tw:mt-3 tw:overflow-x-auto">
        <table className="tw:w-full tw:text-sm">
          <thead>
            <tr className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              <th className="tw:pb-1 tw:text-left">Retailer</th>
              <th className="tw:pb-1 tw:text-right">B2C</th>
              <th className="tw:pb-1 tw:text-right">B2B</th>
            </tr>
          </thead>
          <tbody className="tw:divide-y tw:divide-slate-100">
            {retailers.map((retailer) => (
              <tr key={retailer.sellerId || retailer._label}>
                <td className="tw:py-2 tw:pr-3">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <TintTile
                      index={retailer._tintIndex}
                      className="tw:h-8 tw:w-8 tw:shrink-0 tw:rounded-full tw:text-xs tw:font-bold"
                    >
                      {retailer._initial}
                    </TintTile>
                    <div className="tw:min-w-0">
                      <div className="tw:truncate tw:font-semibold tw:text-slate-800">
                        {retailer._label}
                      </div>
                      {!!retailer.distanceKm && (
                        <div className="tw:text-[11px] tw:text-slate-400">
                          {retailer.distanceKm} km away
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="tw:py-2 tw:pr-3 tw:text-right tw:font-semibold tw:text-slate-800">
                  <Amount value={retailer.b2cPrice || 0} />
                </td>
                <td className="tw:py-2 tw:text-right tw:font-semibold tw:text-slate-800">
                  <Amount value={retailer.b2bPrice || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ProductRetailers;
