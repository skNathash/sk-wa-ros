import clsx from "clsx";
import { CheckCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";

/** Labels for the image chips, in the order the deal's images arrive. */
const IMAGE_LABELS = ["Front", "Side", "Back", "Info"];

/** Kept module-level: AppSwiper re-inits whenever the config identity changes,
 *  and selecting a thumb re-renders this component. */
const THUMB_SWIPER = {
  slidesPerView: "auto" as const,
  spaceBetween: 6,
  freeMode: true,
};

export interface SubscribeHeroProps {
  /** Formatted subscribe deal (see InventorySubscribeService.formatDealResponse). */
  deal: any;
  className?: string;
}

/**
 * Hero band for the subscribe product-detail page — the same plate the seller's
 * own item page uses (ProductHero), with the subscription state standing in for
 * the selling status: StoreKing imagery on the left, and brand/category eyebrow,
 * name, pack and tax meta plus one chip per image on the right.
 */
const SubscribeHero = ({ deal, className }: SubscribeHeroProps) => {
  const images: string[] = useMemo(
    () => (Array.isArray(deal?.images) ? deal.images.filter(Boolean) : []),
    [deal?.images],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Reset the selection when the page moves to another product.
  useEffect(() => {
    setActiveIndex(0);
  }, [deal?._id]);

  if (!deal?._id) return null;

  const brandName = deal.brand?.name || "";
  const categoryName = deal.category?.name || "";
  const menuName = deal.menu?.name || "";
  const barcode = deal.barcodes?.[0] || "";

  // Eyebrow — brand → category → menu, whichever exist.
  const eyebrow = [brandName, categoryName, menuName]
    .filter(Boolean)
    .join(" · ");

  // Meta line under the name — pack, tax identity and the primary barcode.
  const meta = [
    deal.netWeight ? `Pack ${deal.netWeight}` : "",
    deal.hsn ? `HSN ${deal.hsn}` : "",
    deal.gst ? `GST ${deal.gst}%` : "",
    barcode ? `EAN ${barcode}` : "",
  ].filter(Boolean);

  const activeImage = images[activeIndex];
  const initials = (deal.name || "").trim().slice(0, 8);
  const isSubscribed = !!deal.isSubscribed;
  const subscribers = deal.totalSubscribed || 0;

  return (
    <>
      {/* `app-bleed-x` (theme-2 mobile) pulls the band out of the page gutter so
          it runs edge to edge, and `detail-hero-plate` drops the plate's corner
          radius now that its sides touch the screen. Both no-op on desktop. */}
      <div className={clsx("app-bleed-x", className)}>
        <div
          className="detail-hero-plate tw:relative tw:overflow-hidden tw:rounded-2xl tw:p-3 tw:md:p-4 tw:text-white"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--primary) 78%, #1c1917) 0%, color-mix(in srgb, var(--primary) 45%, #1c1917) 100%)",
          }}
        >
          {/* Soft light bloom so the flat gradient reads as a lit surface. */}
          <span className="tw:pointer-events-none tw:absolute tw:-right-16 tw:-top-24 tw:h-64 tw:w-64 tw:rounded-full tw:bg-white/10" />

          <div className="tw:relative">
            {/* Subscription state is the one badge that changes what the page
                means — everything below reads differently once it's in the
                seller's catalog. */}
            <div className="tw:mb-3 tw:flex tw:flex-wrap tw:gap-1.5">
              <span
                className={clsx(
                  "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                  isSubscribed
                    ? "tw:bg-white/20 tw:text-white"
                    : "tw:bg-white/15 tw:text-white/85",
                )}
              >
                {isSubscribed ? (
                  /* Read double-tick — the WhatsApp mark for "delivered". */
                  <CheckCheck size={12} className="tw:text-(--primary-2)" />
                ) : (
                  <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-amber-300" />
                )}
                {isSubscribed ? "In your catalog" : "Not subscribed"}
              </span>

              {subscribers > 0 && (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-white/15 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
                  <Users size={11} />
                  {subscribers} sellers
                </span>
              )}

              {deal.companyName && (
                <span className="tw:rounded-full tw:bg-white/15 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
                  {deal.companyName}
                </span>
              )}
            </div>

            <div className="tw:flex tw:gap-3 tw:sm:gap-4">
              {/* Left — large image tile, clickable into the preview modal. */}
              <button
                type="button"
                disabled={!activeImage}
                onClick={() => setShowPreview(true)}
                className="tw:flex tw:h-24 tw:w-24 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:border tw:border-white/15 tw:bg-white/10 tw:sm:h-32 tw:sm:w-32 tw:disabled:cursor-default"
              >
                {activeImage ? (
                  <ImgRender
                    assetId={activeImage}
                    alt={deal.name}
                    size="500"
                    className="tw:h-full tw:w-full tw:object-contain"
                  />
                ) : (
                  <span className="tw:flex tw:flex-col tw:items-center tw:gap-0.5 tw:px-2 tw:text-center">
                    <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-widest">
                      {initials || "Product"}
                    </span>
                  </span>
                )}
              </button>

              {/* Right — identity, meta and the image chips. */}
              <div className="tw:min-w-0 tw:flex-1">
                {eyebrow && (
                  <div className="tw:truncate tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-white/70">
                    {eyebrow}
                  </div>
                )}

                <h2 className="tw:mt-1 tw:text-lg tw:font-bold tw:leading-snug tw:md:text-xl">
                  {deal.name || "-"}
                </h2>

                {meta.length > 0 && (
                  <div className="tw:mt-1.5 tw:text-xs tw:text-white/75">
                    {meta.join(" · ")}
                  </div>
                )}

                {/* Thumb rail — one chip per image, swapping the large tile. */}
                {images.length > 1 && (
                  <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-1.5">
                    <AppSwiper
                      config={THUMB_SWIPER}
                      className="tw:min-w-0 tw:flex-1"
                    >
                      {images.map((assetId, idx) => (
                        <AppSwiper.Slide key={`${assetId}-${idx}`} isAutoWidth>
                          <button
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            className={clsx(
                              "tw:h-10 tw:w-10 tw:cursor-pointer tw:overflow-hidden tw:rounded-lg tw:border tw:transition-colors",
                              idx === activeIndex
                                ? "tw:border-(--primary-2) tw:bg-white/20"
                                : "tw:border-white/15 tw:bg-white/10 tw:hover:bg-white/15",
                            )}
                            title={IMAGE_LABELS[idx] || `Image ${idx + 1}`}
                            aria-label={IMAGE_LABELS[idx] || `Image ${idx + 1}`}
                          >
                            <ImgRender
                              assetId={assetId}
                              alt={IMAGE_LABELS[idx] || `Image ${idx + 1}`}
                              size="200"
                              className="tw:h-full tw:w-full tw:object-contain"
                              fallback={
                                <span className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:text-[10px] tw:font-bold tw:uppercase">
                                  {IMAGE_LABELS[idx] || idx + 1}
                                </span>
                              }
                            />
                          </button>
                        </AppSwiper.Slide>
                      ))}
                    </AppSwiper>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImgPreviewModal
        show={showPreview}
        images={images.map((id) => ({ id }))}
        initialImageId={activeImage}
        callback={(event: { action: string }) => {
          if (event.action === "close") setShowPreview(false);
        }}
      />
    </>
  );
};

export default SubscribeHero;
