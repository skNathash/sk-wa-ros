import AppCard from "~/components/core/card/AppCard";
import { getData, prepareParams } from "./helper";
import { useCallback, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";
import Alpha from "~/components/core/alpha/Alpha";
import { useTranslation } from "react-i18next";
import useTheme from "~/hooks/useTheme";

type Props = {
  callback: (a: { action: string; data: any }) => void;
  location: string;
};

const BinProducts = ({ callback, location }: Props) => {
  const { t } = useTranslation();
  const isTheme2 = useTheme() === "theme-2";

  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
      location: location,
    },
  });

  const [data, setData] = useState<any[]>([]);
  // The result list only exists once the user has actually looked for something
  // (typed a term or picked a letter) — an idle card shows just the controls.
  const [searched, setSearched] = useState<boolean>(false);
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
      setValue("alpha", "");
      const hasTerm = !!getValues("search")?.trim();
      setSearched(hasTerm);
      if (!hasTerm) {
        setData([]);
        return;
      }
      applyFilter();
    }, 500),
    [],
  );

  const handleAlpha = (value: string) => {
    setValue("alpha", value);
    setSearched(!!value);
    if (!value) {
      setData([]);
      return;
    }
    applyFilter();
  };

  return (
    /* Compact card: the card drops its own padding (`noPadding`) and the header
       and body supply a tighter gutter of their own, so the search block reads
       as a slim control rather than a full-size section card. */
    <AppCard
      title={t("findProducts")}
      icon="search"
      noPadding
      className="tw:mb-3"
      headerClassName="tw:px-3 tw:pt-3 tw:text-sm"
    >
      <div className="tw:px-3 tw:pb-3">
        <AppInput
          name="search"
          register={register}
          onChange={handleSearch}
          placeholder={t("searchByProductName")}
        />
        {/* Alpha strip — dropped in theme-2, where the search field alone
            carries the lookup. */}
        {!isTheme2 && (
          <Alpha
            callback={handleAlpha}
            selected={getValues("alpha")}
            className="tw:mt-3"
          />
        )}

        {/* Results appear only after a search — no empty-state placeholder while
            the card is idle. */}
        {searched && data.length > 0 && (
          <AppScrollArea className="tw:mt-3 tw:h-52">
            {data.map((item, index) => (
              <div
                key={index}
                className="tw:border tw:border-gray-200 tw:px-2 tw:py-1.5 tw:rounded-md tw:mb-1.5 tw:cursor-pointer tw:hover:border-gray-300"
                onClick={() => {
                  callback({
                    action: "select-product",
                    data: item,
                  });
                }}
              >
                <div className="tw:text-xs tw:font-medium tw:line-clamp-1">
                  {item.dealName}
                </div>
                <div className="tw:text-[11px] tw:text-gray-500 tw:line-clamp-1">
                  {item.rackName} - {item.binName || item.binCode} ·{" "}
                  {item.quantity} units
                </div>
              </div>
            ))}
          </AppScrollArea>
        )}

        {searched && !loading && data.length > 0 && hasMore && (
          <div className="tw:text-center tw:text-gray-500 tw:pt-2">
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
    </AppCard>
  );
};

export default BinProducts;
