import { Mic, Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import { CHAT_COMPOSER_LBL } from "../../helper";

/**
 * The composer, pinned to the bottom of the thread. The trailing button swaps
 * mic for send the moment there is a draft — the runner works one-handed with
 * gloves on, so voice is the resting action, not a secondary one.
 */
export default function ChatComposer() {
  const [draft, setDraft] = useState("");

  return (
    <div className="runner-chat-composer">
      <div className="runner-chat-composer-field">
        <Smile size={20} className="tw:shrink-0 tw:text-slate-400" />

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={CHAT_COMPOSER_LBL}
          className="tw:min-w-0 tw:flex-1 tw:bg-transparent tw:text-[0.9375rem] tw:text-slate-900 tw:outline-none tw:placeholder:text-slate-400"
        />

        <Paperclip size={19} className="tw:shrink-0 tw:text-slate-400" />
      </div>

      <AppButton size="icon" className="runner-chat-send">
        {draft ? <SendHorizontal size={19} /> : <Mic size={19} />}
      </AppButton>
    </div>
  );
}
