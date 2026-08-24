import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import AppBadge from "~/components/core/badge/AppBadge";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import {
  emptyModulesPage,
  getModules,
  moduleCounts,
  type ModuleGroup,
  type ModulesPage,
  type ModuleTile,
} from "./helper";

/** The card body — shared by the linked tile and the locked one. */
const CardFace = ({ module }: { module: ModuleTile }) => {
  const Icon = module.icon;

  return (
    <article
      className={clsx(
        "app-modules-card tw:flex tw:h-full tw:flex-col tw:rounded-2xl tw:p-5",
        module.locked && "is-locked",
      )}
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
        <span
          className={clsx(
            "app-modules-chip tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-xl",
            module.chipClass,
          )}
        >
          <Icon size={22} strokeWidth={1.75} />
        </span>

        {module.badge && (
          <AppBadge size="sm" variant={module.badge.variant}>
            {module.badge.text}
          </AppBadge>
        )}
      </div>

      <div className="app-modules-card-body tw:mt-8 tw:pt-4">
        <h3 className="app-modules-name tw:text-lg tw:font-bold">
          {module.name}
        </h3>
        <p className="app-modules-desc tw:mt-1.5 tw:text-[13px] tw:leading-snug">
          {module.description}
        </p>
      </div>

      {/* The action row keeps the tile's own colour — the same accent the icon
          chip carries — so a band reads as a row of distinct tools. */}
      <div className="app-modules-card-foot tw:mt-4 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-3">
        <span
          className={clsx(
            "app-modules-action tw:text-[13px] tw:font-semibold",
            module.actionClass,
          )}
        >
          {module.actionLabel}
        </span>
        <ArrowRight
          size={14}
          className={clsx("tw:shrink-0", module.actionClass)}
        />
      </div>
    </article>
  );
};

/**
 * One module tile. Locked modules render the same card as plain markup — there
 * is nothing behind them yet, so they must not be tappable. Unlocked ones route
 * through `useAppNav`, the same navigation helper the rest of the dashboard
 * uses, rather than a raw router `Link`. Modules that live outside the app
 * (CLUB's public storefront) open their resolved URL in a new tab instead.
 */
const ModuleCard = ({ module }: { module: ModuleTile }) => {
  const appNav = useAppNav();

  if (module.locked) return <CardFace module={module} />;

  if (module.externalUrl) {
    const href = module.externalUrl();
    // No URL to open — usually a user with no mobile on file. Show the card,
    // but don't hand the shop a dead link.
    if (!href) return <CardFace module={module} />;

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="tw:block tw:h-full tw:w-full tw:text-left"
      >
        <CardFace module={module} />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => appNav.to(module.to)}
      className="tw:block tw:h-full tw:w-full tw:text-left"
    >
      <CardFace module={module} />
    </button>
  );
};

/** An intent band: its heading, then the tiles inside it. */
const ModuleGroupBlock = ({ group }: { group: ModuleGroup }) => (
  <section className="tw:mt-8 tw:first:mt-0">
    <div className="tw:mb-3 tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-3 tw:gap-y-1">
      <h2 className="app-modules-group-label">{group.label}</h2>
      <span className="app-modules-group-caption">{group.caption}</span>
    </div>

    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:sm:grid-cols-2 tw:lg:grid-cols-3">
      {group.modules.map((module) => (
        <ModuleCard key={module.key} module={module} />
      ))}
    </div>
  </section>
);

/** Page header — the promise on the left, the count readout on the right. */
const ModulesHeader = ({ data }: { data: ModulesPage }) => {
  const counts = moduleCounts(data);

  return (
    <header className="tw:flex tw:flex-col tw:gap-6 tw:pb-8 tw:lg:flex-row tw:lg:items-start tw:lg:justify-between">
      <div className="tw:min-w-0">
        <span className="app-modules-eyebrow">{data.eyebrow}</span>

        <h1 className="app-modules-display tw:mt-3 tw:text-3xl tw:font-bold tw:leading-tight tw:md:text-4xl">
          {data.headlineLead}{" "}
          <span className="app-modules-accent tw:italic">
            {data.headlineAccent}
          </span>
        </h1>

        <p className="app-modules-subline tw:mt-2">
          {counts.total} modules · {data.subline}
        </p>
      </div>

      <div className="tw:shrink-0 tw:lg:text-right">
        <span className="app-modules-eyebrow">Active modules</span>
        <div className="app-modules-display tw:text-4xl tw:font-bold tw:md:text-5xl">
          {counts.active}
        </div>
        <p className="app-modules-subline tw:mt-1">
          of {counts.total}
          {counts.locked > 0 && ` · ${counts.locked} ${data.unlockNote}`}
        </p>
      </div>
    </header>
  );
};

/**
 * The module directory — every area of StoreKing the shop can open, banded by
 * intent (Sell, Stock, Money, Grow) with whatever needs attention shown as a
 * count chip and whatever is not earned yet shown locked. Everything it paints
 * comes from helper.ts, which owns the (currently static) data promise.
 *
 * theme-2 only. The other themes have no design for this screen, so they are
 * sent back to the dashboard rather than shown an unstyled version — the same
 * rule the journey map follows.
 */
const DashboardModules = () => {
  const theme = useTheme();
  const [data, setData] = useState<ModulesPage>(emptyModulesPage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: ModulesPage;
      try {
        result = await getModules();
      } catch {
        result = emptyModulesPage();
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

  if (theme !== "theme-2") return <Navigate to="/dashboard/main" replace />;

  return (
    <>
      {/* Same section as Home with Modules lit, so the mobile section switcher
          in the header and the desktop rail both know where we are. */}
      <AppHeader
        title="All Modules"
        sectionKey="home"
        activeTab="modules"
        mobileLead="menu"
      />

      {/* `app-modules` scopes every rule in dashboard-modules.css. */}
      <div className="app-modules">
        <div className="app-page page-bg page-bg-muted tw:p-4">
          <div className="app-container">
            <div className="section-layout">
              {/* Desktop-only left rail — the same Home section menu the
                  dashboard carries, so the shell doesn't change under the user
                  when they open the directory. No `onSelect` override: the
                  default redirect navigation is right for every entry. */}
              <aside className="section-menu-aside">
                <div className="tw:sticky tw:top-20">
                  <SectionMenu
                    sectionKey="home"
                    activeTab="modules"
                    title="Home"
                  />
                </div>
              </aside>

              <div className="section-content">
                {loading ? (
                  <div className="tw:flex tw:justify-center tw:py-16">
                    <AppSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    <ModulesHeader data={data} />

                    {data.groups.map((group) => (
                      <ModuleGroupBlock key={group.key} group={group} />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardModules;
