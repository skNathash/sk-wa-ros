import clsx from "clsx";
import { Bike, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import StaticGMap from "~/components/core/map/StaticGMap";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import useAppToast from "~/hooks/useAppToast";
import GMapLocModal from "~/modals/feature/geo-location/GeoLocationModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import PageAccessService from "~/services/PageAccessService";
import {
  SERVICE_DAYS,
  SERVICE_FROM_LBL,
  SERVICE_HOURS,
  SERVICE_HOURS_LBL,
  SERVICE_RADIUS,
  SERVICE_RADIUS_LBL,
  SERVICE_STORES,
  SERVICE_STORES_COUNT_LBL,
  SERVICE_STORES_LBL,
  SERVICE_TO_LBL,
} from "./helper";

/**
 * Service panel — the runner's own terms: where they ride, when, and for whom.
 * Every block on it is a control rather than a record, because these are the
 * three things a runner changes between shifts, not once at sign-up.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerProfileService = () => {
  const appToast = useAppToast();
  const [radiusKm, setRadiusKm] = useState(SERVICE_RADIUS.defaultKm);
  const [days, setDays] = useState(
    () => new Set(SERVICE_DAYS.filter((day) => day.isOn).map((day) => day.key)),
  );
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState<{ lat: number; lng: number } | null>(null);

  const onDayToggle = (key: string) => {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onAreaModalCallback = async (data: {
    action: string;
    address?: any;
  }) => {
    if (data.action === "close") {
      setShowAreaModal(false);
      return;
    }

    if (data.action === "submit") {
      const { lat, lng } = data.address || {};
      if (typeof lat !== "number" || typeof lng !== "number") return;

      setSaving(true);
      const resp = await MarketplaceRunnerService.updateArea(
        AuthService.getLoggedInUserId(),
        { lat, lng },
      );
      setSaving(false);
      setShowAreaModal(false);

      if (resp?.statusCode !== 200 && resp?.statusCode !== 201) {
        appToast.show({ msg: "Failed to update delivery area", color: "danger" });
        return;
      }

      setArea({ lat, lng });
      appToast.show({ msg: "Delivery area updated", color: "success" });
    }
  };

  return (
    <div className="runner-profile-panel">
      <section>
        <div className="tw:mb-2 tw:flex tw:items-end tw:justify-between tw:px-1">
          <p className="runner-profile-section-lbl tw:mb-0">
            {SERVICE_RADIUS_LBL}
          </p>
          <p className="app-amount tw:text-xl tw:font-bold tw:leading-none tw:text-primary">
            {radiusKm} km
          </p>
        </div>

        <div className="runner-profile-card tw:p-3">
          <div className="runner-area">
            <div className="runner-area-map">
              {area ? (
                <StaticGMap
                  lat={area.lat}
                  lng={area.lng}
                  className="tw:w-full tw:h-full tw:rounded-md"
                />
              ) : (
                <div className="runner-map-plate tw:h-full tw:w-full">
                  <span className="runner-map-pin">
                    <Bike size={16} />
                  </span>
                  <span className="runner-map-credit">
                    {SERVICE_RADIUS._creditLbl}
                  </span>
                  <span className="runner-map-chip">
                    {SERVICE_RADIUS._shopsLbl}
                  </span>
                </div>
              )}
            </div>

            <AppButton
              fill="outline"
              color="light"
              size="small"
              className="runner-area-btn"
              onClick={() => setShowAreaModal(true)}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="tw:w-4 tw:h-4 tw:animate-spin" />
              ) : (
                <MapPin className="tw:w-4 tw:h-4" />
              )}
              <span className="tw:text-sm">{area ? "Change area" : "Choose area"}</span>
            </AppButton>
          </div>

          <Slider
            className="runner-radius-slider"
            value={[radiusKm]}
            min={SERVICE_RADIUS.minKm}
            max={SERVICE_RADIUS.maxKm}
            step={1}
            onValueChange={([value]) => setRadiusKm(value)}
          />

          <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:font-semibold tw:text-slate-400">
            <span>{SERVICE_RADIUS.minKm} km</span>
            <span className="tw:text-primary">{radiusKm} km</span>
            <span>{SERVICE_RADIUS.maxKm} km</span>
          </div>
        </div>
      </section>

      <section>
        <p className="runner-profile-section-lbl">{SERVICE_HOURS_LBL}</p>

        <div className="runner-profile-card tw:p-3">
          <div className="runner-day-grid">
            {SERVICE_DAYS.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => onDayToggle(day.key)}
                className={clsx("runner-day-chip", {
                  "runner-day-chip--off": !days.has(day.key),
                })}
              >
                {day._dayLbl}
              </button>
            ))}
          </div>

          <div className="runner-vehicle-facts">
            <div className="runner-vehicle-fact">
              <span className="app-label tw:text-[0.625rem] tw:text-slate-400">
                {SERVICE_FROM_LBL}
              </span>
              <span className="tw:block tw:text-base tw:font-bold tw:text-slate-900">
                {SERVICE_HOURS._fromLbl}
              </span>
            </div>
            <div className="runner-vehicle-fact">
              <span className="app-label tw:text-[0.625rem] tw:text-slate-400">
                {SERVICE_TO_LBL}
              </span>
              <span className="tw:block tw:text-base tw:font-bold tw:text-slate-900">
                {SERVICE_HOURS._toLbl}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="runner-profile-section-lbl">
          {SERVICE_STORES_LBL}
          <span className="tw:ml-2 tw:text-slate-400">
            {SERVICE_STORES_COUNT_LBL}
          </span>
        </p>

        <div className="runner-profile-card">
          {SERVICE_STORES.map((store) => (
            <label key={store.key} className="runner-profile-row">
              <span className={`runner-chat-avatar ${store._avatarCls}`}>
                {store._avatarLbl}
              </span>

              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
                  {store._nameLbl}
                </span>
                <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                  {store._jobsLbl}
                  <span className="tw:px-1.5 tw:text-slate-300">·</span>
                  {store._periodLbl}
                  {store._primaryLbl && (
                    <>
                      <span className="tw:px-1.5 tw:text-slate-300">·</span>
                      <span className="app-label tw:text-[0.625rem] tw:font-bold tw:text-primary tw:uppercase">
                        {store._primaryLbl}
                      </span>
                    </>
                  )}
                </span>
              </span>

              <Switch
                defaultChecked={store.isOn}
                className="runner-profile-switch"
              />
            </label>
          ))}
        </div>
      </section>

      <GMapLocModal
        show={showAreaModal}
        callback={onAreaModalCallback}
        enableGeoLoc={true}
        lat={area?.lat}
        lng={area?.lng}
        title="Choose delivery area"
      />
    </div>
  );
};

export default RunnerProfileService;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner service area"),
    },
  ];
}
