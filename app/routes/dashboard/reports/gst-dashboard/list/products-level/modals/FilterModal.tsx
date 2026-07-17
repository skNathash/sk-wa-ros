import React, { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppSelect from "~/components/core/form/AppSelect";
import AppButton from "~/components/core/button/AppButton";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CommonService from "~/services/CommonService";

type Props = {
  show: boolean;
  callback: (payload: { action: string; data: any }) => void;
  initialValues?: any;
};

const GST_OPTIONS = CommonService.getGstOptions();

const FilterModal = ({ show, callback, initialValues = {} }: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, setValue, getValues, reset } = useForm({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (show) {
      reset(initialValues);
    }
  }, [initialValues, reset, show]);

  const [menu, category, brand] = useWatch({
    control,
    name: ["menu", "category", "brand"],
  });

  // Categories filter - filter by selected menu if any
  const categoryParams = useMemo(() => {
    if (menu && menu.length > 0) {
      return {
        filter: { "applicableMenu.menuId": menu[0].value.id },
      };
    }
    return {};
  }, [menu]);

  // Brands filter - filter by selected menu and category if any
  const brandParams = useMemo(() => {
    const brandsFilter: any = {};

    if (menu && menu.length > 0 && category && category.length > 0) {
      // Filter brands by both menu and category
      brandsFilter.filter = {
        "applicableMenu.menuId": menu[0].value.id,
        "applicableCategory.categoryId": category[0].value.id,
      };
    } else if (menu && menu.length > 0) {
      // Filter brands by menu only
      brandsFilter.filter = {
        "applicableMenu.menuId": menu[0].value.id,
      };
    } else if (category && category.length > 0) {
      // Filter brands by category only
      brandsFilter.filter = {
        "applicableCategory.categoryId": category[0].value.id,
      };
    }

    return brandsFilter;
  }, [menu, category]);

  const handleMenuChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menu", [item]);
      // Clear categories and brands when menu changes
      setValue("category", []);
      setValue("brand", []);
    } else {
      setValue("menu", []);
      // Clear categories and brands when menu is removed
      setValue("category", []);
      setValue("brand", []);
    }
  };

  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", [item]);
      // Clear brands when category changes
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

  const handleReset = () => {
    // Clear form fields
    reset({});
    // Notify parent with apply action and cleared data
    callback({ action: "apply", data: {} });
  };

  const handleApply = () => {
    callback({ action: "apply", data: getValues() });
  };

  return (
    <AppModal
      show={show}
      callback={() => callback({ action: "close", data: getValues() })}
      className="tw:max-w-lg"
    >
      <AppModal.Title
        onClose={() => callback({ action: "close", data: getValues() })}
      >
        {t("filters")}
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <div>
            <MenuSearchInput
              callback={handleMenuChange}
              values={menu || []}
              feature="pos"
              label={t("menu")}
              size="sm"
            />
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <div>
              <CategorySearchInput
                placeholder={t("searchCategories")}
                multiSelect={false}
                callback={handleCategoryChange}
                values={category || []}
                size="sm"
                feature="pos"
                label={t("category")}
                params={categoryParams}
              />
            </div>

            <div>
              <BrandSearchInput
                placeholder={t("searchBrands")}
                multiSelect={false}
                callback={handleBrandChange}
                values={brand || []}
                size="sm"
                feature="pos"
                label={t("brand")}
                params={brandParams}
              />
            </div>
          </div>

          <div>
            <Controller
              control={control}
              name="gst"
              defaultValue={initialValues?.gst ?? ""}
              render={({ field }) => (
                <AppSelect
                  label={t("gst")}
                  options={GST_OPTIONS}
                  placeholder={t("select")}
                  onChange={field.onChange}
                  value={field.value}
                  className="tw:w-full"
                  inputClassName="tw:bg-white"
                  size="sm"
                />
              )}
            />
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:gap-2">
          <AppButton
            type="button"
            fill="outline"
            color="light"
            onClick={handleReset}
          >
            {t("reset")}
          </AppButton>
          <AppButton type="button" onClick={handleApply}>
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
