import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
import AppButton from "~/components/core/button/AppButton";
import { Calendar, MapPin } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";

const EmployeeListItem = ({ emp, callback }: any) => (
  <div
    className="tw:bg-white tw:rounded tw:p-3 tw:flex tw:gap-4 tw:shadow-sm tw:cursor-pointer"
    onClick={() => callback({ action: "view", data: emp })}
  >
    <ImgRender
      assetId={emp.profileImages?.[0]}
      alt={emp.name}
      className="tw:w-12 tw:h-12 tw:rounded-full tw:object-cover"
    />
    <div className="tw:flex-1 tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-2">
      <div>
        <div className="tw:font-medium tw:text-base">
          <AppLink onClick={(e) => {}}>{emp.name}</AppLink>
        </div>
        <div className="tw:text-xs tw:text-gray-500">ID: {emp._id}</div>
        <div className="tw:text-xs tw:text-gray-500">
          Mobile: {emp.mobileNo}
        </div>
      </div>
      <div>
        <div className="tw:text-xs tw:mb-1">
          <Calendar className="tw:mr-1 tw-inline-block tw-w-4 tw-h-4" />
          Created: <DateFormat value={emp.createdAt} />
        </div>
        <div className="tw:text-xs">
          <MapPin className="tw:mr-1 tw-inline-block tw-w-4 tw:h-4" />
          Address: {emp.address?.full_addrees || "-"}
        </div>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2">
        <div className="tw:text-xs tw:text-gray-500">Status</div>
        <AppBadge variant={emp.isActive ? "success" : "danger"}>
          {emp.isActive ? "Active" : "Disabled"}
        </AppBadge>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2 tw:md:mt-0">
        <AppButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            callback({ action: "toggle", data: emp });
          }}
          noShadow={true}
          color={emp.isActive ? "primary" : "secondary"}
          fill="outline"
        >
          {emp.isActive ? "Disable" : "Enable"}
        </AppButton>
        <AppButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            callback({ action: "edit", data: emp });
          }}
          noShadow={true}
          color="secondary"
          fill="outline"
        >
          Edit
        </AppButton>
      </div>
    </div>
  </div>
);

export default EmployeeListItem;
