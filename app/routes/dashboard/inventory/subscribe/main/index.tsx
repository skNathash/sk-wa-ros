import {
  BookOpen,
  Camera,
  ChevronRight,
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
import SubscribeNavChips from "~/shared/inventory/components/subscribe-nav-chips/SubscribeNavChips";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import useAppNav from "~/hooks/useAppNav";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AppBadge from "~/components/core/badge/AppBadge";
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
  /** Thin colored top accent for the card (per designer's per-method coding). */
  accent: string;
  /** Soft tinted background + text color for the icon chip and badge. */
  iconTint: string;
  /** Hardcoded description line (overrides i18n for now). */
  desc: string;
  /** Hardcoded metadata chip shown at the bottom of the card. */
  badge: string;
  /** Renders an "AI powered" badge on the top-right of the tile. */
  aiPowered?: boolean;
};

type QuickLink = {
  key: string;
  icon: LucideIcon;
  to: string;
};

const tiles: Tile[] = [
  {
    key: "scan",
    icon: ScanBarcode,
    to: "/dashboard/inventory/barcode-scan",
    accent: "tw:border-t-emerald-500",
    iconTint: "tw:bg-emerald-50 tw:text-emerald-600",
    desc: "Point · shoot · match",
    badge: "0.4s recognition",
  },
  {
    key: "photo",
    icon: Camera,
    action: "photo",
    accent: "tw:border-t-violet-500",
    iconTint: "tw:bg-violet-50 tw:text-violet-600",
    desc: "AI reads label + brand",
    badge: "Beta · 94% accurate",
    aiPowered: true,
  },
  {
    key: "voice",
    icon: Mic,
    action: "voice",
    accent: "tw:border-t-orange-500",
    iconTint: "tw:bg-orange-50 tw:text-orange-600",
    desc: "Kannada / Tamil / Hindi",
    badge: "5 languages",
    aiPowered: true,
  },
  {
    key: "catalog",
    icon: BookOpen,
    to: "/dashboard/inventory/subscribe/search?tab=search&hideTab=false",
    accent: "tw:border-t-blue-500",
    iconTint: "tw:bg-blue-50 tw:text-blue-600",
    desc: "56,020 items · A–Z",
    badge: "12 new · this week",
  },
  {
    key: "nearby",
    icon: MapPin,
    to: "/dashboard/inventory/subscribe/search?tab=top&sortType=popular&radiusKms=5&hideTab=true",
    accent: "tw:border-t-teal-500",
    iconTint: "tw:bg-teal-50 tw:text-teal-600",
    desc: "Popular within 5 km",
    badge: "Subscribed nearby",
    aiPowered: true,
  },
  {
    key: "create",
    icon: PlusCircle,
    to: "/dashboard/inventory/subscribe/add-product",
    accent: "tw:border-t-slate-400",
    iconTint: "tw:bg-slate-100 tw:text-slate-600",
    desc: "Off-catalog · homemade",
    badge: "Manual entry",
  },
];

const quickLinks: QuickLink[] = [
  {
    key: "unbranded",
    icon: Layers,
    to: "/dashboard/inventory/subscribe/un-brands?tab=un-brands&hideTab=true",
  },
  {
    key: "brands",
    icon: Tag,
    to: "/dashboard/inventory/subscribe/browse-brands?tab=brands",
  },
  {
    key: "approval",
    icon: ClipboardList,
    to: "/dashboard/inventory/subscribe/approval-history/products?tab=history",
  },
  {
    key: "bulk",
    icon: FileSpreadsheet,
    to: "/dashboard/inventory/subscribe/add-product/bulk",
  },
];

const tileClassName = (tile: Tile) =>
  `tw:group tw:relative tw:flex tw:flex-col tw:text-left tw:bg-white tw:rounded-2xl tw:p-4 tw:md:p-5 tw:border tw:border-slate-200 tw:border-t-2 ${tile.accent} tw:shadow-sm tw:transition-[transform,box-shadow,border-color] tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:shadow-md tw:hover:border-slate-300`;

const SubscribeMain = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["inventorySubscribe", "menu"]);

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
    const { icon: Icon, key, iconTint } = tile;
    return (
      <>
        {tile.aiPowered && (
          <span className="tw:absolute tw:top-2 tw:right-2 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary/10 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-primary">
            <Sparkles className="tw:w-3 tw:h-3" />
            {t("subscribeMain.aiPoweredBadge")}
          </span>
        )}
        <div
          className={`tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:md:w-12 tw:md:h-12 tw:rounded-xl tw:transition-transform tw:group-hover:scale-105 ${iconTint}`}
        >
          <Icon className="tw:w-5 tw:h-5 tw:md:w-6 tw:md:h-6" />
        </div>
        <div className="tw:mt-3 tw:text-sm tw:md:text-base tw:font-bold tw:text-slate-900">
          {t(`subscribeMain.tiles.${key}.label`)}
        </div>
        <div className="tw:mt-0.5 tw:text-xs tw:md:text-sm tw:text-slate-500">
          {tile.desc}
        </div>
        <span
          className={`tw:mt-3 tw:inline-flex tw:self-start tw:items-center tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-medium ${iconTint}`}
        >
          {tile.badge}
        </span>
      </>
    );
  };

  return (
    <>
      {/* `sectionKey`/`activeTab` turn the title into the tappable section
          switcher on theme-2 mobile, and `mobileLead="menu"` leads with the
          account hamburger — this is a top-level landing, so there's no
          meaningful back target. Mirrors the subscribe layout's header. */}
      <AppHeader
        title={t("subscribeMain.headerTitle")}
        sectionKey="catalog"
        activeTab="library"
        mobileLead="menu"
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — replaced on mobile by the SubscribeNavChips strip
            below, so the two sticky bars don't stack. */}
        {/* <SectionTabs sectionKey="catalog" activeTab="library" noShadow sticky /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="library"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container theme-2-mobile-gap-top">
            <AppBreadcrumbs data={breadcrumbs} />

            {/* Breadcrumbs are hidden in theme-2, so the chip strip is the first
                visible block: `app-nav-chips-flush` cancels the page gutter and
                the grid's top gap so it sits flush under the sticky header. */}
            <SubscribeNavChips className="app-nav-chips-flush tw:mb-3" />

            {/* Hero */}
            <div className="tw:relative tw:overflow-hidden tw:mt-2 tw:mb-6 tw:rounded-2xl tw:bg-linear-to-br tw:from-[#35538c] tw:via-[#294479] tw:to-[#1d2f55] tw:p-5 tw:md:p-7 tw:shadow-sm">
              <div className="tw:absolute tw:-right-12 tw:-top-12 tw:w-48 tw:h-48 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />
              <div className="tw:absolute tw:-right-20 tw:bottom-0 tw:w-64 tw:h-64 tw:rounded-full tw:bg-sky-300/10 tw:blur-3xl" />
              <div className="tw:relative">
                <h1 className="tw:text-xl tw:md:text-2xl tw:font-bold tw:text-white tw:text-balance">
                  {t("subscribeMain.heroTitle")}
                </h1>
                <p className="tw:mt-1.5 tw:text-sm tw:text-blue-50/90 tw:max-w-2xl">
                  {t("subscribeMain.heroSubtitle")}
                </p>
              </div>
            </div>

            {/* Section heading */}
            <div className="tw:mb-3 tw:flex tw:items-stretch tw:gap-2.5">
              <span
                aria-hidden
                className="tw:w-1 tw:shrink-0 tw:rounded-full tw:bg-primary"
              />
              <h2 className="tw:text-base tw:font-bold tw:leading-tight tw:text-slate-900">
                {t("subscribeMain.sectionEyebrow")}
              </h2>
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
              <div className="tw:mb-3 tw:flex tw:items-stretch tw:gap-2.5">
                <span
                  aria-hidden
                  className="tw:w-1 tw:shrink-0 tw:rounded-full tw:bg-primary"
                />
                <h2 className="tw:text-base tw:font-bold tw:leading-tight tw:text-slate-900">
                  {t("subscribeMain.quickLinksHeading")}
                </h2>
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3">
                {quickLinks.map(({ key, icon: Icon, to }) => (
                  <Link
                    key={key}
                    to={to}
                    className="tw:group tw:flex tw:items-center tw:gap-3 tw:bg-white tw:border tw:border-slate-200 tw:rounded-xl tw:p-3 tw:md:p-4 tw:transition-[box-shadow,border-color] tw:duration-200 tw:hover:shadow-sm tw:hover:border-slate-300"
                  >
                    <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:shrink-0 tw:bg-slate-100 tw:text-slate-600 tw:transition-colors tw:group-hover:bg-primary/10 tw:group-hover:text-primary">
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
                    <ChevronRight className="tw:w-5 tw:h-5 tw:shrink-0 tw:text-slate-400 tw:md:hidden" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handlePhotoResult}
      />

      {/* Cart FAB — redirects to cart page (used on both mobile and desktop).
          `theme-2-fab` lifts it above the theme-2 mobile bottom tab bar. */}
      <div
        className={`theme-2-fab tw:fixed tw:bottom-4 tw:right-4 tw:rounded-full tw:bg-orange-500 tw:text-white tw:p-1 tw:shadow-lg tw:h-12 tw:w-12 tw:flex tw:items-center tw:justify-center tw:cursor-pointer tw:hover:scale-105 tw:transition-all tw:duration-300 tw:z-20 tw:ring-2 tw:ring-orange-300 tw:ring-opacity-50 ${
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
    </>
  );
};

export default SubscribeMain;
