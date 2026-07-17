import { useEffect } from "react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";
import CommonService from "~/services/CommonService";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import Amount from "~/components/core/amount/Amount";
import UpiQrCode from "./components/UpiQrCode";
import { Copy } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";

const images = ["phonepe", "gpay", "bhim"];

const StorekingPayPage = () => {
  const appNav = useAppNav();
  const appToast = useAppToast();

  const dynamicUpi = CommonService.isDynamicUpiEnabled();

  useEffect(() => {
    if (!dynamicUpi.status) {
      appNav.to("/dashboard/deposit-money/options");
    }
  }, [dynamicUpi.status]);

  if (!dynamicUpi.status) return null;

  return (
    <>
      <AppHeader title="StoreKing Pay" showCart={false} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbsData} className="tw:mb-4" />

          <AppCard>
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-8">
              <div className="tw:flex tw:flex-col tw:gap-6">
                <div>
                  <h3 className="tw:text-lg tw:font-semibold tw:text-gray-800 tw:mb-4">
                    Payment Information
                  </h3>
                  <InfoBlock size="sm" bordered>
                    <KeyValue label="UPI ID" size="sm">
                      <span className="tw:mr-4 tw:font-bold tw:text-lg tw:text-gray-900">
                        {dynamicUpi.vpa}
                      </span>
                      <button
                        className="tw:flex tw:items-center tw:gap-1 tw:!border tw:border-dashed tw:border-gray-300 tw:text-gray-500 tw:!rounded tw:!px-3 tw:!py-1 tw:text-xs tw:uppercase tw:font-semibold hover:tw:bg-gray-50 tw:transition-colors"
                        onClick={() => {
                          CommonService.copyToClipboard(dynamicUpi.vpa);
                          appToast.show({
                            color: "success",
                            msg: "UPI ID copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="tw:w-3 tw:h-3" />
                        Copy
                      </button>
                    </KeyValue>
                  </InfoBlock>
                </div>
                <div>
                  <div className="tw:text-sm tw:text-gray-600 tw:mb-4 tw:leading-relaxed">
                    Top-up your StoreKing Advance Balance instantly using any
                    UPI app. Simply scan the QR code or copy the UPI ID to make
                    a payment.
                  </div>

                  <div className="tw:bg-gray-50 tw:rounded-lg tw:p-4 tw:border tw:border-gray-200">
                    <div className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:mb-3">
                      Supported UPI Apps
                    </div>
                    <div className="tw:flex tw:flex-wrap tw:gap-4 tw:items-center">
                      {images.map((image) => (
                        <div
                          key={image}
                          className="tw:bg-white tw:p-2 tw:rounded-md tw:border tw:border-gray-100 tw:shadow-sm hover:tw:shadow-md tw:transition-shadow"
                        >
                          <ImgRender
                            src={`payments/${image}.svg`}
                            alt={image}
                            className="tw:w-10 tw:h-10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <UpiQrCode vpa={dynamicUpi.vpa} />
              </div>
            </div>

            <div className="tw:mt-8 tw:pt-6 tw:border-t tw:border-gray-200">
              <div className="tw:bg-blue-50 tw:rounded-lg tw:p-4 tw:border tw:border-blue-200">
                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:text-sm tw:font-medium tw:text-blue-800">
                    Daily Transaction Limit
                  </div>
                  <div className="tw:text-lg tw:font-bold tw:text-blue-900">
                    <Amount value={199999} />
                  </div>
                </div>
                <div className="tw:text-xs tw:text-blue-600 tw:mt-1">
                  Maximum amount you can deposit in a single day
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </>
  );
};

const breadcrumbsData: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Deposit Money",
    redirect: {
      path: "/dashboard/deposit-money/options",
    },
  },
  {
    label: "StoreKing Pay",
  },
];

export default StorekingPayPage;
