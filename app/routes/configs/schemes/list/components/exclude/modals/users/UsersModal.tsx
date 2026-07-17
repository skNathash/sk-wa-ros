import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Phone, MapPin, User } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";

interface UsersModalProps {
  show: boolean;
  onClose: () => void;
  callback: (args: { action: "add" | "remove"; item: any }) => void;
}

const UsersModal = ({ show, onClose, callback }: UsersModalProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accessConfig, setAccessConfig] = useState<any>(null);

  const methods = useForm({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef({
    search: "",
    alpha: "",
  });

  const fetchAccessConfig = useCallback(async () => {
    try {
      const res = await FranchiseService.getAccessConfig();
      if (res.statusCode === 200) {
        setAccessConfig(res.data?.data?.[0] || null);
      }
    } catch (error) {
      console.error("Error fetching access config:", error);
    }
  }, []);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setData([]);

    try {
      // Sync filterRef with current form values
      const formValues = methods.getValues();
      filterRef.current = { ...formValues };

      const params = prepareParams(filterRef.current, paginationRef.current);
      const [usersData, totalRecords] = await Promise.all([
        getData(params),
        getCount(params),
      ]);

      const currentExcludedList =
        accessConfig?.schemeExcludeFranchiseList || [];
      const updatedResult = (usersData || []).map((user: any) => {
        const userId = user._id || user.id;
        const isExcluded = currentExcludedList.some(
          (item: any) => (item.id || item._id) === userId,
        );
        return { ...user, isExcluded };
      });

      setData(updatedResult);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(usersData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error applying filters:", error);
      appToast.show({ msg: "Failed to fetch customers", color: "danger" });
    } finally {
      setLoading(false);
    }
  }, [accessConfig, methods, appToast]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      paginationRef.current.activePage += 1;

      const params = prepareParams(filterRef.current, paginationRef.current);
      const usersData = await getData(params);

      const currentExcludedList =
        accessConfig?.schemeExcludeFranchiseList || [];
      const updatedResult = (usersData || []).map((user: any) => {
        const userId = user._id || user.id;
        const isExcluded = currentExcludedList.some(
          (item: any) => (item.id || item._id) === userId,
        );
        return { ...user, isExcluded };
      });

      setData((prev) => [...prev, ...updatedResult]);
      setHasMoreData(usersData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [accessConfig, hasMoreData, loadingMore]);

  useEffect(() => {
    if (show) {
      fetchAccessConfig();
    }
  }, [show, fetchAccessConfig]);

  useEffect(() => {
    if (show) {
      applyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]); // Only trigger when modal opens. Filter changes trigger applyFilter manually.

  const debouncedSearch = useDebouncedCallback(() => {
    methods.setValue("alpha", "");
    applyFilter();
  }, 500);

  const handleAlphaChange = (val: string) => {
    methods.setValue("search", "");
    methods.setValue("alpha", val);
    applyFilter();
  };

  // Sync isExcluded status when accessConfig changes
  useEffect(() => {
    const currentExcludedList = accessConfig?.schemeExcludeFranchiseList || [];
    setData((prev) =>
      prev.map((user) => {
        const userId = user._id || user.id;
        const isExcluded = currentExcludedList.some(
          (item: any) => (item.id || item._id) === userId,
        );
        return { ...user, isExcluded };
      }),
    );
  }, [accessConfig]);

  const handleAction = async (user: any, action: "add" | "remove") => {
    setSubmitting(true);
    try {
      const configId = accessConfig?._id;
      let currentList: any[] = accessConfig?.schemeExcludeFranchiseList || [];

      const userId = user._id || user.id;
      let newList = [...currentList];

      const itemToUpdate = {
        id: userId,
        refId: user.franchiseId,
        name: user.name || user.ownerDetails?.name,
        mobile: user.mobile,
        location: user.location,
        city: user.city || user.town,
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        displayImg: user.displayImg,
        _displayImg: user._displayImg,
      };

      if (action === "add") {
        if (newList.some((item) => (item.id || item._id) === userId)) {
          appToast.show({
            msg: "Customer already excluded",
            color: "warning",
          });
          setSubmitting(false);
          return;
        }
        newList.unshift(itemToUpdate);
      } else {
        newList = newList.filter((item) => (item.id || item._id) !== userId);
      }

      const payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        schemeExcludeFranchiseList: newList.map((item) => ({
          id: item.id || item._id,
          refId: item.refId,
          name: item.name,
          mobile: item.mobile,
          city: item.city,
          district: item.district,
          state: item.state,
          pincode: item.pincode,
          displayImg: item.displayImg,
          _displayImg: item._displayImg,
        })),
      };

      let res;
      if (configId) {
        res = await FranchiseService.updateAccessConfig(configId, payload);
      } else {
        res = await FranchiseService.createAccessConfig(payload);
      }

      if (res.statusCode === 200) {
        appToast.show({
          msg:
            action === "add"
              ? "Customer added to exclude list"
              : "Customer removed from exclude list",
          color: "success",
        });

        // Update local state instead of re-fetching
        setAccessConfig((prev: any) => ({
          ...(prev || {}),
          _id: configId || res.data?.data?.[0]?._id || res.data?.data?._id,
          schemeExcludeFranchiseList: newList,
        }));

        callback({ action, item: itemToUpdate });
      } else {
        appToast.show({
          msg: res.data?.message || `Failed to ${action} customer`,
          color: "danger",
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing customer:`, error);
      appToast.show({ msg: "An error occurred", color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const alphaValue = methods.watch("alpha");

  return (
    <AppModal show={show} callback={(a) => a.action === "close" && onClose()}>
      <AppModal.Title onClose={onClose}>Exclude B2B Customer</AppModal.Title>
      <AppModal.Content noPadding>
        <div className="tw:flex tw:flex-col tw:h-[75vh] tw:md:h-[600px] tw:w-full">
          {/* Sticky Filter Section */}
          <div className="tw:p-4 tw:pb-3 tw:bg-gray-50 tw:border-b tw:shrink-0">
            <div className="tw:mb-3">
              <AppInput
                name="search"
                register={methods.register}
                onChange={debouncedSearch}
                size="sm"
                placeholder="Search by Name or Mobile..."
                leftIcon={<Search size={16} className="tw:text-gray-400" />}
                className="tw:bg-white"
                autoFocus
              />
            </div>
            <Alpha callback={handleAlphaChange} selected={alphaValue} />
          </div>

          {/* Scrollable List Section */}
          <div className="tw:flex-1 tw:overflow-y-auto tw:p-4">
            {loading ? (
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:gap-3">
                <div className="tw:w-10 tw:h-10 tw:border-4 tw:border-primary/20 tw:border-t-primary tw:rounded-full tw:animate-spin" />
                <div className="tw:text-sm tw:font-medium tw:text-gray-500">
                  Searching for customers...
                </div>
              </div>
            ) : data.length > 0 ? (
              <div className="tw:flex tw:flex-col tw:gap-3">
                {data.map((user) => (
                  <div
                    key={user._id}
                    className="tw:flex tw:items-center tw:justify-between tw:p-3 tw:border tw:border-gray-100 tw:rounded-xl tw:bg-white tw:hover:border-primary/40 tw:hover:shadow-md tw:transition-all tw:group tw:cursor-pointer"
                    onClick={() =>
                      !submitting &&
                      handleAction(user, user.isExcluded ? "remove" : "add")
                    }
                  >
                    <div className="tw:flex tw:items-center tw:gap-4 tw:flex-1 tw:min-w-0">
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-x-2 tw:gap-y-1">
                          <div className="tw:font-bold tw:text-sm tw:text-gray-900">
                            {user.name || user.ownerDetails?.name}
                          </div>
                          {user.isExcluded && (
                            <span className="tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:bg-red-50 tw:text-red-500 tw:border tw:border-red-100 tw:rounded tw:uppercase tw:tracking-wider tw:shrink-0">
                              Excluded
                            </span>
                          )}
                        </div>
                        <div className="tw:mt-1 tw:flex tw:flex-col tw:gap-1">
                          <div className="tw:text-xs tw:font-semibold tw:text-primary/80 tw:flex tw:items-center tw:gap-1.5">
                            <Phone
                              size={12}
                              className="tw:shrink-0 tw:opacity-70"
                            />
                            {user.mobile}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="tw:ml-4">
                      <AppButton
                        size="small"
                        fill={user.isExcluded ? "solid" : "outline"}
                        color={user.isExcluded ? "danger" : "primary"}
                        isLoading={submitting}
                        disabled={submitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(
                            user,
                            user.isExcluded ? "remove" : "add",
                          );
                        }}
                        className="tw:min-w-[90px] tw:rounded-full tw:font-semibold"
                      >
                        {user.isExcluded ? "Remove" : "Exclude"}
                      </AppButton>
                    </div>
                  </div>
                ))}

                {hasMoreData && (
                  <div className="tw:mt-4 tw:pb-4">
                    <LoadMoreButton
                      loadMore={loadMore}
                      loading={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:text-center">
                <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mb-4">
                  <Search size={28} className="tw:text-gray-300" />
                </div>
                <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  No customers found
                </h3>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:max-w-[200px]">
                  {methods.getValues().search || alphaValue
                    ? "Try adjusting your filters or search keywords"
                    : "Start typing to search for customers to exclude"}
                </p>
              </div>
            )}
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default UsersModal;
