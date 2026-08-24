import { BadgeCheck, FileText, Store } from "lucide-react";
import type { ReactNode } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

const Step = ({
  icon,
  title,
  date,
  done,
  last,
}: {
  icon: ReactNode;
  title: string;
  date?: string;
  done: boolean;
  last?: boolean;
}) => (
  <div className="tw:flex tw:gap-2.5">
    <div className="tw:flex tw:flex-col tw:items-center">
      <div
        className={`tw:w-6 tw:h-6 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shrink-0 ${
          done
            ? "tw:bg-blue-100 tw:text-blue-600"
            : "tw:bg-gray-100 tw:text-gray-400"
        }`}
      >
        {icon}
      </div>
      {!last ? (
        <div className="tw:w-px tw:flex-1 tw:min-h-4 tw:bg-gray-200 tw:my-1" />
      ) : null}
    </div>
    <div className={last ? "" : "tw:pb-3"}>
      <div className="tw:text-xs tw:font-semibold tw:text-gray-900">
        {title}
      </div>
      <div className="tw:text-xs tw:text-gray-500">
        {done ? (
          <>{date ? <DateFormat value={date} formatStr="dd MMM yyyy" /> : "--"}</>
        ) : (
          "Pending"
        )}
      </div>
    </div>
  </div>
);

const Summary = ({ data }: { data: any }) => {
  const reviewed = Boolean(data?.updatedByName);

  return (
    <AppCard title="Summary" icon={<FileText />} iconClassName="tw:text-blue-500">
      <AppBadge variant={data._statusColor || "light"}>
        <span className="tw:font-semibold">{data.summaryStatus}</span>
      </AppBadge>

      {data?.summaryDescription ? (
        <p className="tw:text-xs tw:text-gray-600 tw:mt-2 tw:mb-4">
          {data.summaryDescription}
        </p>
      ) : (
        <div className="tw:mb-4" />
      )}

      <Step
        icon={<Store size={12} />}
        title="Submitted by you"
        date={data.createdAt}
        done
      />
      <Step
        icon={<BadgeCheck size={12} />}
        title="Reviewed by StoreKing"
        date={data.updatedAt}
        done={reviewed}
        last
      />
    </AppCard>
  );
};

export default Summary;
