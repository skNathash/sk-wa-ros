import { useEffect, useRef, useState } from "react";
import { BoxIcon, File } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppTab from "~/components/core/tab/AppTab";
import AppModal from "~/components/core/modal/AppModal";
import { getCount, getData, prepareFilterParams } from "./helper";

import { FormProvider, useForm } from "react-hook-form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { PaginationState, TabItem } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import Item from "./components/Item";
import BoxesView from "./boxes/BoxesView";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const TABS: TabItem[] = [
  { key: "purchase-order", name: "Purchase order", icon: <File /> },
  { key: "boxes", name: "Boxes", icon: <BoxIcon /> },
];

const ViewPosModal = ({
  show,
  callback,
  formData,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  formData: Record<string, any>;
}) => {
  const formMethods = useForm();
  const [activeTab, setActiveTab] = useState<string>("purchase-order");

  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
  });

  const applyFilter = async () => {
    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };
    const data = await getData(
      prepareFilterParams(filterRef.current, paginationRef.current)
    );

    const totalCount = await getCount(
      prepareFilterParams(filterRef.current, paginationRef.current)
    );
    paginationRef.current.totalRecords = totalCount;

    setHasMoreData(totalCount > data.length);
    setData(data);
    setLoading(false);
  };

  const getTitle = () => {
    const type = formData?.groupByType || formData?.type || "total";
    const mapping: Record<string, string> = {
      received: "Received",
      notReceived: "Not Received",
      total: "All",
    };

    const label = mapping[type] || mapping["total"] || "All";
    // For Purchase Orders use plural
    return `List of ${label} Purchase Orders`;
  };

  useEffect(() => {
    if (show) {
      filterRef.current = {
        ...formData,
      };
      formMethods.setValue("search", formData.search);
      applyFilter();
    }
  }, [show, formData, formMethods]);

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      const result = await getData(
        prepareFilterParams(filterRef.current, paginationRef.current)
      );
      setData((prev: any[]) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleFilterChange = ({
    formData,
  }: {
    formData: Record<string, any>;
  }) => {
    filterRef.current = {
      ...filterRef.current,
      ...formData,
    };
    applyFilter();
  };

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">{getTitle()}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:md:max-h-[90vh] modal-bg">
        <div className="tw:mt-2">
          {formData.groupByType === "received" && (
            <AppTab
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={(t) => setActiveTab(t.key)}
              variant="tabs"
              className="tw:mb-3"
            />
          )}

          {activeTab === "purchase-order" ? (
            <>
              <AppCard noPadding={true} className="tw:mt-0">
                <div className="tw:p-4">
                  <FormProvider {...formMethods}>
                    <Filter callback={handleFilterChange} />
                  </FormProvider>
                </div>
              </AppCard>
              <div className="tw:mt-2">
                {loading ? (
                  <div className="tw:flex tw:justify-center tw:items-center tw:py-8 tw:min-h-60">
                    <AppSpinner />
                  </div>
                ) : null}

                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loading}
                  fwSize="sm"
                  loadedCount={data.length}
                  className="tw:mb-2"
                />
                {!loading && data.length === 0 ? <NoData /> : null}

                {data.map((item: any, index: number) => (
                  <Item
                    key={index}
                    item={item}
                    groupByType={formData?.groupByType}
                  />
                ))}

                {hasMoreData && !loading && (
                  <div className="tw:flex tw:justify-center tw:mt-3">
                    <LoadMoreButton
                      loadMore={loadMore}
                      loading={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <BoxesView />
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewPosModal;
