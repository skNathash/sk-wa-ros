import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type {
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import {
  getCart,
  getCount,
  getData,
  mapInCart,
  prepareFilterParams,
  type PurchaseCartData,
  type PurchaseCartSummary,
  type VendorReorderItem,
} from "./helper";

interface FilterState {
  search?: string;
}

const defaultFilter: FilterState = {
  search: "",
};

const defaultSort: SortProps = {
  key: "quantity",
  value: "desc",
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

const VendorReorderPage = () => {
  const { id } = useParams();
  const vendorId = id || "";
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [items, setItems] = useState<VendorReorderItem[]>([]);
  const [view, setView] = useState<ViewToggleType>("list");
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cartSummary, setCartSummary] = useState<PurchaseCartSummary | null>(
    null,
  );

  const filterRef = useRef<FilterState>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });
  const sortRef = useRef<SortProps>({ ...defaultSort });
  const cartRef = useRef<PurchaseCartData>(null);

  const applyCartData = (cart: PurchaseCartData) => {
    cartRef.current = cart;
    setCartSummary(cart?.cartSummary || null);
  };

  const applyFilter = useCallback(async () => {
    if (!vendorId) return;

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setItems([]);
    try {
      // Fetch cart first so list rows can be marked inCart.
      applyCartData(await getCart(vendorId));

      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const [totalRecords, itemsData] = await Promise.all([
        getCount(vendorId, params),
        getData(vendorId, params),
      ]);
      paginationRef.current.totalRecords = totalRecords;
      setItems(mapInCart(itemsData, cartRef.current?.items || []));
      setHasMoreData(itemsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  const loadMore = useCallback(async () => {
    if (!vendorId || loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
      const itemsData = await getData(vendorId, params);
      setItems((prev) => [
        ...prev,
        ...mapInCart(itemsData, cartRef.current?.items || []),
      ]);
      setHasMoreData(itemsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [vendorId, loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const filterCb = (data: { formData: any; action: string }) => {
    if (data.action === "apply") {
      filterRef.current = { ...filterRef.current, ...data.formData };
    }
    applyFilter();
  };

  const sortCb = (data: SortProps) => {
    sortRef.current = data;
    applyFilter();
  };

  const handleCartChange = async (dealId: string, inCart: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.dealId === dealId || item.dealRefId === dealId
          ? { ...item, inCart }
          : item,
      ),
    );

    // Refresh cart so footer totals stay in sync with the API.
    applyCartData(await getCart(vendorId));
  };

  const handleProceed = () => {
    if (!vendorId) return;
    appNav.to("/dashboard/purchase-order/manage", { vid: vendorId });
  };

  const showCartFooter = (cartSummary?.totalItems || 0) > 0;

  return (
    <>
      <Filter callback={filterCb} />

      <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div>
          <PaginationSummary
            loadingTotalRecords={loading}
            paginationConfig={paginationRef.current}
            fwSize="sm"
            loadedCount={items.length}
          />
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          vendorId={vendorId}
          data={items}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={items.length}
          showLoadMore={hasMoreData}
          onCartChange={handleCartChange}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            vendorId={vendorId}
            data={items}
            loading={loading}
            loadedCount={items.length}
            totalCount={paginationRef.current.totalRecords}
            loadingMore={loadingMore}
            loadMore={loadMore}
            showLoadMore={hasMoreData}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            sortCb={sortCb}
            onCartChange={handleCartChange}
          />
        </AppCard>
      )}

      {showCartFooter ? (
        <footer className="app-footer app-footer-fixed tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              {t("cartTotal")}
              {cartSummary?.totalItems ? (
                <span className="tw:ml-1 tw:normal-case tw:tracking-normal tw:font-medium">
                  · {cartSummary.totalItems}{" "}
                  {cartSummary.totalItems === 1
                    ? t("itemSingular")
                    : t("itemPlural")}
                </span>
              ) : null}
            </span>
            <span className="tw:text-lg tw:font-bold tw:text-slate-800">
              <Amount
                value={cartSummary?.totalPurchaseValue || 0}
                decimalPlaces={2}
              />
            </span>
          </div>

          <AppButton color="primary" size="small" onClick={handleProceed}>
            {t("proceed")}
            <ArrowRight className="tw:size-4" />
          </AppButton>
        </footer>
      ) : null}
    </>
  );
};

export default VendorReorderPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Reorder"),
    },
  ];
}
