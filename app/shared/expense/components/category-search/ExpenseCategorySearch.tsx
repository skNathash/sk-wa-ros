import { merge } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import ExpenseService from "~/services/ExpenseService";

type Props = {
  size?: "sm" | "lg";
  callback?: (item: any) => void;
  isRequired?: boolean;
  label?: string;
  value?: Array<any>;
  placeholder?: string;
  filters?: Record<string, any>;
};

const getData = async (
  query: string,
  page: number,
  filters: Record<string, any> = {}
) => {
  let params: Record<string, any> = {
    ...filters,
    page,
    count: 10,
    sort: { name: 1 },
  };
  const search = query?.trim();
  if (search) {
    params = merge({}, params, {
      filter: {
        name: { $regex: search, $options: "i" },
      },
    });
  }
  const response = await ExpenseService.getCategories(params);
  const data = response.data?.data?.data || [];
  return data.map((item: any) => ({
    label: item.name,
    value: item._id,
  }));
};

const ExpenseCategorySearch = ({
  size = "lg",
  callback,
  isRequired = false,
  label = "Category",
  value,
  placeholder = "Category",
  filters,
}: Props) => {
  const [initialData, setInitialData] = useState<any[]>([]);
  const pageRef = useRef(1);
  const isInitialLoad = useRef(false);

  useEffect(() => {
    if (!isInitialLoad.current) {
      isInitialLoad.current = true;
      getData("", 1, filters).then((response) => setInitialData(response));
    }
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (isInitialLoad.current) {
      getData("", 1, filters).then((response) => setInitialData(response));
    }
  }, [filters]);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }
      const response = await getData(query, pageRef.current, filters);
      return response;
    },
    [filters]
  );

  const onSelect = useCallback(
    (item: any, action: "add" | "remove") => {
      callback?.({ action, data: item });
    },
    [callback]
  );

  return (
    <AutoComplete
      searchCallback={searchCallback}
      onSelect={onSelect}
      initialData={initialData}
      size={size}
      isRequired={isRequired}
      label={label}
      values={value}
      placeholder={placeholder}
    />
  );
};

export default ExpenseCategorySearch;
