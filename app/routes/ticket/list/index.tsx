import { Plus } from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import { defaultSummary, getData, prepareParams } from "./helper";
import Summary from "./components/Summary";
import AppCard from "~/components/core/card/AppCard";
import Filter from "./components/Filter";
import { useCallback, useEffect, useState, useRef } from "react";
import useAppNav from "~/hooks/useAppNav";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Ticket Management",
  },
];

const TicketList = () => {
  const { to } = useAppNav();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

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
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      // const totalRecords = await getCount(params);
      // paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    applyFilter();
  }, []);

  const onFilterChange = useCallback((data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  }, []);

  const handleCreateTicket = () => {
    to("/ticket/manage");
  };

  return (
    <>
      <AppHeader title="Ticket Management" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-4 tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
                Track and manage all support and operational tickets.
              </div>
            </div>
            <div>
              <AppButton onClick={handleCreateTicket}>
                <Plus />
                Create Ticket
              </AppButton>
            </div>
          </div>
          <Summary data={defaultSummary} />

          <AppCard>
            <Filter callback={onFilterChange} />
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default TicketList;
