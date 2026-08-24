import { Search } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormRegister } from "react-hook-form";
import { Input } from "~/components/ui/input";

type Props = {
  register: UseFormRegister<any>;
  name?: string;
  placeholder?: string;
  onChange?: () => void;
  autoFocus?: boolean;
  /** Rendered to the right of the field — e.g. a distance chooser. */
  trailing?: ReactNode;
  /** Extra classes on the sticky wrapper — e.g. `search-sticky` to pin the
      bar under the header edge-to-edge in theme-2 (see theme-2.css). */
  className?: string;
};

/**
 * Sticky, white search block shared across the browse-by-brand / browse-by-category
 * pages. Mirrors the hero search field on the network products search page — a compact,
 * rounded field with an inline leading icon — while keeping a plain white fill.
 */
const BrowseSearchField = ({
  register,
  name = "search",
  placeholder = "Search",
  onChange,
  autoFocus,
  trailing,
  className = "",
}: Props) => {
  const field = register(name);

  return (
    <div
      className={`tw:sticky tw:top-0 tw:z-10 tw:bg-white tw:-mx-4 tw:px-4 tw:py-2 tw:shadow-sm tw:md:mx-0 tw:md:px-0 tw:md:py-0 tw:md:pb-2 tw:md:shadow-none ${className}`}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <div className="tw:group tw:relative tw:flex-1 tw:min-w-0">
          <div className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:pointer-events-none tw:text-gray-400 tw:group-focus-within:text-primary tw:transition-colors">
            <Search size={16} />
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            autoFocus={autoFocus}
            className="tw:h-9 tw:rounded-xl tw:bg-white tw:pl-9 tw:pr-4 tw:text-sm tw:placeholder:text-gray-400"
            {...field}
            onChange={(e) => {
              field.onChange(e);
              onChange?.();
            }}
          />
        </div>
        {trailing}
      </div>
    </div>
  );
};

export default BrowseSearchField;
