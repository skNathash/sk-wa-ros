import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { AppInput } from "~/components/core/form";
import { FilterIcon, SearchIcon } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import {
  defaultFilter,
  prepareFilterQueryParams,
  type FilterFormData,
} from "../helper";
import FilterModal from "../modals/FilterModal";

const Filter = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, getValues, setValue } = useFormContext();

  const [filterModal, setFilterModal] = useState({
    show: false,
    data: {},
  });

  const handleFilterChange = useCallback(() => {
    const formData = getValues();
    const params = prepareFilterQueryParams(formData as FilterFormData);

    // Preserve existing URL parameters that should not be removed
    const tab = searchParams.get("tab");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (tab) {
      params.tab = tab;
    }
    if (dateFrom) {
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      params.dateTo = dateTo;
    }

    setSearchParams(params);
  }, [getValues, searchParams, setSearchParams]);

  const debounceSearch = useCallback(
    debounce(() => {
      handleFilterChange();
    }, 500),
    [handleFilterChange]
  );

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const handleFilterModalCallback = useCallback(
    (data: any) => {
      if (data.action === "apply" || data.action === "reset") {
        setValue("dateRange", data.data.dateRange);
        setValue("payoutType", data.data.payoutType);
        handleFilterChange();
      }
      setFilterModal({ show: false, data: defaultFilter });
    },
    [setValue, handleFilterChange]
  );

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            register={register}
            onChange={debounceSearch}
            placeholder={t("searchByReferenceId")}
            className="tw:bg-white"
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
      />
    </>
  );
};

export default Filter;
