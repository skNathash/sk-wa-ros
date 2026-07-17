import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

interface Props {
  franchise: any;
}

export default function AccountStatus({ franchise }: Props) {
  if (!franchise) return null;

  return (
    <AppCard title="Account Status">
      <div className="tw:flex tw:flex-col tw:gap-3 tw:text-sm tw:text-gray-700">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:font-medium tw:text-gray-600">Status</div>
          <div>
            <AppBadge variant="outline">{franchise.status}</AppBadge>
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:font-medium tw:text-gray-600">Joined on</div>
          <div className="tw:text-gray-800">
            <DateFormat value={franchise.createdAt} formatStr="dd MMM yyyy" />
          </div>
        </div>
      </div>
    </AppCard>
  );
}
