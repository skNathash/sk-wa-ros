import { useCallback, useRef } from "react";
import { GOOGLE_MAP_KEY } from "~/constants";
import CommonService from "~/services/CommonService";

type Callback = {
  lat: number | null;
  lng: number | null;
  errMsg?: string;
  loc?: string;
  state?: string;
  district?: string;
  town?: string;
  pincode?: string;
};

function handleLocationError(browserHasGeolocation: boolean) {
  return {
    msg: browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.",
  };
}

async function getGeoCode(type: string, params: any = {}) {
  try {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${GOOGLE_MAP_KEY}&fields=formatted_address,geometry`;

    if (type == "reverse") {
      url += "&latlng=" + params.lat + "," + params.lng;
    } else {
      url += "&address=" + encodeURI(params.search);
    }
    const r = await fetch(url);
    const d = await r.json();
    return d.results || [];
  } catch (error) {
    return [];
  }
}

function useGeoLocation() {
  const cpCodeRef = useRef("");

  const pickLocation = useCallback(
    (callback: (a: Callback) => void, geocode = false) => {
      const fetchGeoCode = async (pos: { lat: number; lng: number }) => {
        const r = await getGeoCode("reverse", pos);
        const a = r?.length > 0 ? r[0] : [];
        const t = CommonService.googleAddrCmpFormatter(a.address_components);
        callback({
          lat: a?.geometry?.location?.lat || null,
          lng: a?.geometry?.location?.lng || null,
          loc: a?.formatted_address,
          ...t,
        });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position: GeolocationPosition) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (geocode) {
              fetchGeoCode(pos);
            } else {
              callback({ lat: pos.lat, lng: pos.lng });
            }
          },
          () => {
            callback({
              lat: null,
              lng: null,
              errMsg: handleLocationError(true).msg,
            });
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 27000,
          }
        );
      } else {
        callback({
          lat: null,
          lng: null,
          errMsg: handleLocationError(false).msg,
        });
      }
    },
    []
  );

  return { pickLocation };
}

export default useGeoLocation;
