import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import { getData } from "./helper";

interface DealSearchInputProps {
  size?: "sm" | "lg";
  multiSelect?: boolean;
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  feature?: "pos" | "product" | "vendor" | "inventory-subscribe";
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  vendorId?: string;
  params?: Record<string, any>;
  isRequired?: boolean;
}

const DealSearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  feature = "pos",
  label,
  placeholder,
  className,
  disabled,
  vendorId,
  params,
  isRequired,
}: DealSearchInputProps) => {
  const [data, setData] = useState<any[]>([]);

  const pageRef = useRef(1);

  const isInitialLoad = useRef(false);

  useEffect(() => {
    if (data?.length === 0 && !isInitialLoad.current) {
      isInitialLoad.current = true;
      getData("", 1, feature, { vendorId, params }).then((res: any[]) => {
        setData(res);
      });
    }
  }, [data, feature, vendorId, params]);

  // Refetch data when params change (for filtering)
  useEffect(() => {
    if (isInitialLoad.current) {
      getData("", 1, feature, { vendorId, params }).then((res: any[]) => {
        setData(res);
      });
    }
  }, [params, feature, vendorId]);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }
      const response = await getData(query, pageRef.current, feature, {
        vendorId,
        params,
      });
      return response;
    },
    [feature, vendorId, params],
  );

  const handleSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      callback?.(item, action);
    },
    [callback],
  );

  return (
    <>
      <AutoComplete
        searchCallback={searchCallback}
        initialData={data}
        onSelect={handleSelect}
        size={size}
        label={label}
        placeholder={placeholder}
        multiSelect={multiSelect}
        values={values}
        disabled={disabled}
        className={className}
        isRequired={isRequired}
        itemTemplate={(item) => (
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-sm tw:font-medium tw:text-gray-900">
              {item.label}
            </span>
            <span className="tw:text-xs tw:text-gray-500">
              {item.value?.dealId}
            </span>
          </div>
        )}
      />
    </>
  );
};

export default DealSearchInput;
