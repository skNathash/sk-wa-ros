import { Eye } from "lucide-react";
import React from "react";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import DateFormat from "~/components/core/date/DateFormat";
import AddressInfo from "./AddressInfo";

interface MobileViewProps {
  data: any[];
  loading: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({ data, loading }) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      {data.map((item, idx) => {
        return (
          <div
            key={idx}
            className="tw:border tw:border-gray-200 tw:rounded-xl tw:p-4 tw:mb-4"
          >
            <div className="tw:flex tw:items-center tw:gap-4 tw:mb-2">
              <div className="tw:w-14 tw:h-14 tw:rounded-full tw:bg-gradient-to-br tw:from-blue-400 tw:to-purple-400 tw:flex tw:items-center tw:justify-center tw:text-white tw:text-2xl tw:font-bold">
                {item._initial}
              </div>
              <div className="tw:flex-1">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/sk-seller/${item._id}`}
                    className="tw:text-lg tw:font-bold tw:leading-tight tw:mb-2"
                  >
                    {item.name || "-"}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:flex-col tw:gap-1">
                  Registered On:
                  <DateFormat value={item.createdAt} />
                </div>
              </div>
            </div>
            <div className="tw:border-t tw:my-3"></div>
            <div className="tw:space-y-2 tw:mb-3">
              <div className="tw:text-sm tw:text-gray-500">Location</div>
              <AddressInfo
                address={item._address}
                city={item.city}
                district={item.district}
                state={item.state}
                pincode={item.pincode}
                distanceKm={item.distanceKm}
              />
            </div>
            <div className="tw:flex tw:gap-2">
              <AppLink
                asLink
                href={`/dashboard/network/view/sk-seller/${
                  (item as any)._id || (item as any).id
                }`}
                className="tw:flex-1"
              >
                <AppButton
                  fill="outline"
                  color="primary"
                  size="small"
                  className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-1"
                >
                  <Eye className="tw:w-3 tw:h-3" />
                  View Detail
                </AppButton>
              </AppLink>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default MobileView;
