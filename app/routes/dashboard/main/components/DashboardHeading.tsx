/** Desktop-only page heading ("DASHBOARD" + full date). */
const DashboardHeading = () => {
  return (
    <div className="tw:mb-4 tw:hidden tw:lg:block">
      <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
        Dashboard
      </p>
      <h1 className="tw:text-xl tw:font-bold tw:text-slate-900">
        Wednesday, 15 July 2026
      </h1>
    </div>
  );
};

export default DashboardHeading;
