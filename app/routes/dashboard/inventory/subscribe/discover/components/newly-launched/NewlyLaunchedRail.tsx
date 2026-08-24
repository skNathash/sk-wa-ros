import { ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import useAppNav from "~/hooks/useAppNav";
import { fetchJustLaunched, JUST_LAUNCHED_SEE_ALL } from "../../helper";
import SectionHeading from "../SectionHeading";
import NewlyLaunchedCard, {
  type NewlyLaunchedDeal,
} from "./NewlyLaunchedCard";

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 12,
  navigation: false,
  pagination: false,
  freeMode: true,
};

const isAbortError = (error: any) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

interface Props {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Newly launched deals — the freshest SKUs in the catalog the seller hasn't
 * subscribed to yet, sorted `newly-created` by InventorySubscribeService (see
 * {@link fetchJustLaunched}). Each card closes on its total-subscribes count so
 * a new SKU that peers are already picking up stands out from an untested one.
 */
const NewlyLaunchedRail: React.FC<Props> = ({
  title = "Newly launched",
  subtitle = "Fresh in the SK Library — subscribe before other retailers do",
  className = "",
}) => {
  const appNav = useAppNav();

  const [items, setItems] = useState<NewlyLaunchedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetchJustLaunched(controller.signal)
      .then((data: NewlyLaunchedDeal[]) => {
        if (controller.signal.aborted) return;
        setItems(data);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        console.error("Failed to load newly launched deals", error);
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Nothing new to show — drop the section rather than leave an empty shelf.
  if (!isLoading && items.length === 0) return null;

  return (
    <section className={`tw:mb-7 ${className}`}>
      <SectionHeading
        title={title}
        subtitle={subtitle}
        action={
          <Link
            to={JUST_LAUNCHED_SEE_ALL}
            className="tw:inline-flex tw:items-center tw:gap-0.5 tw:rounded-full tw:px-2 tw:py-1 tw:text-xs tw:font-semibold tw:text-primary tw:transition-colors tw:hover:bg-primary/8"
          >
            See all
            <ChevronRight size={14} />
          </Link>
        }
      />

      {isLoading ? (
        <div className="tw:-mx-1 tw:flex tw:gap-3 tw:overflow-hidden tw:px-1 tw:pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="tw:w-52 tw:shrink-0 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white"
            >
              <div className="skeleton-loader tw:h-32 tw:w-full" />
              <div className="tw:p-2.5">
                <div className="skeleton-loader tw:h-3 tw:w-1/3 tw:rounded" />
                <div className="skeleton-loader tw:mt-2 tw:h-3 tw:rounded" />
                <div className="skeleton-loader tw:mt-2 tw:h-3 tw:w-2/3 tw:rounded" />
                <div className="tw:mt-3 tw:flex tw:items-end tw:justify-between">
                  <div className="skeleton-loader tw:h-6 tw:w-14 tw:rounded" />
                  <div className="skeleton-loader tw:h-7 tw:w-16 tw:rounded-full" />
                </div>
              </div>
              <div className="skeleton-loader tw:h-8 tw:w-full" />
            </div>
          ))}
        </div>
      ) : (
        <AppSwiper config={swiperConfig} className="tw:-mx-1 tw:px-1 tw:pb-2">
          {items.map((item) => (
            <AppSwiper.Slide key={item._id} isAutoWidth isAutoHeight>
              <NewlyLaunchedCard
                data={item}
                onTap={(id) =>
                  appNav.to(
                    `/dashboard/inventory/subscribe/product-detail/${id}`,
                  )
                }
              />
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </section>
  );
};

export default NewlyLaunchedRail;
