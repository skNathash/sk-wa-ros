import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { debounce } from "lodash";
import { Phone, Search, Users } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import Alpha from "~/components/core/alpha/Alpha";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import type { UsersModalType } from "./helper";

type UserItem = {
  _id?: string;
  id?: string;
  name?: string;
  mobile?: string;
  franchiseId?: string;
  refNo?: string;
  initials?: string;
  location?: string;
  [key: string]: any;
};

type Props = {
  show: boolean;
  onClose: () => void;
  onSelect: (user: UserItem) => void;
  title?: string;
  type?: UsersModalType;
};

const UsersModal: React.FC<Props> = ({
  show,
  onClose,
  onSelect,
  title = "Select User",
  type = "b2b",
}) => {
  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 15,
    startSlNo: 1,
    endSlNo: 15,
    totalRecords: 0,
  });

  const { register, control, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params, type);
      setData(result || []);
      const countResponse = await getCount(params, type);
      paginationRef.current.totalRecords = countResponse?.total || 0;
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params, type);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, type]);

  // Load data when modal opens
  useEffect(() => {
    if (show) {
      filterRef.current = {};
      setValue("search", "");
      setValue("alpha", "");
      applyFilter();
    }
  }, [show, applyFilter]);

  const triggerCallback = useCallback(() => {
    filterRef.current = {
      ...filterRef.current,
      ...getValues(),
    };
    applyFilter();
  }, [applyFilter, getValues]);

  const handleSearch = debounce(() => {
    filterRef.current = {
      ...filterRef.current,
      search: getValues("search"),
      alpha: "",
    };
    setValue("alpha", "");
    applyFilter();
  }, 500);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    filterRef.current = {
      ...filterRef.current,
      alpha: value,
      search: "",
    };
    setValue("search", "");
    applyFilter();
  };

  const handleSelect = (user: UserItem) => {
    onSelect(user);
    onClose();
  };

  return (
    <AppModal show={show} backdropDismiss={false} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:bg-blue-100 tw:p-2 tw:rounded-full">
            <Users className="tw:text-blue-600" size={20} />
          </div>
          <div>
            <div className="tw:text-base tw:font-bold tw:text-gray-800">
              {title}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              Search and select a user to assign PayLater
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {/* Filters */}
        <div className="tw:mb-3">
          <AppInput
            name="search"
            register={register}
            onChange={handleSearch}
            size="sm"
            placeholder="Search by name, mobile, or ID..."
          />
        </div>

        <Alpha
          callback={handleAlphaChange}
          selected={alpha}
          className="tw:mb-4"
        />

        {/* Results */}
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
            <AppSpinner />
          </div>
        ) : data.length === 0 ? (
          <NoData />
        ) : (
          <div className="tw:space-y-2">
            {data.map((item, idx) => {
              const id = item._id || item.id || String(idx);
              const initials = (item.initials as string) || "?";
              const name = item.name || "-";
              const franchiseId = item.franchiseId || item.refNo || "";

              return (
                <div
                  key={id}
                  className="tw:flex tw:items-center tw:justify-between tw:p-3 tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:hover:border-blue-300 tw:hover:bg-blue-50 tw:transition-all tw:cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  <div className="tw:flex tw:items-center tw:gap-3">
                    {/* Avatar */}
                    <div className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-gradient-to-br tw:from-blue-400 tw:to-purple-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:text-sm tw:font-bold tw:flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                        {name}
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-3 tw:mt-0.5">
                        {item.mobile && (
                          <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                            <Phone size={11} />
                            <span>{item.mobile}</span>
                          </div>
                        )}
                        {franchiseId && (
                          <span className="tw:text-xs tw:text-blue-600 tw:font-medium">
                            {franchiseId}
                          </span>
                        )}
                      </div>
                      {item.location && (
                        <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                          {item.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      handleSelect(item);
                    }}
                  >
                    Select
                  </AppButton>
                </div>
              );
            })}

            {hasMoreData && !loading && (
              <div className="tw:text-center tw:mt-4">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
              </div>
            )}
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default UsersModal;
