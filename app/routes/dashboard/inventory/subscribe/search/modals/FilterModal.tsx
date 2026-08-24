import { merge } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import CompanyNameSearchInput from "~/components/feature/search-input/company/CompanyNameSearchInput";
import AuthService from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import { defaultFilterValues, type FilterFormFields } from "../helper";

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  data: Record<string, any>;
  activeTab?: string;
};

const FilterModal = ({ show, callback, data, activeTab = "" }: Props) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<FilterFormFields>({
      defaultValues: { ...defaultFilterValues },
    });

  const [businessCategories, setBusinessCategories] = useState<any[]>([]);

  const [menu = [], categories = []] = useWatch({
    control,
    name: ["menu", "categories"],
  });

  useEffect(() => {
    if (show) {
      const fetchBusinessCategories = async () => {
        const primaryId = AuthService.getLoggedInUserPrimaryBusiness().id;
        const secondaryId = AuthService.getLoggedInUserSecondaryBusiness().id;
        const businessCategories =
          await SellerCatalogService.getBusinessLinkedMenus(
            primaryId,
            secondaryId,
          );

        if (
          businessCategories.status === "success" &&
          businessCategories.ids.length > 0
        ) {
          setBusinessCategories(businessCategories.ids);
        } else {
          setBusinessCategories([]);
        }
      };

      if (data.primeCatalog) {
        fetchBusinessCategories();
      } else {
        setBusinessCategories([]);
      }

      reset({ ...defaultFilterValues, ...data });
    }
  }, [show, reset, data]);

  // Menu filter - only depends on activeTab, never changes based on categories/brands
  const menuParams = useMemo(() => {
    let params: Record<string, any> = {
      filter: {},
    };
    if (data.primeCatalog && businessCategories.length > 0) {
      params.filter["applicableMenu.id"] = {
        $in: businessCategories,
      };
    }
    if (activeTab === "top") {
      params.filter["topRunningDeal"] = true;
    }

    if (!Object.keys(params.filter).length) {
      delete params.filter;
    }

    return params;
  }, [activeTab, businessCategories, data.primeCatalog]);

  // Categories and brands filters - depend on menu and categories selections
  const additionalParams = useMemo(() => {
    let defaultFilter: Record<string, any> = {};

    let categoriesFilter = {};
    let brandsFilter = {};

    if (activeTab === "top") {
      defaultFilter = {
        filter: {
          topRunningDeal: true,
        },
      };
    }

    if (data.primeCatalog && businessCategories.length > 0) {
      if (!defaultFilter.filter) {
        defaultFilter.filter = {};
      }
      defaultFilter.filter["applicableMenu.id"] = { $in: businessCategories };
    }

    // Categories filter - filter by selected menu if any
    if (menu.length > 0) {
      categoriesFilter = merge({}, defaultFilter, {
        filter: { "applicableMenu.menuId": menu[0].value.id },
      });
    } else {
      categoriesFilter = merge({}, defaultFilter);
    }

    // Brands filter - filter by selected menu and categories if any
    if (menu.length > 0 && categories.length > 0) {
      // Filter brands by both menu and categories
      brandsFilter = merge({}, defaultFilter, {
        filter: {
          "applicableMenu.menuId": menu[0].value.id,
          "applicableCategory.categoryId": {
            $in: categories.map((cat: any) => cat.value.id),
          },
        },
      });
    } else if (menu.length > 0) {
      // Filter brands by menu only
      brandsFilter = merge({}, defaultFilter, {
        filter: { "applicableMenu.menuId": menu[0].value.id },
      });
    } else if (categories.length > 0) {
      // Filter brands by categories only
      brandsFilter = merge({}, defaultFilter, {
        filter: {
          "applicableCategory.categoryId": {
            $in: categories.map((cat: any) => cat.value.id),
          },
        },
      });
    } else {
      brandsFilter = merge({}, defaultFilter);
    }

    return {
      categories: categoriesFilter,
      brands: brandsFilter,
    };
  }, [activeTab, menu, categories, businessCategories, data.primeCatalog]);

  const handleMenuSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("menu", [item]);
      // Clear categories and brands when menu changes
      setValue("categories", []);
      setValue("brands", []);
    } else {
      setValue("menu", []);
      // Clear categories and brands when menu is removed
      setValue("categories", []);
      setValue("brands", []);
    }
  };

  const handleCategorySelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("categories", [item]);
    } else {
      setValue("categories", []);
    }
    setValue("brands", []);
  };

  const handleBrandSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brands", [item]);
    } else {
      setValue("brands", []);
    }
  };

  const handleCompanyNameSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("companyName", [item]);
    } else {
      setValue("companyName", []);
    }
  };

  const onSubmit = useCallback(
    (formData: FilterFormFields) => {
      callback({ data: formData, action: "apply" });
    },
    [callback],
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilterValues });
    callback({ data: defaultFilterValues, action: "apply" });
  }, [reset, callback]);

  const handleClose = () => {
    callback({ data: defaultFilterValues, action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {t("filters", { ns: "common" })}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              control={control}
              name="menu"
              render={({ field }) => (
                <MenuSearchInput
                  size="sm"
                  callback={(item, action) => {
                    handleMenuSelect(item, action);
                    field.onChange(action === "add" ? [item] : []);
                  }}
                  values={field.value}
                  feature="inventory-subscribe"
                  placeholder={t("search.filter.menu")}
                  params={menuParams}
                  label="Menu"
                />
              )}
            />

            <Controller
              control={control}
              name="categories"
              render={({ field }) => (
                <CategorySearchInput
                  size="sm"
                  multiSelect={false}
                  callback={(item, action) => {
                    handleCategorySelect(item, action);
                    if (action === "add") {
                      field.onChange([item]);
                    } else {
                      field.onChange([]);
                    }
                  }}
                  values={field.value}
                  feature="inventory-subscribe"
                  placeholder={t("search.filter.category")}
                  params={additionalParams.categories}
                  label="Category"
                />
              )}
            />

            <Controller
              control={control}
              name="brands"
              render={({ field }) => (
                <BrandSearchInput
                  size="sm"
                  multiSelect={false}
                  callback={(item, action) => {
                    handleBrandSelect(item, action);
                    if (action === "add") {
                      field.onChange([item]);
                    } else {
                      field.onChange([]);
                    }
                  }}
                  values={field.value}
                  feature="inventory-subscribe"
                  placeholder={t("search.filter.brand")}
                  params={additionalParams.brands}
                  label="Brand"
                />
              )}
            />

            <Controller
              control={control}
              name="companyName"
              render={({ field }) => (
                <CompanyNameSearchInput
                  size="sm"
                  multiSelect={false}
                  callback={(item, action) => {
                    handleCompanyNameSelect(item, action);
                    field.onChange(action === "add" ? [item] : []);
                  }}
                  values={field.value}
                  feature="inventory-subscribe"
                  placeholder={t("searchCompanyName", { ns: "common" })}
                  label="Company Name"
                />
              )}
            />

            <div className="tw:flex tw:flex-row tw:items-center tw:gap-4 tw:flex-wrap">
              {/* Consumer offer filter — hidden for now
              <Controller
                control={control}
                name="onlyOffers"
                render={({ field }) => (
                  <AppCheckbox
                    size="xs"
                    label={t("onlyOffers", { ns: "common" })}
                    value={!!field.value}
                    onChange={(checked) => field.onChange(checked)}
                  />
                )}
              />
              */}

              <Controller
                control={control}
                name="isGroupDeal"
                render={({ field }) => (
                  <AppCheckbox
                    size="xs"
                    label={t("onlyMultipleVariants", {
                      ns: "inventorySubscribe",
                      defaultValue: "Only Multiple Variants",
                    })}
                    value={!!field.value}
                    onChange={(checked) => field.onChange(checked)}
                  />
                )}
              />

              <Controller
                control={control}
                name="productsWithImages"
                render={({ field }) => (
                  <AppCheckbox
                    size="xs"
                    label="Items With Images"
                    value={!!field.value}
                    onChange={(checked) => {
                      setValue("productsWithoutImages", false);
                      field.onChange(checked);
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="productsWithoutImages"
                render={({ field }) => (
                  <AppCheckbox
                    size="xs"
                    label="Items Without Images"
                    value={!!field.value}
                    onChange={(checked) => {
                      setValue("productsWithImages", false);
                      field.onChange(checked);
                    }}
                  />
                )}
              />

              {/* only not subscribed products */}
              {/* <Controller
                control={control}
                name="onlyNotSubscribed"
                render={({ field }) => (
                  <AppCheckbox
                    size="xs"
                    label="Show Only Not Subscribed"
                    value={!!field.value}
                    onChange={(checked) => field.onChange(checked)}
                  />
                )}
              /> */}
            </div>
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            {t("reset", { ns: "common" })}
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            color="primary"
            size="small"
          >
            {t("apply", { ns: "common" })}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
