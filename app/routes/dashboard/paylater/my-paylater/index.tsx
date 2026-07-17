import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterCreditCard from "./components/PaylaterCreditCard";
import { getMyPaylaterRequests } from "./helper";

const MyPaylater = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await getMyPaylaterRequests();
      setData(list || []);
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-10">
          <AppSpinner />
        </div>
      );
    }

    if (!data.length) {
      return (
        <AppCard>
          <NoData />
        </AppCard>
      );
    }

    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
        {data.map((item) => (
          <div key={item._id} className="tw:flex tw:flex-col tw:gap-2">
            <PaylaterCreditCard data={item} />
            {item.expiryStatus && (
              <div
                className={`tw:text-xs ${
                  item.isOverdue
                    ? "tw:text-red-600"
                    : item.isDueToday
                      ? "tw:text-orange-600"
                      : "tw:text-gray-500"
                }`}
              >
                {item.expiryStatus}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:text-xs tw:md:text-sm tw:text-gray-500">
        {t("myPaylaterDescription")}
      </div>
      {renderContent()}
    </div>
  );
};

export default MyPaylater;
