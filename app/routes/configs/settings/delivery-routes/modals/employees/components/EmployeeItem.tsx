import { Phone, Mail, AlertCircle, CheckCircle } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";

type Props = {
  item: any;
  routeData: any | null;
  assigning?: boolean;
  onAssign: (user: any) => void;
};

const EmployeeItem = ({ item, routeData, onAssign, assigning }: Props) => {
  const routes: { _id: string; name: string }[] = item.routes || [];
  const isAlreadyLinked = routeData
    ? routes.some((r) => r._id === routeData._id)
    : false;

  return (
    <AppCard noPadding>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:p-3">
        <div className="tw:flex tw:flex-row tw:items-start tw:justify-between tw:gap-2">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
              <AppLink
                asLink
                href={`/dashboard/employee/view/${item._id}`}
              >
                {item.name}
              </AppLink>
            </div>
            {item.position ? (
              <div className="tw:text-[10px] tw:text-gray-400 tw:font-medium tw:mt-0.5">
                {item.position}
              </div>
            ) : null}
          </div>

          <div className="tw:shrink-0">
            {isAlreadyLinked ? (
              <span className="tw:text-xs tw:font-semibold tw:text-green-600 tw:px-2 tw:py-1">
                Linked
              </span>
            ) : (
              <AppButton
                size="small"
                onClick={() => onAssign(item)}
                isLoading={assigning}
                color="primary"
                className="tw:bg-green-600 hover:tw:bg-green-700 tw:text-white"
              >
                Assign
              </AppButton>
            )}
          </div>
        </div>

        <div className="tw:space-y-1">
          {item.mobile ? (
            <div className="tw:flex tw:items-center tw:text-xs tw:text-gray-600">
              <Phone
                size={14}
                className="tw:mr-1.5 tw:text-gray-400 tw:shrink-0"
              />
              <span className="tw:truncate">{item.mobile}</span>
            </div>
          ) : null}

          {item.email ? (
            <div className="tw:flex tw:items-center tw:text-xs tw:text-gray-600">
              <Mail
                size={14}
                className="tw:mr-1.5 tw:text-gray-400 tw:shrink-0"
              />
              <span className="tw:truncate">{item.email}</span>
            </div>
          ) : null}
        </div>

        {routes.length > 0 ? (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-blue-50 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-blue-200">
            <CheckCircle
              size={14}
              className="tw:text-blue-600 tw:shrink-0"
            />
            <div className="tw:flex-1 tw:min-w-0">
              <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
                Routes:{" "}
              </span>
              <span className="tw:text-xs tw:font-semibold tw:text-blue-700">
                {routes.map((r) => r.name).join(", ")}
              </span>
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-red-100 tw:rounded tw:px-2.5 tw:py-2 tw:border tw:border-red-300">
            <AlertCircle size={14} className="tw:text-red-600 tw:shrink-0" />
            <span className="tw:text-xs tw:font-semibold tw:text-red-700">
              No route assigned
            </span>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default EmployeeItem;
