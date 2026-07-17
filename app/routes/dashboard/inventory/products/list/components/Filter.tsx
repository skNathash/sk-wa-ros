import { debounce } from "lodash";
import { Barcode, Funnel } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import InventoryFilterModal from "~/shared/inventory/modals/inventory-filter/InventoryFilterModal";
import { type FilterFormFields } from "../helper";
import useScreenView from "~/hooks/useScreenView";
import MiscService from "~/services/MiscService";

interface FilterProps {
  callback: (filters: { formData: FilterFormFields }) => void;
  className?: string;
}

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const [searchParams, setSearchParams] = useSearchParams();
  const isInactivePage = searchParams.get("inactive") === "true";

  const [filterModal, setFilterModal] = useState<{ show: boolean; data: any }>({
    show: false,
    data: null,
  });

  const { control, setValue, getValues, register } =
    useFormContext<FilterFormFields>();

  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });

  const { isMobile } = useScreenView();

  const [keys, setKeys] = useState<string[]>([]);

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

  // Trigger callback function (stable)
  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  // If keys exist, pick the first and update the search input
  useEffect(() => {
    const t = setTimeout(() => {
      const raw = searchParams.get("keys");
      const arr = raw
        ? raw
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];
      setKeys(arr);
    }, 1000);
    return () => clearTimeout(t);
  }, [searchParams.get("keys")?.toString()]);

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      setValue("search", r.data);
      triggerCallback();
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
            setKeys(arr);
            triggerCallback();
          }
        } else if (data.search && typeof data.search === "string") {
          setValue("keys", [data.search]);
          setValue("search", data.search);
          setKeys([data.search]);
          triggerCallback();
        }
      }
    },
    [setValue, triggerCallback],
  );

  const handleSearchChange = useCallback(
    (e: any) => {
      // Accept either a string or an event
      const val = typeof e === "string" ? e : (e?.target?.value ?? "");

      // Detect if input is from scanner device
      const isFromScanner = scannerDetector.trackKeystroke();

      if (!val) {
        setValue("search", "");
        setValue("keys", []);
        setKeys([]);
        scannerDetector.reset();
        // Clear any pending select timeout
        if (selectTimeoutRef.current) {
          clearTimeout(selectTimeoutRef.current);
          selectTimeoutRef.current = null;
        }
      }

      // If user cleared the input, handle clearing keys and URL params
      if (typeof val === "string" && val.trim() === "") {
        const hasKeysParam = Boolean(searchParams.get("keys"));
        const hasSearchParam = Boolean(searchParams.get("search"));

        // If either `keys` or `search` exists in the URL, remove them
        if (hasKeysParam || hasSearchParam) {
          // Remove only the `keys` and `search` params, keep other params intact
          const newParams = new URLSearchParams(searchParams as any);
          newParams.delete("keys");
          newParams.delete("search");

          setSearchParams(newParams, { replace: true });
        }
        scannerDetector.reset();
        // Clear any pending select timeout
        if (selectTimeoutRef.current) {
          clearTimeout(selectTimeoutRef.current);
          selectTimeoutRef.current = null;
        }
      } else {
        // If from scanner, trigger immediately without debounce
        if (isFromScanner) {
          // Clear any existing timeout before setting new one
          if (selectTimeoutRef.current) {
            clearTimeout(selectTimeoutRef.current);
          }
          // Wait for scanning to complete before triggering callback
          selectTimeoutRef.current = setTimeout(() => {
            const inputElem = e?.target as HTMLInputElement;
            if (inputElem && inputElem.value === val) {
              inputElem.select();
            }
            selectTimeoutRef.current = null;
          }, 150);
          debouncedSearch();
        } else {
          // Manual typing - use debounce
          debouncedSearch();
        }
      }
    },
    [searchParams, debouncedSearch, scannerDetector, setValue, triggerCallback],
  );

  // Handle alpha selection
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  const openInventoryFilterModal = () => {
    const currentValues = getValues();
    setFilterModal({
      show: true,
      data: {
        menu: currentValues.menu || [],
        brand: currentValues.brand || [],
        category: currentValues.category || [],
        companyName: currentValues.companyName || [],
        status: currentValues.status || "All",
        velocity: currentValues.velocity || "All",
        stockStatus: currentValues.stockStatus || "All",
        sellIn: currentValues.sellIn || "All",
        onlyOffers: currentValues.onlyOffers || false,
        withoutStock: currentValues.withoutStock || false,
        isGroupDeal: currentValues.isGroupDeal || false,
        isPriceSlab: currentValues.isPriceSlab || false,
        reserve: currentValues.reserve || "All",
        isPromotionalDeal: currentValues.isPromotionalDeal || false,
        dealScope: currentValues.dealScope || "All",
      },
    });
  };

  // sort is moved to view-toggle row; Filter no longer manages sort popover

  const handleInventoryFilterModalCallback = async (payload: {
    data?: any;
    action: string;
  }) => {
    setFilterModal({ show: false, data: null });

    await new Promise((resolve) => setTimeout(resolve, 300)); // wait for modal close animation

    if (payload.action === "apply" && payload.data) {
      // Update form values using setValue
      if (payload.data.menu !== undefined) {
        setValue("menu", payload.data.menu);
      }
      if (payload.data.companyName !== undefined) {
        setValue("companyName", payload.data.companyName);
      }
      if (payload.data.brand !== undefined) {
        setValue("brand", payload.data.brand);
      }
      if (payload.data.category !== undefined) {
        setValue("category", payload.data.category);
      }
      if (payload.data.status !== undefined) {
        setValue("status", payload.data.status);
      }
      if (payload.data.velocity !== undefined) {
        setValue("velocity", payload.data.velocity);
      }
      if (payload.data.stockStatus !== undefined) {
        setValue("stockStatus", payload.data.stockStatus);
      }
      if (payload.data.onlyOffers !== undefined) {
        setValue("onlyOffers", payload.data.onlyOffers);
      }
      if (payload.data.withoutStock !== undefined) {
        setValue("withoutStock", payload.data.withoutStock);
      }
      if (payload.data.isGroupDeal !== undefined) {
        setValue("isGroupDeal", payload.data.isGroupDeal);
      }
      if (payload.data.isPriceSlab !== undefined) {
        setValue("isPriceSlab", payload.data.isPriceSlab);
      }
      if (payload.data.sellIn !== undefined) {
        setValue("sellIn", payload.data.sellIn);
      }
      if (payload.data.reserve !== undefined) {
        setValue("reserve", payload.data.reserve);
      }
      if (payload.data.isPromotionalDeal !== undefined) {
        setValue("isPromotionalDeal", payload.data.isPromotionalDeal);
      }
      if (payload.data.dealScope !== undefined) {
        setValue("dealScope", payload.data.dealScope);
      }
      triggerCallback();
    } else if (payload.action === "scan" && payload.data) {
      setValue("search", payload.data);
      triggerCallback();
    }
  };

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      {/* Search Input - Full Row */}
      <div className="tw:w-full">
        <div className="tw:flex tw:items-center tw:gap-2">
          <AppInput
            name="search"
            placeholder={t("searchProductsPlaceholder")}
            register={register}
            onChange={handleSearchChange}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            autoFocus={!isMobile}
            className="tw:w-full tw:focus:border-2 tw:focus:border-blue-500 tw:flex-1"
            leftIcon={<Barcode className="tw:text-gray-500" size={16} />}
            rightIcon={
              <div className="tw:flex tw:items-center tw:gap-2">
                <VoiceMic callback={handleVoiceCallback} />
              </div>
            }
          />
          <div>
            <div className="tw:flex tw:flex-row tw:gap-2 tw:items-center">
              <AppButton
                fill="outline"
                color="light"
                size="small"
                onClick={openInventoryFilterModal}
              >
                <Funnel fill={filterModal.show ? "black" : "none"} />
              </AppButton>

              {/* sort moved to header */}
            </div>
          </div>
        </div>

        {/* Render collected keys as badges under the input */}
        {keys && keys.length > 0 && (
          <div className="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
            {keys.map((k) => (
              <span
                key={k}
                onClick={() => {
                  setValue("search", k);
                  triggerCallback();
                }}
                className="tw:cursor-pointer"
              >
                <AppBadge variant="light">{k}</AppBadge>
              </span>
            ))}
          </div>
        )}

        {/* Alpha navigation - quick A-Z filter */}
        <div className="tw:mt-3">
          <Alpha selected={alpha || ""} callback={handleAlphaChange} />
        </div>
      </div>

      {/* inline sort popover removed — popover is attached to sort button above */}

      {/* Inline filter inputs removed — open the modal to access filters */}

      <InventoryFilterModal
        show={filterModal.show}
        data={filterModal.data}
        callback={handleInventoryFilterModalCallback}
        hideStatus={isInactivePage}
      />
    </div>
  );
};

export default Filter;
