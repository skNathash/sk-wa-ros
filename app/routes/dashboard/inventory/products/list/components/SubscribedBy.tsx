import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";

interface SubscribedByProps {
  subscribedBy?: { id?: string; name?: string; type?: string } | any;
  className?: string;
  popoverSide?: "top" | "right" | "left" | "bottom";
}

const SubscribedBy: React.FC<SubscribedByProps> = ({
  subscribedBy,
  className = "",
  popoverSide = "left",
}) => {
  const { t } = useTranslation(["common"]);

  if (!subscribedBy?.referenceId) return null;

  // Only customer links are expected here — always use the B2C customer view
  const url = subscribedBy?.referenceId
    ? `/dashboard/network/view/b2c/${subscribedBy.referenceId}`
    : "#";

  return (
    <div className={`${className} tw:flex tw:items-center tw:gap-2 tw:mt-2`}>
      <span className="tw:text-xs tw:text-slate-500 tw:flex tw:items-center tw:gap-2 tw:whitespace-nowrap">
        <span className="tw:font-normal">{t("subscribedBy")}</span>

        <span className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:ml-1 tw:font-semibold">{subscribedBy.type}</span>
          <AppPopover
            triggerContent={
              <button className="tw:cursor-pointer tw:flex tw:items-center">
                <Info size={14} />
              </button>
            }
            side={popoverSide}
            align="center"
          >
            <div className="tw:p-2 tw:max-w-[220px]">
              {/* Title to inform the user what this popup shows */}
              <div className="tw:font-semibold tw:text-xs tw:mb-1">
                {t("subscribedBy")}
                {subscribedBy?.type ? (
                  <span className="tw:ml-1 tw:font-normal">{` - ${subscribedBy.type}`}</span>
                ) : null}
              </div>

              <div className="tw:font-medium tw:text-sm">
                {subscribedBy?.name || "--"}
              </div>
              <div className="tw:mt-2">
                <AppLink
                  href={url}
                  asLink
                  className="tw:text-blue-600 tw:text-xs"
                >
                  {t("viewCustomer")}
                </AppLink>
              </div>
            </div>
          </AppPopover>
        </span>
      </span>
    </div>
  );
};

export default SubscribedBy;
