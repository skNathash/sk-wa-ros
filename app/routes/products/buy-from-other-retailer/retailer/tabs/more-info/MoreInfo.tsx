import Business from "./components/business/Business";
import Contact from "./components/contact/Contact";
import LegalTax from "./components/legal-tax/LegalTax";
import Policies from "./components/policies/Policies";
import RatingBreakdown from "./components/rating-breakdown/RatingBreakdown";
import ServiceDelivery from "./components/service-delivery/ServiceDelivery";
import type { Retailer } from "./helper";

type MoreInfoProps = {
  data: Retailer;
};

const MoreInfo = ({ data }: MoreInfoProps) => {
  return (
    <div className="tw:space-y-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        <Business data={data} />
        <Contact data={data} />
        <LegalTax data={data} />
      </div>

      <ServiceDelivery data={data} />

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <RatingBreakdown data={data} />
        <Policies data={data} />
      </div>
    </div>
  );
};

export default MoreInfo;
