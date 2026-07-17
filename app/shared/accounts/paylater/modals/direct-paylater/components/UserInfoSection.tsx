import React from "react";
import { User, Phone, MapPin, Hash, Building2 } from "lucide-react";

type Props = {
  user: Record<string, any> | null;
};

const UserInfoSection: React.FC<Props> = ({ user }) => {
  if (!user) return null;

  const address = [
    user.city || user.address?.city,
    user.town,
    user.district || user.address?.district,
    user.state || user.address?.state,
  ]
    .filter(Boolean)
    .join(", ");

  const initials = (user.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2 tw:px-1">
        <User size={14} className="tw:text-blue-600" />
        <span className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wider">
          Customer Details
        </span>
      </div>
      <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-xl tw:p-3 tw:flex tw:items-start tw:gap-4 tw:shadow-sm">
      <div className="tw:w-12 tw:h-12 tw:bg-blue-600 tw:text-white tw:rounded-xl tw:flex tw:items-center tw:justify-center tw:text-lg tw:font-bold tw:flex-shrink-0">
        {initials}
      </div>
      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-0.5">
          <h3 className="tw:text-base tw:font-bold tw:text-gray-900 tw:truncate">
            {user.name || "-"}
          </h3>
          <span className="tw:text-[10px] tw:font-bold tw:px-2 tw:py-0.5 tw:bg-blue-50 tw:text-blue-600 tw:rounded-full tw:flex tw:items-center tw:gap-1">
            <Hash size={10} />
            {user.franchiseId || user.refNo || user._id || "-"}
          </span>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-x-4 tw:gap-y-1">
          {user.mobile && (
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-gray-600">
              <Phone size={12} className="tw:text-gray-400" />
              <span className="tw:text-xs tw:font-medium">{user.mobile}</span>
            </div>
          )}
        </div>

        {address && (
          <div className="tw:flex tw:items-start tw:gap-1.5 tw:text-gray-600">
            <MapPin size={12} className="tw:text-gray-400 tw:mt-0.5" />
            <span className="tw:text-xs tw:truncate" title={address}>
              {address}
            </span>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default UserInfoSection;
