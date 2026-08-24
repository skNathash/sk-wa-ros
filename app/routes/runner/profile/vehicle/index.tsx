import { Bike, IdCard, Pencil, Plus } from "lucide-react";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import {
  RUNNER_VEHICLE,
  VEHICLE_ADD_LBL,
  VEHICLE_CHANGE_LBL,
  VEHICLE_FACTS,
  VEHICLE_LICENCE,
} from "./helper";

/**
 * Vehicle panel — the bike as dispatch sees it. The plate is set as a plate
 * and given its own row: it is what the retailer at the pickup counter reads
 * back, so it has to be findable without reading the card around it.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerProfileVehicle = () => {
  return (
    <div className="runner-profile-panel">
      <div className="runner-profile-card tw:p-3.5">
        <div className="tw:flex tw:items-center tw:gap-3">
          <span className="runner-vehicle-icon">
            <Bike size={24} />
          </span>

          <span className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
              {RUNNER_VEHICLE._nameLbl}
            </span>
            <span className="tw:block tw:truncate tw:text-sm tw:text-slate-500">
              {RUNNER_VEHICLE._typeLbl}
              <span className="tw:px-1.5 tw:text-slate-300">·</span>
              {RUNNER_VEHICLE._fuelLbl}
            </span>
          </span>

          <button type="button" className="runner-vehicle-change">
            {VEHICLE_CHANGE_LBL}
          </button>
        </div>

        {/* The plate, drawn as one. The IND tab and the spacing are what make
            it scan as a number plate rather than as a code in a field. */}
        <div className="runner-plate">
          <span className="runner-plate-ind">IND</span>
          <span className="runner-plate-no">
            {RUNNER_VEHICLE._plateStateLbl}
            <span className="tw:px-1.5" />
            {RUNNER_VEHICLE._plateSeriesLbl}
          </span>
          <button type="button" className="runner-profile-row-edit">
            <Pencil size={15} />
          </button>
        </div>

        <div className="runner-vehicle-facts">
          {VEHICLE_FACTS.map((fact) => (
            <div key={fact.key} className="runner-vehicle-fact">
              <span className="app-label tw:text-[0.625rem] tw:text-slate-400">
                {fact._labelLbl}
              </span>
              <span className="tw:block tw:text-base tw:font-bold tw:text-slate-900">
                {fact._valueLbl}
              </span>
            </div>
          ))}
        </div>

        <div className="runner-vehicle-licence">
          <span className="runner-profile-row-icon runner-profile-row-icon--brand">
            <IdCard size={18} />
          </span>

          <span className="tw:min-w-0 tw:flex-1">
            <span className="app-label tw:block tw:truncate tw:text-xs tw:font-bold tw:text-slate-900">
              {VEHICLE_LICENCE._numberLbl}
            </span>
            <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
              {VEHICLE_LICENCE._validLbl}
            </span>
          </span>

          <span className="runner-profile-badge runner-profile-badge--ok">
            {VEHICLE_LICENCE._statusLbl}
          </span>
        </div>
      </div>

      <button type="button" className="runner-profile-add">
        <Plus size={16} />
        {VEHICLE_ADD_LBL}
      </button>
    </div>
  );
};

export default RunnerProfileVehicle;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner vehicle"),
    },
  ];
}
