import { Instagram, X, Youtube } from "lucide-react";
import { useEffect } from "react";

type Platform = "youtube" | "instagram";

type Props = {
  show: boolean;
  platform?: Platform;
  /** Full absolute URL supplied by the API (watch/share link). */
  url?: string;
  callback: (a: { action: string }) => void;
};

/** Extract the YouTube video id from the common URL shapes. */
const getYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
    const parts = u.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "v"].includes(parts[0])) return parts[1] || null;
    return null;
  } catch {
    return null;
  }
};

/** YouTube/Instagram can only render inside an iframe via their embed URLs. */
const getEmbedUrl = (platform: Platform, url: string): string | null => {
  if (platform === "youtube") {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
  }
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return `https://www.instagram.com${path}/embed`;
  } catch {
    return null;
  }
};

const VideoPreviewModal = ({ show, platform, url, callback }: Props) => {
  const handleClose = () => callback({ action: "close" });

  const isYouTube = platform === "youtube";
  const embedUrl = url && platform ? getEmbedUrl(platform, url) : null;

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="tw:fixed tw:inset-0 tw:bg-black/70 tw:backdrop-blur-sm tw:flex tw:items-center tw:justify-center tw:p-4"
      style={{ zIndex: 10000 }}
      onClick={handleClose}
    >
      <div
        className={`tw:bg-white tw:rounded-xl tw:shadow-2xl tw:w-full tw:max-h-[90vh] tw:flex tw:flex-col tw:overflow-hidden ${
          isYouTube ? "tw:md:max-w-2xl" : "tw:md:max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3 tw:border-b tw:border-gray-200">
          <span className="tw:font-semibold tw:text-base tw:flex tw:items-center tw:gap-2">
            {isYouTube ? (
              <Youtube size={18} className="tw:text-red-600" />
            ) : (
              <Instagram size={18} className="tw:text-pink-600" />
            )}
            {isYouTube ? "YouTube" : "Instagram"}
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="tw:rounded-full tw:p-1.5 tw:text-gray-500 tw:hover:bg-gray-100 tw:hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className={`tw:overflow-y-auto ${isYouTube ? "tw:p-4" : "tw:p-0"}`}
        >
          {embedUrl ? (
            isYouTube ? (
              <div className="tw:relative tw:w-full tw:aspect-video tw:bg-black tw:rounded-md tw:overflow-hidden">
                <iframe
                  src={embedUrl}
                  title="YouTube video player"
                  className="tw:absolute tw:inset-0 tw:w-full tw:h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <iframe
                src={embedUrl}
                title="Instagram media"
                className="tw:w-full tw:h-[75vh] tw:bg-white"
                scrolling="no"
                allowFullScreen
              />
            )
          ) : (
            <div className="tw:py-8 tw:text-center tw:text-sm tw:text-gray-500">
              Unable to play this link.{" "}
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:text-primary tw:hover:underline"
                >
                  Open externally
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
