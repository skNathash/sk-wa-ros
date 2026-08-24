import {
  BadgeCheck,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import CommonService from "~/services/CommonService";
import UserBadgeForItem from "~/shared/store/badge/UserBadgeForItem";

type Props = {
  data: any;
};

/** Pill action button — white on the tint, so it reads on any tone. */
const ACTION_CLASS =
  "tw:inline-flex tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-full tw:border tw:border-white/80 tw:bg-white/85 tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-slate-700 tw:shadow-sm tw:transition-colors tw:hover:bg-white tw:disabled:cursor-not-allowed tw:disabled:opacity-50";

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Seller identity band on the retailer page.
 *
 * Wears a {@link TintTile} plate keyed to the seller's name, so the same seller
 * carries the same colour here as in the side-pane list. On desktop the band is
 * pulled full-bleed and pinned under the header together with the tab bar — see
 * `.detail-hero*` in theme-2.css; this component only supplies the content.
 */
const BasicInfo = ({ data }: Props) => {
  const { t } = useTranslation();

  const location = data.city || data.district || "";
  // Ratings only mean something once someone has actually reviewed the store —
  // getFranchise returns avgRating 0 / totalReviews 0 for a fresh seller.
  const ratingCount = Number(data.ratingsSummary?.totalReviews) || 0;
  const rating = ratingCount > 0 ? data.ratingsSummary?.avgRating : null;
  const canMap = !!(data.latitude && data.longitude) || !!data.addressLine1;

  const handleWhatsApp = () => {
    const mobile = data.mobile ? String(data.mobile) : "";
    const waNumber = mobile.startsWith("91") ? mobile : `91${mobile}`;
    const url = CommonService.prepareWhatsappMessage("", waNumber);
    CommonService.windowOpenHandler(url, () => {});
  };

  const handleCall = () => {
    if (!data.mobile) return;
    window.location.href = `tel:${data.mobile}`;
  };

  const handleMap = () => {
    if (data.latitude && data.longitude) {
      const query = encodeURIComponent(`${data.latitude},${data.longitude}`);
      CommonService.windowOpenHandler(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        () => {},
      );
      return;
    }

    const address = [
      data.addressLine1,
      data.addressLine2,
      data.district,
      data.state,
      data.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    if (address) {
      const query = encodeURIComponent(address);
      CommonService.windowOpenHandler(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        () => {},
      );
    }
  };

  return (
    <TintTile
      index={tintIndexFor(data.name || "")}
      className="detail-hero-plate tw:items-stretch tw:justify-start tw:rounded-xl tw:p-3 tw:md:p-4"
    >
      <div className="tw:flex tw:w-full tw:min-w-0 tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:gap-4">
        {/* Avatar — image where the seller has one, tinted initials otherwise.
            Hidden on phones: the header already names the store, so the plate
            gives its width to the name and meta rail instead. */}
        <span className="tw:relative tw:hidden tw:shrink-0 tw:md:block">
          {data.storeLogo ? (
            <ImgRender
              assetId={data.storeLogo}
              className="detail-hero-avatar tw:size-12 tw:md:size-16 tw:rounded-full tw:object-cover"
            />
          ) : (
            <span className="detail-hero-avatar tw:flex tw:size-12 tw:md:size-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-base tw:md:text-xl tw:font-bold tw:text-(--tint-ink) tw:ring-2 tw:ring-white/80">
              {getInitials(data.name)}
            </span>
          )}
          {/* Tick = the franchise is an approved seller (getFranchise `status`),
              not a distance/serviceability signal. */}
          {data.status === "Approved" && (
            <span className="tw:absolute tw:-right-0.5 tw:-bottom-0.5 tw:flex tw:size-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-emerald-600">
              <BadgeCheck size={16} />
            </span>
          )}
        </span>

        <div className="tw:min-w-0 tw:flex-1">
          {/* Badge rail — only what the seller actually carries. */}
          {(data.networkType ||
            data.primaryBusiness ||
            data.franchiseId ||
            Number(rating) >= 4.5) && (
            <div className="tw:mb-1 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
              {data.networkType && (
                <UserBadgeForItem
                  networkType={data.networkType}
                  subType={data.subType}
                />
              )}
              {data.primaryBusiness && (
                <AppBadge
                  variant="white"
                  size="sm"
                  className="tw:uppercase tw:tracking-wide"
                >
                  {data.primaryBusiness}
                </AppBadge>
              )}
              {data.franchiseId && (
                <AppBadge variant="white" size="sm" className="tw:font-mono!">
                  #{data.franchiseId}
                </AppBadge>
              )}
              {Number(rating) >= 4.5 && (
                <AppBadge
                  variant="warning"
                  size="sm"
                  className="tw:uppercase tw:tracking-wide"
                >
                  <Star size={10} className="tw:fill-current" />
                  {t("topRated", "Top rated")}
                </AppBadge>
              )}
            </div>
          )}

          <h2 className="tw:truncate tw:text-lg tw:md:text-2xl tw:font-bold tw:leading-tight tw:text-slate-900">
            {data.name}
          </h2>

          {/* Meta rail — each fact only shows when the API gave it. */}
          <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-xs tw:text-slate-700">
            {location && (
              <span className="tw:flex tw:items-center tw:gap-1">
                <MapPin size={12} className="tw:opacity-70" />
                {location}
              </span>
            )}
            {data.distanceToFranchiseKm != null && (
              <>
                <span className="tw:text-slate-400">·</span>
                <span className="tw:flex tw:items-center tw:gap-1 tw:font-mono!">
                  <Navigation size={12} className="tw:opacity-70" />
                  {Number(data.distanceToFranchiseKm).toFixed(1)} km
                </span>
              </>
            )}
            {rating != null && (
              <>
                <span className="tw:text-slate-400">·</span>
                <span className="tw:flex tw:items-center tw:gap-1">
                  <Star
                    size={12}
                    className="tw:fill-amber-400 tw:text-amber-400"
                  />
                  <span className="tw:font-semibold">
                    {Number(rating).toFixed(1)}
                  </span>
                  {ratingCount ? (
                    <span className="tw:text-slate-500">
                      · {ratingCount} {t("reviews", "reviews")}
                    </span>
                  ) : null}
                </span>
              </>
            )}
            {data.gstNumber && (
              <>
                <span className="tw:text-slate-400">·</span>
                <span className="tw:font-mono!">
                  {t("gstin", "GSTIN")} {data.gstNumber}
                </span>
              </>
            )}
            {data.mobile && (
              <>
                <span className="tw:text-slate-400">·</span>
                <span className="tw:flex tw:items-center tw:gap-1 tw:font-mono!">
                  <Phone size={12} className="tw:opacity-70" />
                  {data.mobile}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions — full-width trio on mobile, a right-aligned row on desktop. */}
        <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:md:flex tw:md:shrink-0 tw:md:items-center tw:md:justify-end">
          <button
            type="button"
            onClick={handleCall}
            disabled={!data.mobile}
            className={ACTION_CLASS}
          >
            <Phone size={14} />
            {t("call", "Call")}
          </button>
          <button
            type="button"
            onClick={handleMap}
            disabled={!canMap}
            className={ACTION_CLASS}
          >
            <Navigation size={14} />
            {t("directions", "Directions")}
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={!data.mobile}
            className={`${ACTION_CLASS} tw:border-transparent tw:bg-emerald-600 tw:text-white tw:hover:bg-emerald-700`}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>
        </div>
      </div>
    </TintTile>
  );
};

export default BasicInfo;
