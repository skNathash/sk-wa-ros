import React from "react";
import { Link, Plus } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";

interface DealLinkedProps {
  isLinkedExisting?: boolean;
  isLinkedNew?: boolean;
  className?: string;
}

const DealLinked: React.FC<DealLinkedProps> = ({
  isLinkedExisting,
  isLinkedNew,
  className = "",
}) => {
  if (isLinkedNew) {
    return (
      <AppBadge
        variant="primary"
        className={`tw:inline-flex tw:items-center tw:gap-0.5 tw:px-1.5 tw:py-0.5 tw:text-xs tw:leading-none ${className}`}
      >
        <Plus size={10} />
        New
      </AppBadge>
    );
  }

  if (isLinkedExisting) {
    return (
      <AppBadge
        variant="success"
        className={`tw:inline-flex tw:items-center tw:gap-0.5 tw:px-1.5 tw:py-0.5 tw:text-xs tw:leading-none ${className}`}
      >
        <Link size={10} />
        Linked
      </AppBadge>
    );
  }

  return null;
};

export default DealLinked;
