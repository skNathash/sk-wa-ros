interface PageLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = "Loading...",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "tw:w-6 tw:h-6",
    md: "tw:w-8 tw:h-8",
    lg: "tw:w-12 tw:h-12",
  };

  const textSizeClasses = {
    sm: "tw:text-sm",
    md: "tw:text-base",
    lg: "tw:text-lg",
  };

  return (
    <div className="tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:bg-white tw:bg-opacity-90 tw:z-50">
      <div className="tw:flex tw:flex-col tw:items-center tw:space-y-4">
        {/* Spinner */}
        <div
          className={`${sizeClasses[size]} tw:animate-spin tw:rounded-full tw:border-4 tw:border-gray-200 tw:border-t-blue-600`}
        ></div>

        {/* Loading Text */}
        <p
          className={`${textSizeClasses[size]} tw:text-gray-600 tw:font-medium tw:text-center`}
        >
          {message}
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
