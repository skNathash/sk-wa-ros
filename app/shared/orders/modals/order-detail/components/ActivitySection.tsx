import clsx from "clsx";
import { History } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import type { OrderDetailView } from "../helper";
import Section from "./Section";

/** Timeline of everything that has happened on the order. */
const ActivitySection = ({ order }: { order: OrderDetailView }) => {
  if (order.activity.length === 0) return null;

  return (
    <Section title="Activity" icon={<History size={13} />}>
      <div className="od-timeline">
        {order.activity.map((entry) => (
          <div
            key={entry.key}
            className={clsx("od-tl", entry.isLatest && "od-tl-latest")}
          >
            <div className="od-tl-rail">
              <span className="od-tl-dot" />
              {entry.isLatest ? null : <span className="od-tl-line" />}
            </div>
            <div className="od-tl-body">
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                <p className="od-tl-title">{entry.title}</p>
                <span className="od-tl-at">
                  <DateFormat value={entry.at} formatStr="dd MMM · hh:mm a" />
                </span>
              </div>
              {entry.subtitle ? (
                <p className="od-tl-sub">{entry.subtitle}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default ActivitySection;
