import AppSpinner from "~/components/core/Spinner/AppSpinner";

export function Welcome() {
  return (
    <>
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    </>
  );
}
