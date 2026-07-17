import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Phone,
  Search,
  User,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import SelectedUser from "./components/SelectedUser";
import Alpha from "~/components/core/alpha/Alpha";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  type: "B2C" | "B2B";
};

const UserSearchModal = ({ show, callback, type = "B2C" }: Props) => {
  const appToast = useAppToast();

  const { register, getValues, setValue, control } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  const [display, setDisplay] = useState<"list" | "config">("list");

  const alpha = useWatch({
    control,
    name: "alpha",
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectedItem, setSelectedItem] = useState<any>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setData([]);

    const params = prepareParams(getValues(), paginationRef.current);
    const response = await getData(params, type);

    const count = await getCount(params, type);
    paginationRef.current.totalRecords = count;

    setData(response);
    setLoading(false);
    setHasMore(response.length === paginationRef.current.rowsPerPage);
  };

  const debouncedSearch = useDebouncedCallback(applyFilter, 500, {
    maxWait: 1000,
  });

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);
    const params = prepareParams(getValues(), paginationRef.current);
    const response = await getData(params, type);
    setData([...data, ...response]);
    setLoadingMore(false);
    setHasMore(response.length === paginationRef.current.rowsPerPage);
  };

  useEffect(() => {
    if (show) {
      setSelectedItem(null);
      setDisplay("list");
      // clear search and alpha when modal opens
      setValue("alpha", "");
      setValue("search", "");
      applyFilter();
    }
  }, [show]);

  const handleSearch = () => {
    setValue("alpha", "");
    debouncedSearch();
  };

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    setDisplay("config");
  };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    setValue("search", "");
    debouncedSearch();
  };

  const handleSelectedUserCallback = (params: {
    action: string;
    data?: any;
  }) => {
    setSelectedItem((prev: any) => ({
      ...prev,
      config: {
        ...(params.data || {}),
      },
    }));
  };

  const handleSave = useCallback(async () => {
    const user = selectedItem;
    if (!user?._id) {
      appToast.show({
        msg: "User not selected",
        color: "error",
      });
      return;
    }

    if (!user.config?.cod && !user.config?.prepaid) {
      appToast.show({
        msg: "At least one payment option must be enabled",
        color: "error",
      });
      return;
    }

    const res = await FranchiseService.updateUserPaymentConfig({
      businessType: type,
      buyerId: user._id,
      codEnabled: user.config.cod,
      prepaidEnabled: user.config.prepaid,
      isActive: true,
      remarks: "COD and Prepaid payment updated",
    });

    if (res?.statusCode === 200 || res?.statusCode === 201) {
      appToast.show({
        msg: "User payment config updated successfully",
        color: "success",
      });
      // notify parent that a user was saved so parent can refresh data
      callback({ action: "saved", data: user });
    } else {
      appToast.show({
        msg: res?.data?.message || "Failed to update user payment config",
        color: "error",
      });
    }
  }, [selectedItem, callback, type]);

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        Choose the User
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        {display === "list" ? (
          <>
            <div className="tw:sticky tw:top-0 tw:z-10 tw:bg-white tw:mb-2">
              <AppInput
                name="search"
                placeholder="Search..."
                register={register}
                inputClassName="tw:w-full tw:mt-1"
                onChange={handleSearch}
                leftIcon={<Search size={16} className="tw:text-gray-500" />}
              />
            </div>

            <Alpha
              selected={alpha}
              callback={handleAlphaChange}
              className="tw:mb-2"
            />

            {loading ? (
              <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
                <AppSpinner />
              </div>
            ) : (
              <>
                {data.length === 0 ? (
                  <NoData />
                ) : (
                  <div>
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={data.length}
                      fwSize="sm"
                      className="tw:mb-2"
                    />
                    <div>
                      {data.map((item) => (
                        <div
                          key={item._id}
                          className="tw:flex tw:items-center tw:justify-between tw:p-2 tw:border-b tw:border-gray-200 tw:cursor-pointer tw:hover:bg-gray-50"
                          onClick={() => handleSelect(item)}
                        >
                          <div>
                            <div className="tw:font-medium">{item.name}</div>
                            <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                              {item.addressStr}
                            </div>
                            <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                              <Phone size={12} />
                              {item.mobile || "-"}
                            </div>
                          </div>
                          <div>
                            <ChevronRight />
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasMore && !loading && data.length > 0 && (
                      <div className="tw:flex tw:justify-center tw:mt-4">
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
              </>
            )}
          </>
        ) : (
          <>
            <SelectedUser
              user={selectedItem}
              callback={handleSelectedUserCallback}
              type={type}
            />
          </>
        )}
      </AppModal.Content>
      {display === "config" && (
        <AppModal.Footer>
          <div className="tw:flex tw:gap-2 tw:w-full tw:justify-between">
            <AppButton
              onClick={() => setDisplay("list")}
              fill="outline"
              color="light"
            >
              <ArrowLeft />
              Back to list
            </AppButton>
            <AppButton onClick={handleSave} fill="solid" color="primary">
              <Check />
              Save
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default UserSearchModal;
