import { merge } from "lodash";
import { useEffect, useMemo, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";

type FilterModalProps = {
  show: boolean;
  callback: (params: { action: string; data?: Record<string, any> }) => void;
  initialData: Record<string, any>;
};

const FilterModal = ({ show, callback, initialData }: FilterModalProps) => {
  const [menuValues, setMenuValues] = useState<any[]>([]);
  const [categoryValues, setCategoryValues] = useState<any[]>([]);
  const [brandValues, setBrandValues] = useState<any[]>([]);

  useEffect(() => {
    if (show) {
      setMenuValues(initialData.menu ? [initialData.menu] : []);
      setCategoryValues(initialData.category ? [initialData.category] : []);
      setBrandValues(initialData.brand ? [initialData.brand] : []);
    }
  }, [show, initialData]);

  const categoryParams = useMemo(() => {
    if (menuValues.length > 0) {
      return {
        filter: { "applicableMenu.menuId": menuValues[0].value.id },
      };
    }
    return {};
  }, [menuValues]);

  const brandParams = useMemo(() => {
    let brandsFilter = {};

    if (menuValues.length > 0 && categoryValues.length > 0) {
      brandsFilter = merge(
        {},
        {
          filter: {
            "applicableMenu.menuId": menuValues[0].value.id,
            "applicableCategory.categoryId": categoryValues[0].value.id,
          },
        },
      );
    } else if (menuValues.length > 0) {
      brandsFilter = merge(
        {},
        {
          filter: { "applicableMenu.menuId": menuValues[0].value.id },
        },
      );
    } else if (categoryValues.length > 0) {
      brandsFilter = merge(
        {},
        {
          filter: {
            "applicableCategory.categoryId": categoryValues[0].value.id,
          },
        },
      );
    }

    return brandsFilter;
  }, [menuValues, categoryValues]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleApply = () => {
    callback({
      action: "apply",
      data: {
        menu: menuValues[0],
        category: categoryValues[0],
        brand: brandValues[0],
      },
    });
  };

  const handleReset = () => {
    setMenuValues([]);
    setCategoryValues([]);
    setBrandValues([]);
    callback({ action: "reset", data: {} });
  };

  const handleMenuChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setMenuValues([item]);
    } else {
      setMenuValues([]);
    }
    setCategoryValues([]);
    setBrandValues([]);
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setCategoryValues([item]);
    } else {
      setCategoryValues([]);
    }
    setBrandValues([]);
  };

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setBrandValues([item]);
    } else {
      setBrandValues([]);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-lg">
      <AppModal.Title onClose={handleClose}>Filters</AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <div>
            <MenuSearchInput
              feature="pos"
              callback={handleMenuChange}
              values={menuValues}
              size="sm"
              label="Menu"
              placeholder="Search menu"
            />
          </div>
          <div>
            <CategorySearchInput
              feature="pos"
              callback={handleCategoryChange}
              values={categoryValues}
              size="sm"
              label="Category"
              placeholder="Search category"
              params={categoryParams}
            />
          </div>
          <div>
            <BrandSearchInput
              feature="pos"
              callback={handleBrandChange}
              values={brandValues}
              size="sm"
              label="Brand"
              placeholder="Search brand"
              params={brandParams}
            />
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleReset}>
            Reset
          </AppButton>
          <AppButton onClick={handleApply}>Apply</AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
