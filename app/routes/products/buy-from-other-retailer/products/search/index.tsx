import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import { AppInput } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import CommonService from "~/services/CommonService";
import { ASSET, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import { Skeleton } from "~/components/ui/skeleton";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import DistanceChooser from "../components/DistanceChooser";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import SellerListModal from "../modals/seller-list/SellerListModal";
import { getCount, getData, prepareParams } from "./helper";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Home", redirect: { path: "/products/main" } },
  { label: "Search" },
];

const ProductCardSkeleton = () => (
  <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:space-y-4">
    <Skeleton className="tw:h-32 tw:w-full" />
    <Skeleton className="tw:h-4 tw:w-3/4" />
    <Skeleton className="tw:h-4 tw:w-1/2" />
    <Skeleton className="tw:h-4 tw:w-1/4" />
    <Skeleton className="tw:h-8 tw:w-full" />
  </div>
);

const BuyFromOtherRetailerProductsSearchPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDistanceParam = searchParams.get("distance");
  const modalDistance: any =
    rawDistanceParam == null
      ? DEFAULT_BROWSE_DISTANCE
      : rawDistanceParam === "all"
        ? "all"
        : Number(rawDistanceParam);
  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: searchParams.get("search") || "",
    },
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({
    dealId: "",
    show: false,
  });

  const [showAiModal, setShowAiModal] = useState(false);
  const [searchedViaAI, setSearchedViaAI] = useState(false);
  const [lastAiPayload, setLastAiPayload] = useState<{
    results: any[];
    images: Array<{ id: string }>;
  }>({ results: [], images: [] });

  const handleBuyNow = useCallback((data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }
  }, []);

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      } else if (data.action === "select") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    [],
  );

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<{ search?: string }>({ search: "" });

  useEffect(() => {
    const search = searchParams.get("search") || "";
    filterRef.current.search = search;
    setValue("search", search);
    if (search) {
      applyFilter();
    } else {
      setProducts([]);
      setLoading(false);
      setHasMoreData(false);
    }
  }, [searchParams]);

  // If redirected with AI image ids and optional search keyword, process them
  useEffect(() => {
    const aiImageIds = searchParams.get("ai_image_ids") || "";
    const aiSearch =
      searchParams.get("ai_search") || searchParams.get("search") || "";
    if (!aiImageIds) return;

    const ids = aiImageIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    const fetchAiInfo = async () => {
      setLoading(true);
      try {
        const urls = ids.map((id) => `${ASSET}/${id}?size=400`);
        const results = await CommonService.getAiImgInfo(urls);
        const data = results.data?.data || results.data;
        const normalizedData = Array.isArray(data) ? data : [data];

        setLastAiPayload({
          results: normalizedData,
          images: ids.map((id) => ({ id })),
        });

        if (aiSearch) {
          setValue("search", aiSearch);
          setSearchedViaAI(true);
          try {
            applyFilter();
          } catch (e) {
            // applyFilter is also triggered by searchParams change
          }
        }
      } catch (err) {
        console.error("AI image processing failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAiInfo();
  }, [searchParams]);

  const debounceSearch = useCallback(
    debounce(() => {
      // Clear AI-search indicator when user types manually
      setSearchedViaAI(false);
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev.toString());
          newParams.set("search", getValues("search") || "");
          return newParams;
        },
        { replace: true },
      );
    }, 500),
    [setSearchParams],
  );

  const handleVoiceCallback = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if ((action === "close" || action === "scan") && data) {
        let searchValue = "";
        if (data.keywords && Array.isArray(data.keywords)) {
          const arr = data.keywords.filter(Boolean);
          if (arr.length > 0) searchValue = arr[0];
        } else if (data.search && typeof data.search === "string") {
          searchValue = data.search;
        }

        if (searchValue) {
          setValue("search", searchValue);
          setSearchParams(
            (prev) => {
              const newParams = new URLSearchParams(prev.toString());
              newParams.set("search", searchValue);
              return newParams;
            },
            { replace: true },
          );
        }
      }
    },
    [setValue, setSearchParams],
  );

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const distance =
        searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
      const totalRecords = await getCount(params, distance);
      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params, distance);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const distance =
        searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
      const productsData = await getData(params, distance);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleAiModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === "close") {
        setShowAiModal(false);
        return;
      }

      if (data.action === "proceed" && data.data && data.data.length > 0) {
        setLastAiPayload({
          results: data.data || [],
          images:
            (data as any).images && Array.isArray((data as any).images)
              ? (data as any).images
              : [],
        });

        const productData = data.data[0];
        const basicInfo = productData?.product_basic_info || {};
        const searchTerm = (basicInfo.product_name || "").toString().trim();

        if (searchTerm) {
          setValue("search", searchTerm);
          setSearchParams(
            (prev) => {
              const newParams = new URLSearchParams(prev.toString());
              newParams.set("search", searchTerm);
              return newParams;
            },
            { replace: true },
          );
          setSearchedViaAI(true);
          try {
            applyFilter();
          } catch (e) {
            // applyFilter is also triggered by searchParams change
          }
        }

        setShowAiModal(false);
      }
    },
    [setSearchParams, setValue, applyFilter],
  );

  return (
    <>
      <AppHeader title="Search" showRecordPayment={false} />
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

          <div className="section-content app-container">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            {/* <BuyFromNetworkTab activeTab="products" className="tw:mb-4" /> */}
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:flex-1">
              <AppInput
                name="search"
                type="text"
                placeholder="Search"
                register={register}
                leftIcon={<Search size={16} />}
                rightIcon={
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <VoiceMic callback={handleVoiceCallback} />
                    {/* AI search */}
                    <button
                      className="tw:cursor-pointer"
                      onClick={() => setShowAiModal(true)}
                    >
                      <ImgRender
                        src="ai/sk-ai.png"
                        className="tw:w-6 tw:h-6 animate__animated animate__pulse animate__infinite"
                      />
                    </button>
                  </div>
                }
                onChange={debounceSearch}
                autoFocus
              />
            </div>
            <div className="tw:flex-none">
              <DistanceChooser
                selectedDistance={searchParams.get("distance") || undefined}
              />
            </div>
          </div>
          {searchParams.get("search") && (
            <>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={products.length}
                fwSize="sm"
                className="tw:mt-2"
              />
              {loading ? (
                <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:mt-4 tw:gap-4">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <ProductCardSkeleton key={idx} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:mt-4 tw:gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      data={product}
                      callback={handleBuyNow}
                    />
                  ))}
                </div>
              ) : (
                <NoData />
              )}
              {hasMoreData && !loading && (
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={products.length}
                />
              )}
            </>
          )}
          </div>
        </div>
      </div>
      <Footer />
      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={modalDistance}
      />

      {/* AI search modal */}
      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handleAiModalCallback}
      />
    </>
  );
};

export default BuyFromOtherRetailerProductsSearchPage;
