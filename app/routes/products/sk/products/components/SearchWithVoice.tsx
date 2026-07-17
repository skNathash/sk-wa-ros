import clsx from "clsx";
import { Search } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "~/components/ui/input";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import ImgRender from "~/components/core/img/ImgRender";

type Props = {
  value?: string;
  onSearch: (term: string) => void;
  readOnly?: boolean;
  onInputClick?: () => void;
  /**
   * When provided, voice/AI searches are routed here instead of updating the
   * inline search term — used by the read-only main page to redirect to the
   * list page with the recognized keywords.
   */
  onVoiceSearch?: (term: string) => void;
};

const SearchWithVoice = ({
  value = "",
  onSearch,
  readOnly = false,
  onInputClick,
  onVoiceSearch,
}: Props) => {
  const [term, setTerm] = useState(value);
  const [showAiModal, setShowAiModal] = useState(false);

  // keep local input in sync when the parent resets the search term
  useEffect(() => {
    setTerm(value);
  }, [value]);

  const emitSearch = useDebouncedCallback((next: string) => {
    onSearch(next);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setTerm(next);
    emitSearch(next);
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

      if (searchValue) {
        if (onVoiceSearch) {
          onVoiceSearch(searchValue);
          return;
        }
        setTerm(searchValue);
        onSearch(searchValue);
      }
    }
  };

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

      if (searchTerm) {
        setTerm(searchTerm);
        onSearch(searchTerm);
      }

      setShowAiModal(false);
    }
  };

  const handleMicClick = useCallback((ev: MouseEvent) => {
    ev.stopPropagation();
  }, []);

  return (
    <>
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:relative tw:flex-1">
            <div className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:pointer-events-none">
              <Search size={18} />
            </div>
            <Input
              type="text"
              placeholder="Search products"
              autoComplete="off"
              value={term}
              onChange={handleChange}
              readOnly={readOnly}
              onClick={readOnly ? onInputClick : undefined}
              className={clsx("tw:pl-10 tw:pr-10", {
                "tw:cursor-pointer": readOnly,
              })}
            />
            <div className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:flex tw:items-center tw:gap-2">
              <span onClick={handleMicClick}>
                <VoiceMic callback={handleVoiceSearchCallback} />
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAiModal(true);
                }}
                className="tw:inline-flex tw:items-center tw:justify-center"
                aria-label="AI search"
              >
                <ImgRender src="ai/sk-ai.png" alt="AI" className="tw:h-6 tw:w-6" />
              </button>
            </div>
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
