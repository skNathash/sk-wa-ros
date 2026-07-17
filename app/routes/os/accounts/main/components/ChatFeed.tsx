import { accountsFeed, type LedgerItem } from "../data";
import LedgerBubble from "./LedgerBubble";

/**
 * Scrolling chat canvas: date/time dividers, centered system notes, and the
 * transaction bubbles themselves.
 *
 * The In / Out tabs narrow the feed to one direction. Dividers and system notes
 * are dropped while filtered — they annotate the full day's timeline, so they'd
 * strand (e.g. a "12 PM" divider with nothing under it) once entries are
 * removed around them.
 */
const ChatFeed = ({ filter }: { filter: "all" | "in" | "out" }) => {
  const items: LedgerItem[] =
    filter === "all"
      ? accountsFeed
      : accountsFeed.filter(
          (item) => item.kind === "entry" && item.direction === filter,
        );

  return (
    <div className="tw:flex-1 tw:overflow-y-auto tw:px-3 tw:py-3">
      <div className="tw:mx-auto tw:flex tw:max-w-2xl tw:flex-col tw:gap-2">
        {items.map((item) => {
          if (item.kind === "divider") {
            return (
              <div key={item.id} className="tw:my-1 tw:flex tw:justify-center">
                <span className="wa-mono tw:rounded-xl tw:bg-white/90 tw:px-2.5 tw:py-1 tw:text-[9.5px] tw:font-bold tw:tracking-wide tw:text-muted-foreground tw:shadow-sm">
                  {item.label}
                </span>
              </div>
            );
          }

          if (item.kind === "note") {
            return (
              <div key={item.id} className="tw:my-1 tw:flex tw:justify-center">
                <span className="wa-section-label tw:rounded-md tw:border tw:border-border tw:bg-card tw:px-2.5 tw:py-1 tw:text-center">
                  {item.text}
                </span>
              </div>
            );
          }

          return <LedgerBubble key={item.id} entry={item} />;
        })}
      </div>
    </div>
  );
};

export default ChatFeed;
