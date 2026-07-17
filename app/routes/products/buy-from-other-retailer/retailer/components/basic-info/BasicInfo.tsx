import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import { useTranslation } from "react-i18next";
import {
  BriefcaseBusiness,
  Copy,
  Link,
  Navigation,
  Phone,
  User,
} from "lucide-react";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";
import { ROS_STORE_URL } from "~/constants";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";

type Props = {
  data: any;
};

const BasicInfo = ({ data }: Props) => {
  const { t } = useTranslation();
  const appToast = useAppToast();

  const storeLink = ROS_STORE_URL + data.mobile;

  const handleStoreLinkClick = () => {
    CommonService.windowOpenHandler(storeLink, () => {
      appToast.show({
        msg: "Store link opened in new tab",
        color: "success",
      });
    });
  };

  const handleCopyStoreLink = () => {
    CommonService.copyToClipboard(storeLink);
    appToast.show({
      msg: "Store link copied to clipboard",
      color: "success",
    });
  };

  return (
    <AppCard>
      <div className="tw:flex tw:gap-2 tw:items-start tw:mb-2">
        <ImgRender
          assetId={data.shopImg}
          alt={data.name}
          className="tw:w-24 tw:h-24 tw:rounded-lg tw:object-cover tw:bg-gray-100"
        />
        <div className="tw:flex tw:flex-col tw:gap-2">
          <div>
            <div className="tw:text-xs tw:text-gray-500">{t("storeName")}</div>
            <div className="tw:text-lg tw:font-medium tw:line-clamp-2 tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
              {data.name} <UserBadgeType type={data.displayType?.name} />
            </div>
          </div>

          <div className="tw:flex tw:gap-2 tw:flex-wrap">
            <div className="tw:text-sm tw:text-gray-500">
              <div className="tw:flex tw:items-center tw:gap-1">
                <Phone size={14} className="tw:text-gray-400" />
                <span className="tw:text-xs tw:text-gray-500">
                  {data.mobile}
                </span>
              </div>
            </div>

            {data.primaryBusiness && (
              <div className="tw:flex tw:items-center tw:gap-1">
                <BriefcaseBusiness size={14} className="tw:text-gray-400" />
                <span className="tw:text-xs tw:text-gray-500">
                  {data.primaryBusiness}
                </span>
              </div>
            )}

            <div className="tw:flex tw:items-center tw:gap-1">
              <Navigation size={14} className="tw:text-gray-400" />
              <span className="tw:text-xs tw:text-gray-500">
                {data.distanceToFranchiseKm} km away
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Link */}
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:px-2 tw:py-1 tw:rounded tw:bg-blue-50 tw:border tw:border-blue-200">
        <Link size={12} className="tw:text-blue-600 tw:flex-shrink-0" />
        <span className="tw:text-[10px] tw:font-semibold tw:text-blue-700 tw:flex-shrink-0">
          Store Link
        </span>
        <span
          className="tw:text-[11px] tw:text-gray-600 tw:truncate tw:flex-1 tw:cursor-pointer tw:select-all"
          title={storeLink}
          onClick={handleStoreLinkClick}
        >
          {storeLink}
        </span>
        <button
          type="button"
          onClick={handleCopyStoreLink}
          className="tw:p-0.5 tw:rounded tw:text-blue-600 hover:tw:bg-blue-100 tw:flex-shrink-0"
          title="Copy link"
        >
          <Copy size={12} />
        </button>
      </div>
    </AppCard>
  );
};

export default BasicInfo;
