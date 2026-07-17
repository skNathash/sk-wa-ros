import { debounce } from "lodash";
import { ChevronRight, MapPin, Search, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AppInput, AppSelect } from "~/components/core/form";
import Alpha from "~/components/core/alpha/Alpha";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import VendorService from "~/services/VendorService";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareFilterParams } from "./helper";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const vendorTypeOptions = VendorService.getVendorTypes().map((type) => ({
  value: type.name,
  label: type.name,
  langKey: type.name,
}));
vendorTypeOptions.unshift({
  value: "All",
  label: "All",
  langKey: "all",
});

const VendorsModal = ({
  show,
  callback,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}) => {
  const { register, getValues, control } = useForm();
  const [formKey, setFormKey] = useState<number>(0);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [alpha, setAlpha] = useState<string>("");

  const filteRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
  });

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
    };
    setLoading(true);
    setData([]);
    try {
      const params = prepareFilterParams(
        {
          ...filteRef.current,
          ...getValues(),
        },
        paginationRef.current
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const result = await getData(params);
      setData(result);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    setLoadingMore(true);
    try {
      const params = prepareFilterParams(
        {
          ...filteRef.current,
          ...getValues(),
        },
        paginationRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  useEffect(() => {
    if (show) {
      // clear search and dropdown when modal opens
      try {
        // reset form inputs by updating refs and calling apply
        filteRef.current = {};
      } catch (e) {
        // ignore
      }
      setAlpha("");
      // bump key to remount inputs so their internal state clears
      setFormKey((k) => k + 1);
      applyFilter();
    }
  }, [show]);

  const handleSearch = useCallback(
    debounce(() => {
      if (filteRef.current) {
        delete filteRef.current.alpha;
      }
      setAlpha("");
      applyFilter();
    }, 500),
    [applyFilter]
  );

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">Choose Vendor</div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:flex tw:gap-2 tw:items-center tw:mt-1 tw:mb-4">
          <AppInput
            key={`search-${formKey}`}
            name="search"
            register={register}
            onChange={handleSearch}
            size="sm"
            className="tw:w-full tw:flex-1"
            placeholder="Search by vendor name"
            leftIcon={<Search size={16} className="tw:text-gray-400" />}
          />

          {/* <Controller
            control={control}
            name="vendorType"
            render={({ field }) => (
              <AppSelect
                key={`vendorType-${formKey}`}
                options={vendorTypeOptions}
                onChange={field.onChange}
                placeholder="Vendor type"
              />
            )}
          /> */}
        </div>

        <Alpha
          selected={alpha}
          callback={(letter: string) => {
            setAlpha(letter);
            filteRef.current = { ...filteRef.current, alpha: letter };
            applyFilter();
          }}
          className="tw:mb-2"
        />

        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && data.length === 0 ? <NoData /> : null}
        {data.length > 0 ? (
          <div className="tw:space-y-2">
            {data.map((item) => {
              return (
                <div
                  key={item._id}
                  className="tw:flex tw:justify-between tw:gap-4 tw:border-b tw:border-gray-200 tw:py-3 tw:cursor-pointer tw:items-start hover:tw:bg-gray-50"
                  onClick={() => callback({ action: "select", data: item })}
                >
                  <div className="tw:flex tw:gap-3 tw:items-start tw:flex-1">
                    <div className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-gray-100 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-medium tw:text-gray-700">
                      {item.initials}
                    </div>

                    <div className="tw:flex-1">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <div className="tw:font-semibold tw:text-base tw:text-gray-900">
                            {item.name}
                          </div>
                          {item._vendorType ? (
                            <VendorTypeBadge
                              type={item._vendorType}
                              color={item._vendorTypeColor}
                              description={item._vendorTypeInfo}
                              className="tw:text-[10px]"
                              hideInfo={true}
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-4 tw:text-gray-600 tw:mt-1 tw:text-xs">
                        <div>
                          ID:{" "}
                          <span className="tw:font-medium tw:text-gray-800">
                            {item.vendorId}
                          </span>
                        </div>
                        {item._primaryContact?.mobile ? (
                          <div>
                            Mobile:{" "}
                            <span className="tw:font-medium tw:text-gray-800">
                              {item._primaryContact.mobile}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="tw:mt-2 tw:text-gray-500 tw:text-xs">
                        {item._fullAddress}
                      </div>
                    </div>
                  </div>

                  <div className="tw:flex tw:items-center tw:justify-center tw:text-gray-400">
                    <ChevronRight size={18} />
                  </div>
                </div>
              );
            })}
            {hasMoreData && !loading && (
              <div className="tw:flex tw:justify-center tw:py-8">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
              </div>
            )}
          </div>
        ) : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default VendorsModal;
