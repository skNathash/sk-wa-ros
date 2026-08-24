import { Edit, Phone, Trash2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import CommonService from "~/services/CommonService";

type Props = {
  data: any[];
  callback: (args: { action: string; data?: any }) => void;
};

/**
 * Specific-user list: one card per user, matching the rounded bordered sheet
 * style of the global settings cards on the same page. Each user stacks an
 * avatar, name, number and the Prepaid state on the left, with edit and remove
 * on the right rail.
 */
const MobileView = ({ data, callback }: Props) => {
  return (
    <div className="tw:space-y-3">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:shadow-sm tw:transition-shadow hover:tw:shadow-md"
        >
          <div className="tw:shrink-0 tw:h-10 tw:w-10 tw:rounded-full tw:bg-blue-50 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold tw:text-blue-600">
            {CommonService.prepareInitials(item.name)}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <h3 className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
              {item.name}
            </h3>
            <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-gray-600">
              <Phone size={14} className="tw:shrink-0 tw:text-blue-600" />
              <span className="tw:truncate tw:text-xs">{item.mobileNo}</span>
            </div>
            <div className="tw:mt-2">
              <AppBadge
                variant={item.prepaidEnabled ? "success" : "danger"}
                className="tw:font-medium"
              >
                Prepaid {item.prepaidEnabled ? "Enabled" : "Disabled"}
              </AppBadge>
            </div>
          </div>

          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
            <AppButton
              color="light"
              size="small"
              fill="clear"
              onClick={() => callback({ action: "edit", data: item })}
              title="Edit customer"
            >
              <Edit size={14} />
            </AppButton>
            <AppButton
              color="danger"
              size="small"
              fill="clear"
              onClick={() => callback({ action: "delete", data: item })}
              title="Delete customer"
            >
              <Trash2 size={14} />
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
