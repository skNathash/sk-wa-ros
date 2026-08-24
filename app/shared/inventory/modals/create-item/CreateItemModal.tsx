import clsx from "clsx";
import {
  BookOpen,
  Camera,
  ChevronRight,
  type LucideIcon,
  PlusCircle,
  ScanBarcode,
} from "lucide-react";
import { Link } from "react-router";

import AppModal from "~/components/core/modal/AppModal";

const SEARCH_PATH = "/dashboard/inventory/subscribe/search";
const ADD_PRODUCT_PATH = "/dashboard/inventory/subscribe/add-product";

type CreateOption = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Soft tinted background + text colour for the icon chip. */
  iconTint: string;
  to: string;
};

/** The four ways to bring an item into the catalog, ordered fastest-first. */
const OPTIONS: CreateOption[] = [
  {
    key: "scan",
    label: "Scan Barcode",
    description: "Point the camera at the pack to match it instantly",
    icon: ScanBarcode,
    iconTint: "tw:bg-emerald-50 tw:text-emerald-600",
    to: "/dashboard/inventory/barcode-scan",
  },
  {
    key: "photo",
    label: "Image Search",
    // The add-product page opens on its photo/AI step by default, which is the
    // image-search flow — so no extra param here.
    description: "Snap the product and let AI read the label",
    icon: Camera,
    iconTint: "tw:bg-violet-50 tw:text-violet-600",
    to: ADD_PRODUCT_PATH,
  },
  {
    key: "library",
    label: "Full SK Library",
    description: "Browse and subscribe from the StoreKing catalog",
    icon: BookOpen,
    iconTint: "tw:bg-blue-50 tw:text-blue-600",
    to: `${SEARCH_PATH}?tab=search&hideTab=false`,
  },
  {
    key: "manual",
    label: "Create Manually",
    description: "Add an off-catalog or homemade item yourself",
    icon: PlusCircle,
    iconTint: "tw:bg-slate-100 tw:text-slate-600",
    // `manual=1` skips the photo/AI path chooser and opens the form directly.
    to: `${ADD_PRODUCT_PATH}?manual=1`,
  },
];

const rowClassName =
  "tw:group tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:text-left tw:transition-[box-shadow,border-color] tw:duration-200 tw:hover:border-slate-300 tw:hover:shadow-sm tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-slate-500";

interface Props {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}

/**
 * "Create item" chooser — the four entry points into the catalog, as a modal.
 * Every option navigates: scan goes to the barcode scanner, library to the
 * StoreKing catalog search, and both image search and manual entry land on the
 * add-product page (manual entry carries `manual=1` so the form is already open).
 */
const CreateItemModal = ({ show, callback }: Props) => {
  const close = () => callback({ action: "close" });

  const renderOptionInner = ({
    icon: Icon,
    iconTint,
    label,
    description,
  }: CreateOption) => (
    <>
      <span
        className={clsx(
          "tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:transition-transform tw:group-hover:scale-105",
          iconTint,
        )}
      >
        <Icon size={18} />
      </span>
      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:block tw:text-sm tw:font-semibold tw:leading-tight tw:text-slate-900">
          {label}
        </span>
        <span className="tw:mt-0.5 tw:block tw:text-xs tw:leading-snug tw:text-slate-500">
          {description}
        </span>
      </span>
      <ChevronRight size={16} className="tw:shrink-0 tw:text-slate-400" />
    </>
  );

  return (
    <AppModal show={show} callback={callback} isAutoHeight>
      <AppModal.Title onClose={close}>
        <div>
          <div className="tw:text-base tw:font-semibold tw:text-slate-900">
            Create Item
          </div>
          <div className="tw:mt-0.5 tw:text-xs tw:font-normal tw:text-slate-500">
            Pick how you want to add this product
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-2 tw:pt-1">
          {OPTIONS.map((option) => (
            <Link
              key={option.key}
              to={option.to}
              onClick={close}
              className={rowClassName}
            >
              {renderOptionInner(option)}
            </Link>
          ))}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default CreateItemModal;
