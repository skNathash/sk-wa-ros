import { useEffect, useRef, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import { getCount, getData, prepareParams } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";
import { useForm } from "react-hook-form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { ChevronRight, Phone } from "lucide-react";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import { AppInput } from "~/components/core/form/AppInput";
import useDebounce from "~/hooks/useDebounce";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  entityType: string;
};

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const SearchModal = ({ show, callback, entityType }: Props) => {
  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedSearch = useDebounce(searchValue, 400);

  const [data, setData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
  });

  const handleClose = () => {
    callback({ action: "close" });
  };

  // returns a human friendly title for the modal based on entity type
  const getEntityTitle = (type: string) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "franchise":
        return "Search Retailer";
      case "customer":
        return "Search Customer";
      case "vendor":
        return "Search Vendor";
      default:
        return "Search";
    }
  };

  useEffect(() => {
    if (show) {
      // sync local search value with form default when modal opens
      const fv = getValues();
      setSearchValue(fv?.search || "");
      applyFilter();
    }
  }, [show]);

  useEffect(() => {
    // when debounced search changes, update form value and re-apply filter
    setValue("search", debouncedSearch);
    // reset to first page when applying a new search
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const applyFilter = async () => {
    setLoading(true);
    setData([]);

    // ensure page boundaries are correct for a fresh filter
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };

    // prepare params using current search value combined with other form values
    const formValues = {
      ...(getValues ? getValues() : {}),
      search: searchValue,
    };

    const params = prepareParams(entityType, formValues, paginationRef.current);
    const response = await getData(entityType, params);

    const countResp = await getCount(entityType, params);
    paginationRef.current = {
      ...paginationRef.current,
      totalRecords: countResp,
    };

    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData(response);
    setLoading(false);
  };

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);

    const formValues = {
      ...(getValues ? getValues() : {}),
      search: searchValue,
    };

    const params = prepareParams(entityType, formValues, paginationRef.current);
    const response = await getData(entityType, params);

    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData([...data, ...response]);
    setLoadingMore(false);
  };

  const onTabChange = (tab: any) => {
    // tabs removed; kept for compatibility if referenced elsewhere
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{getEntityTitle(entityType)}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:mb-3">
          <AppInput
            name="search"
            placeholder="Search..."
            register={register}
            onChange={(e) => setSearchValue(e.target.value)}
            inputClassName="tw:w-full tw:mt-1"
          />
        </div>

        <AppScrollArea className="tw:h-[60vh]">
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              fwSize="sm"
              loadedCount={data.length}
            />
            {loading ? (
              <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
                <AppSpinner />
              </div>
            ) : null}

            {!loading && !data.length ? (
              <>
                <NoData />
              </>
            ) : null}

            {data.map((item, index) => {
              return (
                <div
                  key={index}
                  className="tw:border-b tw:border-gray-200 tw:py-2 tw:cursor-pointer tw:hover:bg-gray-50"
                  onClick={() => callback({ action: "add", data: item })}
                  role="button"
                >
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <div className="tw:flex-1">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                        <div className="tw:text-base tw:font-bold">
                          {item.label}
                        </div>
                        {item?.value?._vendorType ? (
                          <VendorTypeBadge
                            type={item.value._vendorType}
                            color={item.value._vendorTypeColor}
                            description={item.value._vendorTypeInfo}
                            className="tw:text-[10px]"
                            hideInfo={true}
                          />
                        ) : null}
                      </div>

                      <div className="tw:text-xs tw:text-gray-500 tw:mb-1 tw:flex tw:items-center tw:gap-4">
                        <span>
                          <span className="tw:font-medium">ID:</span>{" "}
                          <span>{item.value.refId}</span>
                        </span>
                        {item?.value?.mobile ? (
                          <span className="tw:flex tw:items-center tw:text-xs tw:text-gray-500 tw:flex-row tw:gap-2">
                            <span className="tw:flex tw:items-center">
                              <Phone
                                size={12}
                                className="tw:mr-1 tw:text-gray-400"
                              />
                              <span>{item.value.mobile}</span>
                            </span>
                          </span>
                        ) : null}
                      </div>

                      <div className="tw:text-xs tw:text-gray-500">
                        {item.value.formattedAddress}
                      </div>
                    </div>
                    <div>
                      <ChevronRight size={16} className="tw:text-gray-500" />
                    </div>
                  </div>
                </div>
              );
            })}
            {hasMoreData && !loading && (
              <div className="tw:flex tw:justify-center tw:mt-3">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
              </div>
            )}
          </div>
        </AppScrollArea>
      </AppModal.Content>
    </AppModal>
  );
};

export default SearchModal;
