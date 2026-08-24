import clsx from "clsx";
import React, { useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import { Skeleton } from "~/components/ui/skeleton";
import PlanCard from "~/shared/accounts/platform-fee/plan-card/PlanCard";
import type { PlanCardData } from "~/shared/accounts/platform-fee/plan-card/helper";
import type { BillingCycle } from "../helper";
import {
  getAccent,
  getData,
  getShapeLabel,
  prepareParams,
  type PlanListType,
} from "./helper";

interface PlanListProps {
  /** Plan shape to list — stock swipes, shop lays out in a grid. */
  type: PlanListType;
  /** Billing duration the plans are priced for. */
  billingCycle: BillingCycle;
  className?: string;
}

const EYEBROW_CLASS: Record<PlanListType, string> = {
  stock: "tw:text-[#A05A18]",
  shop: "tw:text-[#1E40AF]",
};

const SKELETON_COUNT: Record<PlanListType, number> = {
  stock: 5,
  shop: 3,
};

/** Stock has five tiers — too many for a grid, so they ride a free-mode rail. */
const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 16,
  navigation: false,
  pagination: false,
  freeMode: true,
};

const PlanList: React.FC<PlanListProps> = ({
  type,
  billingCycle,
  className,
}) => {
  const [plans, setPlans] = useState<PlanCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPlans = async () => {
      setLoading(true);
      try {
        const data = await getData(
          type,
          billingCycle,
          prepareParams(type, billingCycle),
        );
        if (!active) return;
        setPlans(data);
      } catch (error) {
        console.error("Error fetching plans:", error);
        if (active) setPlans([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPlans();

    return () => {
      active = false;
    };
  }, [type, billingCycle]);

  if (!loading && !plans.length) return null;

  const accent = getAccent(type);
  // Stock subtitles wrap to two lines; shop subtitles stay on one.
  const subtitleMinHeight = type === "stock" ? 32 : 20;

  return (
    <div className={clsx(className)}>
      {/* Eyebrow */}
      <div>
        <span
          className={clsx(
            "tw:text-xs tw:font-bold tw:uppercase tw:tracking-widest",
            EYEBROW_CLASS[type],
          )}
        >
          {loading ? "" : getShapeLabel(type, plans.length)}
        </span>
      </div>

      {loading ? (
        <div
          className={clsx(
            "tw:grid tw:gap-4",
            type === "stock"
              ? "tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-5"
              : "tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3",
          )}
        >
          {Array.from({ length: SKELETON_COUNT[type] }).map((_, index) => (
            <Skeleton key={index} className="tw:h-96 tw:rounded-3xl" />
          ))}
        </div>
      ) : type === "stock" ? (
        <AppSwiper config={swiperConfig} className="tw:pb-2 tw:-mx-1 tw:px-1">
          {plans.map((plan) => (
            <AppSwiper.Slide
              key={plan.id}
              className="tw:!w-[17rem] tw:!h-auto tw:pt-2"
            >
              <PlanCard
                data={plan}
                accent={accent}
                subtitleMinHeight={subtitleMinHeight}
              />
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              data={plan}
              accent={accent}
              badgeAlign="left"
              subtitleMinHeight={subtitleMinHeight}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanList;
