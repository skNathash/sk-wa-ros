import { useCallback, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppModal from "~/components/core/modal/AppModal";
import BrandSearchInput from "~/components/feature/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/components/feature/search-input/category/CategorySearchInput";
import MenuSearchInput from "~/components/feature/search-input/menu/MenuSearchInput";

interface FilterModalProps {
  show: boolean;
  callback: (a: { formData: any; action: string }) => void;
  data: any;
}

const FilterModal = ({ show, callback, data }: FilterModalProps) => {
  const { control, register, setValue, getValues, reset } = useForm({
    defaultValues: {
      menu: [] as any[],
      categories: [] as any[],
      brands: [] as any[],
    },
  });

  const [categories, brands, menu] = useWatch({
    control: control,
    name: ["categories", "brands", "menu"],
  });

  useEffect(() => {
    if (show) {
      reset(data);
    }
  }, [data, reset, show]);

  const handleMenuSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menu", [item]);
    } else {
      setValue("menu", []);
    }
  };

  const handleCategorySelect = (item: any, action: "add" | "remove") => {
    const currentCategories = getValues("categories");
    if (action === "add") {
      setValue("categories", [...currentCategories, item]);
    } else {
      setValue(
        "categories",
        currentCategories.filter(
          (category: any) => category.value.id !== item.value.id
        )
      );
    }
  };

  const handleBrandSelect = (item: any, action: "add" | "remove") => {
    const currentBrands = getValues("brands");

    if (action === "add") {
      setValue("brands", [...currentBrands, item]);
    } else {
      setValue(
        "brands",
        currentBrands.filter((brand: any) => brand.value.id !== item.value.id)
      );
    }
  };

  const handleClear = useCallback(() => {
    const defaultValues = {
      inventoryType: "all",
      movementType: "all",
      menu: [] as any[],
      categories: [] as any[],
      brands: [] as any[],
    };
    reset(defaultValues);
    callback({ formData: defaultValues, action: "clear" });
  }, [reset, callback]);

  const handleApply = useCallback(() => {
    callback({ formData: getValues(), action: "filter" });
  }, [getValues, callback]);

  const handleClose = () => {
    callback({ formData: {}, action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="offcanvas-modal">
      <AppModal.Title noShadow={true} onClose={handleClose}>
        Filter
      </AppModal.Title>
      <AppModal.Content className="modal-bg ion-padding">
        <AppCard>
          <div className="tw:mb-4">
            <MenuSearchInput
              size="sm"
              callback={handleMenuSelect}
              values={menu}
            />
          </div>

          <div className="tw:mb-4">
            <CategorySearchInput
              size="sm"
              multiSelect={true}
              callback={handleCategorySelect}
              values={categories}
            />
          </div>

          <div className="tw:mb-4">
            <BrandSearchInput
              size="sm"
              multiSelect={true}
              callback={handleBrandSelect}
              values={brands}
            />
          </div>
        </AppCard>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:p-2 tw:gap-2">
          <AppButton color="secondary" fill="outline" onClick={handleClear}>
            Clear
          </AppButton>
          <AppButton color="primary" onClick={handleApply}>
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
