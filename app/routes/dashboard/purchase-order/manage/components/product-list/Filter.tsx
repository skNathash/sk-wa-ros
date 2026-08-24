import { debounce } from "lodash";
import { Plus, Search } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import {
  CATALOG_SOURCES,
  type CatalogSource,
  type SearchMode,
} from "./helper";

type Props = {
  vendorId: string;
  onApply: () => void;
  onAddProduct: () => void;
};

const ProductListFilter = ({ vendorId, onApply, onAddProduct }: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, setValue, control } = useFormContext();

  const [searchMode, category, brand, catalog] = useWatch({
    control,
    name: ["searchMode", "category", "brand", "catalog"],
  });

  const triggerApply = debounce(() => {
    onApply();
  }, 400);

  const handleSearchMode = (mode: SearchMode) => {
    setValue("searchMode", mode);
    setValue("search", "");
    onApply();
  };

  const handleCategoryCallback = (data: any, action: "add" | "remove") => {
    setValue("category", action === "add" ? [data] : []);
    onApply();
  };

  const handleBrandCallback = (data: any, action: "add" | "remove") => {
    setValue("brand", action === "add" ? [data] : []);
    onApply();
  };

  const handleCatalog = (value: CatalogSource) => {
    if (value === catalog) return;
    setValue("catalog", value);
    onApply();
  };

  return (
    <div className="tw:space-y-3">
      {/* The source choice sits above everything: it decides which slice of the
          catalog the search, filters and list below are reading. */}
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {CATALOG_SOURCES.map((item) => {
          const active = (catalog || "vendor") === item.value;
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              onClick={() => handleCatalog(item.value)}
              className={`tw:rounded-full tw:border tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:transition-colors ${
                active
                  ? "tw:border-primary tw:bg-primary/10 tw:text-primary"
                  : "tw:border-gray-200 tw:bg-white tw:text-gray-600 tw:hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center">
        <div className="tw:relative tw:flex-1">
          <AppInput
            key={searchMode}
            name="search"
            register={register}
            size="sm"
            className="tw:w-full"
            inputClassName="tw:bg-white tw:pl-9"
            placeholder={
              searchMode === "barcode"
                ? t("scanBarcode", "Scan or enter barcode")
                : t(
                    "searchProducts",
                    "Search products by name, brand, category",
                  )
            }
            leftIcon={<Search size={16} className="tw:text-gray-400" />}
            onChange={() => triggerApply()}
          />
        </div>

        <div className="tw:inline-flex tw:shrink-0 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-0.5">
          {(["name", "barcode"] as SearchMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSearchMode(mode)}
              className={`tw:rounded-md tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors ${
                searchMode === mode
                  ? "tw:bg-white tw:text-gray-900 tw:shadow-sm"
                  : "tw:text-gray-500 tw:hover:text-gray-800"
              }`}
            >
              {mode === "name" ? t("name", "Name") : t("barcode", "Barcode")}
            </button>
          ))}
        </div>

        <AppButton
          size="small"
          color="light"
          fill="outline"
          className="tw:shrink-0"
          onClick={onAddProduct}
        >
          <Plus size={14} />
          {t("addProduct", "Add product")}
        </AppButton>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:gap-2 tw:sm:grid-cols-2">
        <CategorySearchInput
          placeholder={t("allCategories", "All categories")}
          callback={handleCategoryCallback}
          values={category || []}
          feature="inventory-subscribe"
          vendorId={vendorId}
          size="sm"
        />
        <BrandSearchInput
          placeholder={t("allBrands", "All brands")}
          callback={handleBrandCallback}
          values={brand || []}
          feature="inventory-subscribe"
          vendorId={vendorId}
          size="sm"
        />
      </div>
    </div>
  );
};

export default ProductListFilter;
