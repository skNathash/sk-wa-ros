import { useEffect, useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import useGeoLocation from "~/hooks/useGeoLocation";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import PageAccessService from "~/services/PageAccessService";
import RunnerHeader from "~/shared/runner/header/RunnerHeader";
import ActiveJobs from "./components/active-jobs/ActiveJobs";
import NearbyJobs from "./components/nearby-jobs/NearbyJobs";
import RunnerHero from "./components/runner-hero/RunnerHero";
import { RUNNER } from "./helper";

/**
 * Runner app home, inside the runner shell ({@link RunnerLayout}). The hero
 * carries everything the runner checks on opening the app — shift status,
 * today's money and their standing record — with the job feed under it. The
 * status pill flips the runner online/offline via the runner update API.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerHome = () => {
  const runner = AuthService.getRunner<{ name?: string; _id?: string }>();
  const name = runner?.name?.trim() || "";
  const firstName = name.split(" ")[0] || name;

  const [isOnline, setIsOnline] = useState(() => AuthService.isRunnerOnline());
  const [switching, setSwitching] = useState(false);

  const [coords, setCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });

  const { pickLocation } = useGeoLocation();

  useEffect(() => {
    pickLocation(({ lat, lng, errMsg }) => {
      if (errMsg || lat == null || lng == null) {
        console.log("Geolocation error:", errMsg || "No location available");
        return;
      }
      console.log("Geolocation:", { lat, lng });
      setCoords({ lat, lng });
    });
  }, [pickLocation]);

  const { show: showToast } = useAppToast();

  const handleToggleOnline = async (online: boolean) => {
    if (!runner?._id) return;
    setSwitching(true);
    setIsOnline(online);
    AuthService.updateRunnerIsOnline(online);
    try {
      const resp = await MarketplaceRunnerService.updateRunner(runner._id, {
        isAvailable: online,
      });
      if (resp?.statusCode !== 200 && resp?.statusCode !== 201) {
        setIsOnline(!online);
        AuthService.updateRunnerIsOnline(!online);
        showToast({
          msg:
            resp?.data?.message ||
            "Failed to update availability. Please try again.",
          color: "danger",
        });
      }
    } catch (e) {
      setIsOnline(!online);
      AuthService.updateRunnerIsOnline(!online);
      showToast({
        msg: (e as any)?.message || "Failed to update availability.",
        color: "danger",
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <RunnerHeader
        title={firstName ? `${RUNNER.greeting}, ${firstName}` : RUNNER.greeting}
        subtitle={RUNNER._placeLbl}
      >
        <AppButton fill="clear" size="icon" className="runner-hero-icon-btn">
          <MessageSquare size={18} />
        </AppButton>
        <AppButton fill="clear" size="icon" className="runner-hero-icon-btn">
          <Bell size={18} />
        </AppButton>
      </RunnerHeader>

      <RunnerHero
        name={name}
        firstName={firstName}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        switching={switching}
      />
      <ActiveJobs />
      <NearbyJobs lat={coords.lat} lng={coords.lng} />
    </>
  );
};

export default RunnerHome;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner"),
    },
  ];
}
