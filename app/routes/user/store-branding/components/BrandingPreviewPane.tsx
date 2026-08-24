import clsx from "clsx";
import { Image as ImageIcon } from "lucide-react";
import React from "react";
import ImgRender from "~/components/core/img/ImgRender";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import {
  buildBrandingProgress,
  buildPreviewLinks,
  type BrandingFormValues,
} from "../helper";

interface BrandingPreviewPaneProps {
  /** Live form values, so the preview moves as the store types. */
  values: BrandingFormValues;
  storeName: string;
  clubUrl: string;
  className?: string;
}

const TIPS = [
  "Use a square logo — it is cropped to a circle on WhatsApp shares.",
  "Keep the tagline short; only the first line shows on small screens.",
  "Paste full profile links (starting with https://), not usernames.",
];

/**
 * Side-pane contents for the store branding page — a live card preview of how
 * the logo, tagline and links read to a customer, plus what is still missing.
 */
const BrandingPreviewPane: React.FC<BrandingPreviewPaneProps> = ({
  values,
  storeName,
  clubUrl,
  className = "",
}) => {
  const links = buildPreviewLinks(values);
  const progress = buildBrandingProgress(values);

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-5", className)}>
      {/* No top padding — the pane supplies it, so this title lines up with
          the page header beside it. */}
      <div className="app-bleed-x tw:border-b tw:border-gray-200 tw:bg-white tw:px-4 tw:pb-4">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <PaneTitle title="Branding" className="tw:text-lg tw:text-gray-900" />
          <span className="tw:shrink-0 tw:text-xs tw:text-gray-500 tw:tabular-nums">
            {progress.label}
          </span>
        </div>

        <div className="tw:mt-3 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
          <div
            className="tw:h-full tw:rounded-full tw:bg-primary"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <p className="tw:mt-3 tw:text-xs tw:leading-relaxed tw:text-gray-500">
          Your logo and tagline travel with every WhatsApp share and appear on
          your{" "}
          <a
            href={clubUrl}
            target="_blank"
            rel="noreferrer"
            className="tw:font-semibold tw:text-primary tw:hover:underline"
          >
            {storeName || "club store"}
          </a>{" "}
          page.
        </p>
      </div>

      <div className="tw:px-4">
        <p className="tw:mb-2 tw:text-xs tw:font-bold tw:uppercase tw:tracking-widest tw:text-gray-400">
          Preview
        </p>
        <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:shadow-xs">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:flex tw:size-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:border tw:border-gray-200 tw:bg-gray-50">
              {values.storeLogo ? (
                <ImgRender
                  assetId={values.storeLogo}
                  alt="Store logo"
                  className="tw:h-full tw:w-full tw:object-cover"
                />
              ) : (
                <ImageIcon className="tw:h-5 tw:w-5 tw:text-gray-300" />
              )}
            </div>
            <div className="tw:min-w-0">
              <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                {storeName || "Your store"}
              </p>
              <p
                className={clsx(
                  "tw:line-clamp-2 tw:text-xs",
                  values.storeCaption?.trim()
                    ? "tw:text-gray-600"
                    : "tw:text-gray-400",
                )}
              >
                {values.storeCaption?.trim() || "Add a tagline for your store"}
              </p>
            </div>
          </div>

          {links.length ? (
            <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-1.5 tw:border-t tw:border-gray-100 tw:pt-3">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <span
                    key={link.key}
                    className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-gray-200 tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:text-gray-700"
                  >
                    <Icon className={clsx("tw:h-3.5 tw:w-3.5", link.iconClass)} />
                    {link.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="tw:px-4">
        <p className="tw:mb-2 tw:text-xs tw:font-bold tw:uppercase tw:tracking-widest tw:text-gray-400">
          Tips
        </p>
        <ul className="tw:space-y-2">
          {TIPS.map((tip) => (
            <li
              key={tip}
              className="tw:flex tw:gap-2 tw:text-xs tw:leading-relaxed tw:text-gray-600"
            >
              <span className="tw:mt-1.5 tw:size-1.5 tw:shrink-0 tw:rounded-full tw:bg-gray-300" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BrandingPreviewPane;
