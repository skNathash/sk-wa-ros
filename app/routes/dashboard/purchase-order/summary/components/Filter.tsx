import { Controller, useForm, useFormContext } from "react-hook-form";
import AppDateInput from "~/components/core/form/AppDateInput";
import type { DayPickerProps } from "react-day-picker";
import AppButton from "~/components/core/button/AppButton";
import { FilterIcon, Search } from "lucide-react";
import { AppInput } from "~/components/core/form";
import { useCallback, useState } from "react";
import VendorsModal from "../modals/vendors/VendorsModal";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { sub } from "date-fns";
import MiscService from "~/services/MiscService";

type Props = {
  callback: (data?: any) => void;
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation();

  const { control, register, getValues, setValue } = useFormContext();

  const [vendorsModal, setVendorsModal] = useState<{
    show: boolean;
    data: any[];
  }>({
    show: false,
    data: [],
  });

  const onDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  const handleVendorsModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "select" && a.data) {
      if (a.data?._id) {
        setValue("vendorInfo", {
          name: a.data.name,
          vendorId: a.data.vendorId,
          _id: a.data._id,
        });
      } else {
        setValue("vendorInfo", {});
      }
      triggerCallback();
    }

    setVendorsModal({ show: false, data: [] });
  };

  return (
    <>
      <div className="tw:mb-4 tw:md:grid tw:md:grid-cols-2 tw:md:gap-2">
        <AppInput
          name="search"
          placeholder={t("searchByPOId")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          className="tw:w-full tw:flex-1 tw:mb-4 tw:md:mb-0"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />

        <div className="tw:flex tw:gap-2">
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                callback={onDateChange(field.onChange)}
                value={field.value}
                size="sm"
                dateConfig={dateConfig}
                placeholder={t("filterByDateRange")}
                className="tw:flex-1 tw:md:flex-none"
                hideClose={true}
              />
            )}
          />

          <div>
            <AppButton
              fill="outline"
              color="light"
              size="small"
              onClick={() => setVendorsModal({ show: true, data: [] })}
            >
              <FilterIcon className="tw:w-4 tw:h-4" />
              <span className="tw:hidden tw:md:inline">
                {t("filterByVendor")}
              </span>
            </AppButton>
          </div>
        </div>
      </div>

      <VendorsModal
        show={vendorsModal.show}
        callback={handleVendorsModalCallback}
      />
    </>
  );
};

export default Filter;
