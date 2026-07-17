import { Edit, Phone, Trash2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";

type Props = {
  data: any[];
  callback: (args: { action: string; data?: any }) => void;
};

const MobileView = ({ data, callback }: Props) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:p-3"
        >
          {/* Header with Customer Info */}
          <div className="tw:flex tw:items-start tw:justify-between tw:mb-3 tw:pb-3 tw:border-b tw:border-gray-100">
            <div className="tw:flex-1 tw:min-w-0">
              <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                {item.name}
              </h3>
              <div className="tw:flex tw:items-center tw:gap-1 tw:text-gray-600 tw:mt-1">
                <Phone size={14} className="tw:text-blue-600 tw:shrink-0" />
                <span className="tw:text-xs tw:truncate">{item.mobileNo}</span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="tw:flex tw:items-center tw:gap-1 tw:ml-2 tw:shrink-0">
              <AppButton
                color="light"
                size="small"
                fill="outline"
                onClick={() => callback({ action: "edit", data: item })}
                title="Edit customer"
              >
                <Edit size={14} />
              </AppButton>
              <AppButton
                color="danger"
                size="small"
                fill="outline"
                onClick={() => callback({ action: "delete", data: item })}
                title="Delete customer"
              >
                <Trash2 size={14} />
              </AppButton>
            </div>
          </div>

          {/* Payment Methods Status */}
          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:flex tw:items-center tw:justify-between">
              <label className="tw:text-xs tw:font-medium tw:text-gray-600">
                COD
              </label>
              <AppBadge variant={item.codEnabled ? "success" : "danger"}>
                {item.codEnabled ? "Enabled" : "Disabled"}
              </AppBadge>
            </div>
            <div className="tw:flex tw:items-center tw:justify-between">
              <label className="tw:text-xs tw:font-medium tw:text-gray-600">
                Prepaid
              </label>
              <AppBadge variant={item.prepaidEnabled ? "success" : "danger"}>
                {item.prepaidEnabled ? "Enabled" : "Disabled"}
              </AppBadge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
