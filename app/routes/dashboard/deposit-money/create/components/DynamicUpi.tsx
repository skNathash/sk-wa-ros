import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";
import CommonService from "~/services/CommonService";

const images = ["phonepe", "gpay", "bhim"];

const DynamicUpi = () => {
  const dynamicUpi = CommonService.isDynamicUpiEnabled();

  if (!dynamicUpi.status) return null;

  return (
    <AppCard title="StoreKing Pay">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-8">
        <div>
          <InfoBlock size="sm" bordered>
            <KeyValue label="UPI ID" size="sm">
              <span className="tw:mr-4 tw:font-bold">{dynamicUpi.vpa}</span>
              <button
                className="tw:!border tw:border-dashed tw:border-gray-300 tw:text-gray-500 tw:!rounded tw:!px-2 tw:!py-1 tw:text-xs"
                onClick={() => CommonService.copyToClipboard(dynamicUpi.vpa)}
              >
                Copy
              </button>
            </KeyValue>
          </InfoBlock>
        </div>
        <div>
          <div className="tw:text-xs tw:text-gray-500">
            Top-up your StoreKing Advance Balance instantly using UPI apps.
          </div>

          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-2">
            {images.map((image) => (
              <ImgRender
                src={`payments/${image}.svg`}
                alt={image}
                className="tw:w-10 tw:h-10"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
        Deposit upto
        <span className="tw:text-green-600 tw:ml-1">1,99,999 lakh per day</span>
      </div>
    </AppCard>
  );
};

export default DynamicUpi;
