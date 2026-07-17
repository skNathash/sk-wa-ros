import clsx from "clsx";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SortDropdown from "../../../components/sort-dropdown/SortDropdown";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  selectedMenu?: any;
  callback: (p: { action: string; data?: any; sortType?: string }) => void;
  params?: Record<string, any>;
};

const defaultPagination = {
  activePage: 1,
  rowsPerPage: 10,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 10,
};

const Menus: React.FC<Props> = ({ selectedMenu, callback, params }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");

  const [sortType, setSortType] = useState("popular");

  const filterRef = useRef<Record<string, any>>({
    sortType: "popular",
    ...(params || {}),
  });
  const paginationRef = useRef({ ...defaultPagination });

  const applyFilter = async () => {
    setIsLoading(true);
    setItems([]);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    const p = prepareParams(filterRef.current, paginationRef.current as any);
    const count = await getCount(p);
    paginationRef.current = {
      ...paginationRef.current,
      totalRecords: count,
    } as any;
    const result = await getData(p);
    setItems(result.data);
    setHasMore(result.data.length < count);
    setIsLoading(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    } as any;
    const p = prepareParams(filterRef.current, paginationRef.current as any);
    const result = await getData(p);
    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    applyFilter();
    setSortType("popular");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const debouncedSearch = useCallback(debounce(applyFilter, 500), []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    filterRef.current = { ...filterRef.current, search: e.target.value };
    debouncedSearch();
  };

  const onClick = (menu: any) => {
    const isSelected = selectedMenu && menu._id === selectedMenu._id;

    if (isSelected) {
      callback({ action: "clear", sortType });
    } else {
      callback({ action: "select", data: menu, sortType });
    }
  };

  const handleSortChange = (value: string) => {
    setSortType(value);
    filterRef.current = { ...filterRef.current, sortType: value };
    applyFilter();
  };

  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-md">
      <div className="tw:bg-gray-50 tw:px-4 tw:py-2">
        <div className="tw:font-semibold tw:mb-1">Menus</div>
        <div className="tw:text-xs tw:text-gray-500">
          {paginationRef.current.totalRecords} menus
        </div>
      </div>
      <AppScrollArea className="tw:p-4 tw:bg-white tw:h-[calc(100vh-150px)]">
        <div className="tw:mb-4 tw:flex tw:md:flex-row tw:flex-col tw:items-center tw:gap-2 tw:w-full">
          <input
            type="text"
            className="tw:w-full tw:px-2 tw:border tw:border-gray-200 tw:rounded-md tw:h-8 tw:bg-gray-50 tw:outline-none tw:text-xs"
            placeholder="Search menus"
            onChange={handleSearch}
            value={search}
          />
          <SortDropdown
            value={sortType}
            onChange={handleSortChange}
            inputClassName="tw:!h-8 tw:text-xs tw:w-full"
            className="tw:w-full tw:md:w-auto"
          />
        </div>

        {isLoading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!isLoading && !items.length && <NoData />}

        {items.map((item) => (
          <div
            className={clsx(
              "tw:border tw:rounded-md tw:p-2 tw:mb-2 tw:flex tw:gap-2 tw:items-center tw:cursor-pointer",
              {
                "tw:border-blue-500 tw:bg-blue-50":
                  selectedMenu?._id === item._id,
                "tw:border-gray-200": selectedMenu?._id !== item._id,
              }
            )}
            onClick={() => onClick(item)}
            key={item._id}
          >
            <div className="tw:w-16 tw:h-16 tw:flex-shrink-0">
              <ImgRender
                assetId={item._displayImg}
                className="tw:object-cover tw:w-full tw:h-full tw:rounded"
              />
            </div>
            <div className="tw:flex-1">
              <div className="tw:text-sm tw:font-medium tw:mb-1">
                {item._displayName || item.name}
              </div>
              <div className="tw:flex tw:gap-1 tw:items-center">
                <div className="tw:text-xs tw:text-gray-500">
                  {item.totalDeals || 0} deals
                </div>
                {/* <span className="tw:text-xs tw:text-gray-500">•</span>
                <div className="tw:text-xs tw:text-gray-500">
                  {item.uniqueBrandCount || 0} brands
                </div> */}
              </div>
            </div>
          </div>
        ))}

        {hasMore && !isLoading && (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <LoadMoreButton
              loadMore={loadMore}
              loading={isLoadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={items.length}
            />
          </div>
        )}
      </AppScrollArea>
    </div>
  );
};

export default Menus;
