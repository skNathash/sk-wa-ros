import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { ArrowUpDown, Box, Check, Search, Store } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppModal from "~/components/core/modal/AppModal";
import AppPopover from "~/components/core/popover/AppPopover";
import AppSwiper from "~/components/core/swiper";
import { AppInput } from "~/components/core/form";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Button } from "~/components/ui/button";
import ImgRender from "~/components/core/img/ImgRender";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import useAppNav from "~/hooks/useAppNav";
import BarcodeScanBulkService, {
  SORT_OPTIONS,
  type ReviewDeal,
  type SortKey,
} from "~/services/BarcodeScanBulkService";

/** Horizontal, auto-width chip strip for the brand filter. */
const BRAND_SWIPER_CONFIG = {
  slidesPerView: "auto" as const,
  spaceBetween: 8,
  freeMode: true,
};

interface Props {
  show: boolean;
  /** The barcode the user scanned — shown for context. */
  barcode: string;
  /** SK Library suggestions (formatted skSuggestedDeals). */
  items: ReviewDeal[];
  /** Fires with the scanned barcode once any suggestion is subscribed. */
  onSubscribed?: (barcode: string) => void;
  /** When true, show a "View Cart" button linking to the subscribe cart page. */
  showViewCart?: boolean;
  /** Label for the dismiss/continue button. Defaults to "Continue". */
  continueLabel?: string;
  callback: (a: { action: string; data?: any }) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * Modal that lists the SK Library matches for an AI-found item.
 * The user picks the right product and taps Subscribe — once any card is
 * subscribed we notify the parent so the review row can be marked done.
 */
const SkSuggestionsModal: React.FC<Props> = ({
  show,
  barcode,
  items,
  onSubscribed,
  showViewCart,
  continueLabel = "Continue",
  callback,
  onImagePreview,
}) => {
  const appNav = useAppNav();
  const [cart, setCart] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [sortOpen, setSortOpen] = useState(false);
  /** Brand filter — `id` of the selected brand, or "" for All. */
  const [brandFilter, setBrandFilter] = useState("");
  /** Debounced free-text query driving the client-side search. */
  const [searchTerm, setSearchTerm] = useState("");

  const { register, getValues, reset } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const debouncedSearch = useDebouncedCallback(() => {
    setSearchTerm(getValues("search").trim());
  }, 300);

  useEffect(() => {
    if (show) {
      setCart({});
      setSortKey("relevance");
      setBrandFilter("");
      setSearchTerm("");
      reset({ search: "" });
    }
  }, [show, barcode, reset]);

  const activeSort =
    SORT_OPTIONS.find((s) => s.key === sortKey) || SORT_OPTIONS[0];

  // Collect the distinct brands present in the suggestions for the filter strip.
  const brands = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const it of items) {
      if (!it.brandName) continue;
      const id = it.brandId || it.brandName;
      if (!map.has(id)) map.set(id, { id, name: it.brandName });
    }
    return Array.from(map.values());
  }, [items]);

  // Client-side filter by tapped brand + search query, then apply the sort.
  const sortedItems = useMemo(() => {
    const filtered = BarcodeScanBulkService.filterDeals(items, {
      brandId: brandFilter,
      search: searchTerm,
    });
    return BarcodeScanBulkService.sortDeals(filtered, sortKey);
  }, [items, brandFilter, searchTerm, sortKey]);

  const onClose = () => callback({ action: "close" });

  const onViewCart = () => {
    onClose();
    appNav.to("/dashboard/inventory/subscribe/cart");
  };

  const subscribedCount = Object.values(cart).filter(Boolean).length;

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:font-bold">
          <Store className="tw:w-4 tw:h-4 tw:text-emerald-600" />
          Similar Items found in SK Library
        </div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Your scanned barcode{" "}
          <span className="tw:font-mono tw:font-semibold">{barcode}</span> isn't
          in your all items yet. Pick the matching product and tap{" "}
          <span className="tw:font-semibold">Subscribe</span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:flex-1">
        {items.length === 0 ? (
          <div className="tw:text-center tw:text-sm tw:text-gray-500 tw:py-10">
            No SK Library match for this barcode. Close this and add it as a new
            product instead.
          </div>
        ) : (
          <>
            <AppInput
              name="search"
              register={register}
              onChange={() => debouncedSearch()}
              placeholder="Search by name, brand or ID"
              className="tw:mb-2 tw:mt-2"
              inputClassName="tw:bg-gray-50"
              size="sm"
              leftIcon={<Search size={16} className="tw:text-gray-400" />}
            />
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
              <PaginationSummary
                paginationConfig={{
                  startSlNo: sortedItems.length ? 1 : 0,
                  endSlNo: sortedItems.length,
                  totalRecords: sortedItems.length,
                }}
                loadingTotalRecords={false}
                loadedCount={sortedItems.length}
                fwSize="sm"
              />
              <AppPopover
                side="bottom"
                align="end"
                noPadding
                open={sortOpen}
                onOpenChange={setSortOpen}
                contentClassName="tw:w-48"
                triggerContent={
                  <button
                    type="button"
                    className={`tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:shrink-0 ${
                      sortKey !== "relevance"
                        ? "tw:border-blue-600 tw:bg-blue-50 tw:text-blue-700"
                        : "tw:border-gray-200 tw:bg-white tw:hover:bg-gray-50 tw:text-gray-700"
                    }`}
                  >
                    <ArrowUpDown className="tw:w-3 tw:h-3" />
                    {activeSort.label}
                  </button>
                }
              >
                <ul className="tw:py-1">
                  {SORT_OPTIONS.map((opt) => {
                    const isActive = opt.key === sortKey;
                    return (
                      <li key={opt.key}>
                        <button
                          type="button"
                          onClick={() => {
                            setSortKey(opt.key);
                            setSortOpen(false);
                          }}
                          className={`tw:cursor-pointer tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-2 tw:text-xs tw:text-left tw:hover:bg-gray-50 ${
                            isActive
                              ? "tw:text-blue-700 tw:font-semibold"
                              : "tw:text-gray-700"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && <Check className="tw:w-3.5 tw:h-3.5" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </AppPopover>
            </div>
            {brands.length > 1 && (
              <div className="tw:mb-2">
                <AppSwiper config={BRAND_SWIPER_CONFIG}>
                  <AppSwiper.Slide isAutoWidth>
                    <button
                      type="button"
                      onClick={() => setBrandFilter("")}
                      className={`tw:cursor-pointer tw:whitespace-nowrap tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold ${
                        brandFilter === ""
                          ? "tw:border-blue-600 tw:bg-blue-50 tw:text-blue-700"
                          : "tw:border-gray-200 tw:bg-white tw:text-gray-700"
                      }`}
                    >
                      All
                    </button>
                  </AppSwiper.Slide>
                  {brands.map((brand) => {
                    const isActive = brandFilter === brand.id;
                    return (
                      <AppSwiper.Slide key={brand.id} isAutoWidth>
                        <button
                          type="button"
                          onClick={() =>
                            setBrandFilter((cur) =>
                              cur === brand.id ? "" : brand.id,
                            )
                          }
                          className={`tw:cursor-pointer tw:whitespace-nowrap tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold ${
                            isActive
                              ? "tw:border-blue-600 tw:bg-blue-50 tw:text-blue-700"
                              : "tw:border-gray-200 tw:bg-white tw:text-gray-700"
                          }`}
                        >
                          {brand.name}
                        </button>
                      </AppSwiper.Slide>
                    );
                  })}
                </AppSwiper>
              </div>
            )}
            {sortedItems.length === 0 ? (
              <div className="tw:text-center tw:text-sm tw:text-gray-500 tw:py-10">
                No items match your search.
              </div>
            ) : (
              <ul className="tw:flex tw:flex-col tw:gap-2 tw:py-1">
                {sortedItems.map((item, idx) => {
                  const inCart = cart[item.id];
                  return (
                    <li
                      key={`${item.id}-${idx}`}
                      className="tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-2.5"
                    >
                      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:leading-snug">
                        {item.title}
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-3">
                        {item.image ? (
                          <button
                            type="button"
                            onClick={() =>
                              onImagePreview?.(
                                item.images || (item.image ? [item.image] : []),
                                item.image,
                                false,
                              )
                            }
                            className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-gray-100 tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
                          >
                            <ImgRender
                              {...BarcodeScanBulkService.dealImageProps(
                                item.image,
                              )}
                              alt={item.title}
                              className="tw:max-h-16 tw:max-w-16 tw:object-contain"
                            />
                          </button>
                        ) : (
                          <div className="tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
                            <Box size={24} className="tw:text-gray-300" />
                          </div>
                        )}

                        <div className="tw:flex-1 tw:min-w-0">
                          {(item.dealId || item.brandName) && (
                            <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                              {item.dealId && (
                                <span className="tw:text-[10px] tw:font-mono tw:text-gray-500">
                                  {item.dealId}
                                </span>
                              )}
                              {item.dealId && item.brandName && (
                                <span className="tw:text-gray-300">·</span>
                              )}
                              {item.brandName && (
                                <span className="tw:max-w-full tw:truncate tw:text-[10px] tw:font-medium tw:text-gray-600 tw:bg-gray-100 tw:rounded-full tw:px-1.5 tw:py-0.5">
                                  {item.brandName}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                            <span className="tw:text-[10px] tw:text-blue-600">
                              MRP
                            </span>
                            <Amount
                              value={item.mrp}
                              className="tw:font-semibold tw:text-blue-800 tw:text-sm"
                            />
                          </div>
                        </div>

                        {item.isSubscribed ? (
                          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-gray-500 tw:shrink-0">
                            <Check className="tw:w-4 tw:h-4" strokeWidth={3} />
                            Already Subscribed
                          </span>
                        ) : inCart ? (
                          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-emerald-600 tw:shrink-0">
                            <Check className="tw:w-4 tw:h-4" strokeWidth={3} />
                            in Subscription Cart
                          </span>
                        ) : (
                          <SubscribeBtn
                            dealId={item.id}
                            dealName={item.title}
                            mrp={item.mrp}
                            price={item.price}
                            images={item.images}
                            size="small"
                            className="tw:px-3 tw:shrink-0"
                            callback={(r) => {
                              if (r.action === "subscribed") {
                                setCart((c) => ({ ...c, [item.id]: true }));
                                onSubscribed?.(barcode);
                              }
                            }}
                          >
                            Subscribe
                          </SubscribeBtn>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </AppModal.Content>

      {subscribedCount > 0 && (
        <AppModal.Footer>
          <div className="tw:flex tw:w-full tw:flex-col tw:gap-2">
            <div className="tw:flex tw:flex-col tw:gap-0.5">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-emerald-700">
                <Check className="tw:w-4 tw:h-4 tw:shrink-0" strokeWidth={3} />
                <span>
                  {subscribedCount === 1
                    ? "1 item added to your subscription cart."
                    : `${subscribedCount} items added to your subscription cart.`}
                </span>
              </div>
              <span className="tw:text-[11px] tw:text-gray-500 tw:pl-[22px]">
                Submit your cart later to finish subscribing.{" "}
                {showViewCart
                  ? "View your cart or continue."
                  : "Tap Continue to keep going."}
              </span>
            </div>
            <div className="tw:flex tw:w-full tw:gap-2">
              {showViewCart && (
                <Button
                  variant="outline"
                  onClick={onViewCart}
                  className="tw:flex-1 tw:cursor-pointer"
                >
                  View Cart
                </Button>
              )}
              <Button onClick={onClose} className="tw:flex-1 tw:cursor-pointer">
                {continueLabel}
              </Button>
            </div>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default SkSuggestionsModal;
