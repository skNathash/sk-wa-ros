import {
  Barcode,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppRadio, AppSelect } from "~/components/core/form";
import { debounce } from "lodash";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import useScreenView from "~/hooks/useScreenView";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import { useTranslation } from "react-i18next";

const options = [
  { label: "All Purchase History", value: "All" },
  { label: "Recent From this Vendor", value: "recent" },
  { label: "Recent From any Vendor", value: "recentAny" },
];

type FormData = {
  type: string;
  category: any[];
  brand: any[];
  alpha?: string;
  /** Whether the single search box searches by product name/ID or by barcode. */
  searchMode: "name" | "barcode";
  /** The value typed/scanned into the single search box. */
  searchTerm?: string;
};

const SelectProductsFilter = ({
  callback,
  vendorId,
}: {
  callback: ({ action, data }: { action: string; data: any }) => void;
  vendorId?: string;
}) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { register, getValues, control, setValue } = useForm<FormData>({
    defaultValues: {
      type: "All",
      category: [],
      brand: [],
      alpha: "",
      searchMode: "name",
      searchTerm: "",
    },
  });

  const [category, brand, alpha, searchMode] = useWatch({
    control,
    name: ["category", "brand", "alpha", "searchMode"],
  });

  const isBarcodeMode = searchMode === "barcode";

  const handleSearchChange = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = () => {
    const values = getValues();
    const term = (values.searchTerm || "").trim();
    // Route the single search box to the right query param based on the
    // selected mode, clearing the other so a stale value can't linger.
    callback({
      action: "search",
      data: {
        ...values,
        search: values.searchMode === "barcode" ? "" : term,
        barcode: values.searchMode === "barcode" ? term : "",
      },
    });
  };

  const handleSearchModeChange = (value: string) => {
    setValue("searchMode", value as FormData["searchMode"]);
    // Clear the box on mode switch so a name query isn't sent as a barcode.
    setValue("searchTerm", "");
    triggerCallback();
  };

  const handleCategoryCallback = (data: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", [data]);
    } else {
      setValue("category", []);
    }
    triggerCallback();
  };

  const handleBrandCallback = (data: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brand", [data]);
    } else {
      setValue("brand", []);
    }
    triggerCallback();
  };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  const handleBarcodeScan = (data: { action: string; data: any }) => {
    if (data.action === "scan" && data.data) {
      setValue("searchMode", "barcode");
      setValue("searchTerm", data.data);
      triggerCallback();
    }
  };

  return (
    <>
      {/* Unified Search - radio picks whether the box searches by product
          name/ID or by barcode; a single input serves both. Radio, input and
          the barcode search button share one row to keep the block compact. */}
      <div className="tw:bg-gray-100 tw:p-2.5 tw:rounded-md tw:mb-3 tw:border tw:border-gray-300">
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-2">
          <AppRadio
            name="searchMode"
            defaultValue="name"
            inline
            className="tw:shrink-0"
            onChange={handleSearchModeChange}
            options={[
              { label: t("productName"), value: "name" },
              { label: t("barcode"), value: "barcode" },
            ]}
          />
          <div className="tw:relative tw:flex-1">
            <AppInput
              key={searchMode}
              name="searchTerm"
              placeholder={
                isBarcodeMode ? t("scanBarcode") : t("searchByProductNameId")
              }
              register={register}
              size="sm"
              className="tw:w-full"
              inputClassName="tw:bg-white tw:pl-8"
              onChange={isBarcodeMode ? undefined : handleSearchChange}
              rightIcon={
                isBarcodeMode ? (
                  <BarcodeScan
                    callback={handleBarcodeScan}
                    className="tw:mt-1 tw:cursor-pointer"
                  />
                ) : undefined
              }
              leftIcon={
                isBarcodeMode ? (
                  <Barcode size={16} className="tw:text-gray-500" />
                ) : (
                  <Search size={16} className="tw:text-gray-500" />
                )
              }
            />
          </div>
          {isBarcodeMode && (
            <AppButton
              size="small"
              color="dark"
              className="tw:shrink-0"
              onClick={triggerCallback}
            >
              {t("search")}
            </AppButton>
          )}
        </div>
      </div>

      {/* Filter Toggle for Mobile */}
      {isMobile && (
        <div className="tw:flex tw:justify-center tw:items-center tw:mb-3">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600 tw:hover:text-blue-800 tw:underline tw:bg-transparent tw:border-none tw:cursor-pointer"
          >
            <span>{t("moreFilters")}</span>
            {showMobileFilters ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </div>
      )}

      {/* Filters Grid - Responsive Layout */}
      {((isMobile && showMobileFilters) || (!isMobile && showFilters)) && (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-3">
          <CategorySearchInput
            placeholder={t("searchByCategory")}
            callback={handleCategoryCallback}
            values={category}
            feature="vendor"
            vendorId={vendorId}
          />

          <BrandSearchInput
            placeholder={t("searchByBrand")}
            callback={handleBrandCallback}
            values={brand}
            feature="vendor"
            vendorId={vendorId}
          />

          {/* <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                inputClassName="tw:w-full"
                onChange={(e) => {
                  field.onChange(e);
                  triggerCallback();
                }}
                value={field.value}
                options={options}
              />
            )}
          /> */}
        </div>
      )}

      {/* Alpha - Full Row */}
      <Alpha
        selected={(alpha as any) || ""}
        callback={handleAlphaChange}
        className="tw:mb-3"
      />
    </>
  );
};

export default SelectProductsFilter;
