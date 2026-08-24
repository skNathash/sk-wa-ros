import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import InfoList from "./components/info-list/InfoList";
import Preferences from "./components/preferences/Preferences";
import Support from "./components/support/Support";

/**
 * About panel — the profile's default tab. It runs from the facts the platform
 * holds on the runner, to the terms the runner sets themselves, to the doors
 * out: read, then change, then leave.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerProfileAbout = () => {
  return (
    <div className="runner-profile-panel">
      <InfoList />
      <Preferences />
      <Support />
    </div>
  );
};

export default RunnerProfileAbout;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner profile"),
    },
  ];
}
