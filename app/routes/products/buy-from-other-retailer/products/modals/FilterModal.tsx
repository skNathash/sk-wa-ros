import type { FC } from "react";
import { useMemo } from "react";
import { merge } from "lodash";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import AppButton from "~/components/core/button/AppButton";

type FilterFormData = {
  menu: any[];
  category: any[];
  brand: any[];
};

const DEFAULT_VALUES: FilterFormData = {
  menu: [],
  category: [],
  brand: [],
};

type FilterModalProps = {
  show: boolean;
  initialValues?: Partial<FilterFormData>;
  callback: (data: {
    action: "apply" | "cancel" | "clear";
    data?: Partial<FilterFormData>;
  }) => void;
  distance?: string;
};

export const FilterModal: FC<FilterModalProps> = ({
  show,
  initialValues = {},
  callback,
  distance,
}) => {
  const { control, handleSubmit, reset, setValue } = useForm<FilterFormData>({
    defaultValues: {
      ...DEFAULT_VALUES,
      ...initialValues,
    },
  });

  // Watch for menu changes to create filter params
  const menuValue = useWatch({ control, name: "menu" });
  const categoryValue = useWatch({ control, name: "category" });

  // Create filter params for category and brand inputs
  const categoryFilterParams = useMemo(() => {
    const params: any = {};

    if (menuValue?.[0]) {
      params.filter = {
        "applicableMenu.menuId": menuValue[0].value?.id || menuValue[0].menuId,
      };
    }

    // Add distance to params if available
    if (distance) {
      params.distance = distance;
    }

    return params;
  }, [menuValue, distance]);

  const brandFilterParams = useMemo(() => {
    const params: any = {};

    if (menuValue?.[0] && categoryValue?.[0]) {
      // Filter brands by both menu and category
      params.filter = {
        "applicableMenu.menuId": menuValue[0].value?.id || menuValue[0].menuId,
        "applicableCategory.categoryId":
          categoryValue[0].value?.id || categoryValue[0].categoryId,
      };
    } else if (menuValue?.[0]) {
      // Filter brands by menu only
      params.filter = {
        "applicableMenu.menuId": menuValue[0].value?.id || menuValue[0].menuId,
      };
    } else if (categoryValue?.[0]) {
      // Filter brands by category only
      params.filter = {
        "applicableCategory.categoryId":
          categoryValue[0].value?.id || categoryValue[0].categoryId,
      };
    }

    // Add distance to params if available
    if (distance) {
      params.distance = distance;
    }

    return params;
  }, [menuValue, categoryValue, distance]);

  const handleApply = (data: FilterFormData) => {
    // Pass full form data (arrays) so callers receive same shape as InventoryFilterModal
    callback({ action: "apply", data });
  };

  const handleCancel = () => {
    reset(initialValues);
    callback({ action: "cancel" });
  };

  const handleClear = () => {
    reset(DEFAULT_VALUES);
    callback({ action: "clear" });
  };

  const handleMenuChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menu", [item]);
      // Clear category and brand when menu changes
      setValue("category", []);
      setValue("brand", []);
    } else {
      setValue("menu", []);
      // Clear category and brand when menu is removed
      setValue("category", []);
      setValue("brand", []);
    }
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", [item]);
      // Clear brand when category changes
      setValue("brand", []);
    } else {
      setValue("category", []);
      // Clear brands when category is removed
      setValue("brand", []);
    }
  };

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") setValue("brand", [item]);
    else setValue("brand", []);
  };

  return (
    <AppModal show={show} callback={handleCancel}>
      <AppModal.Title onClose={handleCancel}>
        <div className="tw:text-lg tw:font-bold">Filter Products</div>
      </AppModal.Title>
      <form onSubmit={handleSubmit(handleApply)}>
        <AppModal.Content>
          <div className="tw:space-y-4">
            <div>
              <Controller
                name="menu"
                control={control}
                render={({ field: { value } }) => (
                  <MenuSearchInput
                    size="sm"
                    values={value || []}
                    label="Search Menu"
                    params={distance ? { distance } : {}}
                    callback={(item, action) => {
                      handleMenuChange(item, action);
                    }}
                    feature="network-buy"
                  />
                )}
              />
            </div>

            <div>
              <Controller
                name="category"
                control={control}
                render={({ field: { value } }) => (
                  <CategorySearchInput
                    size="sm"
                    feature="network-buy"
                    values={value || []}
                    label="Category"
                    params={categoryFilterParams}
                    callback={(item, action) => {
                      handleCategoryChange(item, action);
                    }}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                name="brand"
                control={control}
                render={({ field: { value } }) => (
                  <BrandSearchInput
                    size="sm"
                    feature="network-buy"
                    values={value || []}
                    label="Brand"
                    params={brandFilterParams}
                    callback={(item, action) => {
                      handleBrandChange(item, action);
                    }}
                  />
                )}
              />
            </div>
          </div>
        </AppModal.Content>
        <AppModal.Footer>
          <div className="tw:flex tw:justify-between tw:w-full">
            <AppButton
              type="button"
              onClick={handleClear}
              color="light"
              fill="outline"
              size="small"
            >
              Clear All
            </AppButton>
            <div className="tw:space-x-2">
              <AppButton
                type="button"
                onClick={handleCancel}
                color="light"
                fill="outline"
                size="small"
              >
                Cancel
              </AppButton>
              <AppButton type="submit" color="primary" size="small">
                Apply
              </AppButton>
            </div>
          </div>
        </AppModal.Footer>
      </form>
    </AppModal>
  );
};
