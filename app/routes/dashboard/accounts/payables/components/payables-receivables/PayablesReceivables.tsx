import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { AppInput } from "~/components/core/form/AppInput";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import ShareService from "~/services/ShareService";
import CommonService from "~/services/CommonService";
import type { PayableReceivableEntityType } from "~/types/CommonTypes";

const PayablesReceivables = ({
  type,
  partyType = "all",
}: {
  type: "payables" | "receivables";
  partyType?: string;
}) => {
  const { isMobile } = useScreenView();
  const [viewType, setViewType] = useState<"list" | "card">(
    isMobile ? "card" : "list",
  );

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Record-payment modal is driven from the row "Pay" action; it self-fetches
  // party + outstanding from the entityId/type we hand it.
  const [payModal, setPayModal] = useState<{ show: boolean; item: any }>({
    show: false,
    item: null,
  });

  // Payables → we owe the party, so we make a payout; receivables → we collect.
  const paymentType: "receivePayment" | "makePayout" =
    type === "payables" ? "makePayout" : "receivePayment";

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

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
    };

    try {
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues],
  );

  const handleSearchChange = useCallback(() => {
    debouncedSearch();
  }, [debouncedSearch]);

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
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load + react to tab/party filter changes
  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      type,
      search: getValues("search"),
      "partyDetails.type": partyType === "all" ? undefined : partyType,
    };
    applyFilter();
  }, [type, partyType, getValues, applyFilter]);

  const handlePay = useCallback((item: any) => {
    if (!item?.partyId) return;
    setPayModal({ show: true, item });
  }, []);

  const handlePayCallback = useCallback(
    (result: { action: string; data?: any }) => {
      setPayModal({ show: false, item: null });
      if (result.action === "success") {
        applyFilter();
      }
    },
    [applyFilter],
  );

  const handleNotify = useCallback(
    (item: any) => {
      const amountText = CommonService.formattedAmount(
        item.outstandingAmount,
        2,
      );
      const msg =
        type === "receivables"
          ? `Hi ${item.name || ""}, this is a gentle reminder that ₹${amountText} is pending against your account. Kindly clear it at your earliest convenience. Thank you.`
          : `Hi ${item.name || ""}, this is regarding the outstanding amount of ₹${amountText} on your account.`;
      ShareService.share({ msg, phone: item.mobile });
    },
    [type],
  );

  const viewProps = {
    type,
    data,
    loading,
    loadingMore,
    hasMoreData,
    loadMore,
    pagination: paginationRef.current,
    onPay: handlePay,
    onNotify: handleNotify,
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2">
        <AppInput
          name="search"
          placeholder="Search by name..."
          register={register}
          onChange={handleSearchChange}
          className="tw:w-full"
          leftIcon={<Search className="tw:text-gray-500" size={16} />}
        />
      </div>

      <div className="tw:flex tw:items-center tw:justify-between">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={viewType} callback={setViewType} showOnlyIcon />
      </div>

      <div>
        {viewType === "card" ? (
          <MobileView {...viewProps} />
        ) : (
          <AppCard noPadding>
            <DesktopView {...viewProps} />
          </AppCard>
        )}
      </div>

      <RecordPaymentModal
        show={payModal.show}
        callback={handlePayCallback}
        entityId={payModal.item?.partyId || ""}
        entityType={payModal.item?.type as PayableReceivableEntityType}
        paymentType={paymentType}
        hideTabs
      />
    </>
  );
};

export default PayablesReceivables;
