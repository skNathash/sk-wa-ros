import { produce } from "immer";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { X } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import PriceSchemeModal from "~/shared/catalog/modals/price-scheme/PriceSchemeModal";
import type {
  PaginationState,
  SellerDeal,
  ViewToggleType,
} from "~/types/CommonTypes";
import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import { getCount, getData, prepareParams } from "../../helper";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useScreenView();

  const [view, setView] = useState<ViewToggleType>("list");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SellerDeal[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [schemeModal, setSchemeModal] = useState<{
    show: boolean;
    dealId: string;
  }>({
    show: false,
    dealId: "",
  });

  const [highlightDealId, setHighlightDealId] = useState<string>("");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    totalRecords: 0,
    startSlNo: 1,
    endSlNo: 10,
  });

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const filters = {
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "running",
        alpha: searchParams.get("alpha") || "",
        brandId: searchParams.get("brandId") || "",
        dateRange: [], // dateRange is handled by Filter.tsx which updates searchParams
      } as any;

      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");
      if (dateFrom && dateTo) {
        filters.dateRange = [new Date(dateFrom), new Date(dateTo)];
      }

      const params = prepareParams(filters, paginationRef.current);

      const result = await getData(params);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;

      setData(result || []);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [searchParams]);

  const itemCallback = (args: { action: string; data?: SellerDeal }) => {
    if (args.action === "edit") {
      setSchemeModal({ show: true, dealId: args.data?._id || "" });
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      setLoadingMore(true);
      const filters = {
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "running",
        alpha: searchParams.get("alpha") || "",
        brandId: searchParams.get("brandId") || "",
        dateRange: [],
      } as any;

      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");
      if (dateFrom && dateTo) {
        filters.dateRange = [new Date(dateFrom), new Date(dateTo)];
      }

      const params = prepareParams(filters, paginationRef.current);

      const result = await getData(params);
      setData(
        produce((draft) => {
          draft.push(...result);
        }),
      );
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSchemeModalCallback = async (args: {
    action: string;
    data?: any;
  }) => {
    const currentDealId = schemeModal.dealId;
    setSchemeModal({ show: false, dealId: "" });
    if (
      args.action === "save" ||
      args.action === "disable" ||
      args.action === "remove"
    ) {
      const respData = args.data?.data || {};
      const payload = args.data?._payload || {};

      setData(
        produce((draft) => {
          const index = draft.findIndex(
            (item) => item._id === currentDealId,
          );
          if (index !== -1) {
            const currentDeal = draft[index];
            const offerOfTheDay =
              payload?.offerOfTheDay || respData?.offerOfTheDay || {};

            // Normalize latest scheme meta (status, colors, tax flag, etc.)
            const schemeMeta = SellerCatalogService.prepareSchemeData(
              offerOfTheDay,
            );

            // For save/update, recompute scheme price & profit using the same
            // helper as the cart flow so both mobile & desktop views show
            // the correct B2B scheme price instead of 0.
            if (args.action === "save") {
              const schemePrice = CommonService.calculateScheme(
                currentDeal.b2bPrice || 0,
                offerOfTheDay.offerDiscount || 0,
                !!offerOfTheDay.isTaxInclusive,
                currentDeal.gst || 0,
                currentDeal.purchasePrice || 0,
                currentDeal.additionalCess || 0,
              );

              (draft[index] as any).b2bScheme = {
                ...schemeMeta,
                offerPrice: Number(schemePrice.offerPrice || 0),
                profit: Number(schemePrice.profit || 0),
              };
            } else {
              // For remove/disable, keep meta in sync but clear price info
              (draft[index] as any).b2bScheme = {
                ...schemeMeta,
                offerPrice: undefined,
                profit: undefined,
              };
            }
          }
        }),
      );

      // Highlight the updated row for 3 seconds
      setHighlightDealId(currentDealId);
      setTimeout(() => setHighlightDealId(""), 3000);
    }
  };

  const handleRemoveBrand = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("brandId");
    next.delete("brandName");
    setSearchParams(next);
  };

  return (
    <>
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loadingTotalRecords}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>

      {searchParams.get("brandId") && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4 tw:bg-primary/10 tw:border tw:border-primary/20 tw:px-3 tw:py-1 tw:rounded-full tw:w-fit">
          <span className="tw:text-xs tw:font-medium tw:text-primary">
            Brand: {searchParams.get("brandName") || "Selected Brand"}
          </span>
          <button
            onClick={handleRemoveBrand}
            className="tw:text-primary hover:tw:text-primary/80 tw:transition-colors"
          >
            <X className="tw:w-3 tw:h-3" />
          </button>
        </div>
      )}

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          callback={itemCallback}
          showLoadMore={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          highlightDealId={highlightDealId}
        />
      ) : (
        <AppCard noPadding={true}>
          <DesktopView
            data={data}
            loading={loading}
            callback={itemCallback}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            showLoadMore={hasMoreData}
            highlightDealId={highlightDealId}
          />
        </AppCard>
      )}

      <PriceSchemeModal
        show={schemeModal.show}
        callback={handleSchemeModalCallback}
        dealId={schemeModal.dealId}
      />
    </>
  );
};

export default Products;
