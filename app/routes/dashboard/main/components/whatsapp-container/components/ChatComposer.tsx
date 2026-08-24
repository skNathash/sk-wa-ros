import { Mic, Plus, Send } from "lucide-react";
import { memo, useState } from "react";
import { chatIdentity } from "../helper";

/**
 * The composer keeps the draft to itself — every keystroke would otherwise
 * re-render the whole transcript above it, which is what made typing lag.
 */
const ChatComposer = memo(function ChatComposer({
  sending,
  onSend,
}: {
  sending: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <form
      className="wa-chat-composer tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:px-3 tw:py-2.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.trim()) return;
        onSend(draft);
        setDraft("");
      }}
    >
      <button
        type="button"
        aria-label="Attach"
        className="tw:flex tw:size-9 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:text-slate-500 tw:transition tw:hover:bg-slate-200"
      >
        <Plus size={20} />
      </button>

      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2 tw:rounded-full tw:bg-white tw:px-4 tw:py-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={chatIdentity.composerPlaceholder}
          className="tw:min-w-0 tw:flex-1 tw:text-sm tw:text-slate-700 tw:outline-none tw:placeholder:text-slate-400"
        />
        <Mic size={16} className="tw:shrink-0 tw:text-slate-400" />
      </div>
      <button
        type="submit"
        aria-label="Send"
        disabled={sending || !draft.trim()}
        className="wa-send tw:flex tw:size-9 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:text-white tw:transition tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
      >
        <Send size={16} />
      </button>
    </form>
  );
});

export default ChatComposer;
