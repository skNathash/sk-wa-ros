import { AlertCircle, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import SellerCatalogService from "~/services/SellerCatalogService";

const MissingConfigAlert = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const params = {
          outputType: "count",
          filter: {
            $or: [
              // { isStockAdded: false },
              { isPackageTypeUpdated: false },
              // { isPriceUpdated: false },
            ],
          },
        };
        const res = await SellerCatalogService.getProducts(params);
        setCount(res?.data?.count || 0);
      } catch (error) {
        console.error("Error fetching missing config count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading || count === 0 || !visible) return null;

  const handleView = () => {
    appNav.to("/dashboard/inventory/products/missing-config");
  };

  return (
    <div className="tw:bg-orange-50 tw:border tw:border-orange-100 tw:rounded-lg tw:px-3 tw:py-2 tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-3">
      <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
        <AlertCircle className="tw:text-orange-500 tw:shrink-0" size={16} />
        <p className="tw:text-slate-700 tw:text-sm tw:truncate">
          <span className="tw:font-semibold tw:text-slate-900">
            {count} {count === 1 ? "product needs" : "products need"}
          </span>{" "}
          <span className="tw:text-orange-700 tw:font-semibold">
            sell-in configuration
          </span>
        </p>
      </div>
      <AppButton
        size="small"
        color="primary"
        className="tw:shrink-0 tw:rounded-md"
        onClick={handleView}
      >
        <span>Add</span>
        <ChevronRight size={14} className="tw:ml-0.5" />
      </AppButton>
    </div>
  );
};

export default MissingConfigAlert;
