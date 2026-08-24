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
  parentCategoryId?: string;
  filters?: Record<string, any>;
};

const getData = async (
  query: string,
  page: number,
  parentCategoryId?: string,
  filters: Record<string, any> = {}
) => {
  let params: Record<string, any> = merge({}, filters, {
    page,
    count: 10,
    sort: { name: 1 },
    filter: {
      categoryId: parentCategoryId,
    },
  });
  const search = query?.trim();
  if (search) {
    params.filter.name = { $regex: search, $options: "i" };
  }
  const response = await ExpenseService.getSubCategories(params);
  const data = response.data?.data?.data || [];
  return data.map((item: any) => ({
    label: item.name,
    value: item._id,
  }));
};

const ExpenseSubCategorySearch = ({
  size = "lg",
  callback,
  isRequired = false,
  label = "Sub Category",
  value,
  parentCategoryId,
  filters,
}: Props) => {
  const [initialData, setInitialData] = useState<any[]>([]);
  const pageRef = useRef(1);
  const isInitialLoad = useRef(false);

  useEffect(() => {
    if (!isInitialLoad.current) {
      isInitialLoad.current = true;
      if (parentCategoryId) {
        getData("", 1, parentCategoryId, filters).then((response) =>
          setInitialData(response)
        );
      }
    }
  }, []);

  // Refetch when parent or filters change
  useEffect(() => {
    if (isInitialLoad.current) {
      if (parentCategoryId) {
        getData("", 1, parentCategoryId, filters).then((response) =>
          setInitialData(response)
        );
      } else {
        setInitialData([]);
      }
    }
  }, [parentCategoryId, filters]);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (!parentCategoryId) {
        return [];
      }
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }
      const response = await getData(
        query,
        pageRef.current,
        parentCategoryId,
        filters
      );
      return response;
    },
    [parentCategoryId, filters]
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
    />
  );
};

export default ExpenseSubCategorySearch;
