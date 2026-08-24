import clsx from "clsx";
import { Lock, Search, X } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";
import {
  CHATS_ENCRYPTED_LBL,
  CHATS_SEARCH_LBL,
  RUNNER_CHATS,
} from "../../helper";
import ChatRow from "../chat-row/ChatRow";

interface ChatListPaneProps {
  /** True on the inbox route, where the list is the screen and takes a list's
      width; false in the thread's side pane, where it fills the pane. */
  isPage?: boolean;
}

/**
 * The inbox itself — search over one flat list of conversations. Shared,
 * because a thread on a desktop keeps the list beside it: the same component
 * is the whole of `/runner/chats` and the left pane of a thread.
 */
export default function ChatListPane({ isPage }: ChatListPaneProps) {
  const [search, setSearch] = useState("");

  return (
    <>
      {/* Search sits on the page tint above the list, not in the masthead: it
          filters the feed, so it belongs to the feed. */}
      <div
        className={clsx("runner-chat-search-wrap tw:px-4 tw:pt-4 tw:pb-3", {
          "runner-chat-search-wrap--page": isPage,
        })}
      >
        <div className="tw:relative">
          <Search
            size={16}
            className="tw:absolute tw:top-1/2 tw:left-4 tw:-translate-y-1/2 tw:text-slate-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={CHATS_SEARCH_LBL}
            className="runner-chat-search"
          />
          {search && (
            <AppButton
              fill="clear"
              size="icon"
              className="runner-chat-search-clear"
              onClick={() => setSearch("")}
            >
              <X size={15} />
            </AppButton>
          )}
        </div>
      </div>

      <section
        className={clsx("runner-chat-list", {
          "runner-chat-list--page": isPage,
        })}
      >
        {RUNNER_CHATS.map((chat) => (
          <ChatRow key={chat.id} chat={chat} />
        ))}
      </section>

      <p className="runner-chat-encrypted">
        <Lock size={11} />
        {CHATS_ENCRYPTED_LBL}
      </p>
    </>
  );
}
