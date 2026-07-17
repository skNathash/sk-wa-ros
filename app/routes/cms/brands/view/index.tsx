import { useEffect, useState } from "react";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { getData } from "./helper";
import Summary from "./components/Summary";
import Products from "./components/products/Products";
import AppCard from "~/components/core/card/AppCard";
import Categories from "./components/categories/Categories";
import Vendors from "./components/vendors/Vendors";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import AppButton from "~/components/core/button/AppButton";
import { ArrowRight } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Brand Details",
  },
];

const BrandsView = () => {
  const { id } = useParams();

  const appNav = useAppNav();

  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    totalProducts: 0,
    totalInventoryValue: 0,
    totalOrders: 0,
    unitsSold: 0,
  });

  useEffect(() => {
    const fetchData = async (id: string) => {
      setLoading(true);
      const data: Record<string, any> = await getData(id);
      setData(data);
      setSummary({
        totalProducts: data?._raw?.totalDeals,
        totalInventoryValue: data._raw?.totalValue,
        totalUnits: data._raw?.totalUnits,
        unitsSold: data._raw?.unitsSold,
      });

      setLoading(false);
    };

    if (id) {
      fetchData(id);
    }
  }, [id]);

  return (
    <>
      <AppHeader title="Brand Details" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-2 tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} />
            <AppButton
              onClick={() => appNav.to("/cms/brands/list")}
              color="light"
              size="small"
              fill="outline"
            >
              View all brands
              <ArrowRight />
            </AppButton>
          </div>

          {loading ? (
            <div className="tw:text-center tw:py-4 tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : null}

          {!loading && !data?._id ? (
            <AppCard className="tw:text-center">
              <NoData />
            </AppCard>
          ) : null}

          {!loading && data?._id ? (
            <>
              <div className="tw:flex tw:gap-4 tw:items-center tw:mb-4">
                <ImgRender
                  assetId={data?._displayImg}
                  className="tw:w-12 tw:h-12 tw:object-cover tw:rounded"
                  alt={data?.name}
                />
                <div className="tw:flex-1">
                  <div className="tw:text-2xl tw:font-bold">{data?.name}</div>
                  <div className="tw:text-sm tw:text-gray-500">
                    "{data?.name}" brand details
                  </div>
                </div>
              </div>
              <Summary summary={summary} />

              <div className="tw:flex tw:gap-4 tw:flex-col tw:md:flex-row">
                <div className="tw:md:w-2/3">
                  <Products brandId={id || ""} brandName={data?.name || ""} />
                </div>
                <div className="tw:md:w-1/3">
                  <Categories brandId={id || ""} />
                  <Vendors brandId={id || ""} brandName={data?.name || ""} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default BrandsView;
