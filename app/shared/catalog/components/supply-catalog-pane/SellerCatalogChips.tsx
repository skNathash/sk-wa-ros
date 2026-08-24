import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

export type SellerCatalogChipKey =
  | "home"
  | "reorder"
  | "new-arrivals"
  | "categories"
  | "menus"
  | "brands"
  | "sellers";

type Chip = {
  key: SellerCatalogChipKey;
  label: string;
  path: string;
  /** Extra query params carried into the destination. */
  params?: Record<string, string>;
};

/**
 * Every chip this strip renders, in display order. "New arrivals" lands on the
 * shared per-data-point feature page (see CatalogOverview keys); the rest go to
 * their dedicated browse pages.
 */
const CHIPS: Record<SellerCatalogChipKey, Chip> = {
  home: {
    key: "home",
    label: "Home",
    path: "/products/main",
  },
  reorder: {
    key: "reorder",
    label: "Reorder",
    path: "/products/buy-from-other-retailer/products/reorder",
  },
  "new-arrivals": {
    key: "new-arrivals",
    label: "New arrivals",
    path: "/products/buy-from-other-retailer/products/feature",
    params: { key: "new-launches" },
  },
  categories: {
    key: "categories",
    label: "By category",
    path: "/products/buy-from-other-retailer/products/category",
  },
  menus: {
    key: "menus",
    label: "By menu",
    path: "/products/buy-from-other-retailer/products/menu",
  },
  brands: {
    key: "brands",
    label: "By brand",
    path: "/products/buy-from-other-retailer/products/brands",
  },
  sellers: {
    key: "sellers",
    label: "By seller",
    path: "/products/buy-from-other-retailer/retailers",
  },
};

const CHIP_ORDER: SellerCatalogChipKey[] = [
  "home",
  "reorder",
  "new-arrivals",
  "categories",
  "menus",
  "brands",
  "sellers",
];

interface SellerCatalogChipsProps {
  /**
   * Force which chip renders active. When omitted the active chip is derived
   * from the current route/query.
   */
  activeKey?: SellerCatalogChipKey;
  /** Browse distance carried through to the destination page. */
  distance?: string | number;
  /**
   * Handle the tap yourself (in-page filtering). When provided the chip does
   * not navigate.
   */
  onSelect?: (key: SellerCatalogChipKey) => void;
  className?: string;
}

// Work out which chip should read as active from the current URL. The browse
// pages match on pathname; the shared feature page is classified by the data
// point key it was opened with.
const resolveActiveKey = (
  pathname: string,
  searchParams: URLSearchParams,
): SellerCatalogChipKey | undefined => {
  if (pathname.includes("/products/main")) {
    return "home";
  }
  if (pathname.includes("/products/reorder")) {
    return "reorder";
  }
  if (pathname.includes("/products/feature")) {
    const key = searchParams.get("key");
    if (key === "new-launches") {
      return "new-arrivals";
    }
    return undefined;
  }
  if (pathname.includes("/products/category")) {
    return "categories";
  }
  if (pathname.includes("/products/menu")) {
    return "menus";
  }
  if (pathname.includes("/products/brands")) {
    return "brands";
  }
  if (
    pathname.includes("/buy-from-other-retailer/retailers") ||
    pathname.includes("/buy-from-other-retailer/retailer/")
  ) {
    return "sellers";
  }
  if (pathname.includes("/products/list")) {
    if (searchParams.get("categoryId")) {
      return "categories";
    }
    if (searchParams.get("brandId")) {
      return "brands";
    }
    if (searchParams.get("menuId")) {
      return "menus";
    }
    // Unfiltered list = the full catalog.
    return "home";
  }
  return undefined;
};

const SellerCatalogChips = ({
  activeKey,
  distance,
  onSelect,
  className,
}: SellerCatalogChipsProps) => {
  const appNav = useAppNav();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const resolvedActiveKey = activeKey ?? resolveActiveKey(pathname, searchParams);

  const data: PaneChipItem[] = CHIP_ORDER.map((key) => {
    const chip = CHIPS[key];
    return {
      key,
      label: chip.label,
      active: key === resolvedActiveKey,
      chip,
    };
  });

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    const chip = item.chip as Chip;
    if (onSelect) {
      onSelect(chip.key);
      return;
    }
    const params: Record<string, string | number> = { ...(chip.params || {}) };
    if (distance !== undefined) {
      params.distance = distance;
    }
    appNav.to(chip.path, Object.keys(params).length ? params : undefined);
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default SellerCatalogChips;
