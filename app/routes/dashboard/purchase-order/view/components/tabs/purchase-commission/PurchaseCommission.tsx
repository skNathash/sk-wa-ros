import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "~/hooks/use-mobile";
import { prepareParams, getData } from "./helper";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppCard from "~/components/core/card/AppCard";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

type Props = {
  poId: string | number;
};

export default function PurchaseCommission({ poId }: Props) {
  const { t } = useTranslation(["common"]);
  const isMobile = useIsMobile();
  const [filter] = useState<Record<string, any>>({ poId: String(poId) });

  const [pagination] = useState<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 0,
    endSlNo: 0,
    totalRecords: 0,
  } as PaginationState);

  const [sort] = useState<SortProps>({} as SortProps);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const params = useMemo(
    () => prepareParams(filter, pagination, sort),
    [filter, pagination, sort]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const items = await getData(params);
        if (!mounted) return;
        setData(items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [params]);

  return (
    <>
      <div className="tw:text-xs tw:mb-2 tw:text-gray-600">
        {t("feeSupportDescription")}
      </div>
      {isMobile ? (
        <MobileView data={data} loading={loading} />
      ) : (
        <AppCard noPadding>
          <DesktopView data={data} loading={loading} />
        </AppCard>
      )}
    </>
  );
}
