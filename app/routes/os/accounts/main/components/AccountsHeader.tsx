import { ChevronLeft, IndianRupee, Search } from "lucide-react";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";

/**
 * Teal chat-style header for the Accounts ledger: back arrow, ₹ avatar,
 * title + date line, search, and the section tabs.
 *
 * The tabs are rendered here rather than via `AppTab` because they sit *on* the
 * primary header — theme-2 paints `AppTab`'s track white with a green active
 * pill, which is built for a light page and reads as a light-on-light smudge
 * against the teal.
 */
const AccountsHeader = ({
  tabs,
  activeTab,
  onTabChange,
  title,
  dateLabel,
}: {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  title: string;
  dateLabel: string;
}) => {
  const appNav = useAppNav();

  return (
    <header className="tw:shrink-0 tw:bg-primary tw:text-primary-foreground">
      <div className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:pt-3 tw:pb-2">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => appNav.back()}
          className="tw:-ml-1 tw:cursor-pointer tw:rounded-full tw:p-1 tw:transition-colors tw:hover:bg-white/10"
        >
          <ChevronLeft size={24} />
        </button>

        <span className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15">
          <IndianRupee size={18} />
        </span>

        <div className="tw:min-w-0 tw:flex-1">
          <h1 className="tw:truncate tw:text-lg tw:font-semibold tw:leading-tight">
            {title}
          </h1>
          <p className="tw:truncate tw:text-xs tw:text-white/70">{dateLabel}</p>
        </div>

        <button
          type="button"
          aria-label="Search transactions"
          className="tw:cursor-pointer tw:rounded-full tw:p-2 tw:transition-colors tw:hover:bg-white/10"
        >
          <Search size={20} />
        </button>
      </div>

      <nav
        role="tablist"
        aria-label="Accounts sections"
        className="tw:flex tw:gap-2 tw:overflow-x-auto tw:px-3 tw:pb-3"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={`tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-full tw:px-4 tw:py-1.5 tw:text-sm tw:transition-colors ${
                isActive
                  ? "tw:bg-white tw:font-semibold tw:text-primary"
                  : "tw:bg-white/10 tw:font-medium tw:text-white/80 tw:hover:bg-white/20"
              }`}
            >
              {tab.name}
              {tab.count ? (
                <span
                  className={`tw:inline-flex tw:min-w-5 tw:items-center tw:justify-center tw:rounded-full tw:px-1 tw:py-px tw:text-[11px] tw:font-semibold ${
                    isActive
                      ? "tw:bg-primary tw:text-white"
                      : "tw:bg-white/25 tw:text-white"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default AccountsHeader;
