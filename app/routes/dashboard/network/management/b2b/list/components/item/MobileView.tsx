import { ChevronRight, Phone, Route, Calendar } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import DateFormat from "~/components/core/date/DateFormat";
import UserBadgeForItem from "~/shared/store/badge/UserBadgeForItem";
import RoutePopover from "~/shared/logistics/components/RoutePopover";

interface CustomerData {
  _id?: string;
  id?: string;
  name?: string; // business name
  customerInfo?: { name?: string; contact?: string; [key: string]: any };
  ownerDetails?: { name?: string };
  email?: string;
  tier?: string;
  totalSpent?: number;
  orders?: number;
  loyaltyPoints?: number;
  mobile?: string;
  createdAt?: string | Date;
  city?: string;
  town?: string;
  district?: string;
  state?: string;
  pincode?: string;
  kycStatus?: { overallStatus?: string };
  lastLogin?: string | Date;
  [key: string]: any;
}

interface MobileViewProps {
  data: CustomerData[];
  onView?: (item: CustomerData) => void;
  onAction?: (arg: { action: string; data?: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, onView, onAction }) => {
  const { t } = useTranslation(["common"]);

  if (data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, idx) => {
        const businessName = item.name || "-";
        const initials = (item.initials as string) || "";
        const location = item.location || t("nA").replace("/", "");

        return (
          <AppLink
            key={item._id || item.id || idx}
            asLink
            href={`/dashboard/network/view/b2b/${item._id || item.id}`}
            noUnderline
          >
            <AppCard className="tw:mb-0">
              <div className="tw:flex tw:flex-col tw:gap-3">
                <div className="tw:flex tw:items-start tw:gap-4">
                  {/* Avatar */}
                  <div className="tw:w-12 tw:h-12 tw:rounded-full tw:bg-linear-to-br tw:from-blue-400 tw:to-purple-400 tw:flex tw:items-center tw:justify-center tw:text-white tw:text-lg tw:font-bold tw:shrink-0">
                    {initials}
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-[15px] tw:font-semibold tw:text-gray-800 tw:truncate">
                      {businessName}
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                      <div className="tw:text-gray-500 tw:text-sm tw:truncate tw:flex tw:items-center tw:gap-1">
                        <Phone className="tw:w-4 tw:h-4 tw:shrink-0" />
                        {item.mobile}
                      </div>
                      <UserBadgeForItem
                        networkType={item.networkType}
                        subType={item.subType}
                      />
                    </div>
                  </div>
                </div>

                <div className="tw:mb-1">
                  <div className="tw:text-xs tw:text-gray-500 tw:font-medium tw:mb-1">
                    Route:
                  </div>
                  {item.routes && item.routes.length > 0 ? (
                    <div className="tw:flex tw:flex-wrap tw:gap-1">
                      {item.routes.map((route: any, idx: number) => (
                        <div
                          key={idx}
                          title={route.description || route.name || "-"}
                          className="tw:flex tw:items-center tw:gap-1"
                        >
                          <AppBadge
                            variant="secondary"
                            className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:px-2 tw:py-1"
                          >
                            <Route size={12} />
                            <span className="tw:font-medium tw:truncate tw:max-w-20">
                              {route.description || route.name || "-"}
                            </span>
                          </AppBadge>
                          <div className="tw:ml-1">
                            <RoutePopover route={route} isActive={false} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tw:text-xs tw:text-gray-300 tw:italic">
                      No route configured
                    </div>
                  )}
                </div>

                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <div className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0">
                    {item.createdAt && (
                      <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500">
                        <Calendar size={12} />
                        <span className="tw:text-xs tw:text-gray-500 tw:font-medium">
                          Date:
                        </span>
                        <DateFormat
                          value={item.createdAt || null}
                          formatStr="dd MMM yyyy"
                        />
                      </div>
                    )}
                    <div className="tw:text-gray-400 tw:text-xs tw:font-medium tw:mt-1 tw:truncate">
                      {location}
                    </div>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <button
                      type="button"
                      aria-label="Promote"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAction &&
                          onAction({ action: "openWhatsapp", data: item });
                      }}
                      className="tw:flex tw:items-center tw:gap-1 tw:px-2 tw:py-1 tw:border tw:border-green-500 tw:rounded-md tw:cursor-pointer hover:tw:bg-green-50 tw:transition-colors"
                    >
                      <ImgRender
                        src="whatsapp-logo.png"
                        alt="WhatsApp"
                        className="tw:h-4 tw:w-4 tw:shrink-0"
                      />
                      <span className="tw:text-xs tw:font-medium tw:text-green-600 tw:whitespace-nowrap">Promote via WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mt-2">
                <div>
                  {/* primary business */}
                  <div className="tw:text-xs tw:text-gray-500">
                    Primary Business
                  </div>
                  <div className="tw:text-xs tw:font-medium tw:mb-1">
                    {item.primaryBusiness || "--"}
                  </div>
                </div>

                {/* secondary business */}
                <div>
                  <div className="tw:text-xs tw:text-gray-500">
                    Secondary Business
                  </div>
                  <div className="tw:text-xs tw:font-medium tw:mb-1">
                    {item.secondaryBusiness || "--"}
                  </div>
                </div>
              </div>
            </AppCard>
          </AppLink>
        );
      })}
    </div>
  );
};

export default MobileView;
