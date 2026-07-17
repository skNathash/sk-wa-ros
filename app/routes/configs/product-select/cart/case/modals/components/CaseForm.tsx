import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AppCheckbox, AppInput, AppSelect } from "~/components/core/form";
import AllowUnitDescPopover from "../../components/AllowUnitDescPopover";
import SellerCatalogService from "~/services/SellerCatalogService";

const packageTypes = SellerCatalogService.getSellingTypes().map((st: any) => ({
  label: st.label,
  value: st.apiValue,
}));
packageTypes.unshift({ label: "Choose", value: "Choose" });

const CaseForm = ({}: {}) => {
  const { register, control, setValue } = useFormContext();
  const packageType = useWatch({ control, name: "packageType" });

  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:mb-4">
      <div>
        <Controller
          control={control}
          name="packageType"
          render={({ field }) => (
            <AppSelect
              label="Sell In"
              size="sm"
              options={packageTypes}
              value={field.value}
              onChange={(val) => {
                field.onChange(val);
                if (val === "Unit") {
                  setValue("packageQty", 1);
                  setValue("allowPackageOverride", false);
                }
              }}
              inputClassName="tw:w-full"
              isRequired={true}
            />
          )}
        />
      </div>

      {packageType !== "Choose" && packageType !== "Unit" && (
        <>
          <div>
            <AppInput
              name="packageQty"
              register={register}
              type="number"
              size="sm"
              placeholder="Enter Package Qty"
              isRequired={true}
              className="tw:mb-2"
              label="Package Qty"
              onChange={(e) => {
                const value = e.target.value;
                if (Number(value) < 0) {
                  setValue("packageQty", null);
                }
              }}
            />
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Controller
              control={control}
              name="allowPackageOverride"
              render={({ field }) => (
                <AppCheckbox
                  label={
                    <span className="tw:text-xs tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                      Override to units
                      <AllowUnitDescPopover />
                    </span>
                  }
                  value={field.value || false}
                  onChange={field.onChange}
                  size="sm"
                />
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CaseForm;
