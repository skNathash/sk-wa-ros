import { debounce } from "lodash";
import { FilterIcon, SearchIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import FilterModal from "../modals/FilterModal";

export interface CouponFilterFields {
  search: string;
  applicableFor: string;
  discountKind: string;
  status: string;
  isActive: string;
  validityRange: Date[];
}

interface FilterProps {
  callback: (a: { action: string; formData: CouponFilterFields }) => void;
  isLoading: boolean;
}

const Filter: React.FC<FilterProps> = ({ callback }) => {
  const { setValue, getValues, register } =
    useFormContext<CouponFilterFields>();

  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    data: Partial<CouponFilterFields>;
  }>({ show: false, data: {} });

  const debouncedSearchRef = useRef<any>(null);

  const debouncedSearch = useCallback(
    debounce(() => {
      callback({ action: "search", formData: getValues() });
    }, 800),
    [callback, getValues],
  );

  useEffect(() => {
    debouncedSearchRef.current = debouncedSearch;
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("search", e.target.value);
    debouncedSearch();
  };

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const handleFilterModalCallback = useCallback(
    (result: { action: string; data: CouponFilterFields }) => {
      setFilterModal({ show: false, data: {} });
      if (result.action === "apply") {
        setValue("applicableFor", result.data.applicableFor);
        setValue("discountKind", result.data.discountKind);
        setValue("status", result.data.status);
        setValue("isActive", result.data.isActive);
        setValue("validityRange", result.data.validityRange || []);
        callback({ action: "filter", formData: getValues() });
      }
    },
    [callback, getValues, setValue],
  );

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            placeholder="Search by title or coupon code..."
            register={register}
            onChange={handleSearchChange}
            size="sm"
            className="tw:w-full tw:bg-white"
            leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
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
