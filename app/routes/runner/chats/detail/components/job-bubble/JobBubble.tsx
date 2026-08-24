import { Package } from "lucide-react";
import { CHAT_JOB_CARD } from "../../helper";

/**
 * The job offer as it arrives in the thread: a bubble that keeps the pay and
 * the order code on the surface, so the runner can answer without leaving the
 * conversation to go look the run up.
 */
export default function JobBubble() {
  return (
    <div className="runner-chat-msg-row">
      <div className="runner-chat-bubble runner-chat-bubble--job">
        <span className="runner-chat-job-tag">
          <Package size={11} />
          {CHAT_JOB_CARD.tagLbl}
        </span>

        <h3 className="tw:mt-1.5 tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
          {CHAT_JOB_CARD.storeName}
        </h3>

        <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-500">
          <span className="tw:truncate">{CHAT_JOB_CARD._placeLbl}</span>
          <span className="tw:text-slate-300">·</span>
          <span>{CHAT_JOB_CARD._distanceLbl}</span>
          <span className="tw:text-slate-300">·</span>
          <span>{CHAT_JOB_CARD.orderCode}</span>
        </p>

        <div className="tw:mt-2 tw:flex tw:items-center tw:gap-1.5">
          <span className="runner-chat-job-fee">{CHAT_JOB_CARD._feeLbl}</span>
          <span className="runner-chat-job-type">{CHAT_JOB_CARD._typeLbl}</span>
        </div>

        <span className="runner-chat-bubble-meta">
          {CHAT_JOB_CARD._timeLbl}
        </span>
      </div>
    </div>
  );
}
