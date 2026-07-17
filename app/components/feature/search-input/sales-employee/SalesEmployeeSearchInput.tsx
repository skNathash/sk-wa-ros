import { Hash, Phone, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import UserService from "~/services/UserService";

interface SalesEmployeeSearchInputProps {
  size?: "sm" | "lg";
  multiSelect?: boolean;
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SalesEmployeeSearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  label,
  placeholder,
  className,
  disabled,
}: SalesEmployeeSearchInputProps) => {
  const [data, setData] = useState<any[]>([]);

  const pageRef = useRef(1);

  useEffect(() => {
    if (data.length === 0) {
      getData("", 1).then((res) => {
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

      const response = await getData(query, pageRef.current);
      return response;
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
    const { name, mobile, referenceId } = item.value || {};
    return (
      <div className="tw:flex tw:flex-col tw:gap-1 tw:w-full">
        <span className="tw:flex tw:items-center tw:gap-1 tw:font-medium">
          <User className="tw:w-2.5 tw:h-2.5 tw:text-gray-600" />
          {name}
        </span>
        <div className="tw:flex tw:gap-3 tw:text-xs tw:text-gray-500">
          {mobile && (
            <span className="tw:flex tw:items-center tw:gap-1">
              <Phone className="tw:w-2.5 tw:h-2.5" />
              {mobile}
            </span>
          )}
          {referenceId && (
            <span className="tw:flex tw:items-center tw:gap-1">
              <Hash className="tw:w-2.5 tw:h-2.5" />
              {referenceId}
            </span>
          )}
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
        itemTemplate={itemTemplate}
      />
    </>
  );
};

const getData = async (query: string, page: number) => {
  const filter: Record<string, any> = { position: "Sales Employee" };
  const search = query?.trim();
  if (search) {
    filter.$or = [
      { name: search },
      { mobile: search },
      { email: search },
      { referenceId: search },
    ];
  }

  const response = await UserService.getUserList({
    page,
    limit: 10,
    filter,
  });
  return (response?.data?.data || []).map((item: any) => ({
    label: item.name,
    value: {
      id: item._id,
      name: item.name,
      mobile: item.mobile,
      email: item.email,
      referenceId: item.referenceId,
    },
  }));
};

export default SalesEmployeeSearchInput;
