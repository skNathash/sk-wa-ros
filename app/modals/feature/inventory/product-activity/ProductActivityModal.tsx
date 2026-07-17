import { useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SellerCatalogService from "~/services/SellerCatalogService";
import { getCount, getData, prepareParams } from "./helper";
import { useTranslation } from "react-i18next";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealId: string;
  dealName?: string;
};

const ProductActivityModal = ({ show, callback, dealId, dealName }: Props) => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // filterRef stores both the provided dealId (business id) and the resolved
  // dealRawId (_id returned by SellerCatalogService.getProducts)
  const filterRef = useRef<Record<string, any>>({
    dealId,
    dealRawId: undefined,
  });

  useEffect(() => {
    if (!show) return;
    // update dealId and resolve the raw deal _id, then init
    filterRef.current.dealId = dealId;
    resolveDealRawIdAndInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, dealId]);

  const init = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    await applyFilter();
  };

  const resolveDealRawIdAndInit = async () => {
    // attempt to find the product/deal raw _id using the business dealId
    try {
      if (!filterRef.current.dealId) {
        filterRef.current.dealRawId = undefined;
        await init();
        return;
      }
      const resp = await SellerCatalogService.getProducts({
        filter: { dealId: filterRef.current.dealId },
      });
      const id = resp.data?.data?.[0]?._id;
      filterRef.current.dealRawId = id;
    } catch (error) {
      console.error("Error resolving deal raw id:", error);
      filterRef.current.dealRawId = undefined;
    }
    await init();
  };

  const applyFilter = async () => {
    setLoading(true);
    paginationRef.current.activePage = 1;
    const params = prepareParams(filterRef.current, paginationRef.current);
    try {
      // getData now expects the resolved raw deal _id
      const data = await getData(params, filterRef.current.dealRawId);
      setItems(Array.isArray(data) ? data : []);
      setHasMore(
        (Array.isArray(data) ? data.length : 0) ===
          paginationRef.current.rowsPerPage
      );
      // update total records via getCount if needed
      const count = await getCount(params, filterRef.current.dealRawId);
      paginationRef.current.totalRecords = count;
    } catch (error) {
      console.error(error);
      setItems([]);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (event?: any) => {
    setIsLoadingMore(true);
    paginationRef.current.activePage = paginationRef.current.activePage + 1;
    const params = prepareParams(filterRef.current, paginationRef.current);
    try {
      const data = await getData(params, filterRef.current.dealRawId);
      setItems((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
      setHasMore(
        (Array.isArray(data) ? data.length : 0) ===
          paginationRef.current.rowsPerPage
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
      if (event && event.target && event.target.complete)
        event.target.complete();
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-lg">
          <span>{t("productActivity")}</span>
          {dealName && <span className="tw:ml-1"> - {dealName}</span>}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-32">
            <AppSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="tw:p-4 tw:text-center tw:text-gray-400">
            No activity found.
          </div>
        ) : (
          <AppScrollArea className="tw:max-h-96">
            <div className="tw:divide-y tw:divide-gray-100 tw:max-h-96">
              {items.map((item: any) => (
                <div
                  key={item._id}
                  className="tw:py-3 tw:border-b tw:border-gray-100"
                >
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <div className="tw:font-medium tw:text-gray-900 tw:text-xs">
                      {item.remarks || item.message || "-"}
                    </div>
                  </div>
                  <div className="tw:flex tw:justify-between tw:items-center tw:mt-1">
                    <div className="tw:text-xs tw:text-slate-500">
                      <DateFormat
                        value={item.loggedAt || item.createdAt || item.date}
                      />
                      {item.userName ? (
                        <span className="tw:ml-2">by {item.userName}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AppScrollArea>
        )}

        {hasMore && !loading && (
          <div className="tw:flex tw:justify-center tw:mt-4">
            <AppButton
              onClick={loadMore}
              disabled={isLoadingMore}
              fill="outline"
              size="small"
              color="dark"
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </AppButton>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ProductActivityModal;
