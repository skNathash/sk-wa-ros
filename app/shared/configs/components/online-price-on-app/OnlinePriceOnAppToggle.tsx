import { Smartphone, Store } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import useOnlinePriceVisibilityConfig from "~/hooks/useOnlinePriceVisibilityConfig";

/**
 * Compact, inline notice for the online-price visibility setting, surfaced in
 * context (e.g. on Manage Price). It shows the current CLUB APP state and a
 * link to the full settings card; toggling is handled on the settings page so
 * the WhatsApp/contact message and online-price options stay in one place.
 */
const OnlinePriceOnAppToggle: React.FC = () => {
  const { t } = useTranslation(["settings"]);
  const appNav = useAppNav();
  const { showOnlyOnlineBestPrice, showOnlinePriceOnApp } =
    useOnlinePriceVisibilityConfig();

  const navigateToSettings = () =>
    appNav.to("/configs/settings/others?section=online-price-visibility");

  if (showOnlyOnlineBestPrice) {
    return (
      <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-2 tw:rounded-md tw:border tw:border-amber-200 tw:bg-amber-50/60 tw:px-3 tw:py-2 sm:tw:flex-row sm:tw:items-center sm:tw:justify-between">
        <div className="tw:flex tw:items-start tw:gap-2">
          <Smartphone
            size={16}
            className="tw:mt-0.5 tw:shrink-0 tw:text-amber-600"
          />
          <p className="tw:text-xs tw:text-gray-600">
            <span className="tw:mr-1.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-amber-700">
              {t("onlinePriceVisibility.compactScope")}
            </span>
            {t("onlinePriceVisibility.compactContactMode")}
          </p>
        </div>
        <div className="tw:flex tw:items-center tw:gap-3 tw:shrink-0 sm:tw:pl-3">
          <div className="tw:text-xs tw:font-semibold tw:text-amber-700">
            {t("onlinePriceVisibility.contactModeActive")}
          </div>
          <button
            type="button"
            onClick={navigateToSettings}
            className="tw:text-xs tw:font-medium tw:text-amber-700 tw:underline tw:underline-offset-2 hover:tw:text-amber-800"
          >
            {t("onlinePriceVisibility.changeInSettings")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-2 tw:rounded-md tw:border tw:border-blue-100 tw:bg-blue-50/60 tw:px-3 tw:py-2 sm:tw:flex-row sm:tw:items-center sm:tw:justify-between">
      <div className="tw:flex tw:items-start tw:gap-2">
        <Store size={16} className="tw:mt-0.5 tw:shrink-0 tw:text-blue-600" />
        <p className="tw:text-xs tw:text-gray-600">
          <span className="tw:mr-1.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-blue-700">
            {t("onlinePriceVisibility.compactScope")}
          </span>
          {showOnlinePriceOnApp
            ? t("onlinePriceVisibility.compactVisible")
            : t("onlinePriceVisibility.compactHidden")}
        </p>
      </div>

      <div className="tw:flex tw:items-center tw:gap-3 tw:shrink-0 sm:tw:pl-3">
        <div
          className={
            "tw:text-xs tw:font-semibold " +
            (showOnlinePriceOnApp
              ? "tw:text-emerald-600"
              : "tw:text-gray-500")
          }
        >
          {showOnlinePriceOnApp
            ? t("onlinePriceVisibility.visible")
            : t("onlinePriceVisibility.hidden")}
        </div>
        <button
          type="button"
          onClick={navigateToSettings}
          className="tw:text-xs tw:font-medium tw:text-blue-700 tw:underline tw:underline-offset-2 hover:tw:text-blue-800"
        >
          {t("onlinePriceVisibility.changeInSettings")}
        </button>
      </div>
    </div>
  );
};

export default OnlinePriceOnAppToggle;
