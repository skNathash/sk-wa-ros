import { ChevronLeft, MoreVertical, Phone } from "lucide-react";
import { Link } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import { CHAT_THREAD_HEADER } from "../../helper";

/**
 * Thread masthead. Shallower than the runner masthead on the feed screens: a
 * conversation is a place the runner came *into*, so back leads and the name
 * sits on one line with the presence under it — the rest is screen for
 * messages.
 */
export default function ChatTopbar() {
  return (
    <header className="runner-chat-topbar">
      <Link to="/runner/chats" className="runner-chat-back">
        <ChevronLeft size={22} />
      </Link>

      <span className="runner-chat-avatar runner-chat-avatar--teal runner-chat-avatar--sm">
        {CHAT_THREAD_HEADER.avatarLbl}
      </span>

      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:block tw:truncate tw:text-base tw:font-semibold tw:text-white">
          {CHAT_THREAD_HEADER.name}
        </span>
        <span className="tw:block tw:truncate tw:text-xs tw:text-white/70">
          {CHAT_THREAD_HEADER.statusLbl}
        </span>
      </span>

      <AppButton fill="clear" size="icon" className="runner-chat-topbar-btn">
        <Phone size={18} />
      </AppButton>
      <AppButton fill="clear" size="icon" className="runner-chat-topbar-btn">
        <MoreVertical size={18} />
      </AppButton>
    </header>
  );
}
