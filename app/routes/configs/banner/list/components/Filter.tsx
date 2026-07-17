import debounce from "lodash/debounce";
import { Controller, useFormContext } from "react-hook-form";
import { useCallback, useState } from "react";
import { FilterIcon, Search } from "lucide-react";
import { AppInput, AppSelect } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import FilterModal from "../modals/FilterModal";

const isActiveOptions = [
  { value: "all", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const typeOptions = [
  { value: "All", label: "All" },
  { value: "B2C", label: "B2C" },
  { value: "B2B", label: "B2B" },
];

type Props = {
  callback: (payload: { formData: any }) => void;
  filterCallback: (payload: { action: string; data: any }) => void;
};

const Filter = ({ callback, filterCallback }: Props) => {
  const { register, getValues, setValue, control } = useFormContext();

  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    data: Record<string, any>;
  }>({ show: false, data: {} });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  const handleIsActiveChange = useCallback(
    (value: string) => {
      setValue("isActive", value);
      triggerCallback();
    },
    [setValue, triggerCallback],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setValue("type", value);
      triggerCallback();
    },
    [setValue, triggerCallback],
  );

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const handleFilterModalCallback = useCallback(
    ({ action, data }: { action: string; data: any }) => {
      setFilterModal({ show: false, data: {} });

      if (action === "apply" || action === "reset") {
        setTimeout(() => {
          setValue("validityDateRange", data.validityDateRange);
          setValue("createdDateRange", data.createdDateRange);
          setValue("status", data.status);
          filterCallback({ action, data });
        }, 300);
      }
    },
    [setValue, filterCallback],
  );

  const renderFilterBtn = (className: string) => (
    <AppButton
      fill="outline"
      color="light"
      size="small"
      onClick={openFilterModal}
      className={className}
    >
      <FilterIcon size={16} />
    </AppButton>
  );

  return (
    <>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:mb-4">
        <div className="tw:flex tw:gap-2 tw:flex-1">
          <div className="tw:flex-1">
            <AppInput
              name="search"
              register={register}
              onChange={handleSearchChange}
              size="sm"
              placeholder="Search by title or placeholder"
              className="tw:bg-white"
              leftIcon={<Search size={16} className="tw:text-gray-400" />}
            />
          </div>
          {renderFilterBtn("tw:md:hidden")}
        </div>
        <div className="tw:grid tw:grid-cols-2 tw:md:flex tw:gap-2">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <AppSelect
                options={isActiveOptions}
                value={field.value || "all"}
                onChange={handleIsActiveChange}
                placeholder="All"
                size="sm"
                inputClassName="tw:w-full"
              />
            )}
          />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                options={typeOptions}
                value={field.value || "All"}
                onChange={handleTypeChange}
                placeholder="Platform Type"
                size="sm"
                inputClassName="tw:w-full"
              />
            )}
          />
        </div>
        {renderFilterBtn("tw:hidden tw:md:block")}
      </div>

      <FilterModal
        show={filterModal.show}
        initialData={filterModal.data}
        callback={handleFilterModalCallback}
      />
    </>
  );
};

export default Filter;
