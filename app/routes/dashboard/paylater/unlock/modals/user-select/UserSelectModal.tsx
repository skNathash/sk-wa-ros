import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";
import { Search, Users } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { AppInput } from "~/components/core/form";
import type { PaginationState } from "~/types/CommonTypes";
import type { UserItem, UserType } from "../../helper";
import { defaultFilter, getData, getCount, prepareParams } from "./helper";
import Item from "./Item";

type Props = {
  show: boolean;
  onClose: () => void;
  type: UserType;
  onSelect: (user: UserItem) => void;
};

const UserSelectModal = ({ show, onClose, type, onSelect }: Props) => {
  const { register, reset, getValues } = useForm({
    defaultValues: { ...defaultFilter },
  });

  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 15,
    startSlNo: 1,
    endSlNo: 15,
    totalRecords: 0,
  });

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
      const params = prepareParams(
        filterRef.current as typeof defaultFilter,
        paginationRef.current,
        { key: "name", value: "asc" },
      );
      const result = await getData(params, type);
      setData(result || []);
      const total = await getCount(params, type);
      paginationRef.current.totalRecords = total;
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
      const params = prepareParams(
        filterRef.current as typeof defaultFilter,
        paginationRef.current,
        { key: "name", value: "asc" },
      );
      const result = await getData(params, type);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData((result || []).length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, type]);

  useEffect(() => {
    if (!show) return;
    reset({ ...defaultFilter });
    filterRef.current = { ...defaultFilter };
    applyFilter();
  }, [show, type, applyFilter, reset]);

  // Debounced so typing doesn't fire a request per keystroke.
  const handleSearch = useMemo(
    () =>
      debounce(() => {
        filterRef.current = { ...filterRef.current, ...getValues() };
        applyFilter();
      }, 500),
    [applyFilter, getValues],
  );

  useEffect(() => () => handleSearch.cancel(), [handleSearch]);

  const handleSelect = (user: UserItem) => {
    onSelect(user);
    onClose();
  };

  const titleLabel = type === "b2c" ? "B2C Customer" : "B2B Retailer";

  return (
    <AppModal show={show} backdropDismiss className="tw:max-w-2xl tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:bg-blue-100 tw:p-1.5 tw:rounded-full">
            <Users className="tw:text-blue-600" size={18} />
          </div>
          <div>
            <div className="tw:text-sm tw:font-bold tw:text-gray-800">
              Select {titleLabel}
            </div>
            <div className="tw:text-[10px] tw:text-gray-500">
              Choose a user to unlock PayLater
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <AppInput
          name="search"
          register={register}
          onChange={handleSearch}
          size="sm"
          placeholder="Search by name or mobile..."
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
          className="tw:mb-3"
        />

        <div className="tw:mb-2">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>

        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-10">
            <AppSpinner className="tw:h-8 tw:w-8" />
          </div>
        ) : !data.length ? (
          <NoData />
        ) : (
          <div className="tw:grid tw:grid-cols-1 tw:gap-2">
            {data.map((item, idx) => (
              <Item
                key={item._id || item.id || idx}
                item={item}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}

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
      </AppModal.Content>

      <AppModal.Footer>
        <AppButton color="secondary" fill="outline" onClick={onClose}>
          Cancel
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default UserSelectModal;
