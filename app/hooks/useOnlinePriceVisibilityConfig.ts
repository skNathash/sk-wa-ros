import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

// The CLUB APP is the B2C storefront, so this display flag lives with the
// other B2C order config values.
const CONFIG_TYPE = "B2C_ORDER_CONFIG";

export const DEFAULT_BEST_PRICE_MESSAGE = "For the best price contact";

export interface OnlinePriceVisibilityConfig {
  showOnlyOnlineBestPrice: boolean;
  bestPriceContactMessage: string;
  showOnlinePriceOnApp: boolean;
}

export type OnlinePriceVisibilityUpdates = Partial<OnlinePriceVisibilityConfig>;

/**
 * Reads/writes the online-price visibility settings for the CLUB APP.
 *
 * - showOnlyOnlineBestPrice: when true, the actual/online price is hidden and
 *   the supplied contact message is shown for electronics products.
 * - bestPriceContactMessage: the text shown when showOnlyOnlineBestPrice is on.
 * - showOnlinePriceOnApp: when true, the online market price (Amazon/Flipkart)
 *   is shown next to the selling price.
 *
 * The two visibility modes are mutually exclusive: enabling the WhatsApp/contact
 * mode automatically disables the online-price comparison mode.
 */
const useOnlinePriceVisibilityConfig = () => {
  const { t } = useTranslation(["settings"]);
  const { show: showToast } = useAppToast();

  const [config, setConfig] = useState<OnlinePriceVisibilityConfig>({
    // Online prices are shown by default; hiding them is opt-in.
    showOnlinePriceOnApp: true,
    // WhatsApp/contact-for-price mode is off by default.
    showOnlyOnlineBestPrice: false,
    bestPriceContactMessage: DEFAULT_BEST_PRICE_MESSAGE,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await FranchiseService.getFranchiseSettings({
          configType: CONFIG_TYPE,
        });
        if (cancelled) return;
        const configValue = res?.data?.data?.configValue || {};
        setConfig({
          showOnlinePriceOnApp: configValue.showOnlinePriceOnApp !== false,
          showOnlyOnlineBestPrice: configValue.showOnlyOnlineBestPrice === true,
          bestPriceContactMessage:
            typeof configValue.bestPriceContactMessage === "string" &&
            configValue.bestPriceContactMessage.trim() !== ""
              ? configValue.bestPriceContactMessage
              : DEFAULT_BEST_PRICE_MESSAGE,
        });
      } catch (e: any) {
        if (cancelled) return;
        showToast({
          msg: e?.message || t("onlinePriceVisibility.updateFailed"),
          color: "error",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (updates: OnlinePriceVisibilityUpdates) => {
      setSaving(true);
      try {
        // Re-read before writing so we merge into (instead of replace) the rest
        // of the B2C order config.
        const res = await FranchiseService.getFranchiseSettings({
          configType: CONFIG_TYPE,
        });
        const existingConfigValue = res?.data?.data?.configValue || {};

        const next: OnlinePriceVisibilityConfig = {
          showOnlinePriceOnApp: existingConfigValue.showOnlinePriceOnApp !== false,
          showOnlyOnlineBestPrice:
            existingConfigValue.showOnlyOnlineBestPrice === true,
          bestPriceContactMessage:
            typeof existingConfigValue.bestPriceContactMessage === "string" &&
            existingConfigValue.bestPriceContactMessage.trim() !== ""
              ? existingConfigValue.bestPriceContactMessage
              : DEFAULT_BEST_PRICE_MESSAGE,
          ...updates,
        };

        // Enforce mutual exclusivity: contact mode wins and hides online prices.
        if (next.showOnlyOnlineBestPrice) {
          next.showOnlinePriceOnApp = false;
        }

        const payload = {
          franchiseId: AuthService.getLoggedInUserId(),
          configType: CONFIG_TYPE,
          configValue: {
            ...(res?.data?.data?.configValue || {}),
            showOnlyOnlineBestPrice: next.showOnlyOnlineBestPrice,
            bestPriceContactMessage: next.bestPriceContactMessage,
            showOnlinePriceOnApp: next.showOnlinePriceOnApp,
          },
        };

        const upd: any = await FranchiseService.updateFranchiseSettings(payload);

        if (upd?.statusCode === 200 || upd?.statusCode === 201) {
          setConfig(next);
          showToast({
            msg: t("onlinePriceVisibility.updatedSuccessfully"),
            color: "success",
          });
          return true;
        }

        showToast({
          msg: upd?.data?.message || t("onlinePriceVisibility.updateFailed"),
          color: "error",
        });
        return false;
      } catch (err: any) {
        console.error("Error updating online price visibility config:", err);
        showToast({
          msg: err?.message || t("onlinePriceVisibility.updateFailed"),
          color: "error",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { ...config, loading, saving, save };
};

export default useOnlinePriceVisibilityConfig;
