import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import { Button } from "~/components/ui/button";
import { Check, Globe } from "lucide-react";
import StorageService from "~/services/StorageService";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  title?: string;
};

const languages = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "hi", label: "हिन्दी" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
];

export default function AppLangChangeModal({ show, callback, title }: Props) {
  const { i18n, t } = useTranslation();

  const onClose = useCallback(() => {
    callback({ action: "close", data: {} });
  }, [callback]);

  const handleSelect = useCallback(
    async (lng: string) => {
      if (!lng || lng === i18n.language) {
        onClose();
        return;
      }
      await i18n.changeLanguage(lng);
      StorageService.set("language", lng);
      callback({ action: "changed", data: { language: lng } });
    },
    [callback, i18n, onClose]
  );

  return (
    <AppModal show={show} callback={callback} isAutoHeight>
      <AppModal.Title onClose={onClose} noShadow>
        <div className="tw:flex tw:items-center tw:gap-2 tw:font-semibold">
          <Globe className="tw:w-4 tw:h-4 tw:text-slate-600" />
          <span>{title || t("Choose language") || "Choose language"}</span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:p-4 tw:pt-2 tw:flex tw:flex-col tw:gap-3">
          <div className="tw:grid tw:grid-cols-2 md:tw:grid-cols-3 tw:gap-2">
            {languages.map((lang) => {
              const isActive = i18n.language === lang.value;
              return (
                <Button
                  key={lang.value}
                  variant={isActive ? "default" : "outline"}
                  className="tw:w-full tw:justify-center tw:cursor-pointer"
                  onClick={() => handleSelect(lang.value)}
                >
                  <div className="tw:flex tw:items-center tw:gap-2">
                    {isActive ? <Check className="tw:w-4 tw:h-4" /> : null}
                    <span>{lang.label}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
}
