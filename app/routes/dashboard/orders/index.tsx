import { useCallback, useEffect, useRef, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import OmsService from "~/services/OmsService";
import { useHeaderTitle } from "~/hooks/useHeaderTitle";
import AuthService from "~/services/AuthService";
import OrderTable from "./components/OrderTable";
import AppCard from "~/components/core/card/AppCard";

interface FilterState {
  search?: string;
  status?: string;
  orderType?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface PaginationState {
  activePage: number;
  rowsPerPage: number;
  startSlNo: number;
  endSlNo: number;
  totalRecords: number;
}

const Orders = () => {
  const { setTitle } = useHeaderTitle();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const filterRef = useRef<FilterState>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    setTitle("Orders");
  }, []);

  const init = useCallback(() => {
    // Reset pagination to first page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    applyFilter();
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
    } finally {
      setLoading(false);
    }

    loadList();
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current
      );
      const ordersData = await getData(params);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <AppCard title="Orders">
        <OrderTable data={orders} loading={loading} />
      </AppCard>
    </div>
  );
};

const getData = async (params: Record<string, any>) => {
  try {
    const response = await OmsService.getOrders(params);
    if (response.statusCode === 200 && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching orders data:", error);
    return [];
  }
};

const getCount = async (params: Record<string, any>) => {
  try {
    const countParams: any = { ...params, outputType: "count" };
    delete countParams.page;
    delete countParams.count;

    const response = await OmsService.getOrders(countParams);
    if (response.statusCode === 200 && response.data?.[0]) {
      return response.data[0].totalDocs || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching count:", error);
    return 0;
  }
};

const prepareFilterParams = (
  filterData: FilterState,
  pagination: PaginationState
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      "franchise.id": AuthService.getLoggedInUserId(),
    },
  };

  // Add search filter
  if (filterData.search) {
    p.filter.$or = [
      { _id: { $regex: filterData.search, $options: "i" } },
      {
        "subOrders.name": { $regex: filterData.search, $options: "i" },
      },
      {
        "franchise.name": { $regex: filterData.search, $options: "i" },
      },
    ];
  }

  // Add status filter
  if (filterData.status) {
    p.filter.status = {
      $in: filterData.status.split(","),
    };
  }

  // Add order type filter
  if (filterData.orderType) {
    p.filter.orderType = filterData.orderType;
  }

  // Add date range filter
  if (filterData.dateRange) {
    p.filter.createdAt = {
      $gte: startOfDay(filterData.dateRange.from),
      $lte: endOfDay(filterData.dateRange.to),
    };
  }

  return p;
};

export default Orders;
