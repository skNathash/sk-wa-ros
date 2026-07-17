import { debounce } from "lodash";
import { FilterIcon, SearchIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import { FilterModal } from "../../modals/FilterModal";

type FilterProps = {
  callback: (payload: { action: string; data?: any }) => void;
  rightSlot?: React.ReactNode;
  distance?: string;
};

const Filter: React.FC<FilterProps> = ({ callback, rightSlot, distance }) => {
  const { register, getValues } = useFormContext();
  const [filterModal, setFilterModal] = useState({
    show: false,
    data: {},
  });

  const openFilterModal = () => {
    setFilterModal({ show: true, data: getValues() });
  };

  const handleFilterModalCallback = async (payload: {
    action: string;
    data?: any;
  }) => {
    setFilterModal({ show: false, data: {} });
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (payload.action === "apply") {
      callback({ action: "filter", data: payload.data });
    }
  };

  const debouncedSearch = useCallback(
    debounce(() => {
      callback({ action: "search", data: getValues("search") || "" });
    }, 500),
    [callback, getValues],
  );

  const handleSearchChange = () => {
    debouncedSearch();
  };

  return (
    <>
      <div className="tw:mb-3 tw:flex tw:flex-col tw:gap-2 tw:lg:flex-row tw:lg:items-center">
        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-1">
          <AppInput
            name="search"
            placeholder="Search products..."
            register={register}
            inputClassName="tw:w-full"
            onChange={handleSearchChange}
            leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
            className="tw:flex-1"
          />
          <AppButton
            color="light"
            size="small"
            fill="outline"
            onClick={openFilterModal}
            className="tw:lg:hidden"
          >
            <FilterIcon size={16} />
          </AppButton>
        </div>
        {rightSlot}
      </div>
      <FilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        initialValues={filterModal.data}
        distance={distance}
      />
    </>
  );
};

export default Filter;
