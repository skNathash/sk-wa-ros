import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import VendorService from "~/services/VendorService";

interface Props {
  size?: "sm" | "lg";
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  label?: string;
  placeholder?: string;
}

const VendorSearchInput = ({
  size = "lg",
  callback,
  values,
  label,
  placeholder,
}: Props) => {
  const [data, setData] = useState<any[]>([]);

  const pageRef = useRef(1);

  useEffect(() => {
    if (data?.length === 0) {
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

  return (
    <>
      <AutoComplete
        searchCallback={searchCallback}
        initialData={data}
        onSelect={handleSelect}
        size={size}
        label={label}
        values={values}
        placeholder={placeholder}
      />
    </>
  );
};

const getData = async (query: string, page: number) => {
  const response = await VendorService.getList({
    page: page,
    count: 10,
    filter: query ? { name: { $regex: query, $options: "i" } } : {},
  });
  return response.data?.data?.map((item: any) => ({
    label: item.name,
    value: { id: item._id, ...item },
  }));
};

export default VendorSearchInput;
