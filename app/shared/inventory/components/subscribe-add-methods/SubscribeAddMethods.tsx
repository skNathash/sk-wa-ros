import clsx from "clsx";
import {
  Camera,
  ChevronRight,
  type LucideIcon,
  MapPin,
  Mic,
  Plus,
  ScanBarcode,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";

const SEARCH_PATH = "/dashboard/inventory/subscribe/search";
const CART_PATH = "/dashboard/inventory/subscribe/cart";

interface AddMethod {
  /** Matches the `subscribeMain.tiles.<key>` i18n block. */
  key: string;
  icon: LucideIcon;
  /** Per-method hue class — see `.app-capture-tile--*` in styles/subscribe-add-methods.css. */
  accentClassName: string;
  /** Navigation target. Omitted for methods that open a modal instead. */
  to?: string;
  /** Methods that open something on the page rather than navigating. */
  action?: "photo" | "voice";
}

/** The quick ways to add a product, mirrored from the subscribe/main tiles. */
const METHODS: AddMethod[] = [
  {
    key: "scan",
    icon: ScanBarcode,
    accentClassName: "app-capture-tile--scan",
    to: "/dashboard/inventory/barcode-scan",
  },
  {
    key: "photo",
    icon: Camera,
    accentClassName: "app-capture-tile--photo",
    action: "photo",
  },
  {
    key: "voice",
    icon: Mic,
    accentClassName: "app-capture-tile--voice",
    action: "voice",
  },
  {
    key: "nearby",
    icon: MapPin,
    accentClassName: "app-capture-tile--nearby",
    to: `${SEARCH_PATH}?tab=top&sortType=popular&radiusKms=5&hideTab=true`,
  },
];

/** Manual create — kept out of the grid; it's the fallback, not a method. */
const CREATE_PATH = "/dashboard/inventory/subscribe/add-product";

/** Shared focus ring, so keyboard users get the same affordance on every row.
    No ring offset: the pane background is cream in theme-2, and the default
    white offset would read as a gap rather than a halo. */
const focusClassName =
  "tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-slate-500";

/**
 * Capture-method tile. These are the panel's subject, so they get the room and
 * the colour: icon chip on top, label, and the one-line hint that tells a new
 * user what the method actually does. The hue lives in the feature stylesheet,
 * app/styles/subscribe-add-methods.css.
 */
const methodClassName = clsx(
  "app-capture-tile tw:group tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:items-start tw:gap-1.5 tw:rounded-xl tw:p-2.5 tw:text-left",
  focusClassName,
);

interface SubscribeAddMethodsProps {
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  className?: string;
}

/**
 * The ways to add a product + the subscription cart, as a compact panel.
 * Ordered by what the user reaches for: the four capture methods — scan, AI
 * photo, AI voice, nearby — lead as a two-column tile grid (photo/voice open
 * their capture flow in place), manual create follows as the quiet fallback,
 * and the cart closes the panel as the review step, carrying its own live count
 * (fetched on mount, refreshed on the subscribe cart events). Fetches
 * everything it needs, so it can be dropped into any pane without the host
 * wiring anything up.
 */
const SubscribeAddMethods = ({
  title = "Add Products",
  className,
}: SubscribeAddMethodsProps) => {
  const { t } = useTranslation("inventorySubscribe");
  const appNav = useAppNav();

  const [cartCount, setCartCount] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchCartDetails = async () => {
      try {
        const { totalCount } =
          await InventorySubscribeService.getCartAndPendingCount();
        if (active) setCartCount(totalCount);
      } catch (error) {
        console.error("Error fetching cart details:", error);
        if (active)
          setCartCount(InventorySubscribeService.getLocalCart()?.length || 0);
      }
    };

    fetchCartDetails();

    document.addEventListener("subscribe-item-added", fetchCartDetails);
    document.addEventListener("subscribe-item-removed", fetchCartDetails);
    MiscService.listenEvent("create-pending-updated", fetchCartDetails);

    return () => {
      active = false;
      document.removeEventListener("subscribe-item-added", fetchCartDetails);
      document.removeEventListener("subscribe-item-removed", fetchCartDetails);
      MiscService.removeEventListener(
        "create-pending-updated",
        fetchCartDetails,
      );
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

  // Photo (AI) result -> search page with the detected term.
  const handlePhotoResult = (res: { action: string; data?: any }) => {
    setShowAiModal(false);
    if (res.action !== "proceed") return;

    const results = Array.isArray(res.data) ? res.data : [];
    const productData = results[0] || {};
    const basicInfo = productData?.product_basic_info || {};
    const searchTerm = (
      basicInfo.product_name ||
      basicInfo.barcode ||
      productData?.barcode ||
      ""
    ).trim();

    if (searchTerm) goToSearch({ search: searchTerm });
  };

  // Voice result -> search page with the term + collected keys.
  const handleVoiceResult = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if ((action !== "close" && action !== "scan") || !data) return;

    let searchTerm = "";
    let keys: string[] = [];

    if (Array.isArray(data.keywords)) {
      keys = data.keywords.filter(Boolean);
      searchTerm = keys[0] || "";
    } else if (typeof data.search === "string") {
      searchTerm = data.search;
      keys = [data.search];
    }

    if (!searchTerm) return;

    const params: Record<string, string> = { search: searchTerm, via: "voice" };
    if (keys.length) params.keys = keys.join(",");
    goToSearch(params);
  };

  const renderMethodInner = ({ key, icon: Icon }: AddMethod) => (
    <>
      <span className="app-capture-icon tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg">
        <Icon size={16} />
      </span>
      {/* Wraps rather than truncates: these labels run long in English and
          longer still in the Indic locales, and a clipped label is unusable. */}
      <span className="tw:min-w-0 tw:text-xs tw:font-semibold tw:leading-tight tw:text-slate-800">
        {t(`subscribeMain.tiles.${key}.label`)}
      </span>
      <span className="tw:min-w-0 tw:text-[10px] tw:leading-snug tw:text-slate-500">
        {t(`subscribeMain.tiles.${key}.description`)}
      </span>
    </>
  );

  return (
    <div className={className}>
      {title ? (
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </p>
      ) : null}

      {/* Capture methods — the panel's lead. Each tile owns a hue keyed to what
          it uses to find the product, so the four read as distinct instruments
          rather than one repeated row. */}
      <div
        className={clsx("tw:grid tw:grid-cols-2 tw:gap-2", title && "tw:mt-2")}
      >
        {METHODS.map((method) => {
          const className = clsx(methodClassName, method.accentClassName);

          if (method.action === "voice") {
            return (
              <VoiceSearch
                key={method.key}
                callback={handleVoiceResult}
                className={className}
              >
                {renderMethodInner(method)}
              </VoiceSearch>
            );
          }

          if (method.action === "photo") {
            return (
              <button
                key={method.key}
                type="button"
                onClick={() => setShowAiModal(true)}
                className={className}
              >
                {renderMethodInner(method)}
              </button>
            );
          }

          return (
            <Link
              key={method.key}
              to={method.to as string}
              className={className}
            >
              {renderMethodInner(method)}
            </Link>
          );
        })}
      </div>

      {/* Manual create — the fallback when none of the four finds the item, so
          it sits under them as a quiet outlined row. */}
      <Link
        to={CREATE_PATH}
        className={clsx(
          "app-create-item-row tw:mt-2 tw:flex tw:min-h-11 tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-lg tw:px-2.5 tw:py-2 tw:text-left",
          focusClassName,
        )}
      >
        <Plus size={15} className="tw:shrink-0" />
        <span className="tw:min-w-0 tw:flex-1 tw:text-xs tw:font-semibold tw:leading-tight">
          {t("subscribeMain.tiles.create.label")}
        </span>
        <span className="tw:hidden tw:shrink-0 tw:text-[10px] tw:text-slate-500 tw:sm:block">
          {t("subscribeMain.tiles.create.description")}
        </span>
        <ChevronRight size={15} className="tw:shrink-0 tw:opacity-60" />
      </Link>

      {/* Subscription cart — live count, opens the cart page. Sits last because
          it is where the adding ends, not another way to add; the count chip
          carries the state so the row itself can stay quiet when empty. */}
      <button
        type="button"
        onClick={() => appNav.to(CART_PATH)}
        className={clsx(
          "tw:mt-1.5 tw:flex tw:min-h-11 tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-lg tw:border tw:px-2.5 tw:py-2 tw:text-left tw:transition-colors tw:duration-150",
          cartCount > 0
            ? "app-subscribe-cart-row--filled"
            : "tw:border-slate-200 tw:bg-white tw:hover:bg-slate-50",
          focusClassName,
        )}
      >
        <ShoppingCart size={15} className="tw:shrink-0 tw:text-slate-500" />
        <span className="tw:min-w-0 tw:flex-1 tw:text-xs tw:font-semibold tw:text-slate-700">
          {t("subscribeMain.cartLabel", { defaultValue: "Subscription Cart" })}
        </span>
        {cartCount > 0 ? (
          <span className="app-subscribe-cart-count tw:shrink-0 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:tabular-nums">
            {cartCount}
          </span>
        ) : (
          <span className="tw:shrink-0 tw:text-[11px] tw:text-slate-500">
            {t("subscribeMain.cartEmptyHint", {
              defaultValue: "Nothing added yet",
            })}
          </span>
        )}
        <ChevronRight size={15} className="tw:shrink-0 tw:text-slate-400" />
      </button>

      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handlePhotoResult}
      />
    </div>
  );
};

export default SubscribeAddMethods;
