import React, { useEffect, useRef } from "react";

declare const google: any;

type LatLng = {
  lat: number;
  lng: number;
};

type Props = {
  origLat: number;
  origLng: number;
  destLat: number;
  destLng: number;
  className?: string;
  zoom?: number;
  mapTypeId?: "roadmap" | "satellite" | "hybrid" | "terrain";
  mapId?: string;
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

function GMapTwoPoint({
  origLat,
  origLng,
  destLat,
  destLng,
  className,
  zoom = 12,
  mapTypeId = "terrain",
  mapId = "DEMO_MAP_ID",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ origin?: any; destination?: any }>({});
  const boundsRef = useRef<any>(null);

  // Create origin and destination objects from individual lat/lng props
  const origin = { lat: origLat, lng: origLng };
  const destination = { lat: destLat, lng: destLng };

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        const { Map } = (await google.maps.importLibrary("maps")) as any;
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          "marker"
        )) as any;

        if (!isMounted || !mapContainerRef.current) return;

        mapRef.current = new Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom,
          mapTypeId,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          mapId: mapId,
        });

        // Create colored marker pins using built-in PinElement
        const { PinElement } = (await google.maps.importLibrary(
          "marker"
        )) as any;

        const originPin = new PinElement({
          background: "#16a34a", // green
          borderColor: "#15803d",
          glyphColor: "#ffffff",
        });

        const destinationPin = new PinElement({
          background: "#dc2626", // red
          borderColor: "#b91c1c",
          glyphColor: "#ffffff",
        });

        markersRef.current.origin = new AdvancedMarkerElement({
          map: mapRef.current,
          position: origin,
          content: originPin.element,
        });

        markersRef.current.destination = new AdvancedMarkerElement({
          map: mapRef.current,
          position: destination,
          content: destinationPin.element,
        });

        // Fit bounds to include both markers
        const { LatLngBounds } = (await google.maps.importLibrary(
          "core"
        )) as any;
        boundsRef.current = new LatLngBounds();
        boundsRef.current.extend(origin);
        boundsRef.current.extend(destination);
        mapRef.current.fitBounds(boundsRef.current, 48);
      } catch (err) {
        // fail silently to avoid breaking screens if maps is unavailable
        // console.error(err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      // Cleanup markers
      if (markersRef.current.origin) markersRef.current.origin.map = null;
      if (markersRef.current.destination)
        markersRef.current.destination.map = null;
    };
  }, [origLat, origLng, destLat, destLng, zoom]);

  // Update markers if props change after initial mount
  useEffect(() => {
    if (
      !mapRef.current ||
      !markersRef.current.origin ||
      !markersRef.current.destination
    )
      return;
    try {
      markersRef.current.origin.position = origin;
      markersRef.current.destination.position = destination;

      if (!boundsRef.current) {
        const { LatLngBounds } = (window as any).google?.maps as any;
        boundsRef.current = new (LatLngBounds as any)();
      } else {
        boundsRef.current = new (google.maps as any).LatLngBounds();
      }
      boundsRef.current.extend(origin);
      boundsRef.current.extend(destination);
      mapRef.current.fitBounds(boundsRef.current, 48);
    } catch (e) {
      // ignore
    }
  }, [origLat, origLng, destLat, destLng]);

  return (
    <div ref={mapContainerRef} className={className || "tw:w-full tw:h-80"} />
  );
}

export default GMapTwoPoint;
