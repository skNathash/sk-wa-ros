import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import {
  EMPTY,
  formatDistance,
  formatPhone,
  type Retailer,
} from "../../helper";

type ContactProps = {
  data: Retailer;
};

const Row = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="tw:flex tw:items-start tw:gap-3">
    <span className="tw:mt-0.5 tw:text-slate-400">{icon}</span>
    <div className="tw:text-sm tw:text-slate-700">{children}</div>
  </div>
);

const Contact = ({ data }: ContactProps) => {
  const phone = formatPhone(data.mobile);
  const email = data.email || EMPTY;
  const whatsapp = formatPhone(data.ownerDetails?.whatsappNumber || "");
  const distance = formatDistance(data.distanceToFranchiseKm);
  const storeName = data.name || EMPTY;

  return (
    <AppCard title="Contact">
      <div className="tw:space-y-4">
        <Row icon={<Phone size={16} />}>
          <span className="tw:font-medium">{phone}</span>
        </Row>

        <Row icon={<Mail size={16} />}>
          <span>{email}</span>
        </Row>

        <Row icon={<MessageCircle size={16} />}>
          <span>{whatsapp}</span>
        </Row>

        <Row icon={<MapPin size={16} />}>
          <div>
            <div className="tw:font-medium">{storeName}</div>
            {distance && (
              <div className="tw:text-xs tw:text-slate-500">{distance}</div>
            )}
          </div>
        </Row>
      </div>
    </AppCard>
  );
};

export default Contact;
