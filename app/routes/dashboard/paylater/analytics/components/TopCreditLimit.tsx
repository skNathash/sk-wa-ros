import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";
import AppLink from "~/components/core/link/AppLink";

type Prop = {
  type?: string;
  title?: string;
};

const getData = async (params: Record<string, any>) => {
  const resp: any = await PaylaterService.getRequests(params);
  return resp?.data?.data ?? [];
};

const TopCreditLimit: React.FC<Prop> = ({ type, title }) => {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let params: Record<string, any> = {
          filter: {
            "userInfo.type": type === "b2c" ? "customer" : "franchise",
            status: "Approved",
          },
          sort: {
            creditLimit: -1,
          },
          page: 1,
          count: 10,
        };
        const resp: any = await getData(params);
        setData(resp);
      } catch (error) {
        console.error(error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppCard title={title || "Top Credit Limit"}>
      {loading ? (
        <div className="tw:text-center">
          <AppSpinner />
        </div>
      ) : null}
      {data.length > 0 ? (
        <div className="tw:flex tw:flex-col tw:gap-1 tw:text-sm">
          {data.map((item, idx) => (
            <div
              key={idx}
              className="tw:flex tw:justify-between tw:items-center tw:py-1"
            >
              <span>
                <AppLink
                  href={
                    type === "b2c"
                      ? `/dashboard/network/view/b2c/${item.userInfo?.id}`
                      : `/dashboard/network/view/b2b/${item.userInfo?.id}`
                  }
                  asLink
                >
                  {item.userInfo?.name}
                </AppLink>
              </span>
              <span className="tw:font-medium">
                <Amount value={item.creditLimit} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <NoData />
      )}
    </AppCard>
  );
};

export default TopCreditLimit;
