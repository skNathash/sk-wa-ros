import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import { getData } from "./franchise-search-helper";

interface FranchiseSearchInputProps {
  size?: "sm" | "lg";
  multiSelect?: boolean;
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isRequired?: boolean;
}

const FranchiseSearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  label,
  placeholder,
  className,
  disabled,
  isRequired,
}: FranchiseSearchInputProps) => {
  const [data, setData] = useState<any[]>([]);
  const pageRef = useRef(1);
  const isInitialLoad = useRef(false);

  useEffect(() => {
    if (data?.length === 0 && !isInitialLoad.current) {
      isInitialLoad.current = true;
      getData("", 1).then((res: any[]) => {
        setData(res);
      });
    }
  }, [data]);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }
      return getData(query, pageRef.current);
    },
    []
  );

  const handleSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      callback?.(item, action);
    },
    [callback]
  );

  const itemTemplate = useCallback((item: any) => {
    if (!item?.value) {
      return <span>{item?.label || ""}</span>;
    }
    const { name, refId, mobile } = item.value || {};
    if (!name) {
      return <span>{item.label || ""}</span>;
    }
    return (
      <div className="tw:flex tw:flex-col tw:gap-1">
        <div className="tw:font-medium">{name}</div>
        <div className="tw:flex tw:flex-wrap tw:gap-2 tw:text-xs tw:text-gray-600">
          {refId && <span>ID: {refId}</span>}
          {mobile && <span>• {mobile}</span>}
        </div>
      </div>
    );
  }, []);

  return (
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
      itemTemplate={itemTemplate}
    />
  );
};

export default FranchiseSearchInput;
