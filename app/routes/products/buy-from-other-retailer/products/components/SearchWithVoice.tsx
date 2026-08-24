import { MapPin, Search } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useState } from "react";
import clsx from "clsx";
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
  className?: string;
};

const SearchWithVoice = ({
  onDiscoverSellers,
  trailing,
  className,
}: Props) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const currentDistance = searchParams.get("distance");

  const goToSearch = (search?: string) => {
    appNav.to("/products/buy-from-other-retailer/products/search", {
      ...(search ? { search } : {}),
      ...(currentDistance ? { distance: currentDistance } : {}),
    });
  };

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

      if (searchValue) goToSearch(searchValue);
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

      goToSearch(searchTerm || undefined);
      setShowAiModal(false);
    }
  };

  const handleMicClick = useCallback((ev: MouseEvent) => {
    ev.stopPropagation();
  }, []);

  return (
    <>
      <div
        className={clsx(
          "tw:flex tw:items-center tw:gap-1.5 tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-1.5 tw:shadow-[0_1px_2px_rgba(16,24,40,0.04)] tw:sm:gap-2 tw:sm:p-2",
          className,
        )}
      >
        {/* Unified search bar — input, voice/AI, area filter and nearby
            sellers share one rounded surface so the row reads as a single
            control (matching the browse-network hero search). */}
        <div
          className="tw:group tw:relative tw:flex-1 tw:min-w-0"
          onClick={() => goToSearch()}
        >
          <div className="tw:absolute tw:left-2 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:pointer-events-none tw:text-gray-400 tw:group-focus-within:text-primary tw:transition-colors tw:sm:left-2.5">
            <Search size={16} />
          </div>
          <Input
            type="text"
            placeholder="Search products or brands across the network — try 'atta', 'amul butter'..."
            readOnly
            autoComplete="off"
            className="tw:h-9 tw:border-0 tw:bg-transparent tw:shadow-none tw:rounded-xl tw:pl-8 tw:pr-20 tw:text-[14px] tw:placeholder:text-gray-400 tw:focus-visible:ring-0 tw:cursor-pointer tw:sm:pl-9"
          />
          <div className="tw:absolute tw:right-0.5 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:flex tw:items-center tw:gap-0.5">
            <span onClick={handleMicClick}>
              <VoiceMic
                callback={handleVoiceSearchCallback}
                className="tw:h-8 tw:w-8 tw:rounded-lg tw:bg-transparent tw:text-gray-500 tw:hover:bg-gray-100 tw:hover:scale-100"
                size={16}
              />
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAiModal(true);
              }}
              type="button"
              className="tw:inline-flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-lg tw:bg-[#F0EFFF] tw:hover:bg-[#E6E4FF] tw:transition-colors"
              aria-label="AI search"
              title="Search with AI"
            >
              <ImgRender
                src="ai/sk-ai.png"
                alt="AI"
                className="tw:h-[18px] tw:w-[18px]"
              />
            </button>
          </div>
        </div>

        <span
          aria-hidden
          className="tw:hidden tw:sm:block tw:h-7 tw:w-px tw:shrink-0 tw:bg-gray-200"
        />

        <div className="tw:flex tw:items-center tw:gap-1.5 tw:shrink-0 tw:pr-0.5 tw:sm:gap-2">
          <DistanceChooser variant="inline" />
          {onDiscoverSellers && (
            <button
              onClick={onDiscoverSellers}
              type="button"
              title="Sellers near you"
              className="tw:h-9 tw:w-9 tw:sm:w-auto tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5 tw:px-0 tw:sm:px-3.5 tw:rounded-full tw:sm:rounded-xl tw:bg-primary tw:text-primary-foreground tw:text-sm tw:font-medium tw:hover:bg-primary/90 tw:transition-colors tw:whitespace-nowrap tw:shrink-0"
            >
              <MapPin className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
              <span className="tw:hidden tw:md:inline">Sellers near you</span>
            </button>
          )}
          {trailing}
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
