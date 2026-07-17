import { useCallback, useEffect, useRef, useState } from "react";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";

interface CompanySearchInputProps {
  size?: "sm" | "lg";
  multiSelect?: boolean;
  callback?: (item: any, action: "add" | "remove") => void;
  values?: any[];
  feature?: "inventory-subscribe" | "seller";
  label?: string;
  placeholder?: string;
}

const CompanyNameSearchInput = ({
  size = "lg",
  multiSelect = false,
  callback,
  values,
  feature,
  label,
  placeholder,
}: CompanySearchInputProps) => {
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
    [feature]
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
  const commonParams = {
    page: page,
    count: 10,
    sort: { "_id.companyName": 1 },
  } as any;

  if (query) {
    commonParams.filter = { companyName: { $regex: query, $options: "i" } };
  }

  if (feature === "inventory-subscribe") {
    const response = await InventorySubscribeService.getCompanies(commonParams);
    const formatted = InventorySubscribeService.formatCompanyResponse(
      response.data?.data || []
    );
    return formatted.map((c: any) => ({
      label: c._displayName || c.name,
      value: { id: c._id, name: c._displayName },
    }));
  } else {
    const response = await SellerCatalogService.getCompanies({
      ...commonParams,
    });
    const formatted = SellerCatalogService.formatCompanyResponse(
      response.data?.data || []
    );
    return formatted.map((c: any) => ({
      label: c._displayName || c.name,
      value: { id: c._id, name: c._displayName },
    }));
  }
};

export default CompanyNameSearchInput;
