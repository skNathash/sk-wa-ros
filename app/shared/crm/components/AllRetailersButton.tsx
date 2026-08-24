import { Store } from "lucide-react";
import { Link } from "react-router";

// The All Retailers analytics list. Shared across the CRM pages so the entry
// point looks and behaves identically wherever it appears.
const ALL_RETAILERS_PATH = "/master/analytics/network/dashboard";

interface AllRetailersButtonProps {
  className?: string;
}

// A header CTA pill that jumps to the network's All Retailers analytics list.
// Styled to sit alongside the Today's-Open chip / My-Follow-ups button so the
// header quick-actions read as one set.
const AllRetailersButton = ({ className }: AllRetailersButtonProps) => (
  <Link
    to={ALL_RETAILERS_PATH}
    className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-primary tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white tw:shadow-sm tw:transition-colors tw:hover:opacity-90 ${
      className || ""
    }`}
  >
    <Store className="tw:h-3.5 tw:w-3.5" />
    All Retailers
  </Link>
);

export default AllRetailersButton;
