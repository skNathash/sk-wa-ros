import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";

interface FilterModalProps {
  show: boolean;
  callback: (result: { action: string; data: any }) => void;
  initialData?: { category?: any[]; brand?: any[] };
}

const FilterModal = ({ show, callback, initialData }: FilterModalProps) => {
  const { t } = useTranslation(["common"]);

  const [category, setCategory] = useState<any[]>(initialData?.category || []);
  const [brand, setBrand] = useState<any[]>(initialData?.brand || []);

  const handleCategoryChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setCategory([]);
    } else {
      setCategory(item ? [item] : []);
    }
    // Clear brand when category changes
    setBrand([]);
  };

  const handleBrandChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setBrand([]);
    } else {
      setBrand(item ? [item] : []);
    }
  };

  // Filter brands by selected category
  const brandParams = useMemo(() => {
    if (category.length > 0) {
      return {
        filter: {
          "applicableCategory.categoryId": category[0].value.id,
        },
      };
    }
    return {};
  }, [category]);

  const handleApply = () => {
    callback({ action: "apply", data: { category, brand } });
  };

  const handleClear = () => {
    setCategory([]);
    setBrand([]);
    callback({ action: "apply", data: { category: [], brand: [] } });
  };

  return (
    <AppModal show={show} callback={callback} isAutoHeight>
      <AppModal.Title onClose={() => callback({ action: "close", data: {} })}>
        <span className="tw:text-base tw:font-semibold">{t("filters")}</span>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-4">
          <CategorySearchInput
            label={t("category")}
            placeholder={t("filterByCategory")}
            callback={handleCategoryChange}
            values={category}
            size="sm"
            className="tw:w-full"
            feature="pos"
          />
          <BrandSearchInput
            label={t("brand")}
            placeholder={t("filterByBrand")}
            callback={handleBrandChange}
            values={brand}
            size="sm"
            className="tw:w-full"
            feature="pos"
            params={brandParams}
          />
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:w-full tw:justify-end">
          <AppButton onClick={handleClear} fill="outline" size="small">
            {t("reset")}
          </AppButton>
          <AppButton onClick={handleApply} size="small">
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
