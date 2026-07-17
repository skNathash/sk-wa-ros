import debounce from "lodash/debounce";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";
import Alpha from "~/components/core/alpha/Alpha";
import { useCallback, useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import { Filter as FilterIcon } from "lucide-react";
import InventoryFilterModal from "~/shared/inventory/modals/inventory-filter/InventoryFilterModal";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import AuthService from "~/services/AuthService";
import { useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";

interface FilterProps {
  callback: (filters: { formData: any }) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const { register, getValues, setValue, control } = useFormContext();

  const [inventoryFilterModal, setInventoryFilterModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const isBuyer = AuthService.isBuyerUser() || AuthService.isSkBuyer();
  const type = searchParams.get("type") as "network" | "customer";
  const effectiveType = type || "customer";

  // Watch form values for changes
  const [search, alpha, priceMode] = useWatch({
    name: ["search", "alpha", "priceMode"],
  });

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [],
  );

  // Handle search input change
  const handleSearchChange = () => {
    // If user starts typing, clear alpha selection
    if (alpha) {
      setValue("alpha", "");
    }
    debouncedSearch();
  };

  // Handle alpha change
  const handleAlphaChange = (val: string) => {
    setValue("alpha", val || "");
    // Clear search if alpha is selected
    if (val && search) {
      setValue("search", "");
    }
    triggerCallback();
  };

  const triggerCallback = () => {
    const formValues = getValues();
    callback?.({
      formData: formValues,
    });
  };

  const openInventoryFilterModal = () => {
    const currentValues = getValues();
    setInventoryFilterModal({
      show: true,
      data: {
        menu: currentValues.menu || [],
        brand: currentValues.brand || [],
        category: currentValues.category || [],
        status: currentValues.status || "",
        velocity: currentValues.velocity || "All",
        companyName: currentValues.companyName || [],
        stockStatus: currentValues.stockStatus || "All",
        onlyOffers: currentValues.onlyOffers || false,
        withoutStock: currentValues.withoutStock || false,
        isFixedPrice: currentValues.isFixedPrice || false,
        isPriceSlab: currentValues.isPriceSlab || false,
      },
    });
  };

  const handleInventoryFilterModalCallback = (payload: {
    data?: any;
    action: string;
  }) => {
    setInventoryFilterModal({ show: false, data: null });
    if (payload.action === "apply" && payload.data) {
      // Update form values using setValue
      if (payload.data.menu !== undefined) {
        setValue("menu", payload.data.menu);
      }
      if (payload.data.brand !== undefined) {
        setValue("brand", payload.data.brand);
      }
      if (payload.data.category !== undefined) {
        setValue("category", payload.data.category);
      }
      if (payload.data.status !== undefined) {
        setValue("status", payload.data.status);
      }
      if (payload.data.velocity !== undefined) {
        setValue("velocity", payload.data.velocity);
      }
      if (payload.data.stockStatus !== undefined) {
        setValue("stockStatus", payload.data.stockStatus);
      }
      if (payload.data.onlyOffers !== undefined) {
        setValue("onlyOffers", payload.data.onlyOffers);
      }
      if (payload.data.withoutStock !== undefined) {
        setValue("withoutStock", payload.data.withoutStock);
      }
      if (payload.data.isFixedPrice !== undefined) {
        setValue("isFixedPrice", payload.data.isFixedPrice);
      }
      if (payload.data.companyName !== undefined) {
        setValue("companyName", payload.data.companyName);
      }

      if (payload.data.isPriceSlab !== undefined) {
        setValue("isPriceSlab", payload.data.isPriceSlab);
      }
      triggerCallback();
    }
  };

  // If the effective type changes, ensure priceMode non-fixed option toggles correctly
  // e.g., on_mrp <-> on_purchase
  // Note: keep 'fixed' as-is
  const togglePriceModeForType = () => {
    const pm = priceMode;
    // We removed the non-fixed price mode options (on_purchase/on_mrp).
    // If a previous non-fixed value exists, reset to 'all' to keep UI consistent.
    if (!pm || pm === "fixed" || pm === "all") return;
    setValue("priceMode", "all");
    triggerCallback();
  };

  // Sync when effectiveType changes
  useEffect(() => {
    togglePriceModeForType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveType]);

  // Handle type change (B2B/B2C)
  const handleTypeChange = (value: string) => {
    setValue("type", value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", value);
    appNav.replace(`/configs/rsp?${newParams.toString()}`);
  };

  return (
    <>
      <div className="tw:flex tw:gap-2 tw:mb-2 tw:md:mb-4 tw:items-end">
        <AppInput
          name="search"
          placeholder={t("searchByDealNameOrId")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          className="tw:w-full"
        />
        <AppButton
          fill="outline"
          color="light"
          size="small"
          onClick={openInventoryFilterModal}
          className="tw:flex-shrink-0"
        >
          <FilterIcon size={16} />
        </AppButton>
      </div>

      <div className="tw:mb-4">
        <Alpha selected={alpha || ""} callback={handleAlphaChange} />
      </div>

      <InventoryFilterModal
        show={inventoryFilterModal.show}
        data={inventoryFilterModal.data}
        callback={handleInventoryFilterModalCallback}
        feature="price-config"
        hidePriceSlab={type !== "network"}
      />
    </>
  );
};

export default Filter;
