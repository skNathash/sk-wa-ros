import { produce } from "immer";
import { Package, Link, MapPin } from "lucide-react";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import { getCount, getData, mapSelectedData, prepareParams } from "./helpers";
import DesktopView from "./components/DesktopView";
import VendorSearchInput from "~/components/feature/search-input/vendor/VendorSearchInput";
import useScreenView from "~/hooks/useScreenView";
import MobileView from "./components/MobileView";
import AppHeader from "~/components/core/header/AppHeader";
import PoListTabs from "../components/tabs/PoListTabs";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";

const PoAutoAllocation = () => {
  const { register, handleSubmit, getValues } = useForm();
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  const filterRef = useRef<Record<string, any>>({
    alpha: "",
  });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    endSlNo: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  const selectedRef = useRef<Record<string, any>>({});

  useEffect(() => {
    applyFilter();
  }, []);

  const applyFilter = async () => {
    const params = prepareParams(filterRef.current, paginationRef.current);
    const response = await getData(params);
    const countResponse = await getCount(params);
    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData(mapSelectedData(response, selectedRef.current));
    paginationRef.current.totalRecords = countResponse;
    setLoading(false);
  };

  const debounceSearch = debounce(() => {
    filterRef.current = {
      ...filterRef.current,
      search: getValues("search"),
    };
    applyFilter();
  }, 500);

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);
    const params = prepareParams(filterRef.current, paginationRef.current);
    const response = await getData(params);
    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData([...data, ...mapSelectedData(response, selectedRef.current)]);
    setLoadingMore(false);
  };

  const setAlpha = (value: string) => {
    filterRef.current = {
      ...filterRef.current,
      alpha: value,
    };
    applyFilter();
  };

  const tableCallback = (a: { action: string; data: Record<string, any> }) => {
    if (a.action === "select") {
      const { selected, ...rest } = a.data;
      if (selected) {
        selectedRef.current = {
          ...selectedRef.current,
          [a.data._id]: rest,
        };
      } else {
        delete selectedRef.current[a.data._id];
      }
      setData(
        produce((draft) => {
          const index = draft.findIndex((item) => item._id === a.data._id);
          if (index !== -1) {
            draft[index].selected = selected;
          }
        })
      );
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.checked;
    setSelectAll(selected);
    setData(
      produce((draft) => {
        draft.forEach((item) => {
          item.selected = selected;
        });
      })
    );

    if (selected) {
      data.forEach((item) => {
        selectedRef.current = {
          ...selectedRef.current,
          [item._id]: { ...item },
        };
      });
    } else {
      selectedRef.current = {};
    }
  };

  return (
    <>
      <AppHeader title="Auto Allocation" />
      <div className="tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
          <PoListTabs activeTab="auto-allocation" className="tw:mb-4" />
          <AppCard>
            <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
              <div>
                <div className="tw:flex tw:gap-2">
                  <MapPin className="tw:w-4 tw:h-4 tw:mt-1" />
                  <span className="tw:text-lg tw:font-semibold">
                    Auto Allocation Location
                  </span>
                </div>
                <div className="tw:text-sm tw:text-gray-500">
                  Products from active purchase orders awaiting warehouse
                  location assignment
                </div>
              </div>
            </div>

            <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-2 tw:mb-2">
              <AppInput
                name="search"
                register={register}
                onChange={debounceSearch}
                placeholder="Search by PO number, vendor name, product name, etc."
                size="sm"
                className="tw:flex-1"
              />
              <div className="tw:flex-1">
                <VendorSearchInput size="sm" placeholder="Search Vendor" />
              </div>
              <div>
                <span className="tw:border tw:border-gray-200 tw:rounded-lg tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:flex tw:items-center tw:gap-1">
                  <Package className="tw:w-3 tw:h-3" />
                  <span>{paginationRef.current.totalRecords} items</span>
                </span>
              </div>

              {Object.keys(selectedRef.current).length > 0 && (
                <div>
                  <span className="tw:bg-blue-500 tw:text-white tw:rounded-lg tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:flex tw:items-center tw:gap-1">
                    <span>
                      {Object.keys(selectedRef.current).length} Selected
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="tw:my-1">
              <Alpha selected={filterRef.current.alpha} callback={setAlpha} />
            </div>

            {data.length > 0 && (
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-3 tw:text-sm">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <span className="tw:text-gray-500">
                  Select All {data.length} items
                </span>
              </div>
            )}
          </AppCard>

          {isMobile ? (
            <MobileView data={data} callback={tableCallback} />
          ) : (
            <AppCard>
              <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
                <div>
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    fwSize="sm"
                    loadedCount={data.length}
                  />
                </div>
                {Object.keys(selectedRef.current).length > 0 && (
                  <AppButton size="small" noShadow>
                    <Link className="tw:w-4 tw:h-4 tw:mr-1" />
                    Auto Allocate {Object.keys(selectedRef.current).length}
                  </AppButton>
                )}
              </div>

              <DesktopView
                data={data}
                loading={loading}
                callback={tableCallback}
              />

              {hasMoreData && (
                <div className="tw:flex tw:justify-center tw:mt-3">
                  <AppButton
                    size="small"
                    fill="outline"
                    onClick={loadMore}
                    isLoading={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </AppButton>
                </div>
              )}
            </AppCard>
          )}
        </div>
      </div>
    </>
  );
};

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Purchase Orders", redirect: { path: "/dashboard/purchase-order" } },
  {
    label: "Auto Allocation",
  },
];

export default PoAutoAllocation;
