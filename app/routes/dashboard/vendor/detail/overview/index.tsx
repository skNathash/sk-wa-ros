import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import StaticGMap from "~/components/core/map/StaticGMap";
import PageLoader from "~/components/core/page-loader/PageLoader";
import CommonService from "~/services/CommonService";
import VendorService from "~/services/VendorService";
import ContactInfoCard from "./components/ContactInfoCard";
import FinancialTaxCard from "./components/FinancialTaxCard";
import KycDetailsCard from "./components/KycDetailsCard";
import SummaryCards from "./components/SummaryCards";
import TopSkus from "./components/top-skus/TopSkus";
import AppCard from "~/components/core/card/AppCard";

const Overview = () => {
  const { t } = useTranslation(["common"]);
  const { id } = useParams();
  const [vendor, setVendor] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const resp = await VendorService.getDetail(id);
        const resp2 = await VendorService.getDashboardVendorOverall(id);

        const data = resp.data?.data || {};

        setVendor({
          ...data,
          contact: {
            contactPerson: data.contact?.[0]?.name || "",
            email: data.contact?.[0]?.email || "",
            phone: data.contact?.[0]?.mobile || "",
            address: data?._fullAddress || "",
            shortAddress: data?._shortAddress || "",
            distance: data?._distance != null ? `${data._distance} km` : "",
            categories: data.contact?.[0]?.categories || [],
          },
          finance: {
            gstNo: data.gst_no || "",
            panNo: data.pan || "",
          },
          overall: resp2.data || {},
        });
      } catch (e) {
        console.error("Error fetching vendor details:", e);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  return (
    <>
      {loading ? <PageLoader message={t("loading")} /> : null}

      {!loading && !vendor?._id ? (
        <div className="tw:text-center tw:py-8 tw:text-gray-500">
          {t("noDataFound")}
        </div>
      ) : null}

      {!loading && vendor?._id ? (
        <>
          <SummaryCards vendorId={id} />

          <TopSkus vendorId={id} />

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-4">
            <ContactInfoCard data={vendor?.contact} />

            <FinancialTaxCard data={vendor?.finance} />

            <KycDetailsCard
              status={vendor?.isOtpVerified ? "Verified" : "Pending"}
              vendorId={id}
              mobile={vendor?.contact?.phone || ""}
              isCreatedByMe={vendor?._isCreatedByMe}
            />

            {vendor?._lat && vendor?._lng ? (
              <AppCard title="Vendor Location" className="tw:md:col-span-3">
                <div className="tw:rounded-md">
                  <StaticGMap
                    lat={vendor?._lat}
                    lng={vendor?._lng}
                    className="tw:h-80"
                  />
                </div>
              </AppCard>
            ) : null}

          {/* <div className="tw:md:col-span-3">
            <div className="tw:mb-8">
              <Performance data={vendor?.overall?.performanceOverview} />
            </div>
            <VendorSummary data={vendor?.overall?.financialSummary} />
          </div>

          <ProductAnalytics data={vendor?.overall?.productAnalytics} />
          <DamageAnalytics data={vendor?.overall?.damageAnalytics} />
          <ReturnAnalytics data={vendor?.overall?.returnsAnalytics} />
          <PaymentStatus data={vendor?.overall?.paymentStatus} />
          <FinancialSummary data={vendor?.overall?.financialSummary} /> */}
          </div>
        </>
      ) : null}
    </>
  );
};

export default Overview;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor Overview"),
    },
  ];
}
