import { Calendar, Layers, Shield, Tag, User } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import InfoRow from "./InfoRow";

export default function DetailsTab({ data }: { data: any }) {
  const brands = data.bannerForCondition?.brands || [];
  const categories = data.bannerForCondition?.categories || [];
  const deals = data.bannerForCondition?.deals || [];
  const menus = data.bannerForCondition?.menus || [];
  const keywords = data.bannerForCondition?.keywords || "";

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      {/* General Info */}
      <AppCard>
        <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
          General Information
        </h3>
        <InfoRow icon={<Tag size={14} />} label="Title" value={data.title} />
        <InfoRow icon={<Layers size={14} />} label="Type" value={data.type} />
        <InfoRow icon={<Layers size={14} />} label="Banner Type" value={data.bannerType} />
        <InfoRow icon={<Shield size={14} />} label="Priority" value={data.priority} />
        <InfoRow
          icon={<Shield size={14} />}
          label="Active"
          value={data.isActive ? "Yes" : "No"}
        />
      </AppCard>

      {/* Placement & Validity */}
      <AppCard>
        <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
          Placement & Validity
        </h3>
        <InfoRow
          icon={<Layers size={14} />}
          label="Placeholder"
          value={
            data.placeholderInfo ? (
              <span>
                {data.placeholderInfo.name}{" "}
                <span className="tw:text-xs tw:text-slate-400">
                  ({data.placeholderInfo.code})
                </span>
              </span>
            ) : (
              "--"
            )
          }
        />
        <InfoRow
          icon={<Calendar size={14} />}
          label="Valid From"
          value={
            data.validFrom ? (
              <DateFormat value={data.validFrom} formatStr="dd MMM yyyy, hh:mm a" />
            ) : (
              "--"
            )
          }
        />
        <InfoRow
          icon={<Calendar size={14} />}
          label="Valid To"
          value={
            data.validTo ? (
              <DateFormat value={data.validTo} formatStr="dd MMM yyyy, hh:mm a" />
            ) : (
              "--"
            )
          }
        />
        <InfoRow
          icon={<User size={14} />}
          label="Franchise"
          value={
            data.franchiseInfo ? (
              <span>
                {data.franchiseInfo.name}{" "}
                <span className="tw:text-xs tw:text-slate-400">
                  ({data.franchiseInfo.refId})
                </span>
              </span>
            ) : (
              "--"
            )
          }
        />
      </AppCard>

      {/* Redirection Config */}
      <AppCard className="tw:md:col-span-2">
        <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
          Redirection Config
        </h3>
        <InfoRow
          icon={<Layers size={14} />}
          label="Redirection Type"
          value={data.bannerType || "--"}
        />
        {brands.length > 0 && (
          <div className="tw:mb-3">
            <div className="tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mb-1">
              Brands
            </div>
            <div className="tw:flex tw:flex-wrap tw:gap-1.5">
              {brands.map((b: any) => (
                <AppBadge key={b._id || b.id} variant="primary">
                  {b.name}
                </AppBadge>
              ))}
            </div>
          </div>
        )}
        {categories.length > 0 && (
          <div className="tw:mb-3">
            <div className="tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mb-1">
              Categories
            </div>
            <div className="tw:flex tw:flex-wrap tw:gap-1.5">
              {categories.map((c: any) => (
                <AppBadge key={c._id || c.id} variant="primary">
                  {c.name}
                </AppBadge>
              ))}
            </div>
          </div>
        )}
        {deals.length > 0 && (
          <div className="tw:mb-3">
            <div className="tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mb-1">
              Products
            </div>
            <div className="tw:flex tw:flex-wrap tw:gap-1.5">
              {deals.map((d: any) => (
                <AppBadge key={d._id || d.id} variant="primary">
                  {d.name}
                </AppBadge>
              ))}
            </div>
          </div>
        )}
        {menus.length > 0 && (
          <div className="tw:mb-3">
            <div className="tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mb-1">
              Menus
            </div>
            <div className="tw:flex tw:flex-wrap tw:gap-1.5">
              {menus.map((m: any) => (
                <AppBadge key={m._id || m.id} variant="primary">
                  {m.name}
                </AppBadge>
              ))}
            </div>
          </div>
        )}
        {keywords && (
          <div>
            <div className="tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mb-1">
              Keywords
            </div>
            <div className="tw:text-sm tw:text-slate-800">{keywords}</div>
          </div>
        )}
      </AppCard>

      {/* Created / Updated Info */}
      <AppCard className="tw:md:col-span-2">
        <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
          Activity Info
        </h3>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-x-6">
          <InfoRow
            icon={<User size={14} />}
            label="Created By"
            value={
              data.createdBy ? (
                <span>
                  {data.createdBy.name}{" "}
                  <span className="tw:text-xs tw:text-slate-400">
                    ({data.createdBy.usertype})
                  </span>
                </span>
              ) : (
                "--"
              )
            }
          />
          <InfoRow
            icon={<Calendar size={14} />}
            label="Created At"
            value={
              data.createdAt ? (
                <DateFormat value={data.createdAt} formatStr="dd MMM yyyy, hh:mm a" />
              ) : (
                "--"
              )
            }
          />
          <InfoRow
            icon={<User size={14} />}
            label="Updated By"
            value={
              data.updatedBy ? (
                <span>
                  {data.updatedBy.name}{" "}
                  <span className="tw:text-xs tw:text-slate-400">
                    ({data.updatedBy.usertype})
                  </span>
                </span>
              ) : (
                "--"
              )
            }
          />
          <InfoRow
            icon={<Calendar size={14} />}
            label="Updated At"
            value={
              data.updatedAt ? (
                <DateFormat value={data.updatedAt} formatStr="dd MMM yyyy, hh:mm a" />
              ) : (
                "--"
              )
            }
          />
        </div>
      </AppCard>
    </div>
  );
}
