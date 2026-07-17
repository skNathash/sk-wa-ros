import AppCard from "~/components/core/card/AppCard";
import { getData, prepareParams } from "./helper";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { debounce } from "lodash";
import Alpha from "~/components/core/alpha/Alpha";
import NoData from "~/components/core/no-data/NoData";
import { BIN_STATUSES } from "../../helper";
import { useTranslation } from "react-i18next";

type Props = {
  callback: (a: { action: string; data: any }) => void;
  location: string;
};

const capacityOptions = BIN_STATUSES.map((status) => ({
  label: status.label,
  value: status.value,
  langKey: status.langKey,
}));
capacityOptions.unshift({
  label: "Show only allocated bins",
  value: "Allocated",
  langKey: "showOnlyAllocatedBin",
});
capacityOptions.unshift({ label: "All", value: "All", langKey: "all" });

const BinProducts = ({ callback, location }: Props) => {
  const { t } = useTranslation();

  const { register, getValues, setValue, control } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
      // default capacity should be 'Allocated' to show only allocated bins
      capacity: "Allocated",
      location: location,
    },
  });

  // use useWatch to observe specific form fields (search, capacity, alpha)
  const [search, alpha] = useWatch({
    control,
    name: ["search", "alpha"],
  });

  const searchValue = search || "";
  const alphaValue = alpha || "";

  // Show results only when there's an explicit search or alpha filter.
  // Do not show the products list block just because capacity is selected.
  const showResults = Boolean(
    (searchValue && String(searchValue).trim() !== "") ||
    (alphaValue && String(alphaValue).trim() !== ""),
  );

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // useEffect(() => {
  //   setValue("location", location);
  //   applyFilter();
  //   // Inform parent about the initial capacity selection so it can apply filters
  //   try {
  //     const initialCapacity = getValues("capacity");
  //     callback({ action: "capacity-change", data: initialCapacity });
  //   } catch (e) {
  //     // ignore
  //   }
  // }, [location]);

  const applyFilter = async () => {
    setLoading(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };

    const params = prepareParams(getValues(), paginationRef.current);
    const data = await getData(params, getValues("location"));
    setData(data);
    setHasMore(data.length === paginationRef.current.rowsPerPage);
    setLoading(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    const params = prepareParams(getValues(), paginationRef.current);
    const data = await getData(params, getValues("location"));
    setData((prev) => [...prev, ...data]);
    setHasMore(data.length === paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  const handleSearch = useCallback(
    debounce(() => {
      const searchVal = getValues("search");
      setValue("alpha", "");
      setValue("capacity", searchVal ? "All" : "Allocated");
      applyFilter();
    }, 500),
    [],
  );

  const handleAlpha = (value: string) => {
    setValue("alpha", value);
    applyFilter();
  };

  return (
    <AppCard title={t("findProducts")} icon="search">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleSearch}
          placeholder={t("searchByProductName")}
        />
        <Controller
          control={control}
          name="capacity"
          render={({ field }) => (
            <AppSelect
              options={capacityOptions}
              onChange={(value) => {
                // update local form value
                field.onChange(value);
                // clear search input when bin filter (capacity) changes
                setValue("search", "");
                // inform parent component about capacity change
                callback({ action: "capacity-change", data: value });
                // apply filter to refresh results based on new capacity
                applyFilter();
              }}
              value={field.value}
              inputClassName="tw:w-full"
            />
          )}
        />
        {/* 'Show only allocated' is now an option in the capacity select */}
      </div>

      {showResults && (
        <div className="tw:mt-4">
          <Alpha
            callback={handleAlpha}
            selected={alphaValue ?? getValues("alpha")}
            className="tw:mb-4"
          />

          <AppScrollArea className="tw:h-60">
            {!loading && data.length === 0 && <NoData />}
            {data?.map((item, index) => (
              <div
                key={index}
                className="tw:border tw:border-gray-200 tw:p-2 tw:rounded-md tw:mb-2 tw:cursor-pointer"
                onClick={() => {
                  callback({
                    action: "select-product",
                    data: item,
                  });
                }}
              >
                <div className="tw:text-xs tw:font-medium tw:line-clamp-2 tw:mb-1">
                  {item.dealName}
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("location")}: {item.location} - {item.rackName} -{" "}
                  {item.binName || item.binCode}, {item.quantity} units
                </div>
              </div>
            ))}
          </AppScrollArea>
          {!loading && hasMore && (
            <div className="tw:text-center tw:text-gray-500 tw:py-4">
              <AppButton
                onClick={loadMore}
                isLoading={loadingMore}
                size="small"
                color="light"
                fill="outline"
              >
                {loadingMore ? t("loading") : t("loadMore")}
              </AppButton>
            </div>
          )}
        </div>
      )}
    </AppCard>
  );
};

export default BinProducts;
