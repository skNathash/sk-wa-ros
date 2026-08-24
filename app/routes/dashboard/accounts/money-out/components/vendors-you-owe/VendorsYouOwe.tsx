import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ListSkeleton from "~/shared/accounts/components/list-skeleton/ListSkeleton";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import type {
  PaginationState,
  PayableReceivableEntityType,
} from "~/types/CommonTypes";
import { useDebouncedCallback } from "use-debounce";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import {
  getCount,
  getData,
  pageSize,
  prepareParams,
  type OwedVendor,
} from "./helper";

type VendorsYouOweProps = {
  /** Row and header actions bubble up; the page owns the chat flow, while
   * paying a vendor is handled inside this component. */
  callback?: (payload: { action: string; data?: any }) => void;
};

// Every vendor sitting on an unpaid bill, nearest due first. Rows open to show
// which bills make up the balance, so a payment can be made against the right
// purchase order.
const VendorsYouOwe = ({ callback }: VendorsYouOweProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appToast = useAppToast();

  const [data, setData] = useState<OwedVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [recordPaymentModal, setRecordPaymentModal] = useState<{
    show: boolean;
    data: OwedVendor | null;
  }>({ show: false, data: null });

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });
  const filterRef = useRef<Record<string, any>>({});

  // Form for search
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  // Apply filter (initial load or search/filter change)
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    setExpanded(null);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData(result);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length < totalRecords);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search function
  const handleSearchChange = useDebouncedCallback(() => {
    filterRef.current = {
      ...filterRef.current,
      search: getValues("search"),
    };
    applyFilter();
  }, 500);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData((prev) => {
        const next = [...prev, ...result];
        setHasMoreData(next.length < paginationRef.current.totalRecords);
        return next;
      });
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  /* Paying a vendor stays on the page — the row opens the shared payout wizard
     instead of bubbling up to the record-payment route. */
  const emit = (action: string, item?: OwedVendor) => {
    if (action === "pay" && item) {
      setRecordPaymentModal({ show: true, data: item });
      return;
    }
    callback?.({ action, data: item });
  };

  const handleRecordPaymentModal = useCallback(
    (payload: { action: string; data?: any }) => {
      setRecordPaymentModal({ show: false, data: null });
      if (payload.action === "success") {
        appToast.show({
          msg: `Payment of ${payload.data?.amount} made to ${payload.data?.name}`,
          color: "success",
        });
        applyFilter();
      }
    },
    [appToast, applyFilter],
  );

  const toggle = (item: OwedVendor) =>
    setExpanded((prev) => (prev === item.id ? null : item.id));

  return (
    /* Mobile has no card shell — the rows bleed to the screen edges and the
       header sits on the page background. The card returns from md up. */
    <div className="tw:mb-3 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:bg-white tw:md:shadow-sm">
      {/* One header for both widths: on mobile it sits bare on the page
          background so the sheet below reads as the block itself; from md up it
          gains the card's padding and hairline rule. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:md:border-b tw:md:border-gray-100 tw:md:px-4 tw:md:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("vendorsYouOwe")}
        </div>
      </div>

      {/* The search band rides above the sheet: bare on mobile, inside the
          card's padding and hairline rule from md up. */}
      <div className="tw:pb-2 tw:md:border-b tw:md:border-gray-100 tw:md:px-4 tw:md:py-2.5">
        <AppInput
          name="search"
          placeholder="Search by vendor name..."
          register={register}
          onChange={handleSearchChange}
          className="tw:w-full"
          leftIcon={<Search className="tw:text-gray-500" size={16} />}
        />
      </div>

      {loading ? (
        <ListSkeleton />
      ) : (
        <>
          {/* Desktop prints the full payable row — vendor, term, bills, owed,
              due; mobile folds term, open count and due date under the name. */}
          {isMobile ? (
            <MobileView
              data={data}
              expanded={expanded}
              toggle={toggle}
              emit={emit}
            />
          ) : (
            <DesktopView
              data={data}
              expanded={expanded}
              toggle={toggle}
              emit={emit}
            />
          )}

          {/* More vendors are behind the filter than have been read so far. */}
          {hasMoreData && (
            <div className="tw:pt-3 tw:md:border-t tw:md:border-gray-100 tw:md:px-4 tw:md:pt-0 tw:md:pb-3">
              <LoadMoreButton
                loaderType="button"
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </>
      )}
      <RecordPaymentModal
        show={recordPaymentModal.show}
        callback={handleRecordPaymentModal}
        entityId={recordPaymentModal.data?.vendorId || ""}
        entityType={
          (recordPaymentModal.data?.vendorType ||
            "vendor") as PayableReceivableEntityType
        }
        hideTabs={true}
        paymentType="makePayout"
      />
    </div>
  );
};

export default VendorsYouOwe;
