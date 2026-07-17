import React from "react";
import AppButton from "~/components/core/button/AppButton";
import FranchiseService from "~/services/FranchiseService";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import { ArrowRight, Eye, MapPin } from "lucide-react";
// Icon removed for simple link-style template

export default function SkSellerAvailableNote({
  to = "/products",
  template = 1,
  className = "",
}: {
  to?: string;
  template?: 1 | 2;
  className?: string;
}) {
  const appNav = useAppNav();
  const [count, setCount] = React.useState<number>(0);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [nearestKm, setNearestKm] = React.useState<number | null>(null);
  const isSfSeller = AuthService.isSfSeller();

  React.useEffect(() => {
    let isMounted = true;
    async function fetchCount() {
      try {
        // Same API semantics as getCount in network/management/sk-sellers/list/helper.ts
        const response = await FranchiseService.fetchSkSellers({
          filter: {
            distanceKm: {
              $lte: 30,
            },
          },
        });
        const c = response?.data?.data?.totalCount || 0;
        const first = response?.data?.data?.skSellers?.[0] || null;
        const n =
          first?.distanceKm != null
            ? CommonService.roundedByDecimalPlace(Number(first.distanceKm), 2)
            : null;
        if (!isMounted) return;
        setCount(Number(c) || 0);
        setNearestKm(typeof n === "number" ? n : null);
      } catch (e) {
        if (!isMounted) return;
        setCount(0);
      } finally {
        if (isMounted) setLoaded(true);
      }
    }
    if (isSfSeller) {
      fetchCount();
    } else {
      setLoaded(true);
    }
    return () => {
      isMounted = false;
    };
  }, [isSfSeller]);

  const handleClick = () => {
    appNav.to("/dashboard/network/management/sk-sellers", {
      tab: "sk-sellers",
    });
  };

  if (!isSfSeller || !loaded || !count) return null;

  // Template 2: compact UI that displays '2 sk sellers available' with eye icon
  if (template === 2) {
    return (
      <div
        className={`tw:mb-2 tw:cursor-pointer ${className}`}
        role="link"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            appNav.to("/dashboard/network/management/sk-sellers", {
              tab: "sk-sellers",
            });
          }
        }}
        tabIndex={0}
      >
        <span className="tw:text-xs tw:text-blue-700 tw:font-medium tw:flex tw:gap-2 tw:items-center">
          <MapPin size={12} /> {count} SK Sellers available{" "}
          <ArrowRight size={14} />
        </span>
      </div>
    );
  }

  return (
    <div className="tw:mb-4 tw:rounded-md tw:border tw:border-blue-200 tw:bg-gradient-to-r tw:from-blue-50 tw:to-indigo-50 tw:px-3 tw:py-2 tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:gap-3">
        {/* Column 1: Logo */}
        <div className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded tw:bg-gray-50">
          <img src="/favicon.svg" alt="StoreKing" className="tw:h-6 tw:w-6" />
        </div>

        {/* Column 2: Title and Description */}
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-sm tw:font-semibold tw:text-blue-900">
            Nearby SK sellers available
          </p>
          <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <span className="tw:text-xs tw:text-gray-600">
              {count} sellers nearby
            </span>
            {nearestKm != null && (
              <>
                <span className="tw:text-gray-300">•</span>
                <span className="tw:text-xs tw:text-gray-700">
                  {nearestKm} km nearest
                </span>
              </>
            )}
          </div>
        </div>

        <div className="tw:shrink-0">
          <AppButton size="small" onClick={handleClick}>
            View sellers
          </AppButton>
        </div>
      </div>
    </div>
  );
}
