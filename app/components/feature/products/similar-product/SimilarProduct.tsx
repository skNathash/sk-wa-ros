import React, { useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ProductItem from "../product-item/ProductItem";
import ProductService from "~/services/ProductService";
import type { Deal } from "~/types/CommonTypes";
import { AuthService } from "~/services/AuthService";

interface SimilarProductProps {
  category?: string;
  brand?: string;
  dealId?: string;
  cartType?: "normal" | "buyer";
}

const SimilarProduct: React.FC<SimilarProductProps> = ({
  category,
  brand,
  dealId,
  cartType,
}) => {
  const [products, setProducts] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine cartType based on user type if not provided
  const finalCartType =
    cartType || (AuthService.isBuyerUser() ? "buyer" : "normal");

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);
        const filter: Record<string, any> = { status: "Publish" };

        if (category) {
          filter.category = category;
        }
        if (brand) {
          filter.brand = brand;
        }
        // if (dealId) {
        //   filter._id = { $ne: dealId }; // Exclude current product
        // }

        const response = await ProductService.getProducts({
          filter,
          count: 10, // Limit to 10 similar products
        });

        if (response.data) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [category, brand, dealId]);

  const handleAddToCart = (response: {
    action: "add" | "update" | "remove";
    data: any;
  }) => {
    // Handle add to cart action
  };

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-4">
        <div className="tw:w-8 tw:h-8 tw:border-t-2 tw:border-b-2 tw:border-gray-900 tw:rounded-full tw:animate-spin"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <AppSwiper config={swiperConfig}>
        {products.map((product) => (
          <AppSwiper.Slide key={product.id}>
            <div className="tw:flex tw:flex-col tw:h-full tw:flex-1">
              <ProductItem
                deal={product}
                onAddToCart={handleAddToCart}
                className="tw:flex-1 tw:mb-1"
                cartType={finalCartType}
              />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </>
  );
};

const swiperConfig: SwiperOptions = {
  spaceBetween: 10,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: {
      slidesPerView: 2,
    },
    640: {
      slidesPerView: 3,
    },
    1024: {
      slidesPerView: 7.2,
    },
  },
};

export default SimilarProduct;
