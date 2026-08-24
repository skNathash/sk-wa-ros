import { Lock, MoreHorizontal, Search } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import RunnerBottomTab from "~/shared/runner/bottom-tab/RunnerBottomTab";
import ChatListPane from "../components/chat-list-pane/ChatListPane";
import { CHATS_HEADER } from "../helper";
import ChatComposer from "./components/chat-composer/ChatComposer";
import ChatTopbar from "./components/chat-topbar/ChatTopbar";
import JobBubble from "./components/job-bubble/JobBubble";
import MessageBubble from "./components/message-bubble/MessageBubble";
import {
  CHAT_DAY_LBL,
  CHAT_MESSAGES_MORNING,
  CHAT_MESSAGES_PICKUP,
} from "./helper";

/**
 * One conversation. Two shapes, as everywhere in the runner app: on a phone the
 * thread is the whole screen and it renders outside the runner shell, because
 * the composer owns the bottom and the tab bar would only sit between the
 * runner and the field they are typing in. From `lg` there is room for all
 * three panes at once — the sections, the inbox and the thread — so the nav and
 * the list come back and the back arrow goes away.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerChatDetail = () => {
  return (
    <div className="app-page page-bg runner-chat-page">
      {/* Desktop only — hidden while the composer owns the bottom of a phone. */}
      <RunnerBottomTab />

      <aside className="runner-chat-inbox-pane">
        <header className="runner-chat-inbox-head">
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-base tw:font-semibold tw:text-white">
            {CHATS_HEADER.title}
          </span>

          <AppButton
            fill="clear"
            size="icon"
            className="runner-chat-topbar-btn"
          >
            <Search size={17} />
          </AppButton>
          <AppButton
            fill="clear"
            size="icon"
            className="runner-chat-topbar-btn"
          >
            <MoreHorizontal size={17} />
          </AppButton>
        </header>

        <div className="runner-chat-inbox-scroll">
          <ChatListPane />
        </div>
      </aside>

      <div className="runner-frame">
        <ChatTopbar />

        <div className="runner-chat-thread">
          <div className="runner-chat-thread-col">
            <p className="tw:flex tw:justify-center">
              <span className="runner-chat-day">{CHAT_DAY_LBL}</span>
            </p>

            <p className="runner-chat-thread-note">
              <Lock size={11} />
              Messages are end-to-end encrypted
            </p>

            {CHAT_MESSAGES_MORNING.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* The run the store dropped into the thread, and the exchange it
              set off — kept in order rather than lifted out into a banner. */}
            <JobBubble />

            {CHAT_MESSAGES_PICKUP.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        <ChatComposer />
      </div>
    </div>
  );
};

export default RunnerChatDetail;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner chat"),
    },
  ];
}
