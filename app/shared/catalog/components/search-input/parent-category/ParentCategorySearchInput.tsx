import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import { AppSelect } from "~/components/core/form";
import { getData } from "./helper";

interface ParentCategorySearchInputProps {
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
  renderType?: "search" | "app-select";
  includeSelectAllOption?: boolean;
}

const prepareAppSelectData = (data: any[]) => {
  return data.map((item) => ({
    value: item.value.id,
    label: item.label,
    actualData: item,
  }));
};

const ParentCategorySearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  feature,
  label,
  placeholder,
  className,
  disabled,
  vendorId,
  params,
  isRequired,
  renderType = "search",
  includeSelectAllOption = false,
}: ParentCategorySearchInputProps) => {
  const [data, setData] = useState<any[]>([]);

  const pageRef = useRef(1);

  useEffect(() => {
    getData("", 1, feature, { vendorId, params }).then((res: any[]) => {
      if (renderType === "app-select") {
        const d = prepareAppSelectData(res);
        if (includeSelectAllOption) {
          d.unshift({
            value: "all",
            label: "All",
            actualData: {
              label: "All",
              value: {
                id: "all",
                name: "All",
              },
            },
          });
        }
        setData(d);
      } else {
        setData(res);
      }
    });
  }, [feature, vendorId, params, renderType, includeSelectAllOption]);

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
    [feature, vendorId, params]
  );

  const handleSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      callback?.(item, action);
    },
    [callback]
  );

  const handleAppSelectChange = useCallback(
    (value: string) => {
      const item = data.find(
        (item) => item.value?.toString() === value
      )?.actualData;
      callback?.(item, "add");
    },
    [callback]
  );

  return (
    <>
      {renderType === "app-select" ? (
        <AppSelect
          options={data}
          value={values?.[0]?.value?.id?.toString() || ""}
          onChange={handleAppSelectChange}
          isRequired={isRequired}
          className="tw:w-full"
          inputClassName="tw:w-full"
          label={label}
          placeholder={placeholder}
          size={size}
        />
      ) : (
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
        />
      )}
    </>
  );
};

export default ParentCategorySearchInput;
