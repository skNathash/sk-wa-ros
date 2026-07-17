import React from "react";
import { Smartphone, ArrowRight } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";

interface BrowseByBrandsCategoryProps {
  className?: string;
  variant?: "desktop" | "mobile";
}

const BrowseByBrandsCategory: React.FC<BrowseByBrandsCategoryProps> = ({
  className = "",
  variant = "desktop",
}) => {
  const appNav = useAppNav();

  const handleClick = () => {
    appNav.to("/products/browse/by-brand");
  };

  if (variant === "mobile") {
    return (
      <button
        type="button"
        aria-label="Browse by Brands and Categories"
        onClick={handleClick}
        className={`tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2 tw:text-sm tw:font-medium tw:cursor-pointer tw:mt-2 tw:text-slate-800 tw:bg-white tw:px-2 tw:py-2 tw:rounded-md tw:border tw:border-slate-100 tw:shadow-none hover:tw:shadow-sm active:tw:scale-95 tw:transition tw:duration-150 ${className}`}
      >
        <div className="tw:flex tw:items-center tw:gap-2">
          <Smartphone className="tw:w-4 tw:h-4 tw:text-slate-500" />
          <span className="tw:text-sm tw:font-medium tw:leading-5 tw:tracking-wide">
            Browse by Brands / Category
          </span>
        </div>
        <ArrowRight size={16} className="tw:text-slate-400" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Browse by Brands and Categories"
      onClick={handleClick}
      className={`tw:items-center tw:gap-2 tw:px-4 tw:py-2 tw:rounded-3xl tw:border tw:border-gray-300 tw:text-sm tw:text-gray-700 tw:bg-white tw:hover:border-gray-500 tw:shadow-sm tw:hover:shadow-md tw:transition tw:duration-150 tw:ease-in-out focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-slate-300 ${className}`}
    >
      <Smartphone className="tw:w-4 tw:h-4 tw:text-gray-500" />
      <span className="tw:font-medium">Browse by Brands / Category</span>
    </button>
  );
};

export default BrowseByBrandsCategory;
