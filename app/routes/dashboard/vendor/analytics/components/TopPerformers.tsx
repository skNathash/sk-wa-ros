import AppCard from "~/components/core/card/AppCard";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import VendorService from "~/services/VendorService";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import Amount from "~/components/core/amount/Amount";
import useAppNav from "~/hooks/useAppNav";
import { useTranslation } from "react-i18next";

const TopPerformers = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await VendorService.getTopPerformers({
        page: 1,
        count: 10,
      });
      setData(response.data?.topPerformers || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVendorClick = (id: string) => {
    appNav.to(`/dashboard/vendor/view/${id}`);
  };

  return (
    <AppCard
      title={t("topPerformers")}
      icon="star"
      iconClassName="tw:text-green-500"
    >
      {loading ? (
        <div className="tw:text-center">
          <AppSpinner />
        </div>
      ) : null}

      <AppScrollArea className="tw:h-[300px]">
        {data.map((item, index) => (
          <div
            className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:flex tw:gap-4 tw:mb-2 tw:items-center"
            key={item._id}
          >
            <div>
              <span className="tw:rounded-full tw:bg-green-100 tw:p-2 tw:text-green-600 tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:font-semibold tw:text-sm">
                {index + 1}
              </span>
            </div>
            <div className="tw:flex-1">
              <div>
                <div className="tw:text-sm tw:font-medium">
                  <button
                    className="tw:hover:underline tw:cursor-pointer"
                    onClick={() => handleVendorClick(item.vendorId)}
                  >
                    {item.name}
                  </button>
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {item.onTimePercentage || 0}% {t("onTime")}
                </div>
              </div>
            </div>

            <div>
              <Amount
                value={item.totalRevenue}
                className="tw:rounded-full tw:bg-green-100 tw:px-2 tw:text-green-600 tw:py-1 tw:text-xs tw:font-medium"
              />
            </div>
          </div>
        ))}
      </AppScrollArea>
    </AppCard>
  );
};

export default TopPerformers;
