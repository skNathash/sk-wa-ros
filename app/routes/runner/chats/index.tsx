import { MoreHorizontal, Search } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import RunnerHeader from "~/shared/runner/header/RunnerHeader";
import ChatListPane from "./components/chat-list-pane/ChatListPane";
import { CHATS_HEADER } from "./helper";

/**
 * Runner inbox, inside the runner shell ({@link RunnerLayout}). One flat list
 * rather than folders: the runner talks to a handful of stores and one support
 * desk, so the only ordering that matters is who spoke last. The list itself is
 * {@link ChatListPane}, which a thread renders beside itself on a desktop.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerChats = () => {
  return (
    <>
      <RunnerHeader
        eyebrow={CHATS_HEADER.eyebrow}
        statusLbl={CHATS_HEADER.statusLbl}
        title={CHATS_HEADER.title}
        subtitle={CHATS_HEADER.subtitle}
      >
        <AppButton fill="clear" size="icon" className="runner-hero-icon-btn">
          <Search size={18} />
        </AppButton>
        <AppButton fill="clear" size="icon" className="runner-hero-icon-btn">
          <MoreHorizontal size={18} />
        </AppButton>
      </RunnerHeader>

      <ChatListPane isPage />
    </>
  );
};

export default RunnerChats;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner chats"),
    },
  ];
}
