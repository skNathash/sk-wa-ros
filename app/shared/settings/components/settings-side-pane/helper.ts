import {
  Clock,
  CreditCard,
  Printer,
  Settings,
  Upload,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { SectionTab } from "~/types/CommonTypes";

/** One destination inside the settings section. */
export interface SettingsEntry {
  key: string;
  label: string;
  labelLangKey: string;
  description: string;
  descriptionLangKey: string;
  /** Icon for the pane row / index card. */
  icon: LucideIcon;
  /** Icon name from `SECTION_ICON_MAP`, used by the mobile tab scroller. */
  tabIcon: string;
  /** Tailwind tint pair for the row's icon chip. */
  accent: string;
  path: string;
  rbac: string[];
  /** Heading the entry sits under — entries sharing one must be consecutive. */
  group: string;
  /**
   * Extra routes the entry owns, so a nested page (e.g. a sub-tab of the
   * config) keeps the right row highlighted.
   */
  matchPaths?: string[];
}

/**
 * Every page reachable from Settings, in the order the pane and the index
 * cards list them.
 *
 * Settings is a tab of the Profile section, so the desktop left rail stays the
 * profile rail; this list is what the settings side pane (and the mobile tab
 * scroller) navigate between.
 */
export const settingsEntries: SettingsEntry[] = [
  {
    key: "delivery-slot",
    label: "Delivery Slot Config",
    labelLangKey: "settings.deliverySlotConfig",
    description: "Configure delivery time slots and availability settings",
    descriptionLangKey: "settings.deliverySlotConfigDescription",
    icon: Clock,
    tabIcon: "clock",
    accent: "tw:bg-blue-50 tw:text-blue-600",
    path: "/configs/settings/delivery-slot",
    rbac: ["CONFIGS.DELIVERY-SLOT"],
    group: "Delivery",
  },
  {
    key: "prepaid-payment",
    label: "Prepaid Payment",
    labelLangKey: "settings.prepaidPayment",
    description: "Manage prepaid payment configuration",
    descriptionLangKey: "settings.prepaidPaymentDescription",
    icon: Wallet,
    tabIcon: "wallet",
    accent: "tw:bg-pink-50 tw:text-pink-600",
    path: "/configs/settings/prepaid-payment",
    rbac: ["CONFIGS.PAYMENT-CONFIG"],
    group: "Payments",
  },
  {
    key: "payment-config",
    label: "Payment Config",
    labelLangKey: "settings.paymentConfig",
    description: "Manage payment methods and transaction settings",
    descriptionLangKey: "settings.paymentConfigDescription",
    icon: CreditCard,
    tabIcon: "credit-card",
    accent: "tw:bg-green-50 tw:text-green-600",
    path: "/configs/settings/payment-config",
    rbac: ["CONFIGS.PAYMENT-CONFIG"],
    group: "Payments",
  },
  {
    key: "bulk-upload",
    label: "Bulk Upload",
    labelLangKey: "settings.bulkUpload",
    description: "Upload products in bulk",
    descriptionLangKey: "settings.bulkUploadDescription",
    icon: Upload,
    tabIcon: "upload",
    accent: "tw:bg-purple-50 tw:text-purple-600",
    path: "/dashboard/bulk-upload/add-stock",
    rbac: ["CONFIGS.BULK-UPLOAD"],
    group: "Catalog",
  },
  {
    key: "price-label-print",
    label: "Price Label Print",
    labelLangKey: "settings.priceLabelPrint",
    description: "Configure price label printing settings",
    descriptionLangKey: "settings.priceLabelPrintDescription",
    icon: Printer,
    tabIcon: "printer",
    accent: "tw:bg-cyan-50 tw:text-cyan-600",
    path: "/configs/settings/price-labels",
    rbac: ["CONFIGS.PRICE-LABEL-PRINT"],
    group: "Catalog",
  },
  {
    key: "advanced-setting",
    label: "Advanced Setting",
    labelLangKey: "settings.advancedSetting",
    description: "Configure advanced settings and preferences",
    descriptionLangKey: "settings.advancedSettingDescription",
    icon: Settings,
    tabIcon: "settings",
    accent: "tw:bg-indigo-50 tw:text-indigo-600",
    path: "/configs/settings/others",
    rbac: ["CONFIGS.ADVANCE-SETTINGS"],
    group: "Advanced",
  },
];

/**
 * Entries a master login may open without full access — the rest are the
 * store's own configuration and stay locked (see the settings pages' guard).
 */
export const masterLoginAllowedSettings = ["bulk-upload", "price-label-print"];

/** The settings entry that owns `pathname`, if any. */
export const getSettingsEntryByPath = (
  pathname: string,
): SettingsEntry | undefined =>
  settingsEntries.find(
    (entry) =>
      pathname === entry.path ||
      pathname.startsWith(`${entry.path}/`) ||
      entry.matchPaths?.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      ),
  );

/** Consecutive entries sharing a `group`, so a renderer prints it once. */
export const groupSettingsEntries = (entries: SettingsEntry[]) => {
  const groups: { label: string; entries: SettingsEntry[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.label === entry.group) {
      last.entries.push(entry);
      continue;
    }
    groups.push({ label: entry.group, entries: [entry] });
  }
  return groups;
};

/** The same destinations as a tab list, for the mobile section scroller. */
export const settingsSectionTabs: SectionTab[] = settingsEntries.map(
  (entry) => ({
    key: entry.key,
    label: entry.label,
    langKey: entry.labelLangKey,
    description: entry.description,
    icon: entry.tabIcon,
    rbac: entry.rbac,
    redirect: { url: entry.path },
  }),
);
