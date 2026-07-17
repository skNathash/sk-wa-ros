import React from "react";
import {
  Tag,
  Percent,
  Repeat,
  CalendarClock,
  ShoppingCart,
  BadgeIndianRupee,
  Users,
} from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import CouponService from "~/services/CouponService";
import { colorClasses } from "~/components/core/stats-card/helpers";
import { renderDiscount, renderScope } from "../helper";

const metricsSwiperConfig: SwiperOptions = {
  spaceBetween: 12,
  slidesPerView: "auto",
};

interface CouponDetailsProps {
  coupon: any;
}

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <div className="tw:flex tw:items-center tw:gap-2 tw:pb-2 tw:mb-1 tw:border-b tw:border-gray-100">
    <span className="tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded-md tw:bg-primary/10 tw:text-primary">
      {icon}
    </span>
    <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
      {children}
    </span>
  </div>
);

const Row: React.FC<{
  label: string;
  children: React.ReactNode;
  stacked?: boolean;
}> = ({ label, children, stacked }) =>
  stacked ? (
    <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1.5 tw:border-b tw:border-gray-50 tw:last:border-b-0">
      <span className="tw:text-xs tw:text-gray-500">{label}</span>
      <span className="tw:text-sm tw:font-medium tw:text-gray-900">
        {children}
      </span>
    </div>
  ) : (
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:py-1.5 tw:border-b tw:border-gray-50 tw:last:border-b-0">
      <span className="tw:flex-shrink-0 tw:text-xs tw:text-gray-500">
        {label}
      </span>
      <span className="tw:text-sm tw:font-medium tw:text-gray-900 tw:text-right">
        {children}
      </span>
    </div>
  );

const CouponDetails: React.FC<CouponDetailsProps> = ({ coupon }) => {
  const { label: statusLabel, color: statusColor } =
    CouponService.getStatusLabelAndColor(coupon.status);
  const { label: activeLabel, color: activeColor } =
    CouponService.getActiveLabelAndColor(coupon.isActive);

  const maxDiscountPerUse =
    coupon.discount?.maxDiscountPerUse != null
      ? `₹${coupon.discount.maxDiscountPerUse}`
      : "-";
  const minCartValue =
    coupon.conditions?.minCartValue != null
      ? `₹${coupon.conditions.minCartValue}`
      : "-";
  const globalUses = coupon.stats?.globalUses ?? 0;
  const maxGlobalUses = coupon.usagePolicy?.maxGlobalUses;

  const metrics = [
    {
      label: "Discount",
      icon: <Percent className="tw:h-5 tw:w-5" />,
      color: "primary" as const,
      value: renderDiscount(coupon),
    },
    {
      label: "Min Cart Value",
      icon: <ShoppingCart className="tw:h-5 tw:w-5" />,
      color: "success" as const,
      value: minCartValue,
    },
    {
      label: "Max Discount / Use",
      icon: <BadgeIndianRupee className="tw:h-5 tw:w-5" />,
      color: "info" as const,
      value: maxDiscountPerUse,
    },
    {
      label: "Total Used",
      icon: <Users className="tw:h-5 tw:w-5" />,
      color: "secondary" as const,
      value: (
        <>
          {globalUses}
          {maxGlobalUses != null && (
            <span className="tw:text-sm tw:font-normal tw:opacity-50">
              {" "}
              / {maxGlobalUses}
            </span>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {/* Summary header */}
      <AppCard noPadding bodyClassName="tw:p-4" className="tw:mb-0">
        <div className="tw:flex tw:flex-col tw:gap-3">
          <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
                <Tag className="tw:w-5 tw:h-5" />
              </div>
              <div>
                <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                  {coupon.title || "-"}
                </div>
                <div className="tw:font-mono tw:text-sm tw:text-gray-500">
                  {coupon.code || "-"}
                </div>
              </div>
            </div>
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <AppBadge variant={statusColor}>{statusLabel}</AppBadge>
              <AppBadge variant={activeColor}>{activeLabel}</AppBadge>
            </div>
          </div>

          {/* At-a-glance metrics */}
          <AppSwiper config={metricsSwiperConfig}>
            {metrics.map((m) => (
              <AppSwiper.Slide key={m.label} isAutoWidth>
                <AppStatsCard
                  label={m.label}
                  icon={m.icon}
                  color={m.color}
                  template={2}
                  className="tw:w-44"
                >
                  <span
                    className={`tw:text-lg tw:font-bold tw:leading-tight ${colorClasses[m.color].text}`}
                  >
                    {m.value}
                  </span>
                </AppStatsCard>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      </AppCard>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        <AppCard noPadding bodyClassName="tw:p-4" className="tw:mb-0">
          <SectionTitle icon={<Tag className="tw:w-4 tw:h-4" />}>
            Basic Details
          </SectionTitle>
          <div>
            <Row label="Description" stacked>
              {coupon.description || "-"}
            </Row>
            <Row label="Code Type">{coupon.codeType || "-"}</Row>
            <Row label="Applicable For">
              <div className="tw:flex tw:flex-wrap tw:justify-end tw:gap-1">
                {(coupon.applicableFor || []).length
                  ? (coupon.applicableFor || []).map((a: string) => (
                      <AppBadge
                        key={a}
                        variant="primary"
                        className="tw:text-xs"
                      >
                        {a}
                      </AppBadge>
                    ))
                  : "-"}
              </div>
            </Row>
          </div>
        </AppCard>

        <AppCard noPadding bodyClassName="tw:p-4" className="tw:mb-0">
          <SectionTitle icon={<CalendarClock className="tw:w-4 tw:h-4" />}>
            Validity
          </SectionTitle>
          <div>
            <Row label="Valid From">
              {coupon.validFrom ? (
                <DateFormat
                  value={coupon.validFrom}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              ) : (
                "-"
              )}
            </Row>
            <Row label="Valid Till">
              {coupon.validTill ? (
                <DateFormat
                  value={coupon.validTill}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              ) : (
                "-"
              )}
            </Row>
          </div>
        </AppCard>

        <AppCard noPadding bodyClassName="tw:p-4" className="tw:mb-0">
          <SectionTitle icon={<Percent className="tw:w-4 tw:h-4" />}>
            Discount &amp; Scope
          </SectionTitle>
          <div>
            <Row label="Scope">{renderScope(coupon)}</Row>
            <Row label="Discount">{renderDiscount(coupon)}</Row>
            <Row label="Max Discount / Use">{maxDiscountPerUse}</Row>
            <Row label="Min Cart Value">{minCartValue}</Row>
          </div>
        </AppCard>

        <AppCard noPadding bodyClassName="tw:p-4" className="tw:mb-0">
          <SectionTitle icon={<Repeat className="tw:w-4 tw:h-4" />}>
            Usage Policy
          </SectionTitle>
          <div>
            <Row label="Apply Frequency">
              {coupon.usagePolicy?.applyFrequency || "-"}
            </Row>
            <Row label="Max Uses / Customer">
              {coupon.usagePolicy?.maxUsesPerCustomer ?? "-"}
            </Row>
            <Row label="Max Global Uses">
              {coupon.usagePolicy?.maxGlobalUses ?? "-"}
            </Row>
            <Row label="Total Coupon Used">{globalUses}</Row>
          </div>
        </AppCard>
      </div>
    </div>
  );
};

export default CouponDetails;
