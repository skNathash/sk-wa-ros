import { merge } from "lodash";
import { ScanLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CommonService from "~/services/CommonService";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import CompanyNameSearchInput from "~/components/feature/search-input/company/CompanyNameSearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import StockMovementType from "./components/StockMovementType";
import StockStatus from "./components/StockStatus";
import type { FormData, Props } from "./helper";
import {
  DEFAULT_VALUES,
  statusOptions,
  reserveOptions,
  dealScopeOptions,
} from "./helper";

const InventoryFilterModal = ({
  show,
  data,
  callback,
  feature = "inventory",
  hideStatus = false,
  hidePriceSlab = false,
  hideMenu = false,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const { reset, control, setValue, getValues } = useForm<FormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const [sellInOptions, setSellInOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: "All", label: "All" }]);

  useEffect(() => {
    const fetchPackTypes = async () => {
      try {
        const resp = await CommonService.getUomMasters({
          filter: { isPackType: true },
        });
        const list = resp?.data?.data || [];
        setSellInOptions([
          { value: "All", label: "All" },
          ...list.map((item: any) => ({ value: item.name, label: item.name })),
        ]);
      } catch (e) {
        console.error("Error fetching pack type options:", e);
      }
    };
    fetchPackTypes();
  }, []);

  const [menu, category, brand, velocity, companyName, stockStatus] = useWatch({
    control,
    name: [
      "menu",
      "category",
      "brand",
      "velocity",
      "companyName",
      "stockStatus",
    ],
  });

  // Categories filter - filter by selected menu if any
  const categoryParams = useMemo(() => {
    if (menu.length > 0) {
      return {
        filter: { "applicableMenu.menuId": menu[0].value.id },
      };
    }
    return {};
  }, [menu]);

  // Brands filter - filter by selected menu and category if any
  const brandParams = useMemo(() => {
    let brandsFilter = {};

    if (menu.length > 0 && category.length > 0) {
      // Filter brands by both menu and category
      brandsFilter = merge(
        {},
        {
          filter: {
            "applicableMenu.menuId": menu[0].value.id,
            "applicableCategory.categoryId": category[0].value.id,
          },
        },
      );
    } else if (menu.length > 0) {
      // Filter brands by menu only
      brandsFilter = merge(
        {},
        {
          filter: { "applicableMenu.menuId": menu[0].value.id },
        },
      );
    } else if (category.length > 0) {
      // Filter brands by category only
      brandsFilter = merge(
        {},
        {
          filter: { "applicableCategory.categoryId": category[0].value.id },
        },
      );
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

  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") setValue("brand", [item]);
    else setValue("brand", []);
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

  useEffect(() => {
    if (show && data) {
      // Set values from data prop when modal opens
      if (data.menu !== undefined) setValue("menu", data.menu || []);
      if (data.brand !== undefined) setValue("brand", data.brand || []);
      if (data.category !== undefined)
        setValue("category", data.category || []);
      if (data.status !== undefined) setValue("status", data.status || "All");
      if (data.velocity !== undefined)
        setValue("velocity", data.velocity || "All");
      if (data.stockStatus !== undefined)
        setValue("stockStatus", data.stockStatus || "All");
      if (data.onlyOffers !== undefined)
        setValue("onlyOffers", data.onlyOffers || false);
      if (data.withoutStock !== undefined)
        setValue("withoutStock", data.withoutStock || false);
      if (data.isFixedPrice !== undefined)
        setValue("isFixedPrice", data.isFixedPrice || false);
      if (data.isGroupDeal !== undefined)
        setValue("isGroupDeal", data.isGroupDeal || false);
      if (data.isPriceSlab !== undefined)
        setValue("isPriceSlab", data.isPriceSlab || false);
      if (data.companyName !== undefined)
        setValue("companyName", data.companyName || []);
      if (data.sellIn !== undefined) setValue("sellIn", data.sellIn || "All");
      if (data.reserve !== undefined)
        setValue("reserve", data.reserve || "All");
      if (data.isPromotionalDeal !== undefined)
        setValue("isPromotionalDeal", data.isPromotionalDeal || false);
      if (data.dealScope !== undefined)
        setValue("dealScope", data.dealScope || "All");
    }
  }, [show, data, setValue]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      callback({ action: "scan", data: r.data });
    }
  };

  const handleApply = () => {
    const data = getValues();
    callback({ action: "apply", data });
  };

  const handleReset = () => {
    reset(DEFAULT_VALUES);
    const data = getValues();
    callback({ action: "apply", data });
  };

  return (
    <AppModal show={show} callback={onClose} className="tw:md:max-w-2xl!">
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold tw:text-lg">{t("filters")}</div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-4">
          {!hideMenu && (
            <div>
              <MenuSearchInput
                callback={handleMenuChange}
                values={menu}
                feature="pos"
                label="Menu"
                size="sm"
              />
            </div>
          )}

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <div>
              <CategorySearchInput
                placeholder={t("searchCategories")}
                multiSelect={false}
                callback={handleCategoryChange}
                values={category}
                size="sm"
                feature="pos"
                label="Category"
                params={categoryParams}
              />
            </div>

            <div>
              <BrandSearchInput
                placeholder={t("searchBrands")}
                multiSelect={false}
                callback={handleBrandChange}
                values={brand}
                size="sm"
                feature="pos"
                label="Brand"
                params={brandParams}
              />
            </div>
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            {!hideStatus && (
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    options={statusOptions}
                    label={t("status")}
                    placeholder={t("status")}
                    onChange={field.onChange}
                    value={field.value}
                    inputClassName="tw:w-full"
                    className=""
                    size="sm"
                  />
                )}
              />
            )}

            <CompanyNameSearchInput
              values={companyName}
              multiSelect={false}
              size="sm"
              feature="seller"
              label="Company Name"
              placeholder={t("searchCompanyName")}
              callback={(item: any, action: "add" | "remove") => {
                if (action === "add") setValue("companyName", [item]);
                else setValue("companyName", []);
              }}
            />
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <Controller
              name="sellIn"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={sellInOptions}
                  label="Pack Type"
                  placeholder="Pack Type"
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                  size="sm"
                />
              )}
            />

            <Controller
              name="dealScope"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={dealScopeOptions}
                  label={t("dealScope")}
                  placeholder={t("dealScope")}
                  onChange={field.onChange}
                  value={field.value || "All"}
                  inputClassName="tw:w-full"
                  size="sm"
                />
              )}
            />
          </div>

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <div className="tw:col-span-2">
              <StockMovementType
                velocity={velocity}
                onChange={(value) => setValue("velocity", value)}
              />
            </div>

            <div className="tw:col-span-2">
              <StockStatus
                stockStatus={stockStatus}
                onChange={(value) => setValue("stockStatus", value)}
              />
            </div>

            <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap tw:md:col-span-2">
              {/* <Controller
                name="withoutStock"
                control={control}
                render={({ field }) => (
                  <AppCheckbox
                    name="withoutStock"
                    label={t("withoutStock")}
                    value={!!field.value}
                    onChange={(v: boolean) => field.onChange(v)}
                    size="xs"
                  />
                )}
              /> */}

              <Controller
                name="onlyOffers"
                control={control}
                render={({ field }) => (
                  <AppCheckbox
                    name="onlyOffers"
                    label={t("onlyOffers")}
                    value={!!field.value}
                    onChange={(v: boolean) => field.onChange(v)}
                    size="xs"
                  />
                )}
              />

              {/* <Controller
                name="isPromotionalDeal"
                control={control}
                render={({ field }) => (
                  <AppCheckbox
                    name="isPromotionalDeal"
                    label="Only Promotional Deals"
                    value={!!field.value}
                    onChange={(v: boolean) => field.onChange(v)}
                    size="xs"
                  />
                )}
              /> */}

              {feature === "price-config" && (
                <Controller
                  name="isFixedPrice"
                  control={control}
                  render={({ field }) => (
                    <AppCheckbox
                      name="isFixedPrice"
                      label={t("fixedPriceOnly")}
                      value={!!field.value}
                      onChange={(v: boolean) => field.onChange(v)}
                      size="xs"
                    />
                  )}
                />
              )}

              {/* {!hidePriceSlab && (
                <Controller
                  name="isPriceSlab"
                  control={control}
                  render={({ field }) => (
                    <AppCheckbox
                      name="isPriceSlab"
                      label={t("priceSlabOnly")}
                      value={!!field.value}
                      onChange={(v: boolean) => field.onChange(v)}
                      size="xs"
                    />
                  )}
                />
              )} */}

              {/* <Controller
                name="isGroupDeal"
                control={control}
                render={({ field }) => (
                  <AppCheckbox
                    name="isGroupDeal"
                    label={t("onlyMultipleVariants")}
                    value={!!field.value}
                    onChange={(v: boolean) => field.onChange(v)}
                    size="xs"
                  />
                )}
              /> */}
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
          <div>
            <BarcodeScan
              callback={handleBarcodeScan}
              className="tw:px-2 tw:py-1 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded tw:text-sm tw:text-blue-700 tw:hover:bg-blue-100"
            >
              <ScanLine className="tw:w-3 tw:h-3 tw:mr-1" />
              Scan
            </BarcodeScan>
          </div>
          <div className="tw:flex tw:gap-2">
            <AppButton color="light" fill="outline" onClick={handleReset}>
              {t("reset")}
            </AppButton>
            <AppButton onClick={handleApply}>{t("apply")}</AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default InventoryFilterModal;
