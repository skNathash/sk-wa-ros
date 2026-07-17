import Categories from "./category/Categories";
import Brands from "./brands/Brands";
import Products from "./products/Products";
import { useState } from "react";

type Props = {
  vendorId: string;
};

const Browse = ({ vendorId }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [selectedBrand, setSelectedBrand] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleCategoryCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setSelectedCategory(params.data);
    }
  };

  const handleBrandCallback = (params: { action: string; data?: any }) => {
    if (params.action === "view") {
      setSelectedBrand(params.data);
    }
  };

  return (
    <div className="tw:w-full">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        <Categories vendorId={vendorId} callback={handleCategoryCallback} />

        <Brands
          vendorId={vendorId}
          selectedCategoryId={selectedCategory?.id}
          selectedCategoryName={selectedCategory?.name}
          callback={handleBrandCallback}
        />

        <Products
          vendorId={vendorId}
          selectedCategoryId={selectedCategory?.id}
          selectedCategoryName={selectedCategory?.name}
          selectedBrandId={selectedBrand?.id}
          selectedBrandName={selectedBrand?.name}
        />
      </div>
    </div>
  );
};

export default Browse;
