import ImgRender from "~/components/core/img/ImgRender";
import useScreenView from "~/hooks/useScreenView";

const CoinStoreBanner = () => {
  const { isMobile } = useScreenView();

  return (
    <div className="tw:mb-4 tw:rounded-lg tw:overflow-hidden tw:bg-linear-to-b tw:from-[#F0F6FE] tw:via-[#FFFFFF] tw:to-[#F0F6FE] tw:shadow-sm tw:border tw:border-blue-100">
      <div
        className={`tw:flex tw:items-center ${isMobile ? "tw:flex-col tw:p-3" : "tw:p-6 tw:gap-6"}`}
      >
        {/* Left Content */}
        <div
          className={`tw:flex-1 ${isMobile ? "tw:text-center tw:mb-4" : ""}`}
        >
          <h1
            className={`tw:font-bold tw:text-blue-600 ${isMobile ? "tw:text-2xl tw:leading-snug" : "tw:text-3xl"}`}
          >
            <span className="tw:text-yellow-500">Shop Smart,</span>{" "}
            <span className="tw:text-blue-600">Redeem Better!</span>
          </h1>
          <p
            className={`tw:text-blue-400 tw:font-medium tw:mt-2 ${isMobile ? "tw:text-sm tw:mt-1" : "tw:text-base"}`}
          >
            Get Products Free with Coins
          </p>
        </div>

        {/* Right Content - Single Banner Image */}
        <div
          className={`tw:flex tw:items-center ${isMobile ? "tw:w-full tw:justify-center" : ""}`}
        >
          <ImgRender
            src="kingcoins/coin-store-banner.png"
            alt="Coin Store Banner"
            className={
              isMobile
                ? "tw:w-full tw:h-56 tw:object-cover tw:rounded-lg"
                : "tw:w-56 tw:h-32 tw:object-cover tw:rounded-lg"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default CoinStoreBanner;
