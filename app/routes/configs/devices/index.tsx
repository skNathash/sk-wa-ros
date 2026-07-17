import { useEffect, useRef, useState } from "react";
import AppHeader from "~/components/core/header/AppHeader";

import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PickerDeviceService from "~/services/PickerDeviceService";
import type { PaginationState } from "~/types/CommonTypes";
import Item from "./components/Item";
import ManagePickerDevice from "./modals/ManagePickerDevice";
import AppButton from "~/components/core/button/AppButton";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import { debounce } from "lodash";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import AuthService from "~/services/AuthService";
import useAppAlert from "~/hooks/useAlert";
import useAppToast from "~/hooks/useAppToast";

const title = "Picker Devices";

const Devices = () => {
  const appAlert = useAppAlert();
  const appToast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; data?: any }>({
    show: false,
    data: undefined,
  });

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 1,
    totalRecords: 0,
  });

  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  const handleSearchChange = debounce(() => {
    applyFilter();
  }, 300);

  useEffect(() => {
    applyFilter();
  }, []);

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
    };

    setLoading(true);

    const params = prepareFilters(
      { ...filterRef.current, ...getValues() },
      paginationRef.current
    );

    const response = await getData(params);

    setData(response.data);
    setHasMoreData(response.data.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareFilters(
        { ...filterRef.current, ...getValues() },
        paginationRef.current
      );
      const response = await getData(params);
      setData((prev) => [...prev, ...response.data]);
      setHasMoreData(response.data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAdd = () => {
    setModal({ show: true, data: undefined });
  };

  const handleModalCallback = (res: { action: string; data?: any }) => {
    setModal({ show: false, data: undefined });
    if (res.action === "success") {
      applyFilter();
    }
  };

  const handleItemCallback = (res: {
    action: string;
    data?: any;
    index?: number;
  }) => {
    setModal({ show: false, data: undefined });
    if (res.action === "edit") {
      handleEdit(res.data);
    } else if (res.action === "markAsInactive") {
      handleMarkAsInactive(res.data, res.index);
    } else if (res.action === "markAsActive") {
      handleMarkAsActive(res.data, res.index);
    }
  };

  const handleMarkAsInactive = (data: any, index?: number) => {
    appAlert.confirm({
      header: "Mark as Inactive",
      msg: "Are you sure you want to mark this device as inactive?",
      successCb: async () => {
        const response = await PickerDeviceService.updatePickerDevice(
          data._id,
          { status: "Inactive", remarks: "Marked as inactive" }
        );
        if (response.statusCode === 200) {
          appToast.show({
            msg: "Device marked as inactive successfully",
            color: "success",
          });
          if (typeof index === "number") {
            setData((prev) => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: "Inactive",
              };
              return updated;
            });
          }
        } else {
          appToast.show({
            msg: response.data?.message || "Something went wrong",
            color: "danger",
          });
        }
      },
    });
  };

  const handleEdit = (data: any) => {
    setModal({ show: true, data });
  };

  const handleMarkAsActive = (data: any, index?: number) => {
    appAlert.confirm({
      header: "Mark as Active",
      msg: "Are you sure you want to mark this device as active?",
      successCb: async () => {
        const response = await PickerDeviceService.updatePickerDevice(
          data._id,
          { status: "Active", remarks: "Marked as active" }
        );
        if (response.statusCode === 200) {
          appToast.show({
            msg: "Device marked as active successfully",
            color: "success",
          });
          if (typeof index === "number") {
            setData((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], status: "Active" };
              return updated;
            });
          }
        } else {
          appToast.show({
            msg: response.data?.message || "Something went wrong",
            color: "danger",
          });
        }
      },
    });
  };

  return (
    <>
      <AppHeader title={title} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <AppCard>
            <AppInput
              name="search"
              placeholder="Search by name..."
              register={register}
              size="sm"
              onChange={handleSearchChange}
            />
          </AppCard>

          {loading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
              <div className="tw-text-center tw-text-sm tw-text-gray-500">
                Loading...
              </div>
            </div>
          ) : null}

          {!loading && data.length === 0 ? (
            <AppCard>
              <NoData />
            </AppCard>
          ) : null}

          {data.map((item, idx) => (
            <Item
              key={item._id}
              data={item}
              index={idx}
              callback={handleItemCallback}
            />
          ))}

          {hasMoreData && !loading ? (
            <div className="tw-flex tw-justify-center tw-mt-6">
              <div className="tw:flex tw:justify-center tw:mt-6">
                <AppButton
                  fill="outline"
                  color="light"
                  size="small"
                  onClick={loadMore}
                  isLoading={loadingMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading" : "Load More"}
                </AppButton>
              </div>
            </div>
          ) : null}

          <div className="tw-text-end tw-mt-4">
            <AppButton onClick={handleAdd} type="button">
              <PlusCircle className="tw:mr-1" size={16} />
              Add Device
            </AppButton>
          </div>
        </div>
      </div>

      <ManagePickerDevice
        show={modal.show}
        callback={handleModalCallback}
        data={modal.data}
      />
    </>
  );
};

const breadcrumbs = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Picker Devices",
  },
];

const getData = async (params: Record<string, any>) => {
  const response = await PickerDeviceService.getPickerDevices(params);
  return response;
};

const prepareFilters = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      franchiseId: AuthService.getLoggedInUserId(),
    },
  };
  if (filters.search && filters.search.trim()) {
    params.filter.name = { $regex: filters.search.trim() };
  }
  return params;
};

export default Devices;
