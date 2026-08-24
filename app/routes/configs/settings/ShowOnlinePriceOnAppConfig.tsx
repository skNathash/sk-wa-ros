import { MessageCircle, Monitor, Smartphone } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppCard from "~/components/core/card/AppCard";
import AppSwitch from "~/components/core/form/AppSwitch";
import useOnlinePriceVisibilityConfig from "~/hooks/useOnlinePriceVisibilityConfig";

const SECTION_ID = "online-price-visibility";

const ShowOnlinePriceOnAppConfig: React.FC = () => {
  const { t } = useTranslation(["settings"]);
  const [searchParams] = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const { showOnlyOnlineBestPrice, showOnlinePriceOnApp, loading, saving, save } =
    useOnlinePriceVisibilityConfig();

  useEffect(() => {
    if (searchParams.get("section") === SECTION_ID && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const closeDialog = () => setAppAlertDialog((p) => ({ ...p, show: false }));

  const handleToggleBestPrice = (turningOn: boolean) => {
    setAppAlertDialog({
      show: true,
      title: turningOn
        ? t("onlinePriceVisibility.enableContactTitle")
        : t("onlinePriceVisibility.disableContactTitle"),
      description: turningOn
        ? t("onlinePriceVisibility.enableContactDescription")
        : t("onlinePriceVisibility.disableContactDescription"),
      onConfirm: async () => {
        closeDialog();
        await new Promise((r) => setTimeout(r, 100));
        await save({ showOnlyOnlineBestPrice: turningOn });
      },
      onCancel: closeDialog,
    });
  };

  const handleToggleOnlinePrice = (turningOn: boolean) => {
    setAppAlertDialog({
      show: true,
      title: turningOn
        ? t("onlinePriceVisibility.enableOnlinePriceTitle")
        : t("onlinePriceVisibility.disableOnlinePriceTitle"),
      description: turningOn
        ? t("onlinePriceVisibility.enableOnlinePriceDescription")
        : t("onlinePriceVisibility.disableOnlinePriceDescription"),
      onConfirm: async () => {
        closeDialog();
        await new Promise((r) => setTimeout(r, 100));
        await save({ showOnlinePriceOnApp: turningOn });
      },
      onCancel: closeDialog,
    });
  };

  return (
    <div
      id={SECTION_ID}
      ref={cardRef}
      className={
        "tw:transition-all tw:duration-200 " +
        (highlight
          ? "animate__animated animate__flash animate__repeat-1 tw:-mx-2 tw:rounded-xl tw:bg-amber-50/40 tw:px-2 tw:py-1 tw:ring-2 tw:ring-amber-300 tw:ring-offset-2"
          : "")
      }
    >
      <AppCard title={t("onlinePriceVisibility.title")} icon="settings">
        <div className="tw:flex tw:flex-col tw:gap-4">
        <p className="tw:text-sm tw:text-gray-600">
          {t("onlinePriceVisibility.description")}
        </p>

        {/* Primary option: WhatsApp / contact-for-best-price mode */}
        <div
          className={
            "tw:rounded-lg tw:border tw:p-3 " +
            (showOnlyOnlineBestPrice
              ? "tw:border-amber-200 tw:bg-amber-50/50"
              : "tw:border-gray-200 tw:bg-white")
          }
        >
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div
                className={
                  "tw:mt-0.5 tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full " +
                  (showOnlyOnlineBestPrice
                    ? "tw:bg-amber-100 tw:text-amber-600"
                    : "tw:bg-gray-100 tw:text-gray-500")
                }
              >
                <Smartphone size={16} />
              </div>
              <div>
                <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                  {t("onlinePriceVisibility.contactViaWhatsApp")}
                </div>
                <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                  {t("onlinePriceVisibility.contactViaWhatsAppHint")}
                </p>
              </div>
            </div>
            <AppSwitch
              checked={showOnlyOnlineBestPrice}
              disabled={loading || saving}
              onCheckedChange={handleToggleBestPrice}
              label={
                <span
                  className={
                    "tw:text-xs tw:font-semibold " +
                    (showOnlyOnlineBestPrice
                      ? "tw:text-amber-600"
                      : "tw:text-gray-500")
                  }
                >
                  {showOnlyOnlineBestPrice
                    ? t("onlinePriceVisibility.active")
                    : t("onlinePriceVisibility.inactive")}
                </span>
              }
            />
          </div>

        </div>

        {/* Secondary option: online price comparison (only when contact mode is off) */}
        {!showOnlyOnlineBestPrice && (
          <div
            className={
              "tw:rounded-lg tw:border tw:p-3 " +
              (showOnlinePriceOnApp
                ? "tw:border-emerald-200 tw:bg-emerald-50/40"
                : "tw:border-gray-200 tw:bg-white")
            }
          >
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
              <div className="tw:flex tw:items-start tw:gap-3">
                <div
                  className={
                    "tw:mt-0.5 tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full " +
                    (showOnlinePriceOnApp
                      ? "tw:bg-emerald-100 tw:text-emerald-600"
                      : "tw:bg-gray-100 tw:text-gray-500")
                  }
                >
                  <Monitor size={16} />
                </div>
                <div>
                  <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                    {t("onlinePriceVisibility.showOnlinePrice")}
                  </div>
                  <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                    {t("onlinePriceVisibility.showOnlinePriceHint")}
                  </p>
                </div>
              </div>
              <AppSwitch
                checked={showOnlinePriceOnApp}
                disabled={loading || saving}
                onCheckedChange={handleToggleOnlinePrice}
                label={
                  <span
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
                  </span>
                }
              />
            </div>
          </div>
        )}

        {/* Compact summary shown when WhatsApp mode is active */}
        {showOnlyOnlineBestPrice && (
          <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-md tw:border tw:border-amber-100 tw:bg-amber-50/70 tw:px-3 tw:py-2 tw:text-xs tw:text-amber-800">
            <MessageCircle
              size={14}
              className="tw:mt-0.5 tw:shrink-0"
            />
            <span>{t("onlinePriceVisibility.onlinePriceHiddenByWhatsApp")}</span>
          </div>
        )}

        <AppAlertDialog
          title={appAlertDialog.title}
          description={appAlertDialog.description}
          show={appAlertDialog.show}
          onConfirm={appAlertDialog.onConfirm}
          onCancel={appAlertDialog.onCancel}
        />
      </div>
    </AppCard>
    </div>
  );
};

export default ShowOnlinePriceOnAppConfig;
