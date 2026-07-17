import React, { useEffect } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Controller, useForm } from "react-hook-form";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import { AppSelect } from "~/components/core/form";
import { useTranslation } from "react-i18next";

type FilterModalProps = {
  show: boolean;
  callback: (r?: { action: string; data?: any }) => void;
  data?: any;
};

const createdByOptions = [
  { value: "All", label: "All Vendors" },
  { value: "me", label: "Created By Me" },
  { value: "Otp Verified", label: "Verified" },
  { value: "OTP not verified", label: "Not Verified" },
];

const kmOptions = [
  { value: "any", label: "Any distance" },
  { value: "1", label: "1 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
];

const FilterModal: React.FC<FilterModalProps> = ({ show, callback, data }) => {
  const { t } = useTranslation(["common"]);

  const { control, setValue, handleSubmit, getValues } = useForm<any>({
    defaultValues: { brand: [], createdBy: "All", distance: "any" },
  });

  useEffect(() => {
    if (show && typeof data !== "undefined") {
      setValue("brand", data.brand);
      setValue("createdBy", data.createdBy);
      setValue("distance", data.distance);
    }
  }, [show, data, setValue]);

  const handleBrandCallback = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brand", [item]);
    } else {
      setValue("brand", []);
    }
  };

  const onApply = () => {
    callback({ action: "apply", data: getValues() });
  };

  const onClose = () => {
    callback({ action: "close" });
  };

  const onReset = () => {
    setValue("brand", []);
    setValue("createdBy", "All");
    setValue("distance", "any");
    callback({ action: "apply", data: getValues() });
  };

  return (
    <AppModal show={show} callback={onClose}>
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold">Filters</div>
      </AppModal.Title>

      <AppModal.Content>
        <form onSubmit={handleSubmit(onApply)}>
          <div className="tw:flex tw:flex-col tw:gap-3">
            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <BrandSearchInput
                  size="sm"
                  multiSelect={false}
                  values={field.value}
                  callback={handleBrandCallback}
                  placeholder="Select Brand"
                  className="tw:w-full"
                  label={t("brand")}
                />
              )}
            />
            <div className="tw:grid tw:grid-cols-2 tw:gap-2">
              <Controller
                control={control}
                name="createdBy"
                render={({ field }) => (
                  <AppSelect
                    onChange={(v: string) => field.onChange(v)}
                    size="sm"
                    options={createdByOptions}
                    inputClassName="tw:w-full"
                    value={field.value}
                    placeholder="All Vendors"
                  />
                )}
              />

              <Controller
                control={control}
                name="distance"
                render={({ field }) => (
                  <AppSelect
                    onChange={(v: any) => field.onChange(v)}
                    size="sm"
                    options={kmOptions}
                    inputClassName="tw:w-full"
                    value={field.value ?? "any"}
                    placeholder="Distance (km)"
                  />
                )}
              />
            </div>
          </div>
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton fill="outline" color="dark" onClick={onReset}>
            Reset
          </AppButton>

          <AppButton onClick={onApply}>Apply</AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
