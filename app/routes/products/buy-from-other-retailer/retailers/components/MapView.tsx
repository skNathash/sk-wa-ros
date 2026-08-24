import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Loader2, MapPin } from "lucide-react";
import clsx from "clsx";
import AuthService from "~/services/AuthService";
import { getMapData, type LatLng, type MapBounds } from "../helper";

declare const google: any;

// Bengaluru — only used when the logged-in store has no coordinates yet.
const FALLBACK_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };
const DEFAULT_ZOOM = 12;
const MAX_MARKERS = 400;

// Every pan/zoom emits a burst of `idle` events; wait for the map to settle
// before spending a request on the viewport.
const REFETCH_DEBOUNCE_MS = 400;

const PIN_COLORS = {
  me: "#ef4444",
  connected: "#10b981",
  seller: "#4f46e5",
};

// Google hands the script to us asynchronously from root.tsx, so a map mounted
// on first paint can beat it. Poll briefly rather than loading a second copy.
const waitForGoogleMaps = (timeoutMs = 15000) =>
  new Promise<void>((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      if ((window as any).google?.maps?.importLibrary) return resolve();
      if (performance.now() - started > timeoutMs) {
        return reject(new Error("Google Maps did not load."));
      }
      setTimeout(check, 100);
    };
    check();
  });

interface Props {
  /** Same filter object the list view sends, so both stay in agreement. */
  filter?: Record<string, any>;
  /** Fired when a seller marker's "View catalog" is clicked. */
  onSelectSeller?: (seller: any) => void;
  className?: string;
  height?: string;
}

const MapView = ({
  filter = {},
  onSelectSeller,
  className,
  height = "tw:h-[520px]",
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const infoContentRef = useRef<HTMLDivElement | null>(null);
  const infoRootRef = useRef<Root | null>(null);
  const markersRef = useRef<any[]>([]);
  const markerLibRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic request id — a slow response for an old viewport must not paint
  // over the markers of the viewport the user is looking at now.
  const requestIdRef = useRef(0);
  const filterRef = useRef(filter);
  const onSelectRef = useRef(onSelectSeller);

  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState<string | null>(null);

  filterRef.current = filter;
  onSelectRef.current = onSelectSeller;

  const clearMarkers = () => {
    markersRef.current.forEach((m) => {
      m.map = null;
    });
    markersRef.current = [];
  };

  const openInfoWindow = (seller: any, marker: any) => {
    if (!infoContentRef.current) {
      infoContentRef.current = document.createElement("div");
      infoRootRef.current = createRoot(infoContentRef.current);
    }

    const place =
      [seller.town, seller.city, seller.district].filter(Boolean)[0] || "";
    const distance =
      seller.distanceToFranchiseKm != null
        ? `${Number(seller.distanceToFranchiseKm).toFixed(1)} km`
        : "";

    infoRootRef.current?.render(
      <div className="tw:p-1 tw:max-w-[240px] tw:space-y-1.5">
        <h3 className="tw:font-bold tw:text-sm tw:text-gray-900">
          {seller.name}
        </h3>
        <p className="tw:text-[11px] tw:text-gray-600">
          {[place, distance].filter(Boolean).join(" · ") ||
            "Location not available"}
        </p>
        {seller._networkLbl && (
          <span className="tw:inline-block tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:rounded tw:uppercase tw:tracking-wider tw:bg-indigo-50 tw:text-indigo-700 tw:border tw:border-indigo-100">
            {seller._networkLbl}
          </span>
        )}
        {onSelectRef.current && (
          <button
            type="button"
            onClick={() => onSelectRef.current?.(seller)}
            className="tw:block tw:w-full tw:mt-1 tw:text-[11px] tw:font-semibold tw:text-primary tw:cursor-pointer tw:text-left"
          >
            View catalog →
          </button>
        )}
      </div>,
    );

    infoWindowRef.current.setContent(infoContentRef.current);
    infoWindowRef.current.open(mapRef.current, marker);
  };

  // The boundary response doesn't always carry coordinates where the radius
  // response does (`lat`/`lng` come from `geoLocation` via formatFranchise),
  // so accept every shape the franchise APIs are known to return.
  const resolveLatLng = (seller: any): LatLng | null => {
    const candidates: any[] = [
      [seller?.lat, seller?.lng],
      [seller?.latitude, seller?.longitude],
      [seller?.address?.latitude, seller?.address?.longitude],
      [
        seller?.geoLocation?.coordinates?.[1],
        seller?.geoLocation?.coordinates?.[0],
      ],
      [seller?.location?.coordinates?.[1], seller?.location?.coordinates?.[0]],
      [
        seller?.addressDetails?.geoLocation?.coordinates?.[1],
        seller?.addressDetails?.geoLocation?.coordinates?.[0],
      ],
    ];

    for (const [lat, lng] of candidates) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (
        lat != null &&
        lng != null &&
        !Number.isNaN(latNum) &&
        !Number.isNaN(lngNum) &&
        (latNum !== 0 || lngNum !== 0)
      ) {
        return { lat: latNum, lng: lngNum };
      }
    }
    return null;
  };

  const renderSellers = (sellers: any[]) => {
    const { AdvancedMarkerElement, PinElement } = markerLibRef.current || {};
    if (!AdvancedMarkerElement) return;

    clearMarkers();

    const me = AuthService.getLoggedInUserLatLng();
    if (me?.lat && me?.lng) {
      const pin = new PinElement({
        background: PIN_COLORS.me,
        borderColor: "white",
        glyphColor: "white",
      });
      markersRef.current.push(
        new AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: Number(me.lat), lng: Number(me.lng) },
          title: "My Store",
          content: pin.element,
        }),
      );
    }

    const plotted = sellers
      .map((seller) => ({ seller, position: resolveLatLng(seller) }))
      .filter((s) => s.position) as { seller: any; position: LatLng }[];

    plotted.slice(0, MAX_MARKERS).forEach(({ seller, position }) => {
      const pin = new PinElement({
        background: seller.isConnected
          ? PIN_COLORS.connected
          : PIN_COLORS.seller,
        borderColor: "white",
        glyphColor: "white",
      });

      const marker = new AdvancedMarkerElement({
        map: mapRef.current,
        position,
        title: seller.name,
        content: pin.element,
      });

      marker.addListener("click", () => openInfoWindow(seller, marker));
      markersRef.current.push(marker);
    });

    if (sellers.length && !plotted.length) {
      console.warn(
        "Sellers map: no plottable coordinates on the response",
        sellers[0],
      );
    }

    // The pill counts what the map can actually show, not what came back.
    setCount(plotted.length);
    setSkipped(sellers.length - plotted.length);
  };

  // Reads the viewport the user just dragged into place and asks the API for
  // the sellers inside it.
  const fetchForViewport = async () => {
    const map = mapRef.current;
    const viewport = map?.getBounds?.();
    if (!viewport) return;

    const ne = viewport.getNorthEast();
    const sw = viewport.getSouthWest();
    const center = map.getCenter();

    const bounds: MapBounds = {
      northEast: { lat: ne.lat(), lng: ne.lng() },
      southWest: { lat: sw.lat(), lng: sw.lng() },
    };

    const reqId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getMapData(
        filterRef.current,
        bounds,
        { lat: center.lat(), lng: center.lng() },
        MAX_MARKERS,
      );
      if (reqId !== requestIdRef.current) return; // stale viewport
      renderSellers(data);
      setError(null);
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      console.error("Error loading sellers for map viewport", err);
      setError("Could not load sellers for this area.");
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  const scheduleFetch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchForViewport, REFETCH_DEBOUNCE_MS);
  };

  // Map is created once; pans, zooms and filter changes only refetch.
  useEffect(() => {
    let disposed = false;

    const initMap = async () => {
      try {
        await waitForGoogleMaps();
        if (disposed || !containerRef.current) return;

        const { Map, InfoWindow } = await google.maps.importLibrary("maps");
        markerLibRef.current = await google.maps.importLibrary("marker");
        if (disposed || !containerRef.current) return;

        const me = AuthService.getLoggedInUserLatLng();
        mapRef.current = new Map(containerRef.current, {
          center:
            me?.lat && me?.lng
              ? { lat: Number(me.lat), lng: Number(me.lng) }
              : FALLBACK_CENTER,
          zoom: DEFAULT_ZOOM,
          mapId: "SELLERS_MAP_ID",
          gestureHandling: "greedy",
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
        });
        infoWindowRef.current = new InfoWindow();

        // `idle` covers drag, zoom and the initial render — one hook for every
        // way the viewport can change.
        mapRef.current.addListener("idle", scheduleFetch);
      } catch (err) {
        console.error("Error initializing sellers map", err);
        if (!disposed) {
          setError("Map could not be loaded.");
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      disposed = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestIdRef.current++;
      clearMarkers();
      if (mapRef.current)
        google.maps.event?.clearInstanceListeners?.(mapRef.current);
      const root = infoRootRef.current;
      infoRootRef.current = null;
      // Unmount out of the commit phase — React forbids it synchronously here.
      if (root) setTimeout(() => root.unmount());
    };
  }, []);

  // Filter changes (search, alpha, chips) refetch the current viewport.
  const filterKey = JSON.stringify(filter);
  useEffect(() => {
    if (!mapRef.current) return;
    scheduleFetch();
  }, [filterKey]);

  return (
    <div className={clsx("tw:relative", className)}>
      <div
        className={clsx(
          "tw:w-full tw:rounded-xl tw:overflow-hidden tw:border tw:border-gray-200 tw:shadow-sm",
          height,
        )}
      >
        <div ref={containerRef} className="tw:w-full tw:h-full" />
      </div>

      {/* Status pill — viewport result count, or the in-flight indicator. */}
      <div className="tw:absolute tw:top-3 tw:left-3 tw:flex tw:items-center tw:gap-1.5 tw:bg-white tw:rounded-full tw:shadow tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-gray-700">
        {loading ? (
          <>
            <Loader2 className="tw:w-3.5 tw:h-3.5 tw:animate-spin" />
            Loading sellers…
          </>
        ) : (
          <>
            <MapPin className="tw:w-3.5 tw:h-3.5 tw:text-indigo-600" />
            {count} {count === 1 ? "seller" : "sellers"} in view
          </>
        )}
      </div>

      <div className="tw:absolute tw:bottom-3 tw:left-3 tw:flex tw:items-center tw:gap-3 tw:bg-white tw:rounded-full tw:shadow tw:px-3 tw:py-1.5">
        {[
          { color: PIN_COLORS.me, label: "My store" },
          { color: PIN_COLORS.connected, label: "Connected" },
          { color: PIN_COLORS.seller, label: "Seller" },
        ].map((item) => (
          <div key={item.label} className="tw:flex tw:items-center tw:gap-1.5">
            <span
              className="tw:w-2.5 tw:h-2.5 tw:rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="tw:text-[10px] tw:text-gray-600 tw:font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p className="tw:mt-2 tw:text-[11px] tw:text-amber-600 tw:font-medium">
          {error}
        </p>
      )}

      {!error && skipped > 0 && (
        <p className="tw:mt-2 tw:text-[11px] tw:text-amber-600 tw:font-medium">
          {skipped} seller{skipped > 1 ? "s" : ""} in this area could not be
          plotted — no location on their store profile.
        </p>
      )}
    </div>
  );
};

export default MapView;
