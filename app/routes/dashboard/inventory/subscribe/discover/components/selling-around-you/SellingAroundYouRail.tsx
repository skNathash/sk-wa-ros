import { Flame, ShoppingCart } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import {
  fetchSellingAroundYou,
  SELLING_AROUND_YOU_LIMIT,
  SELLING_AROUND_YOU_RADIUS_KM,
  SELLING_AROUND_YOU_SEE_ALL,
  type SellingAroundYouDeal,
} from "./helper";
import SectionHeading from "../SectionHeading";
import SellingAroundYouDesktop from "./SellingAroundYouDesktop";
import SellingAroundYouMobile from "./SellingAroundYouMobile";

const isAbortError = (error: any) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

/**
 * Quantity each bulk-added row lands in the Subscribe cart with — the
 * price-comparison API carries no MOQ, so the seller edits it in the cart.
 */
const SUBSCRIBE_QUANTITY = 1;

interface Props {
  className?: string;
}

/**
 * "Selling around you" block — SKUs that sellers within a 5km radius already
 * stock but this seller hasn't subscribed to yet, with the network price
 * comparison the API returns for each. Shows up to
 * {@link SELLING_AROUND_YOU_LIMIT} items as a selectable table on desktop and
 * as cards on mobile, with a single bulk "Add to Subscribe cart" action.
 */
const SellingAroundYouRail: React.FC<Props> = ({ className = "" }) => {
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [items, setItems] = useState<SellingAroundYouDeal[]>([]);
  /** Every SKU in the radius, from the API — the block only renders one page. */
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetchSellingAroundYou(controller.signal)
      .then(({ items: deals, total }) => {
        if (controller.signal.aborted) return;
        setItems(deals);
        setTotalCount(total);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        console.error("Failed to load selling around you deals", error);
        setItems([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Selection only ever covers the rows on screen, not the radius-wide total.
  const loadedCount = items.length;
  const allSelected = loadedCount > 0 && selectedIds.size === loadedCount;
  const hasSelection = selectedIds.size > 0;

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(items.map((i) => i._id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleClear = () => setSelectedIds(new Set());

  const handleProductTap = (id: string) => {
    appNav.to(`/dashboard/inventory/subscribe/product-detail/${id}`);
  };

  const handleAddToCart = async () => {
    if (selectedIds.size === 0) return;

    const selected = items.filter((item) => selectedIds.has(item._id));
    if (selected.length === 0) return;

    setIsAddingToCart(true);

    try {
      // `dealId` is the deal's ObjectId — the reference code goes on
      // `dealRefId`, same as the subscribe search page's bulk add.
      const products = selected.map((item) => {
        const product: any = {
          dealId: item._id,
          dealRefId: item.dealRefId,
          name: item.name,
          quantity: SUBSCRIBE_QUANTITY,
          mrp: item.mrp,
          price: item.bestPrice ?? item.mrp,
          images: item.images,
          barcodes: item.barcodes,
        };
        if (item.hsn) product.hsnNumber = item.hsn;
        if (item.tax !== undefined) product.gst = Number(item.tax);
        return product;
      });

      const response =
        await InventorySubscribeService.bulkSubscription(products);

      if (response.statusCode === 200) {
        const added = response.data?.data?.cart?.products || [];

        added.forEach((product: any) => {
          const deal = selected.find((d) => d._id === product.dealId);
          if (deal) {
            InventorySubscribeService.saveInLocalCart({
              dealId: deal._id,
              dealName: deal.name,
              quantity: SUBSCRIBE_QUANTITY,
              price: deal.bestPrice ?? deal.mrp,
              images: deal.images,
              itemId: product.itemId || product._id,
            });

            InventorySubscribeService.triggerItemAddedEvent({
              dealId: deal._id,
              dealName: deal.name,
            });
          }
        });

        appToast.show({
          msg: `Added ${added.length} products to Subscribe cart`,
          color: "success",
        });

        setSelectedIds(new Set());
        InventorySubscribeService.triggerOpenCartPopoverEvent();
      } else {
        appToast.show({
          msg:
            response?.data?.message ||
            "Failed to add products to Subscribe cart",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Bulk subscribe failed", error);
      appToast.show({
        msg: "Failed to add products to Subscribe cart",
        color: "danger",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * Select-all + bulk add bar. Rendered above and below the list so a seller who
   * has scrolled the rows doesn't have to go back up to add them.
   */
  const toolbar = (placement: "top" | "bottom") => (
    <div
      className={`tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-4 tw:gap-y-2 tw:border-slate-200/70 tw:px-3 tw:py-2 ${
        placement === "top"
          ? "tw:border-b"
          : "tw:border-t tw:bg-white"
      }`}
    >
      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
        <AppCheckbox
          size="xs"
          value={allSelected}
          onChange={handleSelectAll}
          label={`Select all ${loadedCount}`}
        />
        {hasSelection ? (
          <span className="tw:text-xs tw:font-semibold tw:text-slate-700">
            {selectedIds.size} selected
          </span>
        ) : (
          <span className="tw:hidden tw:text-xs tw:text-slate-400 tw:md:inline">
            Tap rows to select · then add them all in one go
          </span>
        )}
      </div>

      <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
        {hasSelection ? (
          <AppButton
            fill="clear"
            color="secondary"
            size="small"
            onClick={handleClear}
          >
            Clear
          </AppButton>
        ) : null}
        <AppButton
          color="success"
          size="small"
          onClick={handleAddToCart}
          isLoading={isAddingToCart}
          disabled={selectedIds.size === 0}
        >
          <span className="tw:inline-flex tw:items-center tw:gap-1.5">
            <ShoppingCart size={14} />
            <span className="tw:hidden tw:md:inline">Add to Subscribe cart</span>
            <span className="tw:md:hidden">Add to cart</span>
            {hasSelection ? <span>({selectedIds.size})</span> : null}
          </span>
        </AppButton>
      </div>
    </div>
  );

  // Nothing to show — drop the section rather than leave an empty shelf.
  if (!isLoading && items.length === 0) return null;

  return (
    <section className={`tw:mb-5 tw:md:mb-7 ${className}`}>
      <SectionHeading
        title="Selling around you"
        subtitle={`${
          isLoading ? "Loading seller picks" : `${totalCount} SKUs`
        } · within a ${SELLING_AROUND_YOU_RADIUS_KM}km radius`}
      />

      {/* One white container wraps the whole block — header, toolbar and list
          sit flush on both mobile and desktop. */}
      <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200/70 tw:bg-white tw:shadow-sm">
        {/* Header card */}
        <div className="tw:relative tw:overflow-hidden tw:bg-linear-to-br tw:from-orange-500 tw:via-orange-500 tw:to-red-500 tw:p-4 tw:text-white tw:md:p-5">
          <span
            aria-hidden="true"
            className="tw:pointer-events-none tw:absolute tw:-top-10 tw:-right-8 tw:h-36 tw:w-36 tw:rounded-full tw:bg-white/10"
          />

          <div className="tw:relative">
            <div className="tw:min-w-0">
              <p className="tw:flex tw:items-center tw:gap-1.5 tw:text-base tw:leading-snug tw:font-bold tw:md:text-xl">
                <Flame size={16} className="tw:shrink-0" />
                {totalCount} SKUs nearby retailers subscribed — you haven&apos;t
              </p>
              <p className="tw:mt-1 tw:max-w-2xl tw:text-xs tw:leading-relaxed tw:text-white/85">
                Network price comparison for retailers within{" "}
                {SELLING_AROUND_YOU_RADIUS_KM}km that you haven&apos;t
                subscribed to yet.
              </p>
            </div>
          </div>
        </div>

        {toolbar("top")}

        {/* Views — cards on mobile, table on desktop. */}
        <div>
          {isLoading ? (
            <SellingAroundYouSkeleton isMobile={isMobile} />
          ) : isMobile ? (
            <SellingAroundYouMobile
              items={items}
              selectedIds={selectedIds}
              onSelect={handleSelectOne}
              onProductTap={handleProductTap}
              radiusKm={SELLING_AROUND_YOU_RADIUS_KM}
              seeAllTo={SELLING_AROUND_YOU_SEE_ALL}
            />
          ) : (
            <SellingAroundYouDesktop
              items={items}
              selectedIds={selectedIds}
              onSelect={handleSelectOne}
              onProductTap={handleProductTap}
              radiusKm={SELLING_AROUND_YOU_RADIUS_KM}
              seeAllTo={SELLING_AROUND_YOU_SEE_ALL}
            />
          )}
        </div>

        {isLoading ? null : toolbar("bottom")}
      </div>
    </section>
  );
};

const SellingAroundYouSkeleton = ({ isMobile }: { isMobile: boolean }) =>
  isMobile ? (
    <div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="tw:border-b tw:border-slate-100 tw:p-3 tw:last:border-b-0"
        >
          <div className="tw:flex tw:gap-3">
            <div className="skeleton-loader tw:h-4 tw:w-4 tw:rounded" />
            <div className="skeleton-loader tw:h-11 tw:w-11 tw:rounded-xl" />
            <div className="tw:flex-1 tw:space-y-2">
              <div className="skeleton-loader tw:h-3 tw:w-2/3 tw:rounded" />
              <div className="skeleton-loader tw:h-3 tw:w-full tw:rounded" />
              <div className="skeleton-loader tw:h-3 tw:w-1/2 tw:rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="tw:p-4">
      <div className="tw:space-y-3">
        <div className="tw:flex tw:gap-3">
          <div className="skeleton-loader tw:h-4 tw:w-1/5 tw:rounded" />
          <div className="skeleton-loader tw:h-4 tw:w-1/5 tw:rounded" />
          <div className="skeleton-loader tw:h-4 tw:w-1/5 tw:rounded" />
          <div className="skeleton-loader tw:h-4 tw:w-1/5 tw:rounded" />
          <div className="skeleton-loader tw:h-4 tw:w-1/5 tw:rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="tw:flex tw:items-center tw:gap-3 tw:py-2">
            <div className="skeleton-loader tw:h-4 tw:w-4 tw:rounded" />
            <div className="skeleton-loader tw:h-10 tw:w-10 tw:rounded-xl" />
            <div className="tw:flex-1 tw:space-y-2">
              <div className="skeleton-loader tw:h-3 tw:w-1/3 tw:rounded" />
              <div className="skeleton-loader tw:h-3 tw:w-1/2 tw:rounded" />
            </div>
            <div className="skeleton-loader tw:h-3 tw:w-16 tw:rounded" />
            <div className="skeleton-loader tw:h-3 tw:w-12 tw:rounded" />
            <div className="skeleton-loader tw:h-3 tw:w-20 tw:rounded" />
            <div className="skeleton-loader tw:h-3 tw:w-16 tw:rounded" />
          </div>
        ))}
      </div>
    </div>
  );

export default SellingAroundYouRail;
