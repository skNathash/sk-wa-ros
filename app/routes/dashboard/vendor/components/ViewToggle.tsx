import { ArrowDownAZ, Tags } from "lucide-react";
import { cn } from "~/lib/utils";
import useAppNav from "~/hooks/useAppNav";

/**
 * Vendor directory view switcher — "A–Z rolodex" (flat list) vs "By brand"
 * (vendors grouped under the brands they supply). Rendered as a compact
 * segmented control (muted track + white active thumb, same idiom as the
 * theme-2 tab bars) so it reads as a view switch and stays visually lighter
 * than the quick-filter chips directly below it. Navigates between the two
 * routes rather than toggling local state so each view stays deep-linkable.
 */
const views = [
  {
    key: "list",
    label: "Name A–Z",
    icon: ArrowDownAZ,
    path: "/dashboard/vendor/list",
  },
  {
    key: "brands",
    label: "By brand",
    icon: Tags,
    path: "/dashboard/vendor/brands",
  },
] as const;

const ViewToggle = ({
  active,
  className,
}: {
  active: (typeof views)[number]["key"];
  className?: string;
}) => {
  const appNav = useAppNav();

  return (
    <div
      role="group"
      aria-label="Vendor view"
      className={cn(
        "tw:flex tw:w-full tw:gap-0.5 tw:rounded-full tw:bg-muted tw:p-0.5 tw:md:inline-flex tw:md:w-auto",
        className,
      )}
    >
      {views.map((view) => {
        const isActive = view.key === active;
        const Icon = view.icon;
        return (
          <button
            key={view.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) {
                appNav.to(view.path);
              }
            }}
            className={cn(
              "tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:h-8 tw:px-4 tw:rounded-full tw:text-xs tw:whitespace-nowrap tw:transition-colors tw:cursor-pointer tw:select-none tw:active:scale-[0.98]",
              isActive
                ? "tw:bg-white tw:text-foreground tw:font-bold tw:border tw:border-border tw:shadow-[0_1px_2px_rgb(0_0_0/0.08)]"
                : "tw:text-muted-foreground tw:font-semibold tw:hover:text-foreground",
            )}
          >
            <Icon className="tw:size-3.5 tw:shrink-0" />
            {view.label}
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;
