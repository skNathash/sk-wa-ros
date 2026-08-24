import clsx from "clsx";
import { BadgeCheck, Zap } from "lucide-react";
import { Link, useParams } from "react-router";
import type { RunnerChat } from "../../helper";

interface ChatRowProps {
  chat: RunnerChat;
}

/**
 * One conversation in the inbox. The avatar carries the thread's identity and
 * its live state, the middle column is the only part that wraps, and the right
 * column stacks time over unread so the count sits where the eye already is.
 *
 * The open thread is marked, which only shows where the list sits beside it —
 * the side pane on a desktop; on a phone the row is gone by the time the
 * thread is on screen.
 */
export default function ChatRow({ chat }: ChatRowProps) {
  const { chatId } = useParams();

  return (
    <Link
      to={`/runner/chats/${chat.id}`}
      className={clsx("runner-chat-row", {
        "runner-chat-row--active": chatId === String(chat.id),
      })}
    >
      <span className={clsx("runner-chat-avatar", chat._avatarCls)}>
        {chat._avatarLbl}

        {chat._isOfficial && (
          <BadgeCheck size={15} className="runner-chat-avatar-tick" />
        )}
        {chat._isOnline && <span className="runner-chat-avatar-dot" />}
      </span>

      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:flex tw:items-center tw:gap-1.5">
          <span className="tw:truncate tw:text-[0.9375rem] tw:font-bold tw:text-slate-900">
            {chat.name}
          </span>

          {chat._isOfficial && (
            <>
              <span className="runner-chat-official">Official</span>
              <Zap size={13} className="tw:shrink-0 tw:text-amber-500" />
            </>
          )}
        </span>

        <span className="tw:mt-0.5 tw:block tw:truncate tw:text-sm tw:text-slate-500">
          {chat._snippetLbl}
        </span>
      </span>

      <span className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1.5">
        <span
          className={clsx("runner-chat-time", {
            "runner-chat-time--unread": chat._unreadCount > 0,
          })}
        >
          {chat._timeLbl}
        </span>

        {chat._unreadCount > 0 && (
          <span className="runner-chat-unread">{chat._unreadCount}</span>
        )}
      </span>
    </Link>
  );
}
