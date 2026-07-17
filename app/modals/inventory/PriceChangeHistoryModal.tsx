import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppCard from "~/components/core/card/AppCard";
import PaginationBlock from "~/components/core/pagination/PaginationBlock";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppDateInput from "~/components/core/form/AppDateInput";
import ProductService from "~/services/ProductService";
import CommonService from "~/services/CommonService";
import NoData from "~/components/core/no-data/NoData";

interface PriceChangeHistoryModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealData: {
    _id: string;
    name: string;
  } | null;
  type?: "Customer" | "Network";
}

interface PriceChangeLog {
  _id: string;
  dealId: string;
  oldData: {
    price: number;
    mrp: number;
    discount?: number;
  };
  newData: {
    price: number;
    mrp: number;
    discount?: number;
  };
  createdAt: string;
  createdBy: string;
  _reason: string;
  _createdBy?: {
    _id: string;
    name: string;
  };
}

interface PaginationState {
  activePage: number;
  rowsPerPage: number;
  startSlNo: number;
  endSlNo: number;
  totalRecords: number;
}

interface DateRange {
  from: string;
  to: string;
}

// Helper functions outside the component
const getData = async (params: Record<string, any>) => {
  try {
    const response = await ProductService.getRspLogs(params);
    if (response.statusCode === 200) {
      return response.data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching price change logs:", error);
    return [];
  }
};

const getUserDetails = async (userIds: string[]) => {
  try {
    if (userIds.length === 0) return [];

    const response = await CommonService.getUsers({
      select: "name,franchise",
      filter: { _id: { $in: userIds } },
    });

    if (response.statusCode === 200) {
      return response.data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user details:", error);
    return [];
  }
};

const prepareFilterParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  dealId: string,
  dateRange: DateRange,
  type: "Customer" | "Network" = "Customer"
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      dealId: dealId,
      applicableFor: type, // Add applicableFor to filter
    },
  };

  // Add date range filter if provided
  if (dateRange.from && dateRange.to) {
    params.filter.createdAt = {
      $gte: new Date(dateRange.from + "T00:00:00.000Z"),
      $lte: new Date(dateRange.to + "T23:59:59.999Z"),
    };
  }

  return params;
};

export const PriceChangeHistoryModal: React.FC<
  PriceChangeHistoryModalProps
> = ({ show, callback, dealData, type = "Customer" }) => {
  const [logs, setLogs] = useState<PriceChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTotalRecords, setLoadingTotalRecords] =
    useState<boolean>(false);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const dateRangeRef = useRef<DateRange>({
    from: "",
    to: "",
  });

  const { control } = useForm({
    defaultValues: {
      dateRange: undefined as Date | Date[] | undefined,
    },
  });

  useEffect(() => {
    if (show && dealData) {
      init();
    }
  }, [show, dealData]);

  const formatDateRange = (
    dateRange: Date | Date[] | undefined
  ): { from: string; to: string } => {
    if (!dateRange) return { from: "", to: "" };

    if (Array.isArray(dateRange)) {
      if (dateRange.length === 0) return { from: "", to: "" };
      if (dateRange.length === 1) {
        const dateStr = dateRange[0].toISOString().split("T")[0];
        return { from: dateStr, to: dateStr };
      }
      return {
        from: dateRange[0].toISOString().split("T")[0],
        to: dateRange[1].toISOString().split("T")[0],
      };
    }

    const dateStr = dateRange.toISOString().split("T")[0];
    return { from: dateStr, to: dateStr };
  };

  const handleDateChange = (dateRange: Date | Date[] | undefined) => {
    const formattedRange = formatDateRange(dateRange);
    dateRangeRef.current = formattedRange;
    filterRef.current.dateRange = dateRange;

    if (show && dealData) {
      applyFilter();
    }
  };

  const init = () => {
    // Reset pagination to first page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    applyFilter();
  };

  const applyFilter = async () => {
    if (!dealData) return;

    setIsLoading(true);
    setLoadingTotalRecords(true);

    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        dealData._id,
        dateRangeRef.current,
        type // Pass type to prepareFilterParams
      );

      const data = await getData(params);

      // Get user details for created by information
      const userIds = data
        .map((log: any) => log.createdBy)
        .filter((id: string) => id && id !== "System");

      const users = await getUserDetails(userIds);

      // Map user details to logs
      const logsWithUsers = data.map((log: any) => {
        const user = users.find((u: any) => u._id === log.createdBy);
        return {
          ...log,
          _createdBy: user,
        };
      });

      setLogs(logsWithUsers);

      // For now, set total records to data length (you might need a separate count API)
      paginationRef.current = {
        ...paginationRef.current,
        totalRecords: logsWithUsers.length,
      };
    } catch (error) {
      console.error("Error loading price change logs:", error);
      setLogs([]);
    } finally {
      setIsLoading(false);
      setLoadingTotalRecords(false);
    }
  };

  const handlePaginationChange = (data: {
    activePage: number;
    startSlNo: number;
    endSlNo: number;
  }) => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: data.activePage,
      startSlNo: data.startSlNo,
      endSlNo: data.endSlNo,
    };

    applyFilter();
  };

  const clearDateRange = () => {
    dateRangeRef.current = { from: "", to: "" };
    filterRef.current.dateRange = undefined;
    // Reset form values using react-hook-form
    control._reset({
      dateRange: undefined,
    });

    if (show && dealData) {
      applyFilter();
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={handleClose}>
        {type === "Customer" ? "Customer Price" : "Network Price"} History
      </AppModal.Title>
      <AppModal.Content className="ion-padding modal-bg">
        {/* Deal Information */}
        <AppCard className="shadow-sm border-0 mb-3">
          <div className="tw:text-sm tw:text-gray-500 tw:mb-1">
            Product Name
          </div>
          <div>
            <span className="tw:font-semibold tw:mb-1 tw:text-base">
              {dealData?.name}
            </span>
            <div className="tw:mt-1 tw:text-sm tw:text-gray-500">
              <span className="text-muted">ID: </span>
              <span className="font-weight-500">{dealData?._id}</span>
            </div>
          </div>
        </AppCard>

        {/* Date Range Filter */}
        <AppCard className="tw:mb-3">
          <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
            {dateRangeRef.current.from && dateRangeRef.current.to
              ? "Showing data from"
              : "Choose Date Range"}
          </div>

          <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-3 tw:items-end">
            <div>
              <Controller
                name="dateRange"
                control={control}
                render={({ field }) => (
                  <AppDateInput
                    callback={(value) => {
                      field.onChange(value);
                      handleDateChange(value);
                    }}
                    value={field.value}
                    size="sm"
                    dateConfig={{
                      mode: "range",
                    }}
                  />
                )}
              />
            </div>
          </div>
        </AppCard>

        {/* Price Change Logs */}
        <div className="tw:mb-3">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loadingTotalRecords}
            loadedCount={logs.length}
          />
        </div>

        {isLoading ? (
          <div className="tw:text-center tw:py-4">
            <div className="tw:animate-spin tw:rounded-full tw:h-8 tw:w-8 tw:border-b-2 tw:border-primary tw:mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <NoData />
        ) : (
          <>
            {logs.map((log) => (
              <AppCard key={log._id} className="tw:mb-3">
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                  <div>
                    <KeyValue label="Date" size="sm">
                      <DateFormat
                        value={log.createdAt}
                        formatStr="dd MMM yyyy"
                      />
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:line-clamp-1">
                        by {log._createdBy?.name || log.createdBy || "System"}
                      </div>
                    </KeyValue>
                  </div>
                  <div>
                    <KeyValue label="Old Price" size="sm">
                      <div className="tw:flex tw:gap-4">
                        <div className="tw:mb-1">
                          <span className="tw:text-xs tw:text-gray-400 tw:block">
                            Selling Price
                          </span>
                          <Amount
                            value={log.oldData.price}
                            decimalPlaces={2}
                            className="tw:text-red-500 tw:font-medium"
                          />
                        </div>
                        <div>
                          <span className="tw:text-xs tw:text-gray-400 tw:block">
                            MRP
                          </span>
                          <Amount
                            value={log.oldData.mrp}
                            decimalPlaces={2}
                            className="tw:font-medium"
                          />
                        </div>
                      </div>
                    </KeyValue>
                  </div>
                  <div>
                    <KeyValue label="New Price" size="sm">
                      <div className="tw:flex tw:gap-4">
                        <div className="tw:mb-1">
                          <span className="tw:text-xs tw:text-gray-400 tw:block">
                            Selling Price
                          </span>

                          <Amount
                            value={log.newData.price}
                            decimalPlaces={2}
                            className="tw:text-green-500 tw:font-medium"
                          />
                        </div>
                        <div>
                          <span className="tw:text-xs tw:text-gray-400 tw:block">
                            MRP
                          </span>
                          <Amount
                            value={log.newData.mrp}
                            decimalPlaces={2}
                            className="tw:font-medium"
                          />
                        </div>
                      </div>
                    </KeyValue>
                  </div>
                  <div className="tw:col-span-3">
                    <div className="tw:space-y-2">
                      <KeyValue label="Reason" size="sm">
                        <span className="tw:text-xs">
                          {log._reason || "N/A"}
                        </span>
                      </KeyValue>
                    </div>
                  </div>
                </div>
              </AppCard>
            ))}

            {logs.length > 0 && (
              <div className="tw:mt-3">
                <PaginationBlock
                  paginationConfig={paginationRef.current}
                  paginationCb={handlePaginationChange}
                  loadingTotalRecords={loadingTotalRecords}
                  showSummary={false}
                  size="sm"
                />
              </div>
            )}
          </>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default PriceChangeHistoryModal;
