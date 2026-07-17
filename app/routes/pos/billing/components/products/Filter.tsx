import debounce from "lodash/debounce";
import {
  Barcode,
  CaseSensitive,
  CircleHelp,
  Funnel,
  Keyboard,
  Mic,
  Scan,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox } from "~/components/core/form";
import { AppInput } from "~/components/core/form/AppInput";
import AppPopover from "~/components/core/popover/AppPopover";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import { POS_CART_ITEM_ADDED } from "~/constants";
import MiscService from "~/services/MiscService";
import FilterModal from "./FilterModal";

interface FilterProps {
  callback?: (filters: any) => void;
  cartId?: string;
  onKeypadClick?: () => void;
  hideAutoAdd?: boolean;
}

// Search modes surfaced as tabs. "scan" searches by exact barcode and shows the
// camera capture card; "name" uses the backend's name/id search.
type SearchMode = "scan" | "name";

const MODE_TABS: { key: SearchMode; label: string; icon: typeof Scan }[] = [
  { key: "scan", label: "Scan", icon: Scan },
  { key: "name", label: "Name", icon: CaseSensitive },
];

const Filter = ({
  callback,
  cartId,
  onKeypadClick,
  hideAutoAdd = false,
}: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue } = useForm();

  // Auto-add is no longer a user-facing toggle. It's derived from the search
  // mode: ON while scanning (a barcode resolves to one exact deal → straight to
  // cart) and OFF in name search (matches are ambiguous, so the user picks).
  // Assisted orders (`hideAutoAdd`) never auto-add.
  const autoAddFor = (m: SearchMode) => !hideAutoAdd && m === "scan";
  // Active search tab. Defaults to "scan" so billing opens on the scan panel.
  const [mode, setMode] = useState<SearchMode>("scan");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterData, setFilterData] = useState<{
    category: any[];
    brand: any[];
  }>({ category: [], brand: [] });

  const scannerDetector = MiscService.createScannerDetector();

  // Map the UI tab to the backend search field. Only "name" changes it.
  const searchByFor = (m: SearchMode): "barcode" | "name" =>
    m === "name" ? "name" : "barcode";

  // Create debounced search function
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch();

    const isFromScanner = scannerDetector.trackKeystroke();
    if (isFromScanner) {
      const t = setTimeout(() => {
        e.target.select();
        clearTimeout(t);
      }, 300);
    }
  };

  // Trigger the native camera scanner (app only). On the web there is no
  // cordova bridge, so the scan card is purely a visual prompt.
  const triggerNativeScan = () => {
    const cordova = MiscService.getCordova();
    if (cordova?.plugins?.barcodeScanner) {
      cordova.plugins.barcodeScanner.scan(
        (r: any) => {
          if (r?.text) {
            setValue("search", r.text);
            triggerCallback({ searchBy: "barcode", autoAddToCart: autoAddFor("scan") });
          }
        },
        () => {},
      );
    }
  };

  const handleModeChange = (m: SearchMode) => {
    setMode(m);
    // Clear the search input when switching search tabs so the previous term
    // doesn't carry over into a different search mode.
    setValue("search", "");
    triggerCallback({ searchBy: searchByFor(m), autoAddToCart: autoAddFor(m) });
  };

  const handleVoiceCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if ((action === "close" || action === "scan") && data) {
      const term = Array.isArray(data.keywords)
        ? data.keywords.filter(Boolean)[0]
        : data.search;
      if (term) {
        // Voice input is a spoken product name — switch to name search.
        setMode("name");
        setValue("search", term);
        triggerCallback({ searchBy: "name", autoAddToCart: autoAddFor("name") });
      }
    }
  };

  const handleFilterModalCallback = (r: { action: string; data: any }) => {
    if (r.action === "apply") {
      setFilterData(r.data);
      setValue("category", r.data.category);
      setValue("brand", r.data.brand);
      // Clear search input when filters are reset
      const isReset =
        (!r.data.category || r.data.category.length === 0) &&
        (!r.data.brand || r.data.brand.length === 0);
      if (isReset) {
        setValue("search", "");
      }
      setShowFilterModal(false);
      triggerCallback();
    } else if (r.action === "close") {
      setShowFilterModal(false);
    }
  };

  const triggerCallback = (overrides?: Record<string, any>) => {
    const formValues = getValues();
    let scannedQty: number | undefined;
    const rawSearch = (formValues.search || "").trim();
    if (rawSearch.includes("#")) {
      const [bc, qtyStr] = rawSearch.split("#");
      const parsedQty = parseInt(qtyStr, 10);
      if (bc && Number.isFinite(parsedQty) && parsedQty > 0) {
        scannedQty = parsedQty;
        formValues.search = bc;
        setValue("search", bc);
      }
    }
    callback?.({
      formData: {
        ...formValues,
        scannedQty,
        autoAddToCart: autoAddFor(mode),
        searchBy: searchByFor(mode),
        ...overrides,
      },
    });
  };

  const hasActiveFilters =
    filterData.category.length > 0 || filterData.brand.length > 0;

  // Reset search and filters when cart changes
  const prevCartId = useRef(cartId);
  useEffect(() => {
    if (prevCartId.current && cartId && prevCartId.current !== cartId) {
      setValue("search", "");
      setValue("category", []);
      setValue("brand", []);
      setFilterData({ category: [], brand: [] });
      triggerCallback();
    }
    prevCartId.current = cartId;
  }, [cartId]);

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | null = null;
    const handleCartItemAdded = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      // Only clear when the add was triggered by auto-add on a single search result
      if (!detail.autoAdded) return;
      const searchValue = getValues("search");
      if (searchValue && searchValue.trim() !== "") {
        if (clearTimer) clearTimeout(clearTimer);
        clearTimer = setTimeout(() => {
          setValue("search", "");
          triggerCallback();
          if (!MiscService.isMobile()) {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[name="search"]',
            );
            searchInput?.focus();
          }
        }, 800);
      }
    };

    document.addEventListener(POS_CART_ITEM_ADDED, handleCartItemAdded);
    return () => {
      document.removeEventListener(POS_CART_ITEM_ADDED, handleCartItemAdded);
      if (clearTimer) clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeholder =
    mode === "name"
      ? t("searchProductsPlaceholder")
      : "Type barcode or product…";

  return (
    <AppCard noPadding={true} className="tw:overflow-visible">
      <div className="tw:px-3 tw:pt-3 tw:pb-3">
        {/* Search-mode tabs — Scan / Name */}
        <div className="tw:mb-3 tw:flex tw:gap-1 tw:rounded-xl tw:bg-muted tw:p-1">
          {MODE_TABS.map(({ key, label, icon: Icon }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleModeChange(key)}
                className={`tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:px-3 tw:py-2 tw:text-sm tw:font-bold tw:transition-colors tw:cursor-pointer ${
                  active
                    ? "tw:bg-card tw:text-foreground tw:shadow-sm"
                    : "tw:text-muted-foreground tw:hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Scan capture card — shown only on the Scan tab */}
        {mode === "scan" && (
          <button
            type="button"
            onClick={triggerNativeScan}
            className="tw:mb-3 tw:w-full tw:rounded-xl tw:bg-gradient-to-b tw:from-muted/60 tw:to-transparent tw:p-4 tw:text-center tw:cursor-pointer tw:transition-colors tw:hover:bg-muted/40"
          >
            <div className="wa-scan-target tw:relative tw:mx-auto tw:flex tw:h-24 tw:w-full tw:max-w-[220px] tw:items-center tw:justify-center tw:rounded-lg tw:border-2 tw:border-dashed tw:border-primary/30 tw:bg-card">
              <Scan
                className="tw:text-primary/40"
                size={36}
                strokeWidth={1.25}
              />
            </div>
            <p className="tw:mt-3 tw:text-sm tw:font-bold tw:text-foreground">
              Point camera at barcode
            </p>
            <p className="tw:text-xs tw:text-muted-foreground tw:mt-0.5">
              or type barcode / name below
            </p>
          </button>
        )}

        <div className="tw:flex tw:gap-2 tw:items-center">
          <AppInput
            name="search"
            label=""
            placeholder={placeholder}
            register={register}
            className="tw:flex-1 tw:min-w-0"
            inputClassName="tw:bg-muted focus:tw:bg-white tw:rounded-full tw:pl-10"
            onChange={handleSearchChange}
            onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
            leftIcon={
              mode === "name" ? (
                <Search className="tw:text-muted-foreground" size={16} />
              ) : (
                <Barcode className="tw:text-muted-foreground" size={16} />
              )
            }
            rightIcon={
              <VoiceSearch
                callback={handleVoiceCallback}
                className="tw:mt-1 tw:text-muted-foreground tw:cursor-pointer tw:hover:text-primary"
              >
                <Mic size={18} />
              </VoiceSearch>
            }
          />
          {onKeypadClick && (
            <button
              type="button"
              onClick={onKeypadClick}
              className="tw:p-2.5 tw:rounded-full tw:border tw:border-border tw:bg-card tw:text-muted-foreground tw:cursor-pointer tw:transition-colors tw:hover:border-primary tw:hover:text-primary"
              aria-label="Open keypad"
            >
              <Keyboard size={20} />
            </button>
          )}
          {/* Filter icon temporarily hidden.
          <button
            onClick={() => setShowFilterModal(true)}
            className={`tw:relative tw:p-2.5 tw:rounded-full tw:border tw:cursor-pointer tw:transition-colors ${
              hasActiveFilters
                ? "tw:border-primary tw:text-primary tw:bg-primary/5"
                : "tw:border-border tw:bg-card tw:text-muted-foreground tw:hover:bg-muted tw:hover:text-foreground"
            }`}
          >
            <Funnel size={20} />
            {hasActiveFilters && (
              <span className="tw:absolute tw:-top-1 tw:-right-1 tw:w-2 tw:h-2 tw:bg-primary tw:rounded-full" />
            )}
          </button>
          */}
        </div>
        {/* Auto-add-to-cart is now implicit (driven by the Scan/Name mode via
            `autoAddFor`), so the manual checkbox is no longer shown.
        {!hideAutoAdd && (
          <div className="tw:mt-2 tw:mb-2 tw:md:mb-0 tw:flex tw:items-center tw:gap-1">
            <AppCheckbox
              name="autoAddToCart"
              label={t("autoAddToCart")}
              value={autoAddToCart}
              onChange={(v: boolean) => {
                setAutoAddToCart(v);
                triggerCallback({ autoAddToCart: v });
              }}
              size="xs"
            />
            <AppPopover
              triggerContent={
                <button
                  type="button"
                  className="tw:text-gray-400 tw:hover:text-gray-600"
                >
                  <CircleHelp size={14} />
                </button>
              }
              side="bottom"
              align="start"
              contentClassName="tw:max-w-[250px] tw:text-xs tw:text-gray-600"
            >
              <p>{t("autoAddToCartHelp")}</p>
            </AppPopover>
          </div>
        )}
        */}
      </div>

      <FilterModal
        show={showFilterModal}
        callback={handleFilterModalCallback}
        initialData={filterData}
      />
    </AppCard>
  );
};

export default Filter;
