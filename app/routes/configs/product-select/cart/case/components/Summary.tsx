import { BoxIcon, PackageIcon } from "lucide-react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { useFormContext, useWatch } from "react-hook-form";
import React, { useMemo } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import SellerCatalogService from "~/services/SellerCatalogService";
type StatsColor = "primary" | "secondary" | "warning" | "danger" | "info" | "success";

const statsColorMap: Record<string, StatsColor> = {
  light: "secondary",
  dark: "info",
};

type Props = {
  loading: boolean;
};

const Summary: React.FC<Props> = ({ loading }) => {
  const { control } = useFormContext();

  const products: any[] = useWatch({ control, name: "products" }) || [];

  const totalProducts = products.length;

  const typeCounts = useMemo(() => {
    const sellingTypes = SellerCatalogService.getSellingTypes();
    const countMap: Record<string, { label: string; count: number; color: StatsColor }> = {};

    products.forEach((p) => {
      const packageType = p?.formData?.packageType;
      if (!packageType) return;

      if (!countMap[packageType]) {
        const match = sellingTypes.find((t) => t.apiValue === packageType);
        const rawColor = match?.color || "primary";
        countMap[packageType] = {
          label: match?.label || packageType,
          count: 0,
          color: statsColorMap[rawColor] || (rawColor as StatsColor),
        };
      }
      countMap[packageType].count++;
    });

    return Object.entries(countMap).map(([key, val]) => ({
      key,
      ...val,
    }));
  }, [products]);

  return (
    <AppSwiper
      className="tw:mb-4"
      config={{
        slidesPerView: 2,
        spaceBetween: 8,
        breakpoints: {
          640: { slidesPerView: 3, spaceBetween: 12 },
          768: { slidesPerView: 4, spaceBetween: 16 },
          1024: { slidesPerView: 5, spaceBetween: 16 },
        },
      }}
    >
      <AppSwiper.Slide>
        <AppStatsCard
          label="Total Products"
          icon={<PackageIcon />}
          template={1}
          color="info"
        >
          {loading ? (
            <AppSpinner />
          ) : (
            <span className="tw:text-xl tw:font-bold">{totalProducts}</span>
          )}
        </AppStatsCard>
      </AppSwiper.Slide>

      {typeCounts.map((type) => (
        <AppSwiper.Slide key={type.key}>
          <AppStatsCard
            label={type.label}
            icon={<BoxIcon />}
            template={1}
            color={type.color}
          >
            {loading ? (
              <AppSpinner />
            ) : (
              <span className="tw:text-xl tw:font-bold">{type.count}</span>
            )}
          </AppStatsCard>
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

export default Summary;
