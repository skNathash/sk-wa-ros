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
  const resp: any = await PaylaterService.getTopOutstandingBalances(params);
  const payload = resp?.data?.data ?? {};

  // API may return topB2COutstanding and topB2BOutstanding.
  // Normalize both to a common shape: { id, name, outstandingBalance, profileUrl }
  const b2c: any[] = payload.topB2COutstanding ?? [];
  const b2b: any[] = payload.topB2BOutstanding ?? [];

  const formattedB2C = b2c.map((it: any) => ({
    id: it.customerId,
    name: it.customerName,
    outstandingBalance: it.outstandingBalance ?? 0,
    profileUrl: `/dashboard/network/view/b2c/${it.customerId}`,
  }));

  const formattedB2B = b2b.map((it: any) => ({
    id: it.retailerId,
    name: it.retailerName ?? "",
    outstandingBalance: it.outstandingBalance ?? 0,
    profileUrl: `/dashboard/network/view/b2b/${it.retailerId}`,
  }));

  // Decide which list to return based on params or combined fallback
  if (params?.filter?.["userInfo.type"] === "customer") return formattedB2C;
  if (params?.filter?.["userInfo.type"] === "franchise") return formattedB2B;

  // Default: combine both lists
  return [...formattedB2C, ...formattedB2B];
};

const TopOutStandingBalance: React.FC<Prop> = ({ type, title }) => {
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
            outstandingBalance: -1,
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
  }, [type]);

  return (
    <AppCard title={title || "Top Outstanding Balance"}>
      {loading ? (
        <div className="tw:text-center">
          <AppSpinner />
        </div>
      ) : null}
      {data.length > 0 ? (
        <div className="tw:flex tw:flex-col tw:gap-1 tw:text-sm">
          {data.map((item) => (
            <div
              key={item.id}
              className="tw:flex tw:justify-between tw:items-center tw:py-1"
            >
              <span>
                <AppLink href={item.profileUrl} asLink>
                  {item.name}
                </AppLink>
              </span>
              <span className="tw:font-medium">
                <Amount value={item.outstandingBalance ?? 0} />
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

export default TopOutStandingBalance;
