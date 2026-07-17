import { CircleCheckBig } from "lucide-react";
import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import VendorService from "~/services/VendorService";
import { useTranslation } from "react-i18next";

const AttentionRequired = () => {
  const { t } = useTranslation(["common"]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await VendorService.getList({
        page: 1,
        count: 10,
      });
      setData(response.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <AppCard
      title={t("attentionRequired")}
      icon="alert-circle"
      iconClassName="tw:text-red-500"
    >
      {loading ? (
        <div className="tw:text-center">
          <AppSpinner />
        </div>
      ) : null}

      <div className="tw:h-full tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:mt-8">
        <div>
          <CircleCheckBig className="tw:text-green-500 tw:w-10 tw:h-10" />
        </div>
        <div className="tw:text-center tw:text-sm tw:text-gray-500">
          {t("allVendorsPerformingWell")}
        </div>
      </div>
    </AppCard>
  );
};

export default AttentionRequired;
