import { Calendar, MapPin, Phone, Truck } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import type { OrderDetailView } from "../helper";
import Section from "./Section";

/** Address, contact, delivery timestamp and the order note. */
const DeliverySection = ({ order }: { order: OrderDetailView }) => (
  <Section title="Delivery" icon={<Truck size={13} />}>
    {order.deliveryAddress ? (
      <div className="od-info">
        <span className="od-info-icon">
          <MapPin size={13} />
        </span>
        <div className="tw:min-w-0">
          <p className="od-info-label">Deliver to</p>
          <p className="od-info-value">{order.deliveryAddress}</p>
        </div>
      </div>
    ) : null}

    {order.contactMobile || order.contactName ? (
      <div className="od-info">
        <span className="od-info-icon">
          <Phone size={13} />
        </span>
        <div className="tw:min-w-0">
          <p className="od-info-label">Contact</p>
          <p className="od-info-value">
            {order.contactMobile}
            {order.contactMobile && order.contactName ? " · " : ""}
            {order.contactName}
          </p>
        </div>
      </div>
    ) : null}

    {order.deliveredOn ? (
      <div className="od-info">
        <span className="od-info-icon">
          <Calendar size={13} />
        </span>
        <div className="tw:min-w-0">
          <p className="od-info-label">Delivered on</p>
          <p className="od-info-value">
            <DateFormat
              value={order.deliveredOn}
              formatStr="dd MMM yyyy · hh:mm a"
            />
          </p>
        </div>
      </div>
    ) : null}

    {order.note ? (
      <div className="od-note">
        <p className="od-info-label">Note</p>
        <p className="od-note-text">{order.note}</p>
      </div>
    ) : null}
  </Section>
);

export default DeliverySection;
