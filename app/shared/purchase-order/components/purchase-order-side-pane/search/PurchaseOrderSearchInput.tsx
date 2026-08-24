import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AutoComplete from "~/components/core/autocomplete/AutoComplete";
import useAppNav from "~/hooks/useAppNav";
import { getData } from "./helper";

interface PurchaseOrderSearchInputProps {
  size?: "sm" | "lg";
  className?: string;
  placeholder?: string;
  label?: string;
}

/**
 * Autocomplete search for purchase orders in the side pane. Selecting a result
 * navigates to the PO detail page. Mirrors BrandSearchInput / CategorySearchInput.
 */
const PurchaseOrderSearchInput = ({
  size = "sm",
  className,
  placeholder,
  label,
}: PurchaseOrderSearchInputProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [data, setData] = useState<any[]>([]);
  const pageRef = useRef(1);
  const isInitialLoad = useRef(false);

  useEffect(() => {
    if (data.length === 0 && !isInitialLoad.current) {
      isInitialLoad.current = true;
      getData("", 1).then(setData);
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
    [],
  );

  const handleSelect = useCallback(
    (item: any) => {
      const id = item?.value?.id;
      if (id) {
        appNav.to(`/dashboard/purchase-order/view/${id}`);
      }
    },
    [appNav],
  );

  return (
    <AutoComplete
      searchCallback={searchCallback}
      initialData={data}
      onSelect={handleSelect}
      size={size}
      label={label}
      placeholder={
        placeholder ||
        t("searchPurchaseOrder", { defaultValue: "Search purchase order" })
      }
      className={className}
    />
  );
};

export default PurchaseOrderSearchInput;
