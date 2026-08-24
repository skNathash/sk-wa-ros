import { Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useThemeSwitcher } from "~/hooks/useTheme";

/**
 * Theme switcher for the classic (theme-1) side menu — mirrors
 * LanguageSelector's compact row. Switching is applied live: `data-theme` on
 * <html> drives both stylesheets and every `useTheme()` consumer, so no reload
 * is needed.
 */
export default function ThemeSelector() {
  const { theme, setTheme, options } = useThemeSwitcher();

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:px-2">
      <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-md tw:bg-gray-100">
        <Palette className="tw:w-4 tw:h-4 tw:text-blue-500" aria-hidden="true" />
      </span>
      <span className="tw:text-xs tw:text-sidebar-foreground/70 tw:flex-1">
        Theme
      </span>
      <div className="tw:flex-1">
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger
            aria-label="Theme"
            className="tw:h-6 tw:px-1 tw:py-0 tw:text-xs tw:min-w-[60px] tw:border-0 tw:bg-transparent tw:shadow-none hover:tw:bg-gray-50"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
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
