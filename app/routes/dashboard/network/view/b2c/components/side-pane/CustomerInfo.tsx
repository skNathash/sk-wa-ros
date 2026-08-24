import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface CustomerInfoProps {
  name?: string;
  mobile?: string;
}

/**
 * Identity block at the top of the customer pane — avatar, name and mobile.
 * Rendered on the pane's dark band, so every colour here is the on-dark
 * variant.
 */
const CustomerInfo = ({ name, mobile }: CustomerInfoProps) => (
  <div className="tw:flex tw:items-center tw:gap-3">
    <InitialsAvatar name={name} size={48} />

    <div className="tw:min-w-0 tw:flex-1">
      <p className="tw:truncate tw:text-lg tw:font-bold tw:text-white">
        {name || "Unknown"}
      </p>
      {mobile ? (
        <p className="tw:truncate tw:text-xs tw:text-white/70">{mobile}</p>
      ) : null}
    </div>
  </div>
);

export default CustomerInfo;
