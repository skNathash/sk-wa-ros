import clsx from "clsx";
import React from "react";
import { PHOTO_TIPS, type PhotoModel } from "../helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

interface StorePhotosSidePaneProps {
  model: PhotoModel;
  /** Store front url the photos appear on, shown as the "why" for the page. */
  clubUrl: string;
  storeName: string;
  className?: string;
  /** Inline (mobile/card) rendering — no pane bleed or divider. */
  compact?: boolean;
}

/**
 * Side-pane contents for the store photos page in theme-2 desktop — what the
 * photos are for, how far the gallery has got, and how to shoot them well.
 * The page drops it into `AppPaneSide` (with `app-pane-only`) and the CSS
 * re-homes it as the fixed pane beside the section rail.
 */
const StorePhotosSidePane: React.FC<StorePhotosSidePaneProps> = ({
  model,
  clubUrl,
  storeName,
  className = "",
  compact = false,
}) => (
  <div
    className={clsx(
      "tw:flex tw:flex-col",
      compact ? "tw:gap-4" : "tw:gap-5",
      className,
    )}
  >
    {/* No top padding — the pane already supplies it, so the title lines up
        with the page header beside it. */}
    <div
      className={clsx(
        compact
          ? ""
          : "app-bleed-x tw:border-b tw:border-gray-200 tw:bg-white tw:px-4 tw:pb-4",
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <PaneTitle
          title="Store photos"
          className="tw:text-lg tw:text-gray-900"
        />
        <span className="tw:shrink-0 tw:text-xs tw:text-gray-500 tw:tabular-nums">
          {model.progressLabel}
        </span>
      </div>

      <div className="tw:mt-3 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
        <div
          className="tw:h-full tw:rounded-full tw:bg-primary"
          style={{ width: `${model.progressPercent}%` }}
        />
      </div>

      <p className="tw:mt-3 tw:text-xs tw:leading-relaxed tw:text-gray-500">
        Photos appear on your{" "}
        <a
          href={clubUrl}
          target="_blank"
          rel="noreferrer"
          className="tw:font-semibold tw:text-primary tw:hover:underline"
        >
          {storeName || "club store"}
        </a>{" "}
        page and improve customer trust. Moderation typically takes 4–6 hours.
      </p>
    </div>

    <div className={compact ? "" : "tw:px-1"}>
      <h3 className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
        Tips
      </h3>
      <ul className="tw:mt-2 tw:flex tw:flex-col tw:gap-2">
        {PHOTO_TIPS.map((tip) => (
          <li key={tip} className="tw:text-xs tw:text-gray-600">
            · {tip}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default StorePhotosSidePane;
