import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import PromoteCoinStore from "~/shared/catalog/components/promote-coin-store/PromoteCoinStore";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import ConnectedSellerBlock from "./components/ConnectedSellerBlock";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const DEFAULT_COUNT = 20;

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: DEFAULT_COUNT,
  startSlNo: 1,
  endSlNo: DEFAULT_COUNT,
  totalRecords: 0,
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Home",
    redirect: { path: "/products/main" },
    langKey: "home",
  },
  { label: "Discover Sellers" },
];

export default function RetailersPage() {
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sort, setSort] = useState<{
    key: string;
    value: "asc" | "desc";
  } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const [storeImagesModal, setStoreImagesModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: { images: [] },
  });

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" } | null>(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Read `distance` from URL search params and store in filterRef
    const distanceParam = searchParams?.get?.("distance");
    if (distanceParam) {
      const parsed = Number(distanceParam);
      filterRef.current = {
        ...filterRef.current,
        distance: Number.isNaN(parsed) ? distanceParam : parsed,
      };
    } else {
      // when no distance is provided in URL, default to showing all sellers
      filterRef.current = {
        ...filterRef.current,
        distance: DEFAULT_BROWSE_DISTANCE,
      };
    }

    applyFilter();
  }, [searchParams]);

  const handleCreateRetailer = () => {
    appNav.to("/dashboard/network/management/b2b-retailers/manage");
  };

  const handleSortSelect = (key: string, value: "asc" | "desc") => {
    const newSort = { key, value };
    setSort(newSort);
    sortRef.current = newSort;
    filterRef.current.sort = newSort;
    applyFilter();
    setPopoverOpen(false);
  };

  const applyFilter = async () => {
    setLoading(true);
    setItems([]);

    paginationRef.current = {
      ...defaultPagination,
    };

    const params = prepareParams(filterRef.current, paginationRef.current);

    try {
      const data = await getData(params);
      const total = await getCount(params);

      setItems(data || []);

      paginationRef.current.totalRecords = total || 0;
      setCount(total || 0);
      // Determine if there is more data to load based on fetched rows
      const rowsPerPage = paginationRef.current.rowsPerPage || DEFAULT_COUNT;
      setHasMoreData((data || []).length >= rowsPerPage);
    } catch (err) {
      console.error("Error loading retailers", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        prepareParams(filterRef.current, paginationRef.current),
      );
      setItems((s) => [...s, ...(data || [])]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const itemCallback = (action: { action: string; data: any }) => {
    if (action.action === "viewImages") {
      const images = action.data.approvedShopPhotos?.map((photo: any) => ({
        id: photo.fileUrl,
      }));

      if (images.length > 0) {
        setStoreImagesModal({ show: true, data: { images } });
      } else {
        appToast.show({
          msg: t("noImagesFound"),
          color: "danger",
        });
      }
    }
  };

  const storeImagesModalCallback = () => {
    setStoreImagesModal({ show: false, data: { images: [] } });
  };

  const handleBrowseConnectedSellerCatalog = (sellerId: string) => {
    appNav.to(`/products/buy-from-other-retailer/retailer/${sellerId}`);
  };

  return (
    <>
      <AppHeader title={"Discover Sellers"} showRecordPayment={false} />
      <div className="page-bg app-page tw:p-4">
        <SectionTabs
          sectionKey="supply"
          activeTab="buy-from-network"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="buy-from-network"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          <PromoteCoinStore />

          {/* <div className="tw:mb-4">
            <BuyFromNetworkTab activeTab="products" />
          </div> */}

          {AuthService.isSkBuyer() && (
            <ConnectedSellerBlock
              onBrowseCatalog={handleBrowseConnectedSellerCatalog}
            />
          )}

          <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
            <div className="tw:text-xs tw:text-gray-600">
              Discover and purchase products from nearby retailers in your
              network.
            </div>
            <AppButton
              onClick={handleCreateRetailer}
              size="small"
              color="primary"
              fill="outline"
            >
              <Plus className="tw:w-4 tw:h-4" />
              {t("createB2bRetailer")}
            </AppButton>
          </div>

          <div className="tw:mb-4">
            <Filter
              callback={(a: { action: string; formData: any }) => {
                // Merge incoming formData into filterRef and apply
                filterRef.current = { ...filterRef.current, ...a.formData };
                applyFilter();
              }}
            />
          </div>

          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
            <div>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={items.length}
                fwSize="sm"
              />
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              {/* <AppPopover
                triggerContent={
                  <Button size="sm" variant="outline">
                    <ArrowUpDown className="tw:w-4 tw:h-4" />
                  </Button>
                }
                contentClassName="tw:w-48"
                open={popoverOpen}
                onOpenChange={setPopoverOpen}
              >
                <div className="tw:space-y-1">
                  <Button
                    size="sm"
                    variant={
                      sort?.key === "name" && sort?.value === "asc"
                        ? "secondary"
                        : "ghost"
                    }
                    className="tw:w-full tw:justify-start"
                    onClick={() => handleSortSelect("name", "asc")}
                  >
                    Name A-Z
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      sort?.key === "name" && sort?.value === "desc"
                        ? "secondary"
                        : "ghost"
                    }
                    className="tw:w-full tw:justify-start"
                    onClick={() => handleSortSelect("name", "desc")}
                  >
                    Name Z-A
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      sort?.key === "distance" && sort?.value === "asc"
                        ? "secondary"
                        : "ghost"
                    }
                    className="tw:w-full tw:justify-start"
                    onClick={() => handleSortSelect("distance", "asc")}
                  >
                    Distance Low to High
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      sort?.key === "distance" && sort?.value === "desc"
                        ? "secondary"
                        : "ghost"
                    }
                    className="tw:w-full tw:justify-start"
                    onClick={() => handleSortSelect("distance", "desc")}
                  >
                    Distance High to Low
                  </Button>
                </div>
              </AppPopover> */}
              <ViewToggle viewType={view} callback={setView} />
            </div>
          </div>

          <div>
            {isMobile || view === "card" ? (
              <MobileView
                data={items}
                loading={loading}
                callback={itemCallback}
                showLoadMore={items.length < paginationRef.current.totalRecords}
                loadedCount={items.length}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
              />
            ) : (
              <DesktopView
                data={items}
                loading={loading}
                callback={itemCallback}
                showLoadMore={items.length < paginationRef.current.totalRecords}
                loadedCount={items.length}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
              />
            )}
          </div>
          </div>
        </div>
      </div>

      <ImgPreviewModal
        show={storeImagesModal.show}
        callback={storeImagesModalCallback}
        images={storeImagesModal.data.images}
      />
    </>
  );
}
