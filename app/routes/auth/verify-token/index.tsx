import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import { StorageService } from "~/services/StorageService";
import useAppNav from "~/hooks/useAppNav";

const VerifyToken = () => {
  const appNav = useAppNav();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();

  const hashId = searchParams.get("id");

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      const resp = await AuthService.verifyToken(hashId || "");
      setLoading(false);
      if (resp.statusCode !== 200) {
        setError(resp.data?.message || "Failed to verify token");
        return;
      }

      const token = resp.data?.data?.token;
      if (!token) {
        setError("Failed to verify token");
        return;
      }

      const fid = resp.data?.data?.franchiseInfo?.id;
      if (!fid) {
        setError("Failed to verify token");
        return;
      }

      AuthService.setLoggedInToken(token);

      const franchiseResp = await AuthService.getLoggedInFranchiseDetails();

      const franchise = franchiseResp.data?.data;

      if (!franchise) {
        setError("Failed to fetch franchise details");
        return;
      }

      StorageService.set("_f", franchiseResp.data?.data);

      appNav.replace("/auth/init");
    };

    if (!hashId) {
      setLoading(false);
      setError("No hash id provided");
      return;
    }

    verifyToken();
  }, [hashId]);

  return (
    <div className="app-page">
      <div className="app-container">
        <div className="tw:flex tw:justify-center tw:items-center tw:h-screen">
          {loading && !error && (
            <div className="tw:flex tw:gap-4 tw:items-center">
              <AppSpinner />
              <span className="tw:text-xs">
                Please wait while we verifying your token...
              </span>
            </div>
          )}

          {error && <div className="tw:text-red-500 tw:text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default VerifyToken;
