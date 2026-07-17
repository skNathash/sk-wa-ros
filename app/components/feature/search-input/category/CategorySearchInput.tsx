import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import ProductService from "~/services/ProductService";
import { PosService } from "~/services/PosService";
import AuthService from "~/services/AuthService";

interface CategorySearchInputProps {
  size?: "sm" | "lg";
  multiSelect?: boolean;
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  feature?: "pos" | "product";
  label?: string;
  placeholder?: string;
}

const CategorySearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  feature,
  label,
  placeholder,
}: CategorySearchInputProps) => {
  const [data, setData] = useState<any[]>([]);

  const pageRef = useRef(1);

  useEffect(() => {
    if (data.length === 0) {
      getData("", 1, feature).then((res) => {
        setData(res);
      });
    }
  }, [data, feature]);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }

      const response = await getData(query, pageRef.current, feature);
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
        placeholder={placeholder}
        multiSelect={multiSelect}
        values={values}
      />
    </>
  );
};

const getData = async (query: string, page: number, feature?: string) => {
  if (feature === "pos") {
    const response = await PosService.getCategories({
      page: page,
      count: 10,
      filter: {
        _id: AuthService.getLoggedInUserId(),
      },
      categoryFilter: query ? { name: { $regex: query, $options: "i" } } : {},
    });
    return response.data.map((item: any) => ({
      label: item.name,
      value: { id: item._id, name: item.name },
    }));
  } else {
    const response = await ProductService.getSpcCategories({
      page: page,
      count: 10,
      categoryFilter: query ? { name: { $regex: query, $options: "i" } } : {},
    });
    return response.data.map((item: any) => ({
      label: item.name,
      value: { id: item._id, name: item.name },
    }));
  }
};

export default CategorySearchInput;
