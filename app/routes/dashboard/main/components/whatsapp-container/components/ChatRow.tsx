import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router";
import type { ChatItem } from "../helper";
import Avatar from "./Avatar";
import RichText from "./RichText";
import Timestamp from "./Timestamp";

/**
 * Memoised: the transcript is long and nothing in a row changes once it is on
 * screen, so a row only re-renders when its own item does.
 */
const ChatRow = memo(function ChatRow({
  item,
  avatarMark,
  onReply,
}: {
  item: ChatItem;
  avatarMark: string;
  onReply: (text: string) => void;
}) {
  if (item.type === "divider") {
    return (
      <div className="tw:flex tw:justify-center tw:py-1">
        <span className="wa-divider tw:rounded-full tw:px-3 tw:py-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500 tw:shadow-sm">
          {item.label}
        </span>
      </div>
    );
  }

  // Action rows hang under the message that introduced them, so they keep the
  // bubble's left inset instead of starting at the avatar.
  if (item.type === "cards") {
    return (
      <div className="tw:ms-10 tw:space-y-1.5">
        {item.cards.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            className={clsx(
              "wa-card",
              `wa-card-${card.tone}`,
              "tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:bg-white tw:px-3 tw:py-2.5 tw:shadow-sm tw:transition tw:hover:shadow-md",
            )}
          >
            <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-100 tw:text-lg">
              {card.emoji}
            </span>
            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                {card.title}
              </span>
              <span className="tw:block tw:truncate tw:text-[11px] tw:text-slate-500">
                {card.meta}
              </span>
            </span>
            <ArrowRight size={14} className="tw:shrink-0 tw:text-slate-400" />
          </Link>
        ))}
      </div>
    );
  }

  if (item.type === "replies") {
    return (
      <div className="tw:ms-10 tw:flex tw:flex-wrap tw:gap-2">
        {item.replies.map((reply) => (
          <button
            key={reply.key}
            type="button"
            onClick={() => onReply(reply.send)}
            className={clsx(
              "tw:cursor-pointer tw:rounded-full tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:transition",
              reply.variant === "solid"
                ? "wa-reply-solid tw:text-white tw:shadow-sm"
                : "tw:border tw:border-slate-300 tw:bg-white tw:text-slate-700 tw:hover:bg-slate-50",
            )}
          >
            {reply.label}
          </button>
        ))}
      </div>
    );
  }

  const isOut = item.direction === "out";

  return (
    <div
      className={clsx(
        "tw:flex tw:items-end tw:gap-2",
        isOut ? "tw:justify-end" : "tw:justify-start",
      )}
    >
      {!isOut && (
        <Avatar mark={avatarMark} className="tw:mt-auto tw:size-8 tw:text-xs" />
      )}

      <div
        className={clsx(
          "wa-bubble tw:max-w-[85%] tw:min-w-0 tw:rounded-lg tw:px-3 tw:py-2 tw:shadow-sm",
          isOut ? "wa-bubble-out" : `wa-bubble-${item.tone ?? "plain"}`,
        )}
      >
        {item.eyebrow && (
          <div className="wa-eyebrow tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
            {item.eyebrow}
          </div>
        )}

        {item.headline && (
          <div className="tw:mt-1 tw:font-serif tw:text-xl tw:font-bold tw:leading-snug tw:text-slate-900">
            {item.headline}
          </div>
        )}

        {item.body && (
          <p
            className={clsx(
              "tw:text-sm tw:leading-relaxed tw:text-slate-700",
              (item.eyebrow || item.headline) && "tw:mt-1",
            )}
          >
            <RichText text={item.body} />
          </p>
        )}

        <Timestamp time={item.time} read={item.read} />
      </div>
    </div>
  );
});

export default ChatRow;
