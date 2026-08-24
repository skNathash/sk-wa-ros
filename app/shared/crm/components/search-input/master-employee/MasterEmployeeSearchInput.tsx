import { Hash, Mail, Phone, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import { getData } from "./helper";

interface MasterEmployeeSearchInputProps {
  size?: "sm" | "lg";
  multiSelect?: boolean;
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  params?: Record<string, any>;
  isRequired?: boolean;
}

const MasterEmployeeSearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  label,
  placeholder,
  className,
  disabled,
  params,
  isRequired,
}: MasterEmployeeSearchInputProps) => {
  const [data, setData] = useState<any[]>([]);

  const pageRef = useRef(1);

  const isInitialLoad = useRef(false);

  useEffect(() => {
    if (data?.length === 0 && !isInitialLoad.current) {
      isInitialLoad.current = true;
      getData("", 1, { params }).then((res: any[]) => {
        setData(res);
      });
    }
  }, [data, params]);

  // Refetch data when params change (for filtering).
  useEffect(() => {
    if (isInitialLoad.current) {
      getData("", 1, { params }).then((res: any[]) => {
        setData(res);
      });
    }
  }, [params]);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }
      const response = await getData(query, pageRef.current, { params });
      return response;
    },
    [params],
  );

  const handleSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      callback?.(item, action);
    },
    [callback],
  );

  const itemTemplate = useCallback((item: any) => {
    const { name, email, referenceId } = item.value || {};
    return (
      <div className="tw:flex tw:flex-col tw:gap-1 tw:w-full">
        <span className="tw:flex tw:items-center tw:gap-1 tw:font-medium">
          <User className="tw:w-2.5 tw:h-2.5 tw:text-gray-600" />
          {name}
        </span>
        <div className="tw:flex tw:gap-3 tw:text-xs tw:text-gray-500">
          {email && (
            <span className="tw:flex tw:items-center tw:gap-1">
              <Mail className="tw:w-2.5 tw:h-2.5" />
              {email}
            </span>
          )}
          {/* {referenceId && (
            <span className="tw:flex tw:items-center tw:gap-1">
              <Hash className="tw:w-2.5 tw:h-2.5" />
              {referenceId}
            </span>
          )} */}
        </div>
      </div>
    );
  }, []);

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
        itemTemplate={itemTemplate}
      />
    </>
  );
};

export default MasterEmployeeSearchInput;
