import { FilterIcon, Search } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import AppBadge from "~/components/core/badge/AppBadge";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import { defaultFilterValues, type FilterFormFields } from "../helper";
import FilterModal from "../modals/FilterModal";
import Alpha from "~/components/core/alpha/Alpha";
import MiscService from "~/services/MiscService";
import useScreenView from "~/hooks/useScreenView";

interface FilterProps {
  callback: (a: { action: string; formData: any }) => void;
  subscribeAllChecked: boolean;
  handleSubscribeAllDisplayed: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  showSubscribeAllCheckbox: boolean;
  showFilterButton?: boolean;
  searchPlaceholder?: string;
  showAiSearch?: boolean;
}

const Filter: React.FC<FilterProps> = ({
  callback,
  subscribeAllChecked,
  handleSubscribeAllDisplayed,
  isLoading,
  showSubscribeAllCheckbox,
  showFilterButton = true,
  searchPlaceholder,
  showAiSearch = true,
}) => {
  const { setValue, getValues, register } = useFormContext<FilterFormFields>();
  const { t } = useTranslation(["inventorySubscribe", "common"]);

  const activeTab = getValues("activeTab");

  const { isMobile } = useScreenView();

  const [filterModal, setFilterModal] = useState({
    show: false,
    data: {},
  });

  // Initialize scanner detector (stable across renders)
  const scannerDetector = useMemo(
    () => MiscService.createScannerDetector(),
    [],
  );

  // Ref to store timeout ID for cleanup
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
      }
    };
  }, []);

  // const searchTypeOptions = [
  //   {
  //     label: "By Products",
  //     langKey: "byProducts",
  //     value: "Products",
  //     Icon: Search,
  //   },
  //   {
  //     label: "By Barcode",
  //     langKey: "byBarcode",
  //     value: "barcode",
  //     Icon: Search,
  //   },
  // ];

  const [searchType, keys, alpha, search] = useWatch({
    name: ["searchType", "keys", "alpha", "search"],
  });

  // Alpha (A–Z) browse and free-text search are mutually exclusive (selecting a
  // letter clears the search and vice-versa), so hide the alpha row while a
  // search is active to save vertical space; it returns when the search clears.
  const hasSearch = !!(typeof search === "string" && search.trim());

  const triggerCallback = (data = {}) => {
    callback({
      action: "filter",
      formData: { ...getValues(), ...data },
    });
  };

  // useDebouncedCallback keeps the latest callback in a ref internally, so the
  // debounced fire always uses the current triggerCallback/callback closure.
  // Plain useCallback(debounce(...), []) would freeze the first-render callback
  // (and its stale setSearchParams), which is what dropped the viewMode param.
  const debounceSearch = useDebouncedCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue("search", v);
      // Clear collected voice keys when user clears the input
      if (!v || v.trim() === "") {
        setValue("keys", []);
      }
      if (v && v.trim() !== "") {
        setValue("alpha", "");
        triggerCallback({ search: v, alpha: "" });
        return;
      }

      triggerCallback({ search: e.target.value });
    },
    500,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Detect if input is from scanner device
    const isFromScanner = scannerDetector.trackKeystroke();

    if (!val) {
      setValue("search", "");
      setValue("keys", []);
      triggerCallback({ search: "", keys: [] });
      return;
    }

    if (isFromScanner) {
      setValue("alpha", "");
      triggerCallback({ search: val, alpha: "" });

      // Select the input after a short delay
      selectTimeoutRef.current = setTimeout(() => {
        (e.target as HTMLInputElement).select();
      }, 100);
    } else {
      // Otherwise, debounce the input
      debounceSearch(e);
    }
  };

  const handleKeyClick = useCallback(
    (k: string) => {
      setValue("search", k);
      // Preserve existing collected keys when updating the search via a key click
      const currentKeys = Array.isArray(keys) ? keys : getValues().keys || [];
      triggerCallback({ search: k, keys: currentKeys });
    },
    [getValues, keys, setValue, triggerCallback],
  );

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      setValue("search", r.data);
      triggerCallback({ search: r.data });
    }
  };

  const handleVoiceCallback = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if ((action === "close" || action === "scan") && data) {
        if (data.keywords && Array.isArray(data.keywords)) {
          const arr = data.keywords.filter(Boolean);
          if (arr.length > 0) {
            setValue("keys", arr);
            setValue("search", arr[0]);
            triggerCallback({ search: arr[0], keys: arr });
          }
        } else if (data.search && typeof data.search === "string") {
          setValue("keys", [data.search]);
          setValue("search", data.search);
          triggerCallback({ search: data.search, keys: [data.search] });
        }
      }
    },
    [setValue, triggerCallback],
  );

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const handleFilterModalCallback = useCallback(
    (data: any) => {
      setFilterModal({ show: false, data: defaultFilterValues });
      if (data.action === "apply") {
        setValue("menu", data.data.menu || []);
        setValue("categories", data.data.categories || []);
        setValue("brands", data.data.brands || []);
        setValue("companyName", data.data.companyName || []);
        setValue("onlyOffers", data.data.onlyOffers || false);
        setValue("isGroupDeal", data.data.isGroupDeal || false);
        // Use the data from modal directly to ensure we have the latest values
        triggerCallback(data.data);
      }
    },
    [setValue, getValues, triggerCallback],
  );

  const handleAlphaClick = (value: string) => {
    setValue("alpha", value);
    setValue("search", "");
    setValue("keys", []);
    triggerCallback({ search: "", keys: [], alpha: value });
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-1">
      <div className="tw:col-span-1 tw:md:col-span-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-full">
            <AppInput
              name="search"
              placeholder={
                searchPlaceholder || t("search.filter.placeholder.products")
              }
              register={register}
              onChange={handleSearchChange}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              autoFocus={!isMobile}
              leftIcon={<Search className="tw:text-gray-500" size={16} />}
              rightIcon={
                <div className="tw:flex tw:items-center tw:gap-2">
                  <BarcodeScan
                    callback={handleBarcodeScan}
                    className="tw:mt-1 tw:cursor-pointer"
                  />
                  <VoiceMic callback={handleVoiceCallback} />
                </div>
              }
              inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm tw:pr-20"
            />
          </div>
          {showFilterButton && (
            <div className="tw:flex tw:items-center tw:gap-2">
              <AppButton
                fill="outline"
                color="light"
                size="small"
                onClick={openFilterModal}
              >
                <FilterIcon size={16} />
              </AppButton>
            </div>
          )}
        </div>

        {/* Render collected keys as badges under the input */}
        {keys && keys.length > 0 && (
          <div className="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
            {keys.map((k: string) => (
              <span
                key={k}
                onClick={() => handleKeyClick(k)}
                className="tw:cursor-pointer"
              >
                <AppBadge variant="light">{k}</AppBadge>
              </span>
            ))}
          </div>
        )}
        {(!hasSearch || showSubscribeAllCheckbox) && (
          <div className="tw:mt-2 tw:flex tw:gap-2 tw:flex-wrap tw:items-center">
            {/* {searchTypeOptions.map((opt) => (
            <span
              key={opt.value}
              onClick={() => handleSearchTypeChange(opt.value)}
              className="tw:cursor-pointer"
            >
              <AppBadge
                variant={searchType === opt.value ? "primary" : "secondary"}
                className={searchType === opt.value ? "" : "tw:opacity-70"}
              >
                {opt.Icon && (
                  <opt.Icon className="tw:mr-1 tw:align-middle" size={14} />
                )}
                <span
                  className={`${
                    searchType === opt.value ? "tw:font-medium" : ""
                  }`}
                >
                  {t(opt.langKey, { ns: "common" })}
                </span>
              </AppBadge>
            </span>
          ))} */}

            {!hasSearch && (
              <div className="tw:w-full">
                <Alpha
                  selected={alpha || ""}
                  className="tw:cursor-pointer"
                  callback={(value) => handleAlphaClick(value)}
                />
              </div>
            )}
            {showSubscribeAllCheckbox && (
              <div className="tw:flex tw:items-center tw:gap-2">
                <input
                  type="checkbox"
                  className="tw:w-3 tw:h-3"
                  checked={subscribeAllChecked}
                  onChange={handleSubscribeAllDisplayed}
                  disabled={isLoading}
                />
                <span className="tw:text-xs tw:text-gray-500">
                  {t("search.subscribeAllDisplayed", "Subscribe all displayed")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <FilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        data={filterModal.data}
        activeTab={activeTab}
      />
    </div>
  );
};

export default Filter;
