import ImgRender from "~/components/core/img/ImgRender";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface RetailerInfoProps {
  name?: string;
  mobile?: string;
  /** Shop photo asset; falls back to initials when the store has none. */
  shopImage?: string;
  /** Human-readable retailer code shown under the name. */
  franchiseId?: string;
}

/**
 * Identity block at the top of the retailer pane — shop photo, store name and
 * the number the seller calls. Rendered on the pane's dark band, so every
 * colour here is the on-dark variant.
 */
const RetailerInfo = ({
  name,
  mobile,
  shopImage,
  franchiseId,
}: RetailerInfoProps) => (
  <div className="tw:flex tw:items-center tw:gap-3">
    {shopImage ? (
      <ImgRender
        assetId={shopImage}
        className="tw:size-12 tw:shrink-0 tw:rounded-full tw:object-cover tw:ring-2 tw:ring-white/30"
      />
    ) : (
      <InitialsAvatar name={name} size={48} />
    )}

    <div className="tw:min-w-0 tw:flex-1">
      <p className="tw:truncate tw:text-lg tw:font-bold tw:text-white">
        {name || "Unknown"}
      </p>
      {/* Mobile and code read as one line — the pane is too narrow for two. */}
      {mobile || franchiseId ? (
        <p className="tw:truncate tw:text-xs tw:text-white/70">
          {[mobile, franchiseId].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  </div>
);

export default RetailerInfo;
