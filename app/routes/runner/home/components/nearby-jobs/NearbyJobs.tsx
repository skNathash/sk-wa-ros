import clsx from "clsx";
import { ArrowRight, MapPin, Package, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import { NEARBY_JOBS, NEARBY_JOBS_COUNT_LBL } from "../../helper";

/**
 * Available-near-you feed — the open jobs the runner can still claim. Each card
 * leads with what it pays, then the drop, and ends on the pickup beside the
 * take-it-or-leave-it pair, so the decision reads top to bottom.
 */
export default function NearbyJobs({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const [jobs, setJobs] = useState<any[]>(NEARBY_JOBS);

  const fetchJobs = useCallback(async () => {
    if (lat == null || lng == null) {
      console.log("No location available");
      return;
    }
    console.log("Geolocation:", { lat, lng });
    MarketplaceRunnerService.getAvailableShipments({
      lat,
      lng,
      distance: 5,
      page: 1,
      limit: 20,
    })
      .then((resp) => {
        console.log("Available shipments response:", resp);
        const data = resp?.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data);
        }
      })
      .catch((e) => {
        console.log("Available shipments error:", e);
      });
  }, [lat, lng]);

  useEffect(() => {
    fetchJobs();
    const id = window.setInterval(fetchJobs, 30 * 1000);
    return () => window.clearInterval(id);
  }, [fetchJobs]);

  const currentJobs = jobs;

  return (
    <section className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-5 tw:pb-6">
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="app-label tw:text-slate-500">Available near you</span>
        <span className="tw:text-xs tw:text-slate-400">
          {NEARBY_JOBS_COUNT_LBL}
        </span>

        <AppButton fill="clear" size="small" className="tw:ml-auto">
          <RotateCw size={13} />
          Refresh
        </AppButton>
      </div>

      <div className="runner-card-grid">
        {currentJobs.map((job) => (
          <AppCard
            key={job.id}
            className="tw:mb-0 tw:py-3.5"
            bodyClassName="tw:px-4"
          >
            {/* Code and order type against what the run pays. */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="runner-nearby-code">{job.orderCode}</span>
              <span className={clsx("runner-job-badge", job._typeCls)}>
                {job._typeLbl}
              </span>
              <span className="tw:ml-auto tw:flex tw:items-center tw:text-xl tw:font-bold tw:text-slate-900">
                +
                <Amount value={job.earning} decimalPlaces={0} />
              </span>
            </div>

            <h3 className="tw:mt-2 tw:truncate tw:text-lg tw:font-bold tw:text-slate-900">
              {job.customerName}
            </h3>

            {/* Where it goes, how far, how much to carry. */}
            <p className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-500">
              <MapPin size={13} className="tw:shrink-0" />
              <span className="tw:truncate">{job._placeLbl}</span>
              <span className="tw:text-slate-300">·</span>
              <span>{job._dropDistanceLbl}</span>
              <span className="tw:text-slate-300">·</span>
              <Package size={13} className="tw:shrink-0" />
              <span>{job._itemsLbl}</span>
            </p>

            {/* Pickup on the left, the two ways out of the card on the right. */}
            <div className="tw:mt-3 tw:flex tw:items-end tw:gap-3">
              <p className="tw:min-w-0 tw:flex-1 tw:text-xs">
                <span className="app-label tw:block tw:text-slate-400">
                  Pickup
                </span>
                <span className="tw:block tw:truncate tw:font-semibold tw:text-slate-700">
                  {job._pickupStoreLbl}
                </span>
                <span className="tw:text-slate-400">
                  {job._pickupDistanceLbl}
                </span>
              </p>

              <AppButton fill="outline" color="light" size="small">
                Skip
              </AppButton>
              <AppButton size="small">
                Accept
                <ArrowRight size={15} />
              </AppButton>
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}
