import { debounce } from "lodash";
import { Funnel, Search } from "lucide-react";
import { useCallback, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import FilterModal from "../modals/FilterModal";

const dateConfig: DayPickerProps = {
  mode: "range",
};

const Filter = ({ callback }: { callback: (data: any) => void }) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, control, setValue } = useFormContext();

  const [filterModal, setFilterModal] = useState({
    show: false,
    data: { status: "All", purchasedFrom: "All" },
  });

  const statusOptions = PurchaseOrderService.getStatuses()
    .map((x) => ({
      value: x.value,
      label: x.label,
      langKey: x.langKey,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  statusOptions.unshift({
    value: "All",
    label: "All Statuses",
    langKey: "allStatuses",
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  const handleDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const openFilterModal = () => {
    setFilterModal({
      show: true,
      data: {
        status: getValues("status") || "All",
        purchasedFrom: getValues("purchasedFrom") || "All",
      },
    });
  };

  const handleFilterModalCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    if (payload.action === "apply") {
      setValue("status", payload.data.status);
      setValue("purchasedFrom", payload.data.purchasedFrom);
      triggerCallback();
    }
    setFilterModal({ show: false, data: filterModal.data });
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
      <AppInput
        name="search"
        placeholder="Search by PO ID, Vendor"
        register={register}
        onChange={handleSearchChange}
        size="sm"
        leftIcon={<Search size={16} className="tw:text-gray-500" />}
      />

      <div className="tw:flex tw:gap-2">
        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              value={field.value}
              placeholder="Filter by Date Range"
              size="sm"
              callback={handleDateChange(field.onChange)}
              hideClose={true}
              dateConfig={dateConfig}
              className="tw:flex-1"
            />
          )}
        />

        <AppButton
          fill="outline"
          color="light"
          size="small"
          onClick={openFilterModal}
        >
          <Funnel size={16} />
        </AppButton>
      </div>

      <FilterModal
        show={filterModal.show}
        data={filterModal.data}
        callback={handleFilterModalCallback}
      />
    </div>
  );
};

export default Filter;
