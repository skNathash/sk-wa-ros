import { Plus } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import useAppToast from "~/hooks/useAppToast";
import CartService from "~/services/CartService";
import SellerCompareModal from "~/shared/products/modals/seller-compare/SellerCompareModal";
import type { SellerDeal } from "~/types/CommonTypes";

interface ReorderCardProps {
  item: SellerDeal;
}

const BrandBadge: React.FC<{ brand: string }> = ({ brand }) => {
  return (
    <div
      className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:rounded-lg tw:bg-muted tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-muted-foreground tw:uppercase"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(148,163,184,0.12) 0, rgba(148,163,184,0.12) 6px, transparent 6px, transparent 12px)",
      }}
    >
      <span className="tw:line-clamp-2 tw:text-center tw:leading-tight tw:px-1">
        {brand}
      </span>
    </div>
  );
};

const ReorderCard: React.FC<ReorderCardProps> = ({ item }) => {
  const toast = useAppToast();
  const [adding, setAdding] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);

  const brandName = item.brand?.name || item.companyName || "BRAND";
  const imageObj = Array.isArray(item.images) ? item.images[0] : null;
  const imageUrl =
    typeof imageObj === "string"
      ? imageObj
      : imageObj?.image || imageObj?.assetId || null;
  const imageIsAbsolute =
    typeof imageUrl === "string" && /^https?:\/\//i.test(imageUrl);
  const price = Number(item.price) || 0;
  const mrp = Number(item.mrp) || 0;
  const savings = Math.max(0, mrp - price);
  const stock = Number(item.totalStock) ?? Number(item.maxQty) ?? 0;
  const velocity =
    typeof item.velocity === "number"
      ? item.velocity
      : Number(item.velocity) || 0;

  const previousSeller = item.selectedSeller?.name || item.fulfilledBy || "SK";

  let tag = "SK";
  if (item.isLocalDeal) {
    tag = "LOCAL";
  } else if (item.sellers && item.sellers.length > 0) {
    tag = item.sellers[0].isSkSeller ? "SK" : "RETAILER";
  }

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);

    try {
      CartService.addToCartLocal(String(item.id), 1);
      CartService.triggerCartAddedEvent(String(item.id), 1);
      toast.show({
        msg: `${item.name} added to cart`,
        color: "success",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.show({ msg: "Failed to add item", color: "danger" });
    } finally {
      setAdding(false);
    }
  };

  const handleCardClick = () => {
    setShowSellerModal(true);
  };

  const handleSellerModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    // Cart add/remove is handled inside the modal (SellerAddToCart);
    // keep it open so the user can compare/add from multiple sellers.
    if (payload.action === "close") {
      setShowSellerModal(false);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="tw:group tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-2xl tw:bg-card tw:p-3 tw:shadow-sm tw:text-left tw:transition-colors tw:duration-150 tw:hover:bg-muted tw:cursor-pointer"
      >
        <div className="tw:h-14 tw:w-14 tw:shrink-0 tw:rounded-xl tw:overflow-hidden tw:bg-muted">
          {imageUrl ? (
            <ImgRender
              src={imageIsAbsolute ? imageUrl : undefined}
              assetId={!imageIsAbsolute ? imageUrl : undefined}
              isAbsolute={imageIsAbsolute}
              alt={item.name}
              className="tw:h-full tw:w-full tw:object-cover"
              size="200"
              fallback={<BrandBadge brand={brandName} />}
            />
          ) : (
            <BrandBadge brand={brandName} />
          )}
        </div>

        <div className="tw:min-w-0 tw:flex-1">
          <h3 className="tw:truncate tw:text-sm tw:font-semibold tw:text-foreground">
            {item.name}
          </h3>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:mt-0.5">
            <Amount
              value={price}
              decimalPlaces={0}
              className="tw:text-sm tw:font-bold tw:text-foreground"
            />
            {mrp > price && (
              <Amount
                value={mrp}
                decimalPlaces={0}
                className="tw:text-xs tw:text-muted-foreground tw:line-through"
              />
            )}
            <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-primary/10 tw:text-[10px] tw:font-bold tw:text-primary">
              {tag}
            </span>
            {savings > 0 && (
              <span className="tw:text-[10px] tw:font-semibold tw:text-primary">
                SAVE ₹{savings}
              </span>
            )}
          </div>

          <p className="tw:mt-0.5 tw:text-[10px] tw:text-muted-foreground tw:truncate">
            stock {stock}
            <span className="tw:mx-1">•</span>
            vel {velocity}/wk
            <span className="tw:mx-1">•</span>
            prev: {previousSeller}
          </p>
        </div>

        <AppButton
          size="small"
          color="primary"
          isLoading={adding}
          className="tw:shrink-0 tw:rounded-full tw:px-3"
          onClick={handleAdd}
        >
          <Plus size={14} />
          Add
        </AppButton>
      </div>

      <SellerCompareModal
        show={showSellerModal}
        dealId={String(item._id || item.id || "")}
        callback={handleSellerModalCallback}
      />
    </>
  );
};

export default ReorderCard;
