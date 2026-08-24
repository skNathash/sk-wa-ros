import { useEffect, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import {
  EMPTY_BANNER_SUMMARY,
  getBannerSummary,
  type CoinStoreBannerSummary,
} from "../helper";

interface CoinStoreBannerTheme2Props {
  initial?: string;
  eyebrow?: string;
  /** Overrides the count line the catalogue resolves to. */
  headline?: string;
  description?: string;
  /** Opens the invite flow — the masthead's only action. */
  onInvite?: () => void;
  inviteLabel?: string;
}

const formatCount = (value: number) => value.toLocaleString("en-IN");

/**
 * The theme-2 coin store masthead — it states what the shelf is worth right
 * now: how many rewards a customer can actually redeem. The count comes off
 * the same kcstore-deals catalogue the page below it lists, so the banner
 * never claims a number the shelf cannot back, and the one action it carries
 * is the one that turns the shelf into redemptions: inviting customers.
 */
const CoinStoreBannerTheme2 = ({
  initial = "K",
  eyebrow = "Coin Store · What you curate",
  headline,
  description = "Cheapest to costliest — the full range your coins can buy.",
  onInvite,
  inviteLabel = "Invite Customers",
}: CoinStoreBannerTheme2Props) => {
  const [summary, setSummary] =
    useState<CoinStoreBannerSummary>(EMPTY_BANNER_SUMMARY);

  useEffect(() => {
    let active = true;

    getBannerSummary()
      .then((next) => {
        if (active) setSummary(next);
      })
      .catch(() => {
        if (active) setSummary(EMPTY_BANNER_SUMMARY);
      });

    return () => {
      active = false;
    };
  }, []);

  const resolvedHeadline =
    headline ??
    (summary.total
      ? `${formatCount(summary.total)} rewards your customers can redeem`
      : "Your customers' reward shelf");

  return (
    <div className="tw:rounded-2xl tw:bg-linear-to-r tw:from-[#F5D765] tw:via-[#FADE7C] tw:to-[#FDE9A0] tw:px-4 tw:py-4 tw:sm:px-6 tw:sm:py-5">
      <div className="tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:gap-5">
        {/* Identity mark + the copy block read as one unit on every width. */}
        <div className="tw:flex tw:items-center tw:gap-3 tw:sm:gap-4 tw:min-w-0 tw:flex-1">
          <div className="tw:shrink-0 tw:w-11 tw:h-11 tw:sm:w-12 tw:sm:h-12 tw:rounded-full tw:bg-linear-to-b tw:from-[#F2C544] tw:to-[#D9990F] tw:flex tw:items-center tw:justify-center tw:text-[#7A3C04] tw:font-bold tw:text-lg tw:sm:text-xl">
            {initial}
          </div>

          <div className="tw:min-w-0">
            <p className="tw:text-[10px] tw:sm:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-[#A8601A] tw:mb-1">
              {eyebrow}
            </p>
            <h2 className="tw:text-base tw:sm:text-xl tw:font-bold tw:text-[#7A2E0B] tw:leading-snug">
              {resolvedHeadline}
            </h2>
            {description && (
              <p className="tw:text-[11px] tw:sm:text-xs tw:text-[#8C5A1E] tw:mt-1.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* The invite sits where the coin-range tiles used to — a full-width
        tap target on phones, a compact pill once the copy has room. It borrows
        the avatar's deep-amber so it reads as part of the masthead rather than
        a white card dropped on top of it, and carries the WhatsApp mark on a
        pale chip so the green stays legible against the brown. */}
        {onInvite && (
          <div className="tw:shrink-0">
            <button
              type="button"
              onClick={onInvite}
              className="tw:group tw:w-full tw:sm:w-auto tw:flex tw:items-center tw:justify-center tw:gap-2.5 tw:rounded-full tw:bg-[#7A3C04] tw:pl-2 tw:pr-4 tw:py-1.5 tw:text-sm tw:font-semibold tw:text-[#FFF3D0] tw:shadow-[0_2px_8px_rgba(122,46,11,0.25)] tw:ring-1 tw:ring-[#5C2B02]/20 tw:hover:bg-[#8F4A08] tw:active:scale-[0.98] tw:transition"
            >
              <span className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#FFF6DE]">
                <ImgRender
                  src="whatsapp-logo.png"
                  alt="WhatsApp"
                  className="tw:w-4 tw:h-4 tw:object-contain"
                />
              </span>
              <span className="tw:whitespace-nowrap">{inviteLabel}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinStoreBannerTheme2;
