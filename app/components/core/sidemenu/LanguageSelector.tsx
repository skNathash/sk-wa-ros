import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import StorageService from "~/services/StorageService";
import CommonService from "~/services/CommonService";

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Language options for the select dropdown
  const languageOptions = CommonService.getAppSupportedLanguages();

  // Update current language when i18n language changes
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = async (newLang: string) => {
    try {
      await i18n.changeLanguage(newLang);
      StorageService.set("language", newLang);
      setCurrentLanguage(newLang);
      // Reload the app so the new language is applied everywhere
      window.location.reload();
    } catch (err) {
      // If changeLanguage fails, still persist selection locally
      StorageService.set("language", newLang);
      setCurrentLanguage(newLang);
    }
  };

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:px-2">
      <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-md tw:bg-gray-100">
        <Globe className="tw:w-4 tw:h-4 tw:text-blue-500" aria-hidden="true" />
      </span>
      <span className="tw:text-xs tw:text-sidebar-foreground/70 tw:flex-1">
        {t("Language") || "Language"}
      </span>
      <div className="tw:flex-1">
        <Select value={currentLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="tw:h-6 tw:px-1 tw:py-0 tw:text-xs tw:min-w-[60px] tw:border-0 tw:bg-transparent tw:shadow-none hover:tw:bg-gray-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
