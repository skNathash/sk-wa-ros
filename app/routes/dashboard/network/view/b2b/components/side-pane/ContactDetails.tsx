import { Building2, CalendarDays, Map, Phone } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";

interface ContactDetailsProps {
  mobile?: string;
  /** Single-line address — town/city is enough for the pane's width. */
  address?: string;
  /** What the shop sells; shown next to the store icon. */
  business?: string;
  /** ISO date the retailer joined the network. */
  registeredOn?: string;
  className?: string;
}

const Row = ({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
}) => (
  <div className="tw:flex tw:items-center tw:gap-2.5 tw:text-sm tw:text-slate-700">
    <span className="tw:shrink-0 tw:text-slate-400">{icon}</span>
    <span className="tw:min-w-0 tw:truncate">{value}</span>
  </div>
);

/**
 * How to reach the retailer and the few facts about the shop the seller needs
 * at a glance. Rows that have no value are dropped rather than shown empty.
 */
const ContactDetails = ({
  mobile,
  address,
  business,
  registeredOn,
  className,
}: ContactDetailsProps) => {
  if (!mobile && !address && !business && !registeredOn) {
    return null;
  }

  return (
    <div className={className}>
      <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
        Contact
      </p>

      <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2.5">
        {mobile ? <Row icon={<Phone size={15} />} value={mobile} /> : null}
        {address ? <Row icon={<Map size={15} />} value={address} /> : null}
        {business ? (
          <Row icon={<Building2 size={15} />} value={business} />
        ) : null}
        {registeredOn ? (
          <Row
            icon={<CalendarDays size={15} />}
            value={
              <>
                Joined ·{" "}
                <DateFormat value={registeredOn} formatStr="dd MMM yyyy" />
              </>
            }
          />
        ) : null}
      </div>
    </div>
  );
};

export default ContactDetails;
