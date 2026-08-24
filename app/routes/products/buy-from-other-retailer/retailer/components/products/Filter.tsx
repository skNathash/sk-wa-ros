import { debounce } from "lodash";
import { FilterIcon, SearchIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import FilterModal from "./modals/FilterModal";

type Props = {
  retailerId: string;
  callback: (a: { action: string; data?: any }) => void;
};

const Filter = ({ retailerId, callback }: Props) => {
  const { register, getValues } = useFormContext();
  const [searchParams] = useSearchParams();
  const hideFilter = !!searchParams.get("scrollToProduct");

  const [filterModal, setFilterModal] = useState({
    show: false,
    data: {},
  });

  const triggerCallback = useCallback(
    (formData: any) => {
      callback({ action: "apply", data: formData });
    },
    [callback]
  );

  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback(getValues());
    }, 500),
    [triggerCallback, getValues]
  );

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const openFilterModal = () => {
    setFilterModal({ show: true, data: getValues() });
  };

  const handleFilterModalCallback = (a: any) => {
    const action = a.action;
    const formData = a.formData;

    setFilterModal({ show: false, data: {} });

    if (action === "apply" || action === "reset") {
      triggerCallback({
        ...getValues(),
        ...formData,
      });
    }
  };

  return (
    <>
      <div className="app-full-bleed search-sticky vendor-search-sticky tw:sticky tw:top-29 tw:lg:top-15 tw:z-10 tw:max-md:bg-white tw:flex tw:items-center tw:gap-2 tw:px-4 tw:pt-2 tw:pb-3 tw:mb-2">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          onChange={handleSearchChange}
          className="tw:flex-1"
          leftIcon={<SearchIcon size={16} />}
          size="sm"
        />
        {!hideFilter && (
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={openFilterModal}
          >
            <FilterIcon size={16} />
          </AppButton>
        )}
      </div>

      <FilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        data={filterModal.data}
        retailerId={retailerId || ""}
      />
    </>
  );
};

export default Filter;
