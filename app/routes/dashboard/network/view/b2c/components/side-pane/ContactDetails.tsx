import { Calendar, Map, Phone } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";

interface ContactDetailsProps {
  mobile?: string;
  /** Single-line address — town/city is enough for the pane's width. */
  address?: string;
  /** ISO date of birth; only the day and month are shown. */
  dob?: string;
  /** Free-text note the seller keeps on the customer. */
  notes?: string;
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
 * How to reach the customer and what the seller has written down about them.
 * Rows that have no value are dropped rather than shown empty.
 */
const ContactDetails = ({
  mobile,
  address,
  dob,
  notes,
  className,
}: ContactDetailsProps) => {
  if (!mobile && !address && !dob && !notes) {
    return null;
  }

  return (
    <div className={className}>
      <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
        Contact {notes ? "· Notes" : ""}
      </p>

      <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2.5">
        {mobile ? <Row icon={<Phone size={15} />} value={mobile} /> : null}
        {address ? <Row icon={<Map size={15} />} value={address} /> : null}
        {/* The year is noise at the counter — only the day and month show. */}
        {dob ? (
          <Row
            icon={<Calendar size={15} />}
            value={
              <>
                Birthday · <DateFormat value={dob} formatStr="dd MMM" />
              </>
            }
          />
        ) : null}

        {notes ? (
          <div className="tw:rounded-lg tw:bg-slate-50 tw:p-3 tw:ring-1 tw:ring-slate-100">
            <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
              Notes
            </p>
            <p className="tw:mt-1 tw:text-sm tw:text-slate-700">{notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ContactDetails;
