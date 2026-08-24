import { ChevronRight, Navigation } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import CommonService from "~/services/CommonService";
import {
  DirectoryEmpty,
  InitialsAvatar,
} from "~/shared/network/components/directory-bits/DirectoryBits";

interface RequestData {
  _id: string;
  name?: string;
  mobile?: string;
  email?: string;
  initials?: string;
  distanceKm?: number;
  createdAt?: string | Date;
  formattedLocation?: string | null;
  sfsellerInfo?: {
    name?: string;
    details?: {
      mobile?: string;
      distanceKm?: number;
    };
  };
  _statusLbl?: string;
  _statusColor?: string;
  [key: string]: any;
}

interface MobileViewProps {
  loading?: boolean;
  data: RequestData[];
  onView?: (item: RequestData) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ loading, data, onView }) => {
  const { t } = useTranslation(["common"]);

  // Sorting and filtering both clear the rows before the refetch lands, so the
  // list needs its own placeholder — the desktop table has the skeleton rows.
  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-border tw:bg-white tw:md:grid tw:md:grid-cols-2 tw:md:gap-3 tw:md:divide-y-0 tw:md:bg-transparent">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="tw:animate-pulse tw:bg-white tw:p-3.5 tw:md:rounded-xl tw:md:border tw:md:border-border"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-full tw:bg-gray-200" />
              <div className="tw:min-w-0 tw:flex-1 tw:space-y-2">
                <div className="tw:h-4 tw:w-2/5 tw:rounded tw:bg-gray-200" />
                <div className="tw:h-3 tw:w-3/5 tw:rounded tw:bg-gray-200" />
                <div className="tw:h-3 tw:w-4/5 tw:rounded tw:bg-gray-200" />
                <div className="tw:h-5 tw:w-24 tw:rounded-full tw:bg-gray-200" />
              </div>
              <div className="tw:h-4 tw:w-4 tw:shrink-0 tw:rounded tw:bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <DirectoryEmpty
        variant="bleed"
        title="No joining requests"
        description="Nothing matches this status or filter. Try another segment or clear your search."
      />
    );
  }

  return (
    /* `app-bleed-x` pulls the list out of the page gutter on theme-2 mobile so
       the rows run edge to edge as one flush block — no gaps, no corners. The
       card grid comes back from md up. */
    <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white tw:md:grid tw:md:grid-cols-2 tw:md:gap-3 tw:md:divide-y-0 tw:md:bg-transparent">
      {data.map((item, idx) => {
        const name = item.name || item.sfsellerInfo?.name || "";
        const mobile =
          item.mobile || item.sfsellerInfo?.details?.mobile || "";
        const distance =
          item.distanceKm ?? item.sfsellerInfo?.details?.distanceKm;

        return (
          <div
            key={item._id || idx}
            className="tw:bg-white tw:md:rounded-xl tw:md:border tw:md:border-border tw:md:shadow-sm"
          >
            <div
              className="tw:cursor-pointer tw:p-3.5"
              onClick={() => onView?.(item)}
            >
              <div className="tw:flex tw:items-start tw:gap-3">
                <InitialsAvatar
                  name={name}
                  initials={item.initials}
                  size={48}
                />

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:truncate tw:text-base tw:font-semibold">
                      {name}
                    </span>
                  </div>

                  <div className="tw:mt-0.5 tw:text-xs tw:text-gray-600">
                    {mobile ? `+91 ${mobile}` : t("nA")}
                  </div>

                  {item.formattedLocation ? (
                    <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                      {item.formattedLocation}
                    </div>
                  ) : null}

                  <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-xs tw:text-gray-500">
                    {distance != null ? (
                      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:text-sky-600">
                        <Navigation className="tw:h-3 tw:w-3" />
                        {CommonService.roundedByDecimalPlace(distance, 2)} km
                      </span>
                    ) : null}
                    {item.createdAt ? (
                      <span>
                        Requested ·{" "}
                        <DateFormat
                          value={item.createdAt}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                    ) : null}
                  </div>

                  <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                    <AppBadge
                      variant={(item._statusColor as any) || "warning"}
                    >
                      {item._statusLbl || t("pending")}
                    </AppBadge>
                  </div>
                </div>

                <ChevronRight className="tw:mt-1 tw:h-4 tw:w-4 tw:shrink-0 tw:text-gray-400" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
