import { Phone } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import UserPic from "~/shared/users/components/UserPic";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";

interface CustomerData {
  _id: string;
  referenceId: string;
  name: string;
  mobile: string;
  email?: string;
  registeredFrom: string;
  status: string;
  createdAt: string;
  dateOfRegistration: string;
  franchiseInfo: {
    id: string;
    name: string;
  };
  address: {
    city: string;
    state: string;
    postcode?: string;
  };
  formattedAddress: string;
  initials: string;
  gender?: string;
  profileImages?: string[];
  routes?: { description?: string; routeCode?: string }[];
  lastOrderDate?: string;
}

interface MobileViewProps {
  data: CustomerData[];
  onView?: (item: CustomerData) => void;
  callback?: (arg: { action: string; data?: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, onView, callback }) => {
  const { t } = useTranslation(["common"]);

  if (data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, idx) => {
        return (
          <div key={item._id || idx} className="tw:mb-0">
            <div
              className="tw:cursor-pointer"
              onClick={() => onView && onView(item)}
            >
              <AppCard className="tw:mb-0" noPadding>
                <div className="tw:flex tw:items-start tw:gap-3 tw:p-2.5">
                  {/* Avatar */}
                  <UserPic
                    assetId={item.profileImages?.[0]}
                    gender={item.gender}
                    type="b2c"
                    alt={item.name}
                    className="tw:w-10 tw:h-10 tw:rounded-full tw:object-cover tw:flex-shrink-0 tw:mt-0.5"
                  />
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-sm tw:font-semibold tw:truncate">
                      <AppLink
                        asLink
                        href={`/dashboard/network/view/b2c/${item._id}`}
                        noUnderline
                        showLinkColor
                        onClick={(e: any) => e.stopPropagation()}
                      >
                        {item.name}
                      </AppLink>
                    </div>
                    <div className="tw:text-gray-600 tw:text-xs tw:flex tw:items-center tw:gap-1 tw:mt-1">
                      <Phone className="tw:w-3.5 tw:h-3.5 tw:flex-shrink-0" />
                      {item.mobile}
                    </div>
                    <div className="tw:mt-2">
                      <button
                        type="button"
                        aria-label="Promote via WhatsApp"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          callback &&
                            callback({ action: "openWhatsapp", data: item });
                        }}
                        className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:border tw:border-green-500 tw:rounded-md tw:cursor-pointer hover:tw:bg-green-50 tw:transition-colors"
                      >
                        <ImgRender
                          src="whatsapp-logo.png"
                          alt="WhatsApp"
                          className="tw:h-4 tw:w-4 tw:shrink-0"
                        />
                        <span className="tw:text-xs tw:font-medium tw:text-green-600">
                          Promote via WhatsApp
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
