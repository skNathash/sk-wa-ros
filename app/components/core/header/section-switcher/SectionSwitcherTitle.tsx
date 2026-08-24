import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import SectionTabService from "~/services/SectionTabService";
import type { SectionTabKey } from "~/types/CommonTypes";
import SectionSwitchSheet from "./SectionSwitchSheet";

interface SectionSwitcherTitleProps {
  /** Which section the current page belongs to. */
  sectionKey: SectionTabKey;
  /** Active tab key; derived from the current route when omitted. */
  activeTab?: string;
  /**
   * Fallback title, used when the current route matches no tab in the section
   * (the active tab's own label wins otherwise).
   */
  title?: React.ReactNode;
  /** Line under the title, e.g. "8 sellers · 16+ SKUs near you". */
  subtitle?: React.ReactNode;
  /** Live counts keyed by tab key, merged over the tab config badges. */
  badges?: Record<string, number | string | undefined>;
}

/**
 * theme-2 mobile header title — shows the section name as an eyebrow, the
 * current destination as a tappable title with a chevron, and an optional
 * subtitle. Tapping it opens {@link SectionSwitchSheet} to jump anywhere else
 * inside the same section.
 *
 * Rendered by {@link AppHeader} when a `sectionKey` is passed; the header falls
 * back to its plain title elsewhere (desktop uses the side rail / nav chips).
 */
const SectionSwitcherTitle = ({
  sectionKey,
  activeTab,
  title,
  subtitle,
  badges,
}: SectionSwitcherTitleProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const meta = SectionTabService.getMeta(sectionKey);

  const activeLabel = useMemo(() => {
    const tabs = SectionTabService.getTabs(sectionKey);
    const key = SectionTabService.resolveActiveTab(
      tabs,
      location.pathname,
      activeTab,
    );
    return tabs.find((tab) => tab.key === key)?.label;
  }, [sectionKey, activeTab, location.pathname]);

  return (
    <>
      <div className="tw:min-w-0">
        <p className="tw:text-[9px] tw:leading-none tw:font-semibold tw:tracking-wider tw:uppercase tw:opacity-70">
          {meta.label}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="tw:mt-0.5 tw:flex tw:max-w-full tw:cursor-pointer tw:items-center tw:gap-1.5"
        >
          <span className="tw:truncate tw:text-lg tw:leading-tight tw:font-semibold">
            {activeLabel ?? title ?? meta.label}
          </span>
          <span className="tw:flex tw:size-4 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15">
            <ChevronDown
              className={clsx(
                "tw:size-3 tw:transition-transform tw:duration-150",
                open && "tw:rotate-180",
              )}
            />
          </span>
        </button>
        {subtitle ? (
          <div className="tw:truncate tw:text-[11px] tw:leading-tight tw:opacity-80">
            {subtitle}
          </div>
        ) : null}
      </div>

      <SectionSwitchSheet
        open={open}
        onOpenChange={setOpen}
        sectionKey={sectionKey}
        activeTab={activeTab}
        badges={badges}
      />
    </>
  );
};

export default SectionSwitcherTitle;
