import {
  AlertCircle,
  Clock,
  Copy,
  Package,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Timer from "~/components/core/timer/Timer";
import Amount from "~/components/core/amount/Amount";
import CommonService from "~/services/CommonService";
import ToasterService from "~/services/ToasterService";

type ConfirmationCode = {
  _id: string;
  confirmationType: string;
  code?: string;
  codeFormat?: string;
  sender?: { name?: string };
  createdAt?: string;
  expiresAt?: string;
  metadata?: { orderId?: string; orderAmount?: number; items?: number };
};

type Props = {
  codes: ConfirmationCode[];
  onRejected?: (id: string) => void;
};

const formatTypeLabel = (t?: string) =>
  (t || "")
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const ExpiryTimer: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const initial = useMemo(
    () =>
      Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      ),
    [expiresAt],
  );
  const [expired, setExpired] = useState(initial <= 0);

  if (expired) {
    return (
      <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-red-600">
        <Clock className="tw:w-3.5 tw:h-3.5" />
        Expired
      </span>
    );
  }

  return (
    <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-amber-600">
      <Clock className="tw:w-3.5 tw:h-3.5" />
      Expires in <Timer seconds={initial} callback={({ action }) => action === "completed" && setExpired(true)} />
    </span>
  );
};

const CodeCard: React.FC<{
  c: ConfirmationCode;
  onRejected?: (id: string) => void;
}> = ({ c, onRejected }) => {
  const [copied, setCopied] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const rejectThreshold = useMemo(() => {
    if (!c.createdAt || !c.expiresAt) return null;
    const start = new Date(c.createdAt).getTime();
    const end = new Date(c.expiresAt).getTime();
    if (!(end > start)) return null;
    return start + (end - start) * 0.75;
  }, [c.createdAt, c.expiresAt]);

  const [showReject, setShowReject] = useState(
    rejectThreshold != null && Date.now() >= rejectThreshold,
  );

  useEffect(() => {
    if (rejectThreshold == null || showReject) return;
    const delay = Math.max(0, rejectThreshold - Date.now());
    const t = setTimeout(() => setShowReject(true), delay);
    return () => clearTimeout(t);
  }, [rejectThreshold, showReject]);

  const onCopy = () => {
    if (!c.code) return;
    CommonService.copyToClipboard(c.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onReject = async () => {
    if (rejecting) return;
    setRejecting(true);
    try {
      await CommonService.rejectConfirmationCode(c._id);
      ToasterService.success("Confirmation rejected");
      onRejected?.(c._id);
    } catch (e: any) {
      ToasterService.error(e?.message || "Failed to reject");
      setRejecting(false);
    }
  };

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden tw:bg-white">
      <div className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-2 tw:bg-gray-50 tw:border-b tw:border-gray-200">
        <span className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:uppercase tw:tracking-wide">
          {formatTypeLabel(c.confirmationType)}
        </span>
        {c.expiresAt ? <ExpiryTimer expiresAt={c.expiresAt} /> : null}
      </div>

      {c.code ? (
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:py-5 tw:px-4 tw:bg-gradient-to-b tw:from-emerald-50 tw:to-white">
          <div className="tw:text-[11px] tw:font-medium tw:text-emerald-700 tw:uppercase tw:tracking-widest">
            Share this code
          </div>
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:text-4xl tw:font-bold tw:tracking-[0.5rem] tw:text-gray-900 tw:font-mono">
              {c.code}
            </div>
            <button
              onClick={onCopy}
              className="tw:flex tw:items-center tw:gap-1 tw:px-2 tw:py-1 tw:text-xs tw:rounded tw:border tw:border-gray-300 tw:bg-white tw:hover:bg-gray-50"
              type="button"
            >
              <Copy className="tw:w-3.5 tw:h-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : (
        <div className="tw:flex tw:items-center tw:gap-2 tw:py-4 tw:px-4 tw:bg-amber-50 tw:text-amber-800 tw:text-sm">
          <AlertCircle className="tw:w-4 tw:h-4" />
          Waiting for code delivery…
        </div>
      )}

      <div className="tw:p-4 tw:flex tw:flex-col tw:gap-3 tw:text-sm">
        {c.sender?.name ? (
          <div className="tw:flex tw:items-start tw:gap-2">
            <Store className="tw:w-4 tw:h-4 tw:text-gray-500 tw:mt-0.5" />
            <div>
              <div className="tw:text-xs tw:text-gray-500">Requested by</div>
              <div className="tw:font-medium tw:text-gray-900">
                {c.sender.name}
              </div>
            </div>
          </div>
        ) : null}

        {c.metadata?.orderAmount != null || c.metadata?.items != null ? (
          <div className="tw:flex tw:items-start tw:gap-2">
            <Package className="tw:w-4 tw:h-4 tw:text-gray-500 tw:mt-0.5" />
            <div className="tw:flex tw:flex-col">
              <div className="tw:text-xs tw:text-gray-500">Order</div>
              <div className="tw:font-medium tw:text-gray-900">
                {c.metadata?.orderAmount != null ? (
                  <Amount value={c.metadata.orderAmount} />
                ) : null}
                {c.metadata?.items != null ? (
                  <span className="tw:text-gray-600 tw:font-normal">
                    {c.metadata?.orderAmount != null ? " · " : ""}
                    {c.metadata.items} item
                    {c.metadata.items === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {showReject ? (
          <button
            type="button"
            onClick={onReject}
            disabled={rejecting}
            className="tw:mt-1 tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2 tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:rounded tw:border tw:border-red-300 tw:bg-red-50 tw:text-red-700 tw:hover:bg-red-100 tw:disabled:opacity-60"
          >
            <X className="tw:w-4 tw:h-4" />
            {rejecting ? "Rejecting…" : "Reject"}
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ConfirmationCodeModal: React.FC<Props> = ({ codes, onRejected }) => {
  const [closed, setClosed] = useState(false);

  if (!codes || codes.length === 0) return null;
  if (closed) return null;

  return (
    <div
      className="tw:fixed tw:inset-0 tw:bg-black/70 tw:backdrop-blur-sm tw:flex tw:items-center tw:justify-center tw:p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="tw:bg-white tw:rounded-xl tw:shadow-2xl tw:max-w-md tw:w-full tw:max-h-[90vh] tw:flex tw:flex-col tw:overflow-hidden">
        <div className="tw:flex tw:items-start tw:gap-3 tw:p-5 tw:border-b tw:border-gray-200 tw:bg-gradient-to-r tw:from-emerald-600 tw:to-emerald-500 tw:text-white">
          <div className="tw:bg-white/20 tw:rounded-full tw:p-2">
            <ShieldCheck className="tw:w-5 tw:h-5" />
          </div>
          <div className="tw:flex-1">
            <div className="tw:font-semibold tw:text-base tw:leading-tight">
              Action Required
            </div>
            <div className="tw:text-xs tw:text-emerald-50 tw:mt-0.5">
              {codes.length} pending confirmation
              {codes.length > 1 ? "s" : ""} awaiting your approval
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label="Close"
            className="tw:bg-white/20 tw:hover:bg-white/30 tw:rounded-full tw:p-1.5 tw:text-white"
          >
            <X className="tw:w-4 tw:h-4" />
          </button>
        </div>

        <div className="tw:p-4 tw:flex tw:flex-col tw:gap-3 tw:overflow-y-auto tw:bg-gray-50">
          {codes.map((c) => (
            <CodeCard key={c._id} c={c} onRejected={onRejected} />
          ))}
        </div>

        <div className="tw:px-5 tw:py-3 tw:border-t tw:border-gray-200 tw:bg-white tw:text-xs tw:text-gray-600 tw:text-center">
          Share the code above with the requester to complete verification.
        </div>
      </div>
    </div>
  );
};

export default ConfirmationCodeModal;
