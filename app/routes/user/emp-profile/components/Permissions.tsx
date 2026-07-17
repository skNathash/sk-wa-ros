import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";

const Permissions = ({ data }: { data: any }) => {
  return (
    <AppCard title={`Permissions (${data?.length})`} icon="shield">
      {!data?.length && (
        <div className="tw:text-gray-500 tw:text-sm tw:text-center tw:py-4">
          No permissions assigned.
        </div>
      )}

      <AppScrollArea className="tw:h-96">
        {data?.map((item: any, idx: number) => (
          <div
            key={idx}
            className="tw:bg-gray-50 tw:px-4 tw:py-2 tw:rounded-md tw:flex tw:justify-between tw:items-center tw:mb-2"
          >
            <div className="tw:text-sm">{item.name || item.code}</div>
            <div>
              <AppBadge variant="success">Granted</AppBadge>
            </div>
          </div>
        ))}
      </AppScrollArea>
    </AppCard>
  );
};

export default Permissions;
