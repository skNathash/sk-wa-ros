import clsx from "clsx";
import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterDues from "./components/dues/PaylaterDues";
import PaylaterHero from "./components/hero/PaylaterHero";
import PaylaterStatement from "./components/statement/PaylaterStatement";
import WalletTerms from "./components/terms/WalletTerms";
import { getPaylaterWallet, type PaylaterWallet } from "./helper";

type PaylaterTabProps = {
  /** Seller being viewed — the one who issued the wallet. */
  retailerId?: string;
  retailerName?: string;
  className?: string;
};

/**
 * PayLater with this seller: the wallet they issued the logged-in retailer,
 * what is owed against it, and the transaction statement behind the balance.
 */
const PaylaterTab = ({
  retailerId,
  retailerName,
  className,
}: PaylaterTabProps) => {
  const [wallet, setWallet] = useState<PaylaterWallet | null>(null);
  const [loading, setLoading] = useState(!!retailerId);

  useEffect(() => {
    if (!retailerId) {
      setWallet(null);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchWallet = async () => {
      setLoading(true);
      try {
        const data = await getPaylaterWallet(retailerId);
        if (active) setWallet(data);
      } catch (e) {
        if (active) setWallet(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchWallet();

    return () => {
      active = false;
    };
  }, [retailerId]);

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-10">
        <AppSpinner />
      </div>
    );
  }

  // No wallet with this seller — nothing to summarise and no statement behind it.
  if (!wallet) {
    return (
      <AppCard className={className}>
        <NoData
          title="No paylater wallet"
          description="This seller has not issued you a paylater wallet yet."
        />
      </AppCard>
    );
  }

  return (
    <div className={clsx("tw:space-y-4", className)}>
      <PaylaterHero wallet={wallet} sellerName={retailerName} />

      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-2">
        <PaylaterDues wallet={wallet} />
        <WalletTerms wallet={wallet} sellerName={retailerName} />
      </div>

      <PaylaterStatement sellerId={retailerId || ""} />
    </div>
  );
};

export default PaylaterTab;
export type { PaylaterTabProps };
