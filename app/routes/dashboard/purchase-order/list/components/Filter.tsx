import debounce from "lodash/debounce";
import { FilterIcon, SearchIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import FilterModal, { defaultFilterValues } from "../modals/FilterModal";

interface FilterProps {
  onFilterChange: (value: any) => void;
  feature: string;
  className?: string;
  activeTab?: string;
}

const Filter = ({
  onFilterChange,
  feature,
  className,
  activeTab,
}: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue } = useForm({
    defaultValues: {
      ...defaultFilterValues,
      search: "",
    },
  });

  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    data: Record<string, any>;
  }>({ show: false, data: {} });

  // Status is driven by the tab on the receive-orders tab, and both status and
  // source only apply to the purchase feature.
  const hideStatus = feature !== "purchase" || activeTab === "receive-orders";
  const hideSource = feature !== "purchase";

  const triggerCallback = () => {
    onFilterChange({ ...getValues() });
  };

  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    []
  );

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const handleFilterModalCallback = useCallback(
    ({ action, data }: { action: string; data: any }) => {
      setFilterModal({ show: false, data: {} });

      if (action === "apply") {
        setValue("dateRange", data.dateRange || defaultFilterValues.dateRange);
        setValue(
          "status",
          hideStatus ? defaultFilterValues.status : data.status
        );
        setValue(
          "source",
          hideSource ? defaultFilterValues.source : data.source
        );
        triggerCallback();
      }
    },
    [setValue, hideStatus, hideSource]
  );

  return (
    <>
      <div
        className={`tw:flex tw:items-center tw:gap-2 ${className ? className : ""}`}
      >
        <div className="tw:flex-1">
          <AppInput
            name="search"
            placeholder={t("searchByPOIdVendorName")}
            register={register}
            onChange={debouncedSearch}
            size="sm"
            leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
            inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
          />
        </div>

        <div>
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={openFilterModal}
          >
            <FilterIcon size={16} />
          </AppButton>
        </div>
      </div>

      <FilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        data={filterModal.data}
        hideStatus={hideStatus}
        hideSource={hideSource}
      />
    </>
  );
};

export default Filter;
