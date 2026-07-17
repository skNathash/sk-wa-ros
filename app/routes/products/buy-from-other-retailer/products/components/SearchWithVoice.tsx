import { Search, Users } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useState } from "react";
import { Input } from "~/components/ui/input";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import useAppNav from "~/hooks/useAppNav";
import DistanceChooser from "./DistanceChooser";
import { useSearchParams } from "react-router";
import ImgRender from "~/components/core/img/ImgRender";

type Props = {
  onDiscoverSellers?: () => void;
  trailing?: ReactNode;
};

const SearchWithVoice = ({ onDiscoverSellers, trailing }: Props) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const currentDistance = searchParams.get("distance");

  const handleVoiceSearchCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if ((action === "close" || action === "scan") && data) {
      let searchValue = "";
      if (data.keywords && Array.isArray(data.keywords)) {
        const arr = data.keywords.filter(Boolean);
        if (arr.length > 0) searchValue = arr[0];
      } else if (data.search && typeof data.search === "string") {
        searchValue = data.search;
      }

      if (searchValue) {
        appNav.to("/products/buy-from-other-retailer/products/search", {
          search: searchValue,
          ...(currentDistance ? { distance: currentDistance } : {}),
        });
      }
    }
  };

  const [showAiModal, setShowAiModal] = useState(false);

  const handleAiModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close") {
      setShowAiModal(false);
      return;
    }

    if (action === "proceed" && data) {
      const payload = data as any;

      // Support both shapes: payload may be an array (data: [ ... ])
      // or an object with a `data` array.
      let results: any[] = [];

      if (Array.isArray(payload)) {
        results = payload;
      } else {
        results = Array.isArray(payload.data)
          ? payload.data
          : payload.results || [];
      }

      const productData = results[0] || {};
      const basicInfo =
        productData?.product_basic_info || productData?.basic_info || {};
      const searchTerm = (basicInfo.product_name || basicInfo.name || "")
        .toString()
        .trim();

      appNav.to("/products/buy-from-other-retailer/products/search", {
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(currentDistance ? { distance: currentDistance } : {}),
      });

      setShowAiModal(false);
    }
  };

  const handleMicClick = useCallback((ev: MouseEvent) => {
    ev.stopPropagation();
  }, []);

  return (
    <>
      <div>
        <div className="tw:flex tw:items-center tw:gap-3">
          {/* Search field — the hero of this row. Taller, softly filled and
              rounded so it reads as the primary target; the inline voice / AI
              triggers stay visually quiet beside it. */}
          <div
            className="tw:group tw:relative tw:flex-1 tw:min-w-0"
            onClick={() =>
              appNav.to("/products/buy-from-other-retailer/products/search", {
                ...(currentDistance ? { distance: currentDistance } : {}),
              })
            }
          >
            <div className="tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:pointer-events-none tw:text-gray-400 tw:group-focus-within:text-primary tw:transition-colors">
              <Search size={19} />
            </div>
            <Input
              type="text"
              placeholder="Search products across the network"
              readOnly
              autoComplete="off"
              className="tw:h-11 tw:rounded-xl tw:bg-gray-50 tw:pl-11 tw:pr-[6.5rem] tw:text-[15px] tw:placeholder:text-gray-400 tw:transition-colors tw:hover:bg-white tw:focus:bg-white tw:cursor-pointer"
            />
            <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:flex tw:items-center tw:gap-1">
              <span onClick={handleMicClick}>
                <VoiceMic callback={handleVoiceSearchCallback} />
              </span>
              <span
                aria-hidden
                className="tw:h-5 tw:w-px tw:bg-gray-200"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAiModal(true);
                }}
                className="tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:hover:bg-primary/10 tw:transition-colors"
                aria-label="AI search"
                title="Search with AI"
              >
                <ImgRender
                  src="ai/sk-ai.png"
                  alt="AI"
                  className="tw:h-6 tw:w-6"
                />
              </button>
            </div>
          </div>
          {/* Action cluster — one quiet chip (distance filter) and one bold
              accent (Discover Sellers), given room to breathe from the field. */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
            <DistanceChooser />
            {onDiscoverSellers && (
              <button
                onClick={onDiscoverSellers}
                type="button"
                title="Discover Sellers"
                className="tw:h-11 tw:inline-flex tw:items-center tw:gap-2 tw:px-3.5 tw:sm:px-5 tw:rounded-xl tw:bg-primary/10 tw:text-primary tw:border tw:border-primary/20 tw:text-sm tw:font-medium tw:hover:bg-primary/15 tw:transition-colors tw:whitespace-nowrap tw:shrink-0"
              >
                <Users className="tw:w-4 tw:h-4 tw:shrink-0" />
                <span className="tw:hidden tw:sm:inline">Discover Sellers</span>
              </button>
            )}
            {trailing}
          </div>
        </div>
      </div>
      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handleAiModalCallback}
      />
    </>
  );
};

export default SearchWithVoice;
