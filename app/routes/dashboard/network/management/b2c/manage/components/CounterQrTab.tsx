import { Check, Printer, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import AuthService from "~/services/AuthService";
import ViewMyClubModal from "~/shared/store/view-my-club/ViewMyClubModal";
import {
  getNewlyAdded,
  type NewlyAddedItem,
} from "~/shared/network/components/directory-side-pane/newly-added/helper";

interface CounterQrTabProps {
  /** Bumped by the page after any onboarding, to re-pull the latest joiner. */
  refreshKey?: number;
}

/**
 * Route C — the customer does the typing. The counter QR opens the store's
 * club link on their phone; one tap on WhatsApp and they're in the book. Same
 * link (and the same printable poster) as the club QR everywhere else.
 */
const CounterQrTab = ({ refreshKey = 0 }: CounterQrTabProps) => {
  const user = AuthService.getLoggedInUser() || {};
  const storeName = user?.name || "My Store";
  const clubUrl = user?.mobile ? `https://storeking.in/${user.mobile}` : "";

  const [qrSrc, setQrSrc] = useState("");
  const [qrError, setQrError] = useState("");
  const [showPoster, setShowPoster] = useState(false);
  const [latest, setLatest] = useState<NewlyAddedItem | null>(null);

  useEffect(() => {
    setQrSrc("");
    setQrError("");
    if (!clubUrl) {
      setQrError("No QR content");
      return;
    }

    let alive = true;
    (async () => {
      try {
        const mod = await import("qrcode");
        const url: string = await mod.toDataURL(clubUrl, {
          margin: 1,
          errorCorrectionLevel: "M",
          width: 360,
        });
        if (alive) setQrSrc(url);
      } catch (error) {
        if (alive) setQrError("Failed to render QR");
      }
    })();

    return () => {
      alive = false;
    };
  }, [clubUrl]);

  // The most recent joiner, so the retailer sees scans land while the QR is up.
  useEffect(() => {
    let alive = true;

    getNewlyAdded(1)
      .then((items) => {
        if (alive) setLatest(items[0] || null);
      })
      .catch(() => {
        if (alive) setLatest(null);
      });

    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <>
      <ViewMyClubModal
        show={showPoster}
        onClose={() => setShowPoster(false)}
        title="Counter QR"
        value={clubUrl}
      />

      <div className="tw:overflow-hidden tw:rounded-xl tw:bg-slate-900 tw:text-white">
        <div className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-white/10 tw:px-5 tw:py-4">
          <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-amber-500/20 tw:text-amber-400">
            <QrCode size={18} />
          </span>
          <div>
            <p className="tw:text-sm tw:font-bold">C · Counter QR</p>
            <p className="tw:text-xs tw:text-slate-400">
              Show this to the customer
            </p>
          </div>
        </div>

        <div className="tw:px-5 tw:py-6">
          <div className="tw:mx-auto tw:flex tw:size-60 tw:max-w-full tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:p-3">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="Counter QR code"
                className="tw:h-full tw:w-full tw:object-contain"
              />
            ) : (
              <span className="tw:text-xs tw:text-slate-500">
                {qrError || "Generating QR..."}
              </span>
            )}
          </div>

          <p className="tw:mt-5 tw:text-center tw:text-xl tw:font-bold tw:leading-tight">
            Scan to join
            <br />
            {storeName}
          </p>
          <p className="tw:mt-2 tw:text-center tw:text-xs tw:text-slate-400">
            Customer scans → WhatsApp opens
            <br />→ they tap &ldquo;Save&rdquo; → you&rsquo;re connected
          </p>

          {latest ? (
            <div className="tw:mt-5 tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-emerald-900/60 tw:px-4 tw:py-3 tw:ring-1 tw:ring-emerald-500/40">
              <span className="tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-emerald-400" />
              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-sm tw:font-semibold">
                  {latest.name} just joined
                </span>
                <span className="tw:block tw:truncate tw:text-xs tw:text-emerald-200">
                  {latest.detail}
                </span>
              </span>
              <Check size={16} className="tw:shrink-0 tw:text-emerald-400" />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setShowPoster(true)}
            disabled={!clubUrl}
            className="tw:mt-3 tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-white/10 tw:px-4 tw:py-3 tw:text-sm tw:font-medium tw:transition-colors tw:hover:bg-white/15 tw:disabled:opacity-50"
          >
            <Printer size={16} />
            Also printable at counter · A5 / A4 tent card
          </button>
        </div>
      </div>
    </>
  );
};

export default CounterQrTab;
