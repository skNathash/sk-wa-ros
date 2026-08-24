import {
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Boxes,
  BookOpen,
  Camera,
  ChartColumn,
  ChartLine,
  ClipboardList,
  Clock,
  CreditCard,
  FileCheck,
  Gift,
  Grid3x3,
  IdCard,
  Image,
  LayoutDashboard,
  Library,
  Lightbulb,
  MapPin,
  Package,
  PackageCheck,
  Printer,
  Radio,
  Receipt,
  Route,
  ScanLine,
  Sun,
  Search,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  Trophy,
  Truck,
  Undo2,
  Upload,
  Users,
  Wallet,
  Warehouse,
  User,
  Settings,
  Pencil,
  MessageCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import type { SectionTab } from "~/types/CommonTypes";

/**
 * Static lookup for the icon names used by {@link SectionTabService} tabs —
 * avoids DynamicIcon (per-icon dynamic imports). Add an entry here when a new
 * icon name is introduced in the section tab config.
 *
 * Shared by every renderer of the section tabs: the desktop rail
 * (`SectionMenu`), the mobile chip scroller (`SectionTabs`) and the theme-2
 * header switcher (`SectionSwitchSheet`).
 */
export const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  "scan-line": ScanLine,
  search: Search,
  "chart-line": ChartLine,
  "shopping-bag": ShoppingBag,
  "package-check": PackageCheck,
  "undo-2": Undo2,
  truck: Truck,
  route: Route,
  users: Users,
  "id-card": IdCard,
  gift: Gift,
  "credit-card": CreditCard,
  clock: Clock,
  printer: Printer,
  upload: Upload,
  wallet: Wallet,
  receipt: Receipt,
  "chart-column": ChartColumn,
  lightbulb: Lightbulb,
  grid: Grid3x3,
  "map-pin": MapPin,
  store: Store,
  "clipboard-list": ClipboardList,
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  library: Library,
  warehouse: Warehouse,
  barcode: Barcode,
  boxes: Boxes,
  package: Package,
  tag: Tag,
  user: User,
  settings: Settings,
  pencil: Pencil,
  "message-circle": MessageCircle,
  "file-text": FileText,
  "file-check": FileCheck,
  camera: Camera,
  image: Image,
  "arrow-down-left": ArrowDownLeft,
  "arrow-up-right": ArrowUpRight,
  "trending-up": TrendingUp,
  sun: Sun,
  trophy: Trophy,
  radio: Radio,
};

/**
 * Renders a tab icon — either a name from {@link SECTION_ICON_MAP} or an
 * already-built React node, sized to `size`.
 */
export const renderSectionIcon = (
  icon: SectionTab["icon"],
  size = 20,
): React.ReactNode => {
  if (!icon) return null;
  if (typeof icon === "string") {
    const Icon = SECTION_ICON_MAP[icon];
    return Icon ? <Icon size={size} /> : null;
  }
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, { size } as any);
  }
  return icon;
};
