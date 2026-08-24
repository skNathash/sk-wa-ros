import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ListSkeleton from "~/shared/accounts/components/list-skeleton/ListSkeleton";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import type { PaginationState } from "~/types/CommonTypes";
import type { PayableReceivableEntityType } from "~/types/CommonTypes";
import { useDebouncedCallback } from "use-debounce";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import {
  allLanes,
  getCount,
  getData,
  pageSize,
  prepareParams,
  type OwingParty,
} from "./helper";

type WhoOwesYouProps = {
  /** Lane the list is read for; omit to list both. */
  lane?: string;
  /** Row and header actions bubble up; the page owns remind flows, while
   * record payment is handled inside this component. */
  callback?: (payload: { action: string; data?: any }) => void;
};

// Every party holding a balance on the selected lane, biggest exposure first,
// with the age of the oldest open invoice so a reminder can be prioritised.
const WhoOwesYou = ({ lane = allLanes, callback }: WhoOwesYouProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appToast = useAppToast();

  const [data, setData] = useState<OwingParty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [recordPaymentModal, setRecordPaymentModal] = useState<{
    show: boolean;
    data: OwingParty | null;
  }>({ show: false, data: null });

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({ lane });

  // Form for search
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  // Apply filter (initial load or filter change)
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

  /* The lane is read by the API, so switching lanes starts the list again from
     the first page. */
  useEffect(() => {
    filterRef.current = { ...filterRef.current, lane };
    applyFilter();
  }, [lane, applyFilter]);

  const handleRowAction = (action: string, item?: OwingParty) => {
    if (action === "record" && item) {
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
          msg: `Payment of ${payload.data?.amount} received from ${payload.data?.name}`,
          color: "success",
        });
        applyFilter();
      }
    },
    [appToast, applyFilter],
  );

  return (
    /* Mobile has no card shell — the rows bleed to the screen edges and the
       header sits on the page background. The card returns from md up. */
    <div className="tw:mb-3 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:bg-white tw:md:shadow-sm">
      {/* One header for both widths: on mobile it sits bare on the page
          background so the sheet below reads as the block itself; from md up it
          gains the card's padding and hairline rule. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:md:border-b tw:md:border-gray-100 tw:md:px-4 tw:md:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("whoOwesYou")}
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          {/* <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={() => emit("filter")}
          >
            <FilterIcon size={14} />
            <span className="tw:hidden tw:md:inline">{t("filter")}</span>
          </AppButton> */}
          {/* <AppButton size="small" onClick={() => emit("remindAll")}>
            <MessageCircle size={14} />
            {t("remindAll")}
          </AppButton> */}
        </div>
      </div>

      {/* The search band rides above the sheet: bare on mobile, inside the
          card's padding and hairline rule from md up. */}
      <div className="tw:pb-2 tw:md:border-b tw:md:border-gray-100 tw:md:px-4 tw:md:py-2.5">
        <AppInput
          name="search"
          placeholder="Search by party name..."
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
          {/* Desktop prints the full exposure row — party, type, invoices,
              owes; mobile folds type, open count and age under the name. */}
          {isMobile ? (
            <MobileView data={data} emit={handleRowAction} />
          ) : (
            <DesktopView data={data} emit={handleRowAction} />
          )}

          {/* More parties are behind the filter than have been read so far. */}
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
        entityId={recordPaymentModal.data?.partyId || ""}
        entityType={
          recordPaymentModal.data?.partyType as PayableReceivableEntityType
        }
        hideTabs={true}
        paymentType="receivePayment"
      />
    </div>
  );
};

export default WhoOwesYou;
