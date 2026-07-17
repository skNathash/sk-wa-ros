import { debounce } from "lodash";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AppInput } from "~/components/core/form/AppInput";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
};

const RecipientModal = ({ show, callback }: Props) => {
  const { register, getValues, setValue } = useForm();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const handleSearch = useCallback(
    debounce(async () => {
      await applyFilter();
    }, 500),
    []
  );

  const [hasMoreData, setHasMoreData] = useState(true);

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
    };

    setLoading(true);

    const params = prepareParams("vendor", getValues(), paginationRef);

    const fetched = await getData("vendor", params);

    setData(fetched);
    setLoading(false);

    const count = await getCount("vendor", params);
    paginationRef.current = {
      ...paginationRef.current,
      totalRecords: count,
    };

    // There is more data if totalRecords > currently loaded rows
    setHasMoreData((count || 0) > (fetched?.length || 0));
  };

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  useEffect(() => {
    if (show) {
      setValue("search", "");
      paginationRef.current = {
        activePage: 1,
        rowsPerPage: 10,
        startSlNo: 1,
        endSlNo: 10,
        totalRecords: 0,
      };

      // initial load
      applyFilter();
    }
  }, [show]);

  const handleSelect = (item: any) => {
    callback({ action: "select", data: item });
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    const params = prepareParams("vendor", getValues(), paginationRef);

    const more = await getData("vendor", params);
    if (more && more.length > 0) {
      setData((prev) => {
        const newData = [...prev, ...more];
        const total = paginationRef.current.totalRecords || 0;
        // update hasMoreData based on total vs loaded
        setHasMoreData(total > newData.length);
        return newData;
      });
    } else {
      // no more data returned
      setHasMoreData(false);
    }
    setIsLoadingMore(false);
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
          <div className="tw:text-lg tw:font-semibold">Choose Recipient</div>
          <div className="tw:text-sm tw:text-gray-500" aria-live="polite">
            {paginationRef.current.totalRecords ? (
              <>{paginationRef.current.totalRecords} results</>
            ) : null}
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <div className="tw:mb-3 tw:mt-1">
          <label htmlFor="search" className="tw:sr-only">
            Search recipients
          </label>
          <AppInput
            type="text"
            placeholder="Search by name, mobile, email"
            className="form-control tw:w-full"
            name="search"
            register={register}
            onChange={handleSearch}
            size="sm"
            aria-label="Search recipients"
          />
        </div>
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-8">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && data.length === 0 ? <NoData /> : null}

        {!loading && data.length > 0 ? (
          <div className="tw:space-y-2">
            {data.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                className="tw:w-full tw:text-left tw:flex tw:gap-3 tw:items-start tw:border-b tw:border-gray-100 tw:py-3 tw:px-2 tw:cursor-pointer tw:bg-white hover:tw:bg-gray-50 focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-indigo-200"
                onClick={() => handleSelect(item)}
              >
                <div className="tw:flex-1">
                  <div className="tw:font-medium tw:text-base tw:text-gray-900">
                    {item.name}
                  </div>
                  {item.formattedAddress ? (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                      {item.formattedAddress}
                    </div>
                  ) : null}
                  {item.mobile ? (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                      Mobile: {item.mobile}
                    </div>
                  ) : null}
                  {item.email ? (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                      Email: {item.email}
                    </div>
                  ) : null}
                  {item.gstNumber ? (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                      GST: {item.gstNumber}
                    </div>
                  ) : null}
                </div>
                <div className="tw:flex tw:items-center tw:justify-center">
                  <ChevronRight className="tw:w-4 tw:h-4 tw:text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        ) : null}
        {data.length > 0 && hasMoreData && (
          <div className="tw:flex tw:justify-center tw:mt-4">
            <LoadMoreButton
              loadMore={loadMore}
              loading={isLoadingMore}
              totalCount={paginationRef.current.totalRecords || 0}
              loadedCount={data.length}
            />
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default RecipientModal;
