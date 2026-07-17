import React, { useEffect, useState } from "react";
import clsx from "clsx";
import TermsService from "~/services/TermsService";
// removed APP_VERSION import per request
import AppSpinner from "../Spinner/AppSpinner";

interface TermsContentProps {
  termsKey: string;
  version?: string;
  className?: string;
  loadingClassName?: string;
  errorClassName?: string;
  callback?: (data: {
    action: string;
    data?: { version: string; name: string; code: string; content: string };
  }) => void;
}

const TermsContent: React.FC<TermsContentProps> = ({
  termsKey,
  version,
  className = "",
  loadingClassName = "",
  errorClassName = "",
  callback,
}) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [termsVersion, setTermsVersion] = useState<string | null>(
    version || null
  );

  useEffect(() => {
    const fetchTermsContent = async () => {
      if (!termsKey) {
        setError("Terms key is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let payload = {
          filter: { code: termsKey, isActive: true },
        };

        if (version) {
          Object.assign(payload.filter, { version });
        }

        const response = await TermsService.getTermsList(payload);

        if (response.statusCode === 200 && response.data) {
          // Handle both array and single object responses
          let termsData: any = response.data?.[0] || null;
          const htmlContent = termsData?.description || "";

          setContent(htmlContent);
          setTermsVersion(termsData?.version || version || null);

          // Call callback with success data including version, name, code
          callback?.({
            action: "success",
            data: {
              version: termsData?.version || "",
              name: termsData?.name || "",
              code: termsData?.code || termsKey,
              content: htmlContent,
            },
          });
        } else {
          const errorMessage = "Failed to fetch terms content";
          setError(errorMessage);
          callback?.({ action: "error" });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred while fetching terms content";
        setError(errorMessage);
        callback?.({ action: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchTermsContent();
  }, [termsKey, callback, version]);

  if (loading) {
    return (
      <div
        className={clsx(
          "tw:flex tw:items-center tw:justify-center tw:py-8",
          loadingClassName
        )}
      >
        <AppSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={clsx(
          "tw:text-red-600 tw:text-center tw:py-4",
          errorClassName
        )}
      >
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div
        className={clsx(
          "tw:text-gray-500 tw:text-center tw:py-4",
          errorClassName
        )}
      >
        <p>No content available</p>
      </div>
    );
  }

  return (
    <div className={clsx("terms-content", className)}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {termsVersion ? (
        <div className="tw:text-xs tw:text-gray-400 tw:text-center tw:mt-3">
          Document version: v{termsVersion}
        </div>
      ) : null}
    </div>
  );
};

export default TermsContent;
