import { CheckCheck, Pencil, Send } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import type { NudgePreview } from "../helper";

interface WhatsappPreviewProps {
  preview: NudgePreview;
  /** How many people the draft would go out to — the send button's number. */
  recipients: number;
  callback?: (payload: { action: string }) => void;
}

/**
 * The draft exactly as the buyer will see it, on a WhatsApp-looking ground so
 * the tone can be judged before it is sent rather than after.
 */
const WhatsappPreview: React.FC<WhatsappPreviewProps> = ({
  preview,
  recipients,
  callback,
}) => {
  return (
    <AppCard className="tw:mb-0 tw:h-full">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:pb-3">
        <h4 className="tw:text-sm tw:font-bold tw:text-gray-900">
          WhatsApp preview
        </h4>
        <span className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          tone auto-picked
        </span>
      </div>

      <div className="tw:mb-3 tw:rounded-lg tw:bg-[#ece5dd] tw:p-3">
        <div className="tw:rounded-lg tw:rounded-tl-none tw:bg-white tw:px-3 tw:py-2 tw:shadow-sm">
          {preview.lines.map((line, idx) => (
            <p
              key={idx}
              className="tw:mb-2 tw:text-xs tw:leading-relaxed tw:text-gray-800 tw:last:mb-0"
            >
              {line}
            </p>
          ))}

          <div className="tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[10px] tw:text-gray-400">
            {preview.time}
            <CheckCheck className="tw:h-3 tw:w-3 tw:text-sky-500" />
          </div>
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-2">
        <AppButton
          fill="outline"
          color="light"
          size="small"
          className="tw:flex-1"
          onClick={() => callback?.({ action: "edit" })}
        >
          <Pencil className="tw:h-3.5 tw:w-3.5" />
          Edit
        </AppButton>

        <AppButton
          color="success"
          size="small"
          className="tw:flex-1"
          disabled={recipients === 0}
          onClick={() => callback?.({ action: "send" })}
        >
          <Send className="tw:h-3.5 tw:w-3.5" />
          Send to {recipients}
        </AppButton>
      </div>
    </AppCard>
  );
};

export default WhatsappPreview;
