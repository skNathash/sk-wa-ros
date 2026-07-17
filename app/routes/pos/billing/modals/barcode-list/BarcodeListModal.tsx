import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import Alpha from "~/components/core/alpha/Alpha";
import { prepareParams, getData, getCount } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";
import { Copy, Search } from "lucide-react";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import { Skeleton } from "~/components/ui/skeleton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

interface BarcodeListModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
}

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const defaultFilter = {
  search: "",
  alpha: "",
};

const BarcodeListModal: React.FC<BarcodeListModalProps> = ({
  show,
  callback,
}) => {
  const appToast = useAppToast();

  const { register, getValues, setValue } = useForm({
    defaultValues: { search: defaultFilter.search },
  });

  const handleCopy = (barcode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    CommonService.copyToClipboard(barcode);
    appToast.show({ msg: "Barcode copied", color: "success" });
  };

  const handleSelect = (item: any) => {
    callback({ action: "select", data: { barcode: item.barcode } });
  };

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [activeAlpha, setActiveAlpha] = useState("");

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setData([]);
    setLoadingTotalRecords(true);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const list = await getData(params);
      setData(list);
      setTotal(totalRecords);
      setHasMoreData(list.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(
    debounce(() => {
      const val = (getValues("search") || "").toString();
      filterRef.current.search = val;
      applyFilter();
    }, 500),
    [getValues, applyFilter],
  );

  const handleAlphaChange = (value: string) => {
    setActiveAlpha(value);
    filterRef.current.alpha = value;
    applyFilter();
  };

  useEffect(() => {
    if (show) {
      paginationRef.current = { ...defaultPagination };
      filterRef.current = { ...defaultFilter };
      setValue("search", "");
      setActiveAlpha("");
      setData([]);
      applyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const list = await getData(params);
      setData((d) => [...d, ...list]);
      setHasMoreData(list.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMoreData, loadingMore]);

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-2xl tw:md:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <h2 className="tw:text-lg tw:font-bold">Barcode List</h2>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        <AppInput
          name="search"
          placeholder="Search by Barcode or Deal Name ..."
          register={register}
          onChange={handleSearch}
          leftIcon={<Search className="tw:text-gray-500" size={16} />}
          className="tw:mb-2 tw:mt-1"
        />

        <Alpha
          selected={activeAlpha}
          callback={handleAlphaChange}
          className="tw:mb-3"
        />

        <div className="tw:space-y-2">
          <div className="tw:mb-2 tw:flex tw:justify-between">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loadingTotalRecords}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>

          {data.map((item, index) => (
            <div
              key={item._id || index}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(item)}
              className="tw:border tw:rounded tw:p-3 tw:flex tw:justify-between tw:items-center tw:cursor-pointer tw:hover:bg-gray-50"
            >
              <div>
                <div className="tw:font-semibold tw:text-sm">
                  {item.barcode || "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {item.name || "-"}
                </div>
              </div>
              {item.barcode && (
                <button
                  onClick={(e) => handleCopy(item.barcode, e)}
                  className="tw:p-1.5 tw:rounded tw:text-gray-400 tw:hover:text-gray-600 tw:hover:bg-gray-100 tw:cursor-pointer"
                >
                  <Copy size={14} />
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="tw:space-y-2">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="tw:border tw:rounded tw:p-3 tw:flex tw:justify-between tw:items-center"
                >
                  <div className="tw:w-3/4">
                    <Skeleton className="tw:h-4 tw:w-2/3 tw:mb-2" />
                    <Skeleton className="tw:h-3 tw:w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && data.length < total && (
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={total}
              loadedCount={data.length}
            />
          )}

          {!loading && data.length === 0 && <NoData />}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default BarcodeListModal;
