import { useEffect, useRef } from "react";
import DateFormat from "~/components/core/date/DateFormat";
import { createRoot } from "react-dom/client";
import { AuthService } from "~/services/AuthService";

declare const google: any;

interface Customer {
  id?: string;
  _id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  town?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  linkedAt?: string;
  referenceType?: string;
}

const CustomersMapView = ({ users }: { users: Customer[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const initMap = async () => {
      try {
        const { Map, InfoWindow } = (await google.maps.importLibrary(
          "maps",
        )) as any;
        const { AdvancedMarkerElement, PinElement } =
          (await google.maps.importLibrary("marker")) as any;

        // Valid coordinates only
        const validUsers = users.filter((u) => u.latitude && u.longitude);

        const center =
          validUsers.length > 0
            ? {
                lat: Number(validUsers[0].latitude),
                lng: Number(validUsers[0].longitude),
              }
            : { lat: 12.9716, lng: 77.5946 };

        if (!mapObjRef.current && mapRef.current) {
          mapObjRef.current = new Map(mapRef.current, {
            center,
            zoom: 12,
            mapId: "CUSTOMERS_MAP_ID",
            disableDefaultUI: false,
            gestureHandling: "greedy",
          });
          infoWindowRef.current = new InfoWindow();
        }

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        let hasMarkers = false;

        const currentUserLocation = AuthService.getLoggedInUserLatLng();

        if (
          currentUserLocation &&
          currentUserLocation.lat &&
          currentUserLocation.lng
        ) {
          const currentPos = {
            lat: Number(currentUserLocation.lat),
            lng: Number(currentUserLocation.lng),
          };

          const pin = new PinElement({
            background: "#10b981", // Emerald color for logged in user store
            borderColor: "white",
            glyphColor: "white",
          });

          const userMarker = new AdvancedMarkerElement({
            map: mapObjRef.current,
            position: currentPos,
            title: "My Store",
            content: pin.element,
          });

          userMarker.addListener("click", () => {
            const content = document.createElement("div");
            content.className = "tw:p-2 tw:max-w-[250px]";
            const root = createRoot(content);
            root.render(
              <div className="tw:space-y-2">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <h3 className="tw:font-bold tw:text-sm tw:text-gray-900">
                    My Store
                  </h3>
                  <span className="tw:px-1 tw:py-0.5 tw:text-[8px] tw:font-bold tw:rounded tw:uppercase tw:tracking-wider tw:border tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-100">
                    Current Location
                  </span>
                </div>
              </div>,
            );
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(mapObjRef.current, userMarker);
          });

          markersRef.current.push(userMarker);
          bounds.extend(currentPos);
          hasMarkers = true;
        }

        validUsers.forEach((user) => {
          const position = {
            lat: Number(user.latitude),
            lng: Number(user.longitude),
          };

          const pinBackground =
            user.referenceType === "Franchise" ? "#4f46e5" : "#f59e0b";
          const pin = new PinElement({
            background: pinBackground,
            borderColor: "white",
            glyphColor: "white",
          });

          const marker = new AdvancedMarkerElement({
            map: mapObjRef.current,
            position,
            title: user.name,
            content: pin.element,
          });

          marker.addListener("click", () => {
            const content = document.createElement("div");
            content.className = "tw:p-2 tw:max-w-[250px]";

            const root = createRoot(content);
            root.render(
              <div className="tw:space-y-2">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <h3 className="tw:font-bold tw:text-sm tw:text-gray-900">
                    {user.name}
                  </h3>
                  <span
                    className={`tw:px-1 tw:py-0.5 tw:text-[8px] tw:font-bold tw:rounded tw:uppercase tw:tracking-wider tw:border ${
                      user.referenceType === "Franchise"
                        ? "tw:bg-indigo-50 tw:text-indigo-700 tw:border-indigo-100"
                        : "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-100"
                    }`}
                  >
                    {user.referenceType === "Franchise" ? "B2B" : "B2C"}
                  </span>
                </div>
                <div className="tw:text-[11px] tw:text-gray-600">
                  <p className="tw:font-medium">
                    {[user.town, user.city, user.district, user.state]
                      .filter(Boolean)
                      .join(", ")}
                    {user.pincode && ` (${user.pincode})`}
                    {!user.town &&
                      !user.city &&
                      !user.district &&
                      !user.state &&
                      !user.pincode &&
                      "Address not available"}
                  </p>
                </div>
                <div className="tw:text-[10px] tw:text-gray-400">
                  Linked on{" "}
                  <DateFormat
                    value={user.linkedAt || null}
                    formatStr="dd MMM yyyy"
                  />
                </div>
              </div>,
            );

            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(mapObjRef.current, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(position);
          hasMarkers = true;
        });

        if (hasMarkers && mapObjRef.current) {
          mapObjRef.current.fitBounds(bounds);
          // Don't zoom in too much if only one marker
          if (validUsers.length === 1) {
            mapObjRef.current.setZoom(15);
          }
        }
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    initMap();
  }, [users]);

  const usersWithoutCoords =
    users.length - users.filter((u) => u.latitude && u.longitude).length;

  return (
    <div className="tw:space-y-2">
      <div className="tw:flex tw:items-center tw:gap-4 tw:px-1 tw:pb-1">
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <div className="tw:w-3 tw:h-3 tw:rounded-full tw:bg-emerald-500 tw:shadow-sm"></div>
          <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
            My Store
          </span>
        </div>
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <div className="tw:w-3 tw:h-3 tw:rounded-full tw:bg-indigo-600 tw:shadow-sm"></div>
          <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
            B2B Customer
          </span>
        </div>
      </div>
      <div className="tw:w-full tw:h-[350px] tw:rounded-xl tw:overflow-hidden tw:border tw:border-gray-200 tw:shadow-sm">
        <div ref={mapRef} className="tw:w-full tw:h-full" />
      </div>
      {usersWithoutCoords > 0 && (
        <p className="tw:text-[10px] tw:text-amber-600 tw:font-medium tw:px-1">
          * {usersWithoutCoords} customer{usersWithoutCoords > 1 ? "s" : ""} not
          shown due to missing location coordinates.
        </p>
      )}
    </div>
  );
};

export default CustomersMapView;
