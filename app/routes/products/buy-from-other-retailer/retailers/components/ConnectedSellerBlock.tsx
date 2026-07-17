import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

interface ConnectedSellerBlockProps {
  onBrowseCatalog?: (sellerId: string) => void;
}

const ConnectedSellerBlock: React.FC<ConnectedSellerBlockProps> = ({
  onBrowseCatalog,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [seller, setSeller] = useState<any>(null);

  const linkedSeller = AuthService.getLinkedSeller();

  useEffect(() => {
    let isMounted = true;
    const fetchSeller = async () => {
      try {
        setLoading(true);
        if (!linkedSeller?._id) {
          setSeller(null);
          setLoading(false);
          return;
        }
        const resp = await FranchiseService.getFranchise(linkedSeller._id);
        const data = resp?.data?.data;
        if (isMounted) {
          setSeller(data || null);
        }
      } catch (e) {
        // ignore errors
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSeller();
    return () => {
      isMounted = false;
    };
  }, [linkedSeller?._id]);

  if (!linkedSeller?._id || loading) {
    return null;
  }

  const handleBrowseCatalog = () => {
    if (onBrowseCatalog) {
      onBrowseCatalog(linkedSeller._id);
    }
  };

  const sellerName = seller?.name || "Connected seller";

  return (
    <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:shadow-sm tw:flex tw:flex-col tw:sm:flex-row tw:items-stretch tw:sm:items-center tw:gap-3 tw:mb-4">
      <div className="tw:flex-1">
        <div className="tw:text-[11px] tw:tracking-wide tw:uppercase tw:text-gray-500 tw:font-semibold">
          Your Connected seller
        </div>
        <div className="tw:text-base tw:sm:text-lg tw:font-semibold tw:text-gray-900">
          {sellerName}
        </div>
        <p className="tw:text-xs  tw:text-gray-600 tw:mt-1">
          Browse the catalog from this retailer to add items instantly.
        </p>
      </div>
      <div className="tw:w-full tw:sm:w-auto">
        <AppButton
          onClick={handleBrowseCatalog}
          size="small"
          className="tw:w-full tw:sm:w-auto tw:flex tw:items-center tw:justify-center tw:gap-2"
        >
          <ShoppingCart size={16} />
          Browse catalog
        </AppButton>
      </div>
    </div>
  );
};

export default ConnectedSellerBlock;
