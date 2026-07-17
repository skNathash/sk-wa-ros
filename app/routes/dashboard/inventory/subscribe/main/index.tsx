import {
  BookOpen,
  Camera,
  ClipboardList,
  FileSpreadsheet,
  Layers,
  type LucideIcon,
  MapPin,
  Mic,
  PlusCircle,
  ScanBarcode,
  ShoppingCart,
  Sparkles,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import useAppNav from "~/hooks/useAppNav";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import useScreenView from "~/hooks/useScreenView";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";

const SEARCH_PATH = "/dashboard/inventory/subscribe/search";

type Tile = {
  key: string;
  icon: LucideIcon;
  /** Navigation target. Omitted for tiles that open a modal instead. */
  to?: string;
  /** Tiles that open a modal on the page rather than navigating. */
  action?: "photo" | "voice";
  gradient: string;
  iconColor: string;
  ring: string;
  /** Renders an "AI powered" badge on the top-right of the tile. */
  aiPowered?: boolean;
};

type QuickLink = {
  key: string;
  icon: LucideIcon;
  to: string;
  accent: string;
};

const tiles: Tile[] = [
  {
    key: "scan",
    icon: ScanBarcode,
    to: "/dashboard/inventory/barcode-scan",
    gradient: "tw:from-emerald-50 tw:to-emerald-100/50",
    iconColor: "tw:bg-emerald-600 tw:text-white",
    ring: "tw:hover:ring-emerald-400/40",
  },
  {
    key: "photo",
    icon: Camera,
    action: "photo",
    gradient: "tw:from-violet-50 tw:to-violet-100/50",
    iconColor: "tw:bg-violet-600 tw:text-white",
    ring: "tw:hover:ring-violet-400/40",
    aiPowered: true,
  },
  {
    key: "voice",
    icon: Mic,
    action: "voice",
    gradient: "tw:from-rose-50 tw:to-rose-100/50",
    iconColor: "tw:bg-rose-600 tw:text-white",
    ring: "tw:hover:ring-rose-400/40",
    aiPowered: true,
  },
  {
    key: "catalog",
    icon: BookOpen,
    to: "/dashboard/inventory/subscribe/search?tab=search&hideTab=false",
    gradient: "tw:from-amber-50 tw:to-amber-100/50",
    iconColor: "tw:bg-amber-600 tw:text-white",
    ring: "tw:hover:ring-amber-400/40",
  },
  {
    key: "nearby",
    icon: MapPin,
    to: "/dashboard/inventory/subscribe/search?tab=top&sortType=popular&radiusKms=5&hideTab=true",
    gradient: "tw:from-sky-50 tw:to-sky-100/50",
    iconColor: "tw:bg-sky-600 tw:text-white",
    ring: "tw:hover:ring-sky-400/40",
    aiPowered: true,
  },
  {
    key: "create",
    icon: PlusCircle,
    to: "/dashboard/inventory/subscribe/add-product",
    gradient: "tw:from-orange-50 tw:to-orange-100/50",
    iconColor: "tw:bg-orange-600 tw:text-white",
    ring: "tw:hover:ring-orange-400/40",
  },
];

const quickLinks: QuickLink[] = [
  {
    key: "unbranded",
    icon: Layers,
    to: "/dashboard/inventory/subscribe/un-brands?tab=un-brands&hideTab=true",
    accent: "tw:text-teal-700 tw:bg-teal-50 tw:group-hover:bg-teal-100",
  },
  {
    key: "brands",
    icon: Tag,
    to: "/dashboard/inventory/subscribe/browse-brands?tab=brands",
    accent: "tw:text-indigo-700 tw:bg-indigo-50 tw:group-hover:bg-indigo-100",
  },
  {
    key: "approval",
    icon: ClipboardList,
    to: "/dashboard/inventory/subscribe/approval-history/products?tab=history",
    accent:
      "tw:text-fuchsia-700 tw:bg-fuchsia-50 tw:group-hover:bg-fuchsia-100",
  },
  {
    key: "bulk",
    icon: FileSpreadsheet,
    to: "/dashboard/inventory/subscribe/add-product/bulk",
    accent: "tw:text-cyan-700 tw:bg-cyan-50 tw:group-hover:bg-cyan-100",
  },
];

const tileClassName = (tile: Tile) =>
  `tw:group tw:relative tw:flex tw:flex-col tw:text-left tw:bg-linear-to-br ${tile.gradient} tw:border tw:border-white tw:rounded-2xl tw:p-4 tw:md:p-5 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:transition-all tw:hover:-translate-y-0.5 tw:hover:shadow-lg tw:hover:ring-2 ${tile.ring}`;

const SubscribeMain = () => {
  const appNav = useAppNav();
  const { t } = useTranslation("inventorySubscribe");
  const { isMobile } = useScreenView();

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: t("subscribeMain.breadcrumbDashboard"),
      redirect: { path: "/dashboard" },
    },
    {
      label: t("subscribeMain.breadcrumbAllItems"),
      redirect: { path: "/dashboard/inventory/products/list" },
    },
    { label: t("subscribeMain.breadcrumbCreateMyCatalog") },
  ];
  const [showAiModal, setShowAiModal] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartDetails = async () => {
    try {
      const { totalCount } =
        await InventorySubscribeService.getCartAndPendingCount();
      setCartCount(totalCount);
    } catch (error) {
      console.error("Error fetching cart details:", error);
      setCartCount(InventorySubscribeService.getLocalCart()?.length || 0);
    }
  };

  useEffect(() => {
    fetchCartDetails();

    const handleRefresh = () => {
      fetchCartDetails();
    };

    document.addEventListener("subscribe-item-added", handleRefresh);
    document.addEventListener("subscribe-item-removed", handleRefresh);
    MiscService.listenEvent("create-pending-updated", handleRefresh);

    return () => {
      document.removeEventListener("subscribe-item-added", handleRefresh);
      document.removeEventListener("subscribe-item-removed", handleRefresh);
      MiscService.removeEventListener("create-pending-updated", handleRefresh);
    };
  }, []);

  const goToSearch = (params: Record<string, string>) => {
    const query = new URLSearchParams({
      tab: "search",
      hideTab: "true",
      ...params,
    });
    appNav.to(`${SEARCH_PATH}?${query.toString()}`);
  };

  // Photo (AI) search result -> redirect to search page with the detected term.
  const handlePhotoResult = (res: { action: string; data?: any }) => {
    if (res.action !== "proceed") {
      setShowAiModal(false);
      return;
    }

    const results = Array.isArray(res.data) ? res.data : [];
    const productData = results[0] || {};
    const basicInfo = productData?.product_basic_info || {};
    const searchTerm = (
      basicInfo.product_name ||
      basicInfo.barcode ||
      productData?.barcode ||
      ""
    ).trim();

    setShowAiModal(false);
    if (searchTerm) {
      goToSearch({ search: searchTerm });
    }
  };

  // Voice search result -> redirect to search page with term + collected keys.
  const handleVoiceResult = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action !== "close" && action !== "scan") return;
    if (!data) return;

    let searchTerm = "";
    let keys: string[] = [];

    if (Array.isArray(data.keywords)) {
      keys = data.keywords.filter(Boolean);
      searchTerm = keys[0] || "";
    } else if (typeof data.search === "string") {
      searchTerm = data.search;
      keys = [data.search];
    }

    if (searchTerm) {
      const params: Record<string, string> = {
        search: searchTerm,
        via: "voice",
      };
      if (keys.length) params.keys = keys.join(",");
      goToSearch(params);
    }
  };

  const renderTileInner = (tile: Tile) => {
    const { icon: Icon, key, iconColor } = tile;
    return (
      <>
        {tile.aiPowered && (
          <span className="tw:absolute tw:top-2 tw:right-2 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-linear-to-r tw:from-fuchsia-600 tw:to-violet-600 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-white tw:shadow-sm">
            <Sparkles className="tw:w-3 tw:h-3" />
            {t("subscribeMain.aiPoweredBadge")}
          </span>
        )}
        <div
          className={`tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:md:w-12 tw:md:h-12 tw:rounded-xl tw:shadow-md tw:transition-transform tw:group-hover:scale-110 tw:group-hover:rotate-3 ${iconColor}`}
        >
          <Icon className="tw:w-5 tw:h-5 tw:md:w-6 tw:md:h-6" />
        </div>
        <div className="tw:mt-3 tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
          {t(`subscribeMain.tiles.${key}.label`)}
        </div>
        <div className="tw:mt-0.5 tw:text-xs tw:md:text-sm tw:text-slate-600">
          {t(`subscribeMain.tiles.${key}.description`)}
        </div>
      </>
    );
  };

  return (
    <>
      <AppHeader title={t("subscribeMain.headerTitle")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          {/* Hero */}
          <div className="tw:relative tw:overflow-hidden tw:mt-2 tw:mb-6 tw:rounded-2xl tw:bg-linear-to-br tw:from-green-700 tw:via-emerald-700 tw:to-teal-700 tw:p-5 tw:md:p-7 tw:shadow-sm">
            <div className="tw:absolute tw:-right-12 tw:-top-12 tw:w-48 tw:h-48 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />
            <div className="tw:absolute tw:-right-20 tw:bottom-0 tw:w-64 tw:h-64 tw:rounded-full tw:bg-emerald-300/10 tw:blur-3xl" />
            <div className="tw:relative">
              <h1 className="tw:text-xl tw:md:text-2xl tw:font-bold tw:text-white">
                {t("subscribeMain.heroTitle")}
              </h1>
              <p className="tw:mt-1.5 tw:text-sm tw:text-emerald-50/90 tw:max-w-2xl">
                {t("subscribeMain.heroSubtitle")}
              </p>
            </div>
          </div>

          {/* Primary tiles */}
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-3 tw:md:gap-4">
            {tiles.map((tile) => {
              if (tile.action === "voice") {
                return (
                  <VoiceSearch
                    key={tile.key}
                    callback={handleVoiceResult}
                    className={tileClassName(tile)}
                  >
                    {renderTileInner(tile)}
                  </VoiceSearch>
                );
              }

              if (tile.action === "photo") {
                return (
                  <button
                    key={tile.key}
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className={tileClassName(tile)}
                  >
                    {renderTileInner(tile)}
                  </button>
                );
              }

              return (
                <Link
                  key={tile.key}
                  to={tile.to as string}
                  className={tileClassName(tile)}
                >
                  {renderTileInner(tile)}
                </Link>
              );
            })}
          </div>

          {/* Quick links */}
          <div className="tw:mt-8">
            <div className="tw:flex tw:items-center tw:gap-3 tw:mb-3">
              <h2 className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-700">
                {t("subscribeMain.quickLinksHeading")}
              </h2>
              <div className="tw:flex-1 tw:h-px tw:bg-linear-to-r tw:from-slate-200 tw:to-transparent" />
            </div>
            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-3">
              {quickLinks.map(({ key, icon: Icon, to, accent }) => (
                <Link
                  key={key}
                  to={to}
                  className="tw:group tw:flex tw:items-center tw:gap-3 tw:bg-white tw:border tw:border-slate-200 tw:rounded-xl tw:p-3 tw:md:p-4 tw:hover:shadow-sm tw:hover:border-slate-300 tw:transition-all"
                >
                  <div
                    className={`tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:transition-colors ${accent}`}
                  >
                    <Icon className="tw:w-5 tw:h-5" />
                  </div>
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:text-sm tw:font-semibold tw:text-slate-800 tw:leading-tight">
                      {t(`subscribeMain.quickLinks.${key}.label`)}
                    </div>
                    <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500 tw:leading-tight">
                      {t(`subscribeMain.quickLinks.${key}.description`)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handlePhotoResult}
      />

      {/* Cart FAB - Desktop view only, redirects to cart page */}
      <div
        className={`tw:fixed tw:bottom-4 tw:right-4 tw:rounded-full tw:bg-orange-500 tw:text-white tw:p-1 tw:shadow-lg tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:cursor-pointer tw:hover:scale-105 tw:transition-all tw:duration-300 tw:z-20 tw:ring-2 tw:ring-orange-300 tw:ring-opacity-50 tw:hidden tw:md:flex ${
          cartCount > 0
            ? "tw:ring-4 tw:ring-orange-400 tw:ring-opacity-75 tw:bg-orange-600"
            : ""
        }`}
        onClick={() => appNav.to("/dashboard/inventory/subscribe/cart")}
      >
        {cartCount > 0 && (
          <AppBadge
            variant="danger"
            className="tw:absolute tw:-top-2 tw:right-0"
          >
            <div className="tw:text-xs tw:font-bold">{cartCount}</div>
          </AppBadge>
        )}
        <ShoppingCart size={24} />
      </div>

      {/* Mobile Footer with Cart button */}
      {isMobile && (
        <div className="app-footer tw:flex tw:justify-center tw:items-center">
          <AppButton
            size="small"
            onClick={() => appNav.to("/dashboard/inventory/subscribe/cart")}
            className="tw:flex-1"
          >
            <ShoppingCart size={16} />
            {t("subscribeMain.subscriptionCart", { count: cartCount })}
          </AppButton>
        </div>
      )}
    </>
  );
};

export default SubscribeMain;
