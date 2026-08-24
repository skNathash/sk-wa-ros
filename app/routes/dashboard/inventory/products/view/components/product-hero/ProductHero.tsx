import clsx from "clsx";
import { Clock, ExternalLink, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import AddMoreImagesModal from "~/shared/catalog/modals/add-more-images/AddMoreImagesModal";
import type { SellerDeal } from "~/types/CommonTypes";

/** Labels for the image chips, in the order the deal's images arrive. */
const IMAGE_LABELS = ["Front", "Side", "Back", "Info"];

/** Kept module-level: AppSwiper re-inits whenever the config identity changes,
 *  and selecting a thumb re-renders this component. */
const THUMB_SWIPER = {
  slidesPerView: "auto" as const,
  spaceBetween: 6,
  freeMode: true,
};

/** Placeholder counts — no rating/retailer feed exists for seller deals yet. */
// const RATING = 4.2;
const TOTAL_RETAILERS = 128;

/** A pending `IMAGE_UPDATE` seller-deal request, flattened for display. */
interface ImageRequest {
  status: string;
  requestedDate?: string;
  images: string[];
}

export interface ProductHeroProps {
  /** Formatted seller deal (see SellerCatalogService.formatProductResponse). */
  deal: SellerDeal;
  /** Fired after an image-upload request is raised, so the page can refresh. */
  onImagesRequested?: () => void;
  className?: string;
}

/* Rating display — parked until a real rating feed exists.
const Stars = ({ value }: { value: number }) => (
  <span className="tw:flex tw:items-center tw:gap-0.5">
    {Array.from({ length: 5 }).map((_, idx) => {
      const filled = idx < Math.round(value);
      return (
        <Star
          key={`hero-star-${idx}`}
          size={15}
          className={clsx(
            filled ? "tw:fill-amber-300 tw:text-amber-300" : "tw:text-white/30",
          )}
        />
      );
    })}
  </span>
);
*/

/**
 * Product hero for the item-detail page: the deal's imagery on the left and its
 * identity on the right — brand/category eyebrow, name, pack and tax meta,
 * reach, and one chip per product image that swaps the large preview (plus an
 * "Add" chip that opens the image-upload request).
 */
const ProductHero = ({
  deal,
  onImagesRequested,
  className,
}: ProductHeroProps) => {
  const images: string[] = useMemo(
    () => (Array.isArray(deal?.images) ? deal.images.filter(Boolean) : []),
    [deal?.images],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [showAddImages, setShowAddImages] = useState(false);
  /** What the preview modal is currently showing — the deal's own images, or
   *  the ones still waiting on approval. An empty list means it's closed. */
  const [preview, setPreview] = useState<{
    images: string[];
    initial?: string;
  }>({ images: [] });
  const [request, setRequest] = useState<ImageRequest | null>(null);

  const dealId = deal?._id;

  /**
   * Images added from here don't go live directly — StoreKing approves the
   * request first, so the pending one is surfaced under the hero.
   */
  const fetchRequest = useCallback(async () => {
    if (!dealId) return;
    const resp = await InventorySubscribeService.getSellerDealRequests({
      filter: {
        status: "PENDING",
        dealId,
        type: "IMAGE_UPDATE",
      },
      sort: { createdAt: -1 },
    });
    const rows: any[] = (resp?.statusCode === 200 && resp.data?.data) || [];
    if (!rows.length) {
      setRequest(null);
      return;
    }
    setRequest({
      status: rows[0].status,
      requestedDate: rows[0].createdAt,
      // Several requests can be open at once; the modal shows all of them.
      images: rows
        .filter((row) => row.status === "PENDING")
        .flatMap((row) => row.newImages || []),
    });
  }, [dealId]);

  // Reset the selection when the page moves to another product.
  useEffect(() => {
    setActiveIndex(0);
  }, [deal?._id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  if (!deal?._id) return null;

  const brandName = deal.brand?._displayName || deal.brand?.name || "";
  const categoryName = deal.category?._displayName || deal.category?.name || "";
  const menuName = deal.menu?._displayName || deal.menu?.name || "";
  const uom = deal.selectedStockUom || "";
  const barcode = deal.barcodes?.[0] || "";

  // Eyebrow — brand → category → menu, whichever exist.
  const eyebrow = [brandName, categoryName, menuName]
    .filter(Boolean)
    .join(" · ");

  const isActive = String(deal.status || "").toLowerCase() === "active";

  // Meta line under the name — pack, tax identity and the primary barcode.
  const meta = [
    uom ? `Sold by ${uom}` : "",
    deal.hsn ? `HSN ${deal.hsn}` : "",
    deal.gst ? `GST ${deal.gst}%` : "",
    barcode ? `EAN ${barcode}` : "",
  ].filter(Boolean);

  const activeImage = images[activeIndex];
  const initials = (deal.name || "").trim().slice(0, 8);

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
            {/* Category rank is a placeholder; movement type is real deal data. */}
            <div className="tw:mb-3 tw:flex tw:flex-wrap tw:gap-1.5">
              {/* Selling status — the one badge that changes what the page means. */}
              <span
                className={clsx(
                  "tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                  isActive
                    ? "tw:bg-emerald-400/25 tw:text-emerald-100"
                    : "tw:bg-red-400/25 tw:text-red-100",
                )}
              >
                <span
                  className={clsx(
                    "tw:h-1.5 tw:w-1.5 tw:rounded-full",
                    isActive ? "tw:bg-emerald-300" : "tw:bg-red-300",
                  )}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
              {deal.movementType && (
                <span className="tw:rounded tw:bg-white/15 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide">
                  {deal.movementType}
                </span>
              )}
            </div>

            <div className="tw:flex tw:gap-3 tw:sm:gap-4">
              {/* Left — large image tile, clickable into the preview modal. */}
              <button
                type="button"
                disabled={!activeImage}
                onClick={() => setPreview({ images, initial: activeImage })}
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
                    {uom && (
                      <span className="tw:text-base tw:font-extrabold tw:text-amber-300">
                        {uom}
                      </span>
                    )}
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

                {/* Pack/tax meta and reach share one line to keep the hero short. */}
                <div className="tw:mt-1.5 tw:text-xs tw:text-white/75">
                  {[...meta, `${TOTAL_RETAILERS} retailers`].join(" · ")}
                </div>

                {/* Rating is parked until a real feed exists:
              <Stars value={RATING} />
              */}

                {/* Thumb rail — the images scroll, "Add" is pinned outside the
                  swiper so it stays reachable however many images exist. */}
                <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-1.5">
                  {images.length > 0 && (
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
                                ? "tw:border-amber-300 tw:bg-white/20"
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
                  )}

                  {/* Raises an image-update request (same flow as the overview
                    "Add More" action — StoreKing approves before it goes live). */}
                  <button
                    type="button"
                    onClick={() => setShowAddImages(true)}
                    title="Add more images"
                    aria-label="Add more images"
                    className="tw:flex tw:h-10 tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-dashed tw:border-white/40 tw:bg-white/5 tw:px-2 tw:text-white/80 tw:transition-colors tw:hover:bg-white/15 tw:hover:text-white"
                  >
                    <ImagePlus size={15} />
                    <span className="tw:text-[10px] tw:font-bold tw:uppercase">
                      Add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending image-update request — images added from the hero stay
          invisible on the deal until StoreKing approves, so the wait is
          stated rather than leaving the upload looking like a no-op. */}
      {request && (
        <div className="tw:mb-4 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:px-3 tw:py-2">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <span className="tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full tw:bg-amber-500" />
                <span className="tw:truncate tw:text-xs tw:font-medium tw:text-amber-800">
                  Image Upload Request
                </span>
                <span className="tw:shrink-0 tw:rounded-full tw:bg-amber-200 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:text-amber-800">
                  {request.status}
                </span>
              </div>
              {request.requestedDate && (
                <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-amber-600">
                  <Clock size={10} />
                  <span className="tw:truncate">
                    <DateFormat value={request.requestedDate} />
                  </span>
                </div>
              )}
            </div>

            {request.images.length > 0 && (
              <AppButton
                size="small"
                color="light"
                fill="outline"
                className="tw:shrink-0 tw:bg-white"
                onClick={() => setPreview({ images: request.images })}
              >
                <ExternalLink size={12} />
                View ({request.images.length})
              </AppButton>
            )}
          </div>
        </div>
      )}

      <ImgPreviewModal
        show={preview.images.length > 0}
        images={preview.images.map((id) => ({ id }))}
        initialImageId={preview.initial || preview.images[0]}
        callback={(event: { action: string }) => {
          if (event.action === "close") setPreview({ images: [] });
        }}
      />

      <AddMoreImagesModal
        show={showAddImages}
        dealName={deal.name || ""}
        dealId={deal._id}
        dealRefId={deal.id}
        oldImages={images}
        callback={({ action }: { action: string; data?: any }) => {
          setShowAddImages(false);
          if (action === "submit") {
            fetchRequest();
            onImagesRequested?.();
          }
        }}
      />
    </>
  );
};

export default ProductHero;
