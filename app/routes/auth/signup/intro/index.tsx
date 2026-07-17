import "./css/index.css";
import { useTranslation } from "react-i18next";
import { CircleCheck, ArrowUpRight } from "lucide-react";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";

interface Feature {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  image: string;
}

interface HowItWorksStep {
  title: string;
  description: string;
  image: string;
}

const FeatureCard = ({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) => {
  const imageFirst = index % 2 !== 0;

  const imageBlock = (
    <div className="tw:flex tw:items-center tw:justify-center tw:w-full tw:sm:w-1/2">
      <ImgRender
        src={`intro/sk-retailer/${feature.image}`}
        alt={feature.title}
        className="tw:w-full tw:max-w-[280px] tw:sm:max-w-[360px] tw:h-auto tw:object-contain"
      />
    </div>
  );

  const textBlock = (
    <div className="tw:w-full tw:sm:w-1/2 tw:flex tw:flex-col tw:justify-center">
      <h3 className="tw:text-xl tw:sm:text-2xl tw:font-bold tw:text-gray-900">
        {feature.title}
      </h3>
      <p className="tw:text-sm tw:sm:text-base tw:font-semibold tw:text-gray-600 tw:mt-1">
        {feature.subtitle}
      </p>
      <p className="tw:text-sm tw:sm:text-base tw:text-gray-600 tw:mt-3 tw:leading-relaxed">
        {feature.description}
      </p>
      <ul className="tw:mt-4 tw:space-y-2">
        {feature.bullets.map((bullet, i) => (
          <li key={i} className="tw:flex tw:items-center tw:gap-2">
            <CircleCheck className="tw:w-5 tw:h-5 tw:text-green-500 tw:flex-shrink-0" />
            <span className="tw:text-sm tw:sm:text-base tw:text-gray-700 tw:font-medium">
              {bullet}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="intro-feature-card tw:p-6 tw:sm:p-10 tw:mx-4 tw:sm:mx-auto tw:max-w-7xl">
      {/* Mobile: always text on top, image below */}
      <div className="tw:flex tw:flex-col tw:sm:hidden tw:gap-5">
        {textBlock}
        {imageBlock}
      </div>
      {/* Desktop: alternate */}
      <div className="tw:hidden tw:sm:flex tw:flex-row tw:items-center tw:gap-8">
        {imageFirst ? (
          <>
            {imageBlock}
            {textBlock}
          </>
        ) : (
          <>
            {textBlock}
            {imageBlock}
          </>
        )}
      </div>
    </div>
  );
};

const IntroPage = () => {
  const { t } = useTranslation(["intro-signup"]);
  const appNav = useAppNav();

  const features = t("features", { returnObjects: true }) as Feature[];
  const howItWorksSteps = t("howItWorks.steps", {
    returnObjects: true,
  }) as HowItWorksStep[];

  const handleJoinNow = () => {
    appNav.replace("/auth/signup/mobile");
  };

  return (
    <div>
      <AppSimpleHeader title={t("pageTitle")} />

      {/* Section 1: Hero */}
      <section className="intro-hero-bg tw:relative tw:w-full tw:pt-8 tw:sm:pt-12 tw:pb-0">
        <div className="tw:max-w-5xl tw:mx-auto tw:px-4 tw:text-center tw:relative tw:z-10">
          <h1 className="tw:text-3xl tw:sm:text-5xl tw:font-bold tw:text-orange-400">
            {t("hero.title")}
          </h1>
          <h2 className="tw:text-2xl tw:sm:text-4xl tw:font-bold tw:text-white tw:mt-2">
            {t("hero.subtitle")}
          </h2>
          <p className="tw:text-sm tw:sm:text-base tw:text-gray-300 tw:mt-4 tw:max-w-xl tw:mx-auto">
            {t("hero.description")}
          </p>
          <AppButton
            onClick={handleJoinNow}
            className="tw:mt-6 tw:bg-green-500 tw:text-white tw:font-bold tw:!px-8 tw:py-3 tw:rounded-full tw:h-auto tw:hover:bg-green-600 tw:!text-lg"
          >
            {t("cta.buttonText")}
            <ArrowUpRight className="tw:!w-5 tw:!h-5 tw:ml-1" />
          </AppButton>
        </div>
        <div className="tw:-mt-4 tw:sm:-mt-36 tw:flex tw:justify-center">
          <ImgRender
            src="intro/sk-retailer/register-to-sk.png"
            alt="StoreKing ROS"
            className="tw:w-full tw:max-w-6xl tw:h-auto"
          />
        </div>
      </section>

      {/* Section 2: One Platform */}
      <section className="intro-platform-bg tw:py-10 tw:sm:py-16">
        <div className="tw:max-w-5xl tw:mx-auto tw:px-4 tw:text-center">
          <h2 className="tw:text-2xl tw:sm:text-4xl tw:font-bold tw:text-gray-900">
            {t("platform.title")}
          </h2>
          <h3 className="tw:text-2xl tw:sm:text-4xl tw:font-bold tw:text-gray-900">
            {t("platform.subtitle")}
          </h3>
          <p className="tw:text-sm tw:sm:text-base tw:text-gray-500 tw:mt-2">
            {t("platform.description")}
          </p>
          <div className="tw:mt-6 tw:sm:mt-10">
            <ImgRender
              src="intro/sk-retailer/second-image.png"
              alt="Six Powerful Capabilities"
              className="tw:w-full tw:max-w-3xl tw:mx-auto tw:h-auto"
            />
          </div>
        </div>
      </section>

      {/* Sections 3-8: Feature Cards - Commented out */}
      {/* <section className="tw:bg-white tw:pb-10 tw:sm:pb-16 tw:space-y-6 tw:sm:space-y-8">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </section> */}

      {/* Section 9: How It Works */}
      <section className="intro-how-it-works-bg tw:py-10 tw:sm:py-16">
        <div className="tw:max-w-5xl tw:mx-auto tw:px-4">
          <div className="tw:text-center tw:mb-8 tw:sm:mb-12">
            <h2 className="tw:text-2xl tw:sm:text-4xl tw:font-bold tw:text-white">
              {t("howItWorks.title")}
            </h2>
            <p className="tw:text-sm tw:sm:text-base tw:text-gray-300 tw:mt-2">
              {t("howItWorks.subtitle")}
            </p>
          </div>
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="tw:flex tw:flex-col tw:items-center tw:text-center">
                <ImgRender
                  src={`intro/sk-retailer/${step.image}`}
                  alt={step.title}
                  className="tw:w-32 tw:sm:w-40 tw:h-32 tw:sm:h-40 tw:object-contain tw:mb-4"
                />
                <h3 className="tw:text-lg tw:sm:text-xl tw:font-bold tw:text-white tw:mb-2 tw:min-h-[3.5rem] tw:flex tw:items-start">
                  {step.title}
                </h3>
                <p className="tw:text-sm tw:text-gray-300 tw:leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 10: CTA */}
      <section className="tw:bg-gray-50 tw:py-10 tw:sm:py-16 tw:pb-40 tw:sm:pb-48">
        <div className="tw:max-w-5xl tw:mx-auto tw:px-6 tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:gap-8">
          <div className="tw:flex-1">
            <h2 className="tw:text-2xl tw:sm:text-4xl tw:font-bold tw:text-gray-900 tw:leading-tight">
              {t("cta.title")}
            </h2>
            <p className="tw:text-sm tw:sm:text-base tw:text-gray-600 tw:mt-3">
              {t("cta.subtitle")}
            </p>
            <AppButton
              onClick={handleJoinNow}
              className="tw:mt-6 tw:bg-green-500 tw:text-white tw:font-bold tw:!px-8 tw:py-3 tw:rounded-full tw:h-auto tw:hover:bg-green-600 tw:!text-lg"
            >
              {t("cta.buttonText")}
              <ArrowUpRight className="tw:!w-5 tw:!h-5 tw:ml-1" />
            </AppButton>
          </div>
          <div className="tw:flex-1 tw:flex tw:justify-center">
            <div className="tw:relative tw:mb-28 tw:mr-28">
              <ImgRender
                src="intro/sk-retailer/business-together-before.png"
                alt="Business Together"
                className="tw:w-56 tw:sm:w-48 tw:h-auto tw:rounded-2xl tw:object-cover"
              />
              <ImgRender
                src="intro/sk-retailer/business-together-after.png"
                alt="Business Together"
                className="tw:w-56 tw:sm:w-48 tw:h-auto tw:rounded-2xl tw:object-cover tw:absolute tw:-bottom-28 tw:-right-28 tw:sm:-bottom-28 tw:sm:-right-28 tw:z-10 tw:shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntroPage;
