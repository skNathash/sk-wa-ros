import { Phone, Navigation, ChevronRight } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import CommonService from "~/services/CommonService";
import AppCard from "~/components/core/card/AppCard";

interface MobileViewProps {
  data: any[];
  loading: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({ data, loading }) => {
  const { t } = useTranslation(["common", "dashboard"]);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, idx) => {
        return (
          <AppLink
            key={item._id || idx}
            asLink
            href={`/dashboard/network/view/view-join-request/${item._id}`}
            noUnderline
          >
            <AppCard className="tw:mb-0">
              <div className="tw:flex tw:items-center tw:justify-between">
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:text-[15px] tw:font-semibold tw:text-gray-800">
                      {item.sfsellerInfo?.name}
                    </span>
                    <AppBadge variant={item._statusColor || "warning"}>
                      {item._statusLbl || t("pending")}
                    </AppBadge>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-400 tw:text-xs tw:font-medium">
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <Phone className="tw:w-3.5 tw:h-3.5" />
                      <span>{item.sfsellerInfo?.details?.mobile || "-"}</span>
                    </div>
                    <div className="tw:h-3 tw:w-[1.5px] tw:bg-gray-200" />
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <Navigation className="tw:w-3.5 tw:h-3.5" />
                      <span>
                        {CommonService.roundedByDecimalPlace(
                          item.sfsellerInfo?.details?.distanceKm,
                          2
                        )}{" "}
                        km away
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="tw:w-6 tw:h-6 tw:text-gray-400" />
              </div>
            </AppCard>
          </AppLink>
        );
      })}
    </div>
  );
};

export default MobileView;
