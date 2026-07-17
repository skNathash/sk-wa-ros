import { Package } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import useAppToast from "~/hooks/useAppToast";
import ViewBoxItems from "~/shared/orders/receive-box/modals/view-box-items/ViewBoxItems";
import type { PaginationState, TabItem } from "~/types/CommonTypes";
import BulkBoxReceiveModal from "../receive-box/modals/bulk-box/BulkBoxReceiveModal";
import ReceiveBoxModal from "../receive-box/modals/receive-box/ReceiveBoxModal";
import BoxItem from "./components/BoxItem";
import Summary from "./components/Summary";
import { getCount, getData, prepareParams } from "./helper";

const defaultFilter: Record<string, any> = {
  search: "",
  dateRange: null,
  status: "",
  feature: "purchase",
  vendorId: "",
};

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const OrderBoxes = ({
  orderId,
  // optional counts can be provided by parent. If not provided we'll fetch them
  receivedCount = 0,
  notReceivedCount = 0,
  callback,
}: {
  orderId: string;
  receivedCount?: number;
  notReceivedCount?: number;
  callback?: (a: { action: string; data?: any }) => void;
}) => {
  // tabs are empty by default and will be populated based on counts
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const appToast = useAppToast();
  const MAX_SELECTION = 5;

  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [selectedBoxes, setSelectedBoxes] = useState<Record<string, any>>({});

  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [countSummary, setCountSummary] = useState<{
    count: number;
    totalItems: number;
    totalUnits: number;
    totalValue: number;
  }>({ count: 0, totalItems: 0, totalUnits: 0, totalValue: 0 });

  const [activeTab, setActiveTab] = useState<string>("");

  const filteRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const [receivePackageModal, setReceivePackageModal] = useState({
    show: false,
    data: {
      orderId: "",
      boxNo: "",
    },
  });

  const [viewBoxItemsModal, setViewBoxItemsModal] = useState<{
    show: boolean;
    boxId?: string | null;
  }>({
    show: false,
    boxId: null,
  });

  const [bulkProcessModal, setBulkProcessModal] = useState<{
    show: boolean;
    boxIds: string[];
  }>({
    show: false,
    boxIds: [],
  });

  const applyFilter = async () => {
    setLoading(true);
    setBoxes([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    const params = prepareParams(filteRef.current, paginationRef.current);
    const data = await getData(params, filteRef.current.tab);

    const totalCountRes = await getCount(params, filteRef.current.tab);
    // totalCountRes is an object: { count, totalItems, totalUnits, totalValue }
    paginationRef.current.totalRecords = totalCountRes?.count || 0;
    setHasMoreData((totalCountRes?.count || 0) > data.length);
    setCountSummary({
      count: totalCountRes?.count || 0,
      totalItems: totalCountRes?.totalItems || 0,
      totalUnits: totalCountRes?.totalUnits || 0,
      totalValue: totalCountRes?.totalValue || 0,
    });

    setBoxes(data);
    setLoading(false);
  };

  useEffect(() => {
    const setup = () => {
      // derive tabs only from props (no API calls here)

      const nextTabs: TabItem[] = [];
      if (notReceivedCount > 0) {
        nextTabs.push({
          name: `Not Received Boxes (${notReceivedCount})`,
          key: "not-received",
        });
      }
      if (receivedCount > 0) {
        nextTabs.push({
          name: `Received Boxes (${receivedCount})`,
          key: "received",
        });
      }

      setTabs(nextTabs);

      const defaultTab = nextTabs[0]?.key ?? "";

      setActiveTab(defaultTab);

      filteRef.current = {
        orderId: orderId,
        tab: defaultTab || "not-received",
      };

      // after setting up tabs and default tab, load data
      applyFilter();
    };

    setup();
  }, [orderId, receivedCount, notReceivedCount]);

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    const params = prepareParams(filteRef.current, paginationRef.current);
    const data = await getData(params, filteRef.current.tab);
    setBoxes((prev) => [...prev, ...data]);
    setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  const handleSkReceivePackageModalCallback = (data: any) => {
    setReceivePackageModal({
      show: false,
      data,
    });
    callback?.({ action: "receive", data });
    applyFilter();
  };

  const boxCallback = (a: { action: string; data: any }) => {
    if (a.action === "receive") {
      setReceivePackageModal({
        show: true,
        data: {
          orderId: a.data.orderData?.refId2,
          boxNo: a.data.refNo,
        },
      });
    } else if (a.action === "view-items") {
      // open modal to view items for this box
      setViewBoxItemsModal({ show: true, boxId: a.data?.refNo });
    }
  };

  const handleSelect = (id: string, checked: boolean, box?: any) => {
    // Prevent selecting more than MAX_SELECTION boxes
    if (checked) {
      const alreadySelected = !!selectedBoxes[id];
      const count = Object.keys(selectedBoxes).length;
      if (!alreadySelected && count >= MAX_SELECTION) {
        appToast.show({
          msg: `You can select maximum ${MAX_SELECTION} boxes`,
          color: "warning",
        });
        return;
      }
    }

    setSelectedBoxes((prev) => {
      const next = { ...prev };
      if (checked) next[id] = box ?? true;
      else delete next[id];
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedBoxes({});
  };

  const handleReceiveAll = () => {
    const selectedList = boxes.filter((b: any) => !!selectedBoxes[b.refNo]);
    if (selectedList.length === 0) {
      appToast.show({
        msg: "Please select at least one box to receive",
        color: "warning",
      });
      return;
    }

    // BulkBoxReceiveModal expects an array of boxIds (refNos/invoiceNos)
    const ids = selectedList.map((b: any) => b.refNo).filter(Boolean);
    setBulkProcessModal({ show: true, boxIds: ids });
  };

  const handleBulkProcessModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    setBulkProcessModal({ show: false, boxIds: [] });
    callback?.({ action: "receive", data: a.data });
    clearSelection();
    applyFilter();
  };

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    filteRef.current = {
      ...filteRef.current,
      tab: tab.key,
    };
    // clear any selected boxes when switching tabs
    clearSelection();
    applyFilter();
  };

  const handleViewModalCb = (a: { action: string; data?: any }) => {
    setViewBoxItemsModal({ show: false, boxId: null });
  };

  return (
    <>
      {tabs.length > 0 ? (
        <AppTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="tw:mb-4"
        />
      ) : null}

      <Summary
        boxesCount={countSummary.count}
        value={countSummary.totalValue}
        items={countSummary.totalItems}
        units={countSummary.totalUnits}
      />

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && boxes.length === 0 && (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
          <NoData />
        </div>
      )}

      <div className="tw:mb-3">
        {Object.keys(selectedBoxes).length > 0 ? (
          <div className="tw:flex tw:items-center tw:justify-between">
            {/* Left column: selected count + clear button */}
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:text-sm tw:text-gray-700">
                {Object.keys(selectedBoxes).length} box(es) selected
              </div>
              <button
                onClick={clearSelection}
                className="tw:text-xs tw:text-blue-600"
              >
                Clear
              </button>
            </div>

            {/* Right column: receive button */}
            <div className="tw:flex tw:items-center">
              <AppButton
                color="success"
                onClick={handleReceiveAll}
                size="small"
              >
                <Package />
                Receive Selected
              </AppButton>
            </div>
          </div>
        ) : null}
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {boxes.map((box) => {
          const selectedCount = Object.keys(selectedBoxes).length;
          const isSelected = !!selectedBoxes[box.refNo];
          const disableCheckbox = selectedCount >= MAX_SELECTION && !isSelected;

          return (
            <BoxItem
              key={box._id}
              box={box}
              callback={boxCallback}
              isSelected={isSelected}
              onSelect={handleSelect}
              showCheckbox={activeTab === "not-received"}
              showReceive={activeTab === "not-received"}
              checkboxDisabled={disableCheckbox}
            />
          );
        })}
      </div>

      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-6">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={boxes.length}
          />
        </div>
      )}

      <ReceiveBoxModal
        show={receivePackageModal.show}
        callback={handleSkReceivePackageModalCallback}
        orderId={receivePackageModal.data?.orderId}
        boxNo={receivePackageModal.data?.boxNo}
      />

      <ViewBoxItems
        show={viewBoxItemsModal.show}
        callback={handleViewModalCb}
        boxId={viewBoxItemsModal.boxId}
      />

      <BulkBoxReceiveModal
        show={bulkProcessModal.show}
        callback={handleBulkProcessModalCallback}
        boxIds={bulkProcessModal.boxIds}
      />
    </>
  );
};

export default OrderBoxes;
