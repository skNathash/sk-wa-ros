import clsx from "clsx";
import { CheckCheck } from "lucide-react";
import type { RunnerChatMessage } from "../../helper";

interface MessageBubbleProps {
  message: RunnerChatMessage;
}

/**
 * One line of the conversation. Side, fill and the read ticks all hang off the
 * same flag, so an outgoing message never has to be read twice to place it.
 */
export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={clsx("runner-chat-msg-row", {
        "runner-chat-msg-row--out": message._isOut,
      })}
    >
      <div
        className={clsx("runner-chat-bubble", {
          "runner-chat-bubble--out": message._isOut,
        })}
      >
        <p className="tw:text-[0.9375rem] tw:leading-snug tw:text-slate-900">
          {message.text}
        </p>

        <span className="runner-chat-bubble-meta">
          {message._timeLbl}
          {message._isOut && (
            <CheckCheck size={14} className="runner-chat-tick" />
          )}
        </span>
      </div>
    </div>
  );
}
