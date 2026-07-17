import { List } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppModal from "~/components/core/modal/AppModal";
import type { PaginationState } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { getData, prepareFilterParams, getCount } from "./helper";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  formData: Record<string, any>;
};

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const ViewVendorsModal = ({ show, callback, formData }: Props) => {
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

  useEffect(() => {
    if (show) {
      filterRef.current = {
        ...formData,
      };
      applyFilter();
    }
  }, [show, formData]);

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

  const getDescription = () => {
    const type = formData?.groupByType;
    const mapping: Record<string, string> = {
      received: "Vendors with at least one received purchase order.",
      notReceived: "Vendors with purchase orders not yet received.",
      total: "Vendors who have received purchase orders",
    };

    return mapping[type] || mapping["total"];
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div>
          <div className="tw:text-lg tw:font-semibold">List of Vendors</div>
          <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
            {getDescription()}
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <AppCard noPadding={true} className="tw:mt-4">
          <div className="tw:p-4">
            <Filter callback={handleFilterChange} />
          </div>
        </AppCard>

        {loading ? (
          <div className="tw:flex tw:justify-center tw:py-8 tw:h-36">
            <AppSpinner />
          </div>
        ) : null}

        <div className="tw:mt-2">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            fwSize="sm"
            loadedCount={data.length}
            className="tw:mb-2"
          />
        </div>
        {!loading && data.length === 0 ? <NoData /> : null}

        {data.map((item: any, index: number) => (
          <AppCard key={index} className="tw:mb-2">
            <div className="tw:border-b tw:border-gray-200 tw:pb-2 tw:mb-2">
              <div className="tw:font-semibold tw:text-base">
                {item.vendorInfo?.vendorName}
              </div>
              <div className="tw:text-gray-500 tw:text-sm tw:md:text-xs">
                ID: {item.vendorInfo?.vendorRefId}
              </div>
            </div>
            <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mb-2">
              <div>
                <div className="tw:text-gray-500 tw:text-sm tw:md:text-xs tw:mb-1">
                  Open POs
                </div>
                <div className="tw:text-blue-600 tw:text-sm tw:font-bold">
                  {item.notReceivedPOCount || 0}
                </div>
              </div>

              <div>
                <div className="tw:text-gray-500 tw:text-sm tw:md:text-xs tw:mb-1">
                  Open PO Value
                </div>
                <div className="tw:text-green-600 tw:text-sm tw:font-bold">
                  <Amount value={item.notReceivedPOValue || 0} />
                </div>
              </div>
            </div>
            <AppLink
              asLink
              href={`/dashboard/vendor/view/${item.vendorInfo?.vendorId}/purchase-order?tab=purchase-order`}
            >
              <AppButton
                color="primary"
                size="small"
                className="tw:w-full tw:md:w-autos"
              >
                <List className="tw:w-4 tw:h-4" />
                View Vendor
              </AppButton>
            </AppLink>
          </AppCard>
        ))}
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewVendorsModal;
