import { Box, PlusCircle, Sparkles } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import BarcodeScanBulkService from "~/services/BarcodeScanBulkService";

import type { AiSuggestedProduct } from "../../helper";

interface Props {
  product: AiSuggestedProduct;
  onCreate: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * A product discovered by StoreKing AI that is not in the catalog yet.
 * "Create item" opens the add-product modal with all AI details pre-filled,
 * so the user only has to check and save.
 */
const AiSuggestedCard: React.FC<Props> = ({
  product,
  onCreate,
  onImagePreview,
}) => {
  // AI-extracted images are absolute external URLs, so render them via the
  // image proxy (useProxy) — they aren't catalog asset ids.
  const image = product.images?.[0];

  return (
    <AppCard noPadding className="tw:overflow-hidden tw:border-violet-200">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1.5 tw:bg-linear-to-r tw:from-violet-50 tw:to-blue-50 tw:border-b tw:border-violet-100">
        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-bold tw:text-violet-700 tw:uppercase tw:tracking-wide">
          <Sparkles className="tw:w-3 tw:h-3" />
          Found by SK AI
        </span>
      </div>

      <div className="tw:p-3 tw:flex tw:flex-col tw:gap-1.5">
        <div className="tw:flex tw:items-start tw:gap-2.5">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
            {image ? (
              <button
                type="button"
                onClick={() => onImagePreview?.(product.images, image, true)}
                className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
              >
                <ImgRender
                  {...BarcodeScanBulkService.dealImageProps(image)}
                  alt={product.name}
                  className="tw:max-h-14 tw:max-w-14 tw:object-contain"
                  useProxy
                />
              </button>
            ) : (
              <Box size={20} className="tw:text-gray-300" />
            )}
          </div>
          <div className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2">
            {product.name}
          </div>
        </div>

      <div className="tw:flex tw:flex-wrap tw:gap-1">
        {product.brandName && (
          <span className="tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
            {product.brandName}
          </span>
        )}
        {product.categoryName && (
          <span className="tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
            {product.categoryName}
          </span>
        )}
        {product.productSize && (
          <span className="tw:text-[10px] tw:font-medium tw:text-blue-700 tw:bg-blue-50 tw:px-1.5 tw:py-0.5 tw:rounded-full">
            {product.productSize}
            {product.packagingType ? ` · ${product.packagingType}` : ""}
          </span>
        )}
      </div>

      {/* {product.barcodes?.[0] && (
        <div className="tw:flex tw:flex-col tw:gap-0.5 tw:text-[10px] tw:text-gray-500">
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium">
            <Barcode className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
            Other Barcodes
          </span>
          <span className="tw:font-mono tw:text-gray-600">
            {product.barcodes.join(", ")}
          </span>
        </div>
      )} */}

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-1">
        <div className="tw:flex tw:flex-col">
          <span className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:font-medium">
            MRP
          </span>
          {product.mrp ? (
            <Amount
              value={product.mrp}
              className="tw:text-base tw:font-bold tw:text-blue-700"
            />
          ) : (
            <span className="tw:text-xs tw:text-gray-400">—</span>
          )}
        </div>
        <AppButton size="small" color="success" onClick={() => onCreate(product)}>
          <PlusCircle className="tw:w-4 tw:h-4 tw:mr-1" />
          Create item
        </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default AiSuggestedCard;
