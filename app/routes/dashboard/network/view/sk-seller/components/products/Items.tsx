import ImgRender from "~/components/core/img/ImgRender";
import AppBadge from "~/components/core/badge/AppBadge";
import { Package } from "lucide-react";
import type { ProductItem } from "./Products";

interface ItemsProps {
  data: ProductItem[];
  loading?: boolean;
}

const Items = ({ data, loading }: ItemsProps) => {
  if (loading) {
    return (
      <div className="tw:p-4">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-6 tw:gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="tw:animate-pulse">
              <div className="tw:bg-gray-200 tw:h-48 tw:rounded-lg tw:mb-3"></div>
              <div className="tw:bg-gray-200 tw:h-4 tw:rounded tw:mb-2"></div>
              <div className="tw:flex tw:gap-2 tw:mb-2">
                <div className="tw:bg-gray-200 tw:h-6 tw:w-16 tw:rounded"></div>
                <div className="tw:bg-gray-200 tw:h-6 tw:w-20 tw:rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:p-8 tw:text-center tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-400" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="tw:p-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-5 tw:gap-4">
        {data.map((product) => (
          <div
            key={product.id}
            className="tw:bg-white tw:rounded-lg tw:border tw:border-gray-200 tw:overflow-hidden tw:hover:shadow-md tw:transition-shadow"
          >
            {/* Product Image */}
            <div className="tw:aspect-square tw:bg-gray-100 tw:flex tw:items-center tw:justify-center">
              {product.img &&
              (Array.isArray(product.img) ? product.img[0] : product.img) ? (
                <ImgRender
                  assetId={
                    Array.isArray(product.img) ? product.img[0] : product.img
                  }
                  className="tw:w-full tw:h-full tw:object-cover"
                  alt={product.name}
                />
              ) : (
                <Package className="tw:w-12 tw:h-12 tw:text-gray-400" />
              )}
            </div>

            {/* Product Details */}
            <div className="tw:p-3 tw:space-y-2">
              {/* Product Name */}
              <h3 className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:leading-tight">
                {product.name}
              </h3>

              {/* Category and Brand Chips */}
              <div className="tw:flex tw:flex-wrap tw:gap-1">
                {product.brand && product.brand !== "Unknown" && (
                  <AppBadge variant="light" className="tw:text-xs">
                    {product.brand}
                  </AppBadge>
                )}
                {product.category && product.category !== "Unknown" && (
                  <AppBadge variant="light" className="tw:text-xs">
                    {product.category}
                  </AppBadge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Items;
