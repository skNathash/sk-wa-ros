import { Bot, Sparkles } from "lucide-react";

import type { AiSuggestedProduct } from "../../helper";
import AiSuggestedCard from "./AiSuggestedCard";

interface Props {
  items: AiSuggestedProduct[];
  onCreate: (product: AiSuggestedProduct) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * aiSuggestedDeals — products StoreKing AI found that are not in the catalog.
 * Each card offers a one-tap "Create item" that pre-fills the add-product
 * modal with the AI-extracted details.
 */
const AiSuggestedDeals: React.FC<Props> = ({
  items,
  onCreate,
  onImagePreview,
}) => {
  if (!items.length) return null;

  return (
    <section>
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-2">
        <div className="tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-full tw:bg-violet-100 tw:shrink-0">
          <Bot className="tw:w-3.5 tw:h-3.5 tw:text-violet-600" />
        </div>
        <div className="tw:min-w-0">
          <h2 className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight">
            StoreKing AI found this product
            <Sparkles className="tw:w-3.5 tw:h-3.5 tw:text-amber-400" />
          </h2>
          <p className="tw:text-[11px] tw:text-gray-600 tw:leading-tight">
            Not found in SK catalog — review and add to your store.
          </p>
        </div>
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-2">
        {items.map((p, i) => (
          <AiSuggestedCard
            key={`${p.barcodes?.[0] || p.name}-${i}`}
            product={p}
            onCreate={onCreate}
            onImagePreview={onImagePreview}
          />
        ))}
      </div>
    </section>
  );
};

export default AiSuggestedDeals;
