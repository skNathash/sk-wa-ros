import { ArrowRight } from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import useAppNav from "~/hooks/useAppNav";
import MiscService from "~/services/MiscService";
import type { BreadcrumbItem } from "~/types/CommonTypes";


const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Accounts Summary",
    langKey: "accountsSummary",
    redirect: { path: "/dashboard/accounts/platform-fee", params: { tab: "commission-invoices" } },
  },
  {
    label: "Benefits",
    langKey: "benefits",
  },
];

const benefitCount = 3;

export default function PlatformFeeBenefits() {
  const isMobile = MiscService.isMobile();
  const images = Array.from({ length: benefitCount }, (_, i) =>
    isMobile
      ? `platform-fee/benefits/benefit-mob-${i + 1}.png`
      : `platform-fee/benefits/benefit-${i + 1}.png`,
  );
  const appNav = useAppNav();

  const navigateToPlans = () =>
    appNav.to("/dashboard/accounts/platform-fee", {
      tab: "commission-invoices",
      subtab: "available-plans",
      skipBenefits: "true",
    });

  return (
    <>
      <AppHeader title="Platform Fee Benefits" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:space-y-6 tw:mt-4">
            {/* Swiper - constrained width on desktop */}
            <div className="tw:max-w-4xl tw:mx-auto">
              <AppSwiper
                config={{
                  slidesPerView: 1,
                  spaceBetween: 0,
                  pagination: true,
                  navigation: true,
                  autoplay: { delay: 3000, disableOnInteraction: false },
                  loop: true,
                }}
              >
                {images.map((src, index) => (
                  <AppSwiper.Slide key={index}>
                    <ImgRender
                      src={src}
                      alt={`Benefit ${index + 1}`}
                      className="tw:w-full tw:h-auto tw:rounded-xl tw:object-contain"
                    />
                  </AppSwiper.Slide>
                ))}
              </AppSwiper>
            </div>

          </div>
        </div>
      </div>
      <div className="app-footer tw:flex tw:justify-end">
        <AppButton
          color="success"
          size="large"
          onClick={navigateToPlans}
          className="tw:w-full tw:md:w-auto"
        >
          View All Plans
          <ArrowRight className="tw:w-4 tw:h-4" />
        </AppButton>
      </div>
    </>
  );
}
