import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import { useCallback, useEffect, useRef, useState } from "react";
import { getData, getCount, prepareParams } from "./helper";
import { Eye } from "lucide-react";

export type BrandItem = {
  id: string;
  name: string;
  img?: any;
  totalProducts?: number;
};

// Type for API response
type Brand = {
  _id: string;
  name: string;
  id?: string;
  [key: string]: any;
};

const defaultFilter = {
  search: "",
};

interface BrandsProps {
  sellerId: string;
}

const Brands = ({ sellerId }: BrandsProps) => {
  const [data, setData] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 50, // Get more brands initially
  });
  const sortRef = useRef<{ key: string; value: any } | undefined>(undefined);

  useEffect(() => {
    if (sellerId) {
      applyFilter();
    }
  }, [sellerId]);

  // Apply filter and fetch brands
  const applyFilter = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const brandsData = await getData(params);

      // Transform API data to match BrandItem type
      const transformedData: BrandItem[] = brandsData.map((item: Brand) => ({
        id: item._id,
        name: item.name,
        img: undefined, // Brands might not have images in the API response
        totalProducts: 0, // This would need to be fetched separately if needed
      }));

      setData(transformedData);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const displayBrands = showAll ? data : data.slice(0, 7);
  const hasMoreBrands = data.length > 7;

  if (loading) {
    return (
      <AppCard title="Brands" subtitle="Brands available with this seller.">
        <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-4 tw:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="tw:border tw:rounded-md tw:p-3 tw:flex tw:items-center tw:gap-3 tw:animate-pulse"
            >
              <div className="tw:w-12 tw:h-12 tw:bg-gray-200 tw:rounded"></div>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard title="Brands" subtitle="Brands available with this seller.">
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-4 tw:gap-4">
        {displayBrands.map((brand) => (
          <div
            key={brand.id}
            className="tw:border tw:rounded-md tw:p-3 tw:flex tw:items-center tw:gap-3 tw:hover:shadow-sm"
          >
            <ImgRender
              assetId={brand.img}
              className="tw:w-12 tw:h-12 tw:object-cover tw:rounded"
            />
            <div className="tw:min-w-0">
              <div className="tw:text-sm tw:font-semibold tw:truncate">
                {brand.name}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                {brand.totalProducts || 0} products
              </div>
            </div>
          </div>
        ))}

        {/* View More Block */}
        {hasMoreBrands && !showAll && (
          <div
            onClick={toggleShowAll}
            className="tw:border tw:rounded-md tw:p-3 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:hover:shadow-sm tw:cursor-pointer tw:border-dashed tw:border-gray-300 tw:hover:border-gray-400"
          >
            <Eye className="tw:w-5 tw:h-5 tw:text-gray-500" />
            <div className="tw:text-sm tw:font-medium tw:text-gray-600">
              View More ({data.length - 7} more)
            </div>
          </div>
        )}

        {/* View Less Block */}
        {hasMoreBrands && showAll && (
          <div
            onClick={toggleShowAll}
            className="tw:border tw:rounded-md tw:p-3 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:hover:shadow-sm tw:cursor-pointer tw:border-dashed tw:border-gray-300 tw:hover:border-gray-400"
          >
            <Eye className="tw:w-5 tw:h-5 tw:text-gray-500" />
            <div className="tw:text-sm tw:font-medium tw:text-gray-600">
              View Less
            </div>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Brands;
