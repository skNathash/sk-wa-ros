import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AppSwiper from "~/components/core/swiper";
import {
  getAllData,
  getLowStock,
  getOutofStock,
  getAllDataCount,
  getLowStockCount,
  getOutofStockCount,
} from "./helper";
import ImgRender from "~/components/core/img/ImgRender";
import type { SwiperOptions } from "swiper/types";
import useAppNav from "~/hooks/useAppNav";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";

const swiperOptions: SwiperOptions = {
  slidesPerView: 3,
  spaceBetween: 20,
  breakpoints: {
    320: {
      slidesPerView: 2.1,
      spaceBetween: 10,
    },
    1024: {
      slidesPerView: 5,
      spaceBetween: 20,
    },
  },
};

const Overview = ({
  distance = DEFAULT_BROWSE_DISTANCE,
}: {
  distance: number | string;
}) => {
  const appNav = useAppNav();

  const [allData, setAllData] = useState<any[]>([]);
  const [lowStockData, setLowStockData] = useState<any[]>([]);
  const [outOfStockData, setOutOfStockData] = useState<any[]>([]);
  const [allCount, setAllCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [all, low, out, allC, lowC, outC] = await Promise.all([
          getAllData({ page: 1, count: 4 }, distance),
          getLowStock({ page: 1, count: 4 }, distance),
          getOutofStock({ page: 1, count: 4 }, distance),
          getAllDataCount({}, distance),
          getLowStockCount({}, distance),
          getOutofStockCount({}, distance),
        ]);
        setAllData(all);
        setLowStockData(low);
        setOutOfStockData(out);
        setAllCount(allC);
        setLowStockCount(lowC);
        setOutOfStockCount(outC);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [distance]);

  const handleAllProductsClick = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      distance: distance,
      title: "All Products",
    });
  };

  const handleLowStockClick = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      distance: distance,
      feature: "lowStock",
      title: "Low Stock",
    });
  };

  const handleOutOfStockClick = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      distance: distance,
      feature: "outOfStock",
      title: "Out of Stock",
    });
  };

  const renderSlide = (
    title: string,
    data: any[],
    count: number,
    onClick?: () => void,
  ) => (
    <div
      onClick={onClick}
      className={onClick ? "tw:mb-4 tw:cursor-pointer" : "tw:mb-4"}
    >
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-4 tw:bg-blue-50 tw:p-2 tw:rounded-md">
        {data.slice(0, 4).map((product, index) => (
          <div
            key={index}
            className="tw:aspect-square tw:bg-white tw:rounded-lg tw:overflow-hidden tw:p-1"
          >
            {product.images && product.images.length > 0 ? (
              <ImgRender
                assetId={product.images[0]}
                alt={product.name}
                className="tw:w-full tw:h-full tw:object-cover"
              />
            ) : (
              <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:text-gray-500">
                No Image
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - data.length) }).map(
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="tw:aspect-square tw:bg-gray-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:text-gray-400"
            >
              -
            </div>
          ),
        )}
      </div>
      <h3 className="tw:text-sm tw:font-semibold tw:mb-1">{title}</h3>
      <p className="tw:text-xs tw:text-gray-600">{count} products</p>
    </div>
  );

  const renderSkeletonSlide = (title: string) => (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="tw:aspect-square tw:rounded-lg tw:overflow-hidden tw:p-1"
          >
            <div className="skeleton-loader tw:w-full tw:h-full tw:rounded-md"></div>
          </div>
        ))}
      </div>
      <div className="tw:text-left">
        <div className="skeleton-loader tw:w-3/4 tw:h-4 tw:mb-2"></div>
        <div className="skeleton-loader tw:w-1/4 tw:h-3"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="tw:w-full tw:mb-4">
        <AppSwiper config={swiperOptions}>
          {/* <AppSwiper.Slide>
            {renderSkeletonSlide("All Products")}
          </AppSwiper.Slide> */}
          <AppSwiper.Slide>{renderSkeletonSlide("Low Stock")}</AppSwiper.Slide>
          <AppSwiper.Slide>
            {renderSkeletonSlide("Out of Stock")}
          </AppSwiper.Slide>
        </AppSwiper>
      </div>
    );
  }

  return (
    <div className="tw:w-full tw:mb-4">
      <AppSwiper config={swiperOptions}>
        {/* <AppSwiper.Slide>
          {renderSlide(
            "All Products",
            allData,
            allCount,
            handleAllProductsClick,
          )}
        </AppSwiper.Slide> */}
        <AppSwiper.Slide>
          {renderSlide(
            "Low Stock",
            lowStockData,
            lowStockCount,
            handleLowStockClick,
          )}
        </AppSwiper.Slide>
        <AppSwiper.Slide>
          {renderSlide(
            "Out of Stock",
            outOfStockData,
            outOfStockCount,
            handleOutOfStockClick,
          )}
        </AppSwiper.Slide>
      </AppSwiper>
    </div>
  );
};

export default Overview;
