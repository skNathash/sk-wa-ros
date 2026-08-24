import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSwiper from "~/components/core/swiper";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import { getMapRunners, type MapRunner } from "./helper";

const google = window.google as any;

const REFRESH_MS = 30_000;

async function initMap(mapRef: HTMLDivElement) {
  const coords = AuthService.getLoggedInUserLatLng();
  const { Map } = await google.maps.importLibrary("maps");

  const map = new Map(mapRef, {
    zoom: 14,
    center: coords ? { lat: coords.lat, lng: coords.lng } : { lat: 12.9716, lng: 77.5946 },
  });

  return map;
}

const swiperConfig = {
  slidesPerView: 3,
  spaceBetween: 10,
  breakpoints: {
    768: {
      slidesPerView: 2.5,
    },
    1024: {
      slidesPerView: 3,
    },
  },
};

const RunnerMapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [runners, setRunners] = useState<MapRunner[]>([]);
  const markersRef = useRef<any[]>([]);
  const { isMobile } = useScreenView();

  useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const map = await initMap(mapRef.current);
      setMap(map);
    })();
  }, [mapRef]);

  // Load the nearby runners and drop them on the map, then keep the markers
  // fresh every 30s.
  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const refresh = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      const list = await getMapRunners();
      if (cancelled) return;

      setRunners(list);
      markersRef.current.forEach((marker) => marker.map = null);
      markersRef.current = list
        .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
        .map(
          (runner) =>
            new AdvancedMarkerElement({
              map,
              position: { lat: runner.lat, lng: runner.lng },
              title: runner.name,
              content: buildMarkerContent(runner),
            }),
        );
    };

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, [map]);

  const onRoute = runners.filter((r) => r.activeShipments > 0).length;

  const summary = [
    { title: "On Route", value: onRoute, key: "on-route" },
    { title: "Runners Active", value: runners.length, key: "runners-active" },
    { title: "Runners Offline", value: 0, key: "runners-offline" },
  ];

  return (
    <AppCard
      noPadding
      className={clsx("tw:h-full", isMobile && "tw:rounded-none tw:border-x-0")}
    >
      {/* Fixed-height map on mobile (the whole card is basically the canvas),
          taller/themed on larger screens. */}
      <div
        ref={mapRef}
        className={clsx(
          "tw:w-full",
          isMobile ? "tw:h-[45vh]" : "tw:h-[calc(100vh-250px)]",
        )}
      />
      {/* Summary strip — desktop only, hidden on the mobile screen so the map
          and the runner queue below it take over the whole viewport. */}
      {!isMobile && (
        <div className="tw:px-4 tw:pt-4">
          <AppSwiper config={swiperConfig}>
            {summary.map((item) => (
              <AppSwiper.Slide
                key={item.title}
                className="tw:border tw:border-gray-200 tw:rounded-md tw:p-4 tw:h-full"
              >
                <div className="tw:flex tw:flex-col tw:justify-center tw:h-full">
                  <div className="tw:text-xs tw:font-bold tw:text-slate-500 tw:mb-1 tw:uppercase">
                    {item.title}
                  </div>
                  <div
                    className={clsx("tw:text-2xl tw:font-bold", {
                      "tw:text-green-500": item.key === "on-route",
                      "tw:text-blue-500": item.key === "runners-active",
                      "tw:text-orange-700": item.key === "runners-offline",
                    })}
                  >
                    {item.value}
                  </div>
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      )}
    </AppCard>
  );
};

/** Tiny custom pin showing the runner's initials, with a tooltip. */
function buildMarkerContent(runner: MapRunner): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = [
    "width:28px;height:28px;border-radius:50%;",
    "background:#f97316;color:#fff;font-weight:700;font-size:11px;",
    "display:flex;align-items:center;justify-content:center;",
    "border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);",
    "cursor:pointer;",
  ].join("");
  el.textContent = runner._initials;
  el.title = `${runner.name} · ${runner._meta} · ${runner._loadLbl} loaded`;
  return el;
}

export default RunnerMapView;