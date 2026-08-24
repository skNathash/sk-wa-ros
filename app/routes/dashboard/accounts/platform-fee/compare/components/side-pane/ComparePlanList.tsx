import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import type { BillingCycle } from "../helper";
import ComparePlanItem from "./ComparePlanItem";
import {
  getData,
  getShapeLabel,
  prepareParams,
  type ComparePlanItemData,
  type ComparePlanType,
} from "./helper";

interface ComparePlanListProps {
  type: ComparePlanType;
  /** Billing duration the plan list is filtered by. */
  billingCycle: BillingCycle;
  className?: string;
}

const EYEBROW_CLASS: Record<ComparePlanType, string> = {
  stock: "tw:text-[#B45309]",
  shop: "tw:text-[#1E40AF]",
};

const SKELETON_COUNT: Record<ComparePlanType, number> = {
  stock: 5,
  shop: 3,
};

/** JUMP TO list for one plan shape. */
const ComparePlanList: React.FC<ComparePlanListProps> = ({
  type,
  billingCycle,
  className,
}) => {
  const [plans, setPlans] = useState<ComparePlanItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPlans = async () => {
      setLoading(true);
      try {
        const data = await getData(type, prepareParams(type, billingCycle));
        if (!active) return;
        setPlans(data);
      } catch (error) {
        console.error("Error fetching compare plans:", error);
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

  return (
    <div className={clsx("tw:space-y-2", className)}>
      <div className="tw:px-0.5">
        <span
          className={clsx(
            "tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider",
            EYEBROW_CLASS[type],
          )}
        >
          {loading ? "" : getShapeLabel(type, plans.length)}
        </span>
      </div>

      <div className="tw:space-y-1.5">
        {loading
          ? Array.from({ length: SKELETON_COUNT[type] }).map((_, index) => (
              <Skeleton key={index} className="tw:h-10 tw:rounded-xl" />
            ))
          : plans.map((plan) => (
              <ComparePlanItem key={plan.id} plan={plan} type={type} />
            ))}
      </div>
    </div>
  );
};

export default ComparePlanList;
