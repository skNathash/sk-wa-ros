import { useCallback, useRef } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import VendorService from "~/services/VendorService";

interface CategorySearchProps {
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  vendorId: string;
}

const CategorySearch = ({
  callback,
  values,
  vendorId,
}: CategorySearchProps) => {
  const pageRef = useRef(1);

  const searchCallback = useCallback(
    async (query: string, isLoadingMore?: boolean) => {
      if (isLoadingMore) {
        pageRef.current++;
      } else {
        pageRef.current = 1;
      }

      const response = await getData(vendorId, query, pageRef.current);
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
        onSelect={handleSelect}
        values={values}
        initialData={[]}
      />
    </>
  );
};

const getData = async (vendorId: string, query: string, page: number) => {
  {
    const response = await VendorService.getCategories(vendorId, {
      page: page,
      count: 10,
      filter: query ? { name: query } : {},
      sort: { name: 1 },
    });
    return response.data?.data?.map((item: any) => ({
      label: item.name,
      value: { id: item._id, name: item.name },
    }));
  }
};

export default CategorySearch;
