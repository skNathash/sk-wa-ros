import clsx from "clsx";
import { Search } from "lucide-react";
import { chatIdentity } from "../helper";
import Avatar from "./Avatar";

/** Presentational — the thread's own actions are the composer below. */
const ACTIONS = [{ key: "search", icon: Search, label: "Search chat" }];

/**
 * The contact strip: mark, name, tagline and presence. Shown at every
 * breakpoint so the chat keeps its identity inside the mobile full-screen
 * view as well as the desktop side pane.
 */
const ChatHeader = ({
  connected,
  sending,
}: {
  connected: boolean;
  sending: boolean;
}) => (
  <div className="wa-chat-header tw:flex tw:shrink-0 tw:items-center tw:gap-3 tw:px-4 tw:py-2.5">
    <Avatar mark={chatIdentity.avatarMark} className="tw:size-11 tw:text-lg" />

    <div className="tw:min-w-0 tw:flex-1">
      <div className="tw:truncate tw:text-lg tw:font-bold tw:text-white">
        {chatIdentity.title}
      </div>
      <div className="tw:truncate tw:text-xs tw:text-white/75">
        {chatIdentity.tagline}
      </div>
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-white/60">
        <span
          className={clsx(
            "tw:size-1.5 tw:shrink-0 tw:rounded-full",
            connected ? "tw:bg-emerald-400" : "tw:bg-slate-400",
          )}
        />
        <span className="tw:truncate">
          {sending ? "typing…" : connected ? "online · always here" : null}
        </span>
      </div>
    </div>

    <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          type="button"
          aria-label={action.label}
          className="tw:flex tw:size-9 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-white/12 tw:text-white tw:transition tw:hover:bg-white/20"
        >
          <action.icon size={16} />
        </button>
      ))}
    </div>
  </div>
);

export default ChatHeader;
