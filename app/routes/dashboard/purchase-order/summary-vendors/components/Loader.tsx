const Loader = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mx-6">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="tw:block tw:border tw:border-gray-200 tw:rounded-md tw:p-4 tw:bg-white"
          >
            <div className="tw:mb-2">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="skeleton-loader tw:w-24 tw:h-5"></div>
              </div>
              <div className="tw:text-xs tw:mt-1">
                <div className="skeleton-loader tw:w-16 tw:h-3"></div>
              </div>
            </div>

            <div className="tw:my-2">
              <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mt-2">
                <div>
                  <div className="skeleton-loader tw:w-full tw:h-5"></div>
                  <div className="tw:mt-2 skeleton-loader tw:w-3/4 tw:h-3"></div>
                </div>
                <div>
                  <div className="skeleton-loader tw:w-full tw:h-5"></div>
                  <div className="tw:mt-2 skeleton-loader tw:w-2/4 tw:h-3"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Loader;
