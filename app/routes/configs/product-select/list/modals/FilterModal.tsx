import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";

type Props = {
  show: boolean;
  callback: (a: {
    action: string;
    data: {
      menus: any[];
      categories: any[];
      brands: any[];
    };
  }) => void;
  data: {
    menus: any[];
    categories: any[];
    brands: any[];
  };
};

const defaultValues: Record<string, any> = {
  menus: [],
  categories: [],
  brands: [],
};

const FilterModal = ({ show, callback, data }: Props) => {
  const { control, getValues, setValue, reset } = useForm<{
    menus: any[];
    categories: any[];
    brands: any[];
  }>({
    defaultValues: { ...defaultValues },
  });

  const [selectedMenus, selectedCategories] = useWatch({
    control,
    name: ["menus", "categories"],
  });

  const defaultParams = useMemo(() => {
    let categoryParams: Record<string, any> = {};
    let brandParams: Record<string, any> = {};

    if (selectedMenus.length > 0) {
      categoryParams.filter = {
        "applicableMenu.menuId": {
          $in: selectedMenus.map((menu: any) => menu.value.id),
        },
      };
    }

    if (selectedCategories.length > 0) {
      brandParams.filter = {
        "applicableCategory.categoryId": {
          $in: selectedCategories.map((category: any) => category.value.id),
        },
      };
    }

    return {
      categories: categoryParams,
      brands: brandParams,
    };
  }, [selectedMenus, selectedCategories]);

  useEffect(() => {
    if (show) {
      reset({ ...defaultValues, ...(data || {}) });
    }
  }, [show, reset, data]);

  const handleClose = () => {
    callback({
      action: "close",
      data: { menus: [], categories: [], brands: [] },
    });
  };

  const handleMenuChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menus", [item]);
    } else {
      setValue("menus", []);
      setValue("categories", []);
      setValue("brands", []);
    }
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("categories", [item]);
    } else {
      setValue("categories", []);
      setValue("brands", []);
    }
  };

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brands", [item]);
    } else {
      setValue("brands", []);
    }
  };

  const handleReset = () => {
    reset({ ...defaultValues });
    callback({
      action: "reset",
      data: { menus: [], categories: [], brands: [] },
    });
  };

  const handleApply = () => {
    callback({ action: "apply", data: getValues() });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">Filter</div>
      </AppModal.Title>
      <AppModal.Content>
        <Controller
          control={control}
          name="menus"
          render={({ field }) => (
            <MenuSearchInput
              feature="pos"
              label="Menus"
              placeholder="Search menus"
              values={field.value}
              callback={handleMenuChange}
              size="sm"
              className="tw:mb-4"
            />
          )}
        />
        <Controller
          control={control}
          name="categories"
          render={({ field }) => (
            <CategorySearchInput
              feature="pos"
              label="Categories"
              placeholder="Search categories"
              values={field.value}
              callback={handleCategoryChange}
              size="sm"
              className="tw:mb-4"
              params={defaultParams.categories}
            />
          )}
        />
        <Controller
          control={control}
          name="brands"
          render={({ field }) => (
            <BrandSearchInput
              feature="pos"
              label="Brands"
              placeholder="Search brands"
              values={field.value}
              callback={handleBrandChange}
              size="sm"
              className="tw:mb-4"
              params={defaultParams.brands}
            />
          )}
        />
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            Reset
          </AppButton>
          <AppButton onClick={handleApply} color="primary" size="small">
            Apply
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
