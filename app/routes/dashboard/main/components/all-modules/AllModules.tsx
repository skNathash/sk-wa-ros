import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyAllModules,
  getAllModules,
  type AllModulesData,
  type ModuleTile,
} from "./helper";

/** Card body — same face whether the tile routes internally or opens a tab. */
const TileFace = ({ module }: { module: ModuleTile }) => (
  <AppCard className="app-home-module-card tw:transition tw:hover:shadow-md">
    <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
      <span
        className={clsx(
          "tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-xl tw:text-xl",
          module.chipClass,
        )}
      >
        {module.emoji}
      </span>
      {module.badge && (
        <AppBadge size="sm" variant={module.badge.variant}>
          {module.badge.text}
        </AppBadge>
      )}
    </div>

    <div className="tw:mt-6 tw:border-t tw:border-dashed tw:border-slate-200 tw:pt-3">
      <div className="tw:text-base tw:font-bold tw:text-slate-900">
        {module.name}
      </div>
      <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
        {module.description}
      </div>
    </div>

    <div className="tw:mt-4 tw:flex tw:items-center tw:justify-between tw:border-t tw:border-dashed tw:border-slate-200 tw:pt-3 tw:text-xs tw:font-semibold tw:text-emerald-700">
      {module.actionLabel}
      <ArrowRight size={14} />
    </div>
  </AppCard>
);

const Tile = ({ module }: { module: ModuleTile }) => {
  // CLUB opens the shop's public storefront rather than a route inside the app.
  // An empty URL (user with no mobile on file) leaves the card inert.
  if (module.externalUrl) {
    const href = module.externalUrl();
    if (!href) return <TileFace module={module} />;

    return (
      <AppLink
        onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
        className="tw:block tw:h-full tw:no-underline"
      >
        <TileFace module={module} />
      </AppLink>
    );
  }

  return (
    <AppLink asLink noUnderline href={module.to} className="tw:block tw:h-full">
      <TileFace module={module} />
    </AppLink>
  );
};

/** Every module the shop owns, as a directory grid. */
const AllModules = () => {
  const [data, setData] = useState<AllModulesData>(emptyAllModules);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: AllModulesData;
      try {
        result = await getAllModules();
      } catch (e) {
        result = emptyAllModules();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="tw:mb-5">
      <div className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-700">
        {data.heading}{" "}
        <span className="tw:font-normal tw:normal-case tw:text-slate-400">
          {data.caption}
        </span>
      </div>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-6">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-2 tw:lg:grid-cols-3">
          {data.modules.map((module) => (
            <Tile key={module.key} module={module} />
          ))}
        </div>
      )}
    </section>
  );
};

export default AllModules;
