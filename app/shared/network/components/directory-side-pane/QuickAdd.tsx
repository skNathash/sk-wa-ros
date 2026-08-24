import clsx from "clsx";
import {
  ChevronRight,
  Mic,
  Plus,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import useAppNav from "~/hooks/useAppNav";

/** The onboarding routes a directory page can start from the pane. */
export type QuickAddKey = "type-mobile" | "voice" | "counter-qr" | "paylater";

interface QuickAddOption {
  key: QuickAddKey;
  icon: LucideIcon;
  title: string;
  /** One-line promise of what the route saves the user. */
  hint: string;
  /** Where the row lands when the host passes no handler. */
  path: string;
  /** Query params carried into the destination. */
  params?: Record<string, string>;
}

const OPTIONS: QuickAddOption[] = [
  {
    key: "type-mobile",
    icon: Plus,
    title: "Type mobile",
    hint: "Zero-form onboarding",
    path: "/dashboard/network/management/b2c-customers/manage",
  },
  {
    key: "voice",
    icon: Mic,
    title: "Voice add",
    hint: "English + Kannada",
    path: "/dashboard/network/management/b2c-customers/manage",
    params: { mode: "voice" },
  },
  // {
  //   key: "counter-qr",
  //   icon: QrCode,
  //   title: "Counter QR",
  //   hint: "Customer scans",
  //   path: "/dashboard/network/management/b2c-customers/manage",
  //   params: { mode: "qr" },
  // },
  {
    key: "paylater",
    icon: Unlock,
    title: "Paylater-first",
    hint: "Credit unlock = signup",
    path: "/dashboard/network/management/b2c-customers/manage",
    params: { mode: "paylater" },
  },
];

interface QuickAddProps {
  /**
   * Handle the tap yourself (open a modal, switch the page into a capture
   * mode). When omitted the row navigates to its own destination.
   */
  onSelect?: (key: QuickAddKey) => void;
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  /** Restrict/reorder the rows; defaults to all four. */
  keys?: QuickAddKey[];
  className?: string;
}

/**
 * The four ways to put a customer into the directory without a form —
 * typing a mobile number, dictating, letting the customer scan the counter QR,
 * or unlocking paylater (which signs them up as a side effect).
 *
 * Rows are self-navigating so the panel can be dropped into any directory pane;
 * pass `onSelect` to intercept instead.
 */
const QuickAdd = ({
  onSelect,
  title = "Quick add · Voice · QR",
  keys,
  className,
}: QuickAddProps) => {
  const appNav = useAppNav();

  const options = keys
    ? (keys
        .map((key) => OPTIONS.find((option) => option.key === key))
        .filter(Boolean) as QuickAddOption[])
    : OPTIONS;

  const handleSelect = (option: QuickAddOption) => {
    if (onSelect) {
      onSelect(option.key);
      return;
    }
    appNav.to(option.path, option.params);
  };

  return (
    <div className={className}>
      {title ? (
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </p>
      ) : null}

      <div
        className={clsx(
          "tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:bg-white tw:p-2 tw:ring-1 tw:ring-slate-100",
          title && "tw:mt-2",
        )}
      >
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelect(option)}
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-lg tw:bg-slate-50 tw:p-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-100"
            >
              <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:text-slate-600">
                <Icon size={18} />
              </span>
              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                  {option.title}
                </span>
                <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                  {option.hint}
                </span>
              </span>
              <ChevronRight
                size={16}
                className="tw:shrink-0 tw:text-slate-400"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAdd;
