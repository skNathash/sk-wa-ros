import React from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import { Link, Copy } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { useTranslation } from "react-i18next";
import { ROS_STORE_URL } from "~/constants";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";

type Props = {
  mobile?: string;
  link?: string;
  className?: string;
};

const StoreLinkPopover: React.FC<Props> = ({ mobile, link, className }) => {
  const { t } = useTranslation();
  const appToast = useAppToast();
  const storeLink = link || (mobile ? ROS_STORE_URL + mobile : "");

  const handleOpen = () => {
    if (!storeLink) return;
    CommonService.windowOpenHandler(storeLink, () => {
      appToast.show({ msg: "Store link opened in new tab", color: "success" });
    });
  };

  const handleCopy = () => {
    if (!storeLink) return;
    CommonService.copyToClipboard(storeLink);
    appToast.show({ msg: "Store link copied to clipboard", color: "success" });
  };

  return (
    <AppPopover
      triggerContent={
        <div
          className={`tw:text-xs tw:text-gray-500 tw:cursor-pointer ${className || ""}`}
        >
          <div className="tw:flex tw:items-center tw:gap-2">
            <Link size={12} className="tw:text-gray-400" />
            <div className="tw:text-xs tw:text-gray-700 tw:font-semibold">
              Store Link
            </div>
          </div>
        </div>
      }
    >
      <div className="tw:space-y-2 tw:p-2">
        <div
          className="tw:text-xs tw:text-gray-500 tw:break-words"
          title={storeLink}
        >
          {storeLink || "-"}
        </div>

        <div className="tw:flex tw:flex-col tw:gap-1">
          <AppButton
            size="small"
            fill="clear"
            className="tw:w-full tw:justify-start"
            onClick={handleOpen}
          >
            <Link size={14} className="tw:mr-2" />
            Open
          </AppButton>

          <AppButton
            size="small"
            fill="clear"
            className="tw:w-full tw:justify-start"
            onClick={handleCopy}
          >
            <Copy size={14} className="tw:mr-2" />
            Copy
          </AppButton>
        </div>
      </div>
    </AppPopover>
  );
};

export default StoreLinkPopover;
