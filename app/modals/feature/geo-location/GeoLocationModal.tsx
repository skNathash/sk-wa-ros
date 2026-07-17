import AppButton from "~/components/core/button/AppButton";
import AppProgress from "~/components/core/progress/AppProgress";
import { X, MapPin, Search, Loader2 } from "lucide-react";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import { GOOGLE_MAP_KEY, IMG_PATH } from "~/constants";

import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import GMapAddrTownSelect from "./town-select/GMapAddrTownSelect";
import FranchiseService from "~/services/FranchiseService";
import useGeoLocation from "~/hooks/useGeoLocation";

const markerImg = document.createElement("img");
markerImg.src = IMG_PATH + "/images/map/pointer.png";

declare const google: any;

const defaultAddrVal = {
  lat: null,
  loc: "",
  lng: null,
  state: "",
  district: "",
  town: "",
  pincode: "",
};

type Props = {
  show: boolean;
  callback: (a: { action: string; address?: any }) => void;
  enableGeoLoc?: boolean;
  lat?: number;
  lng?: number;
  title?: string;
};

const mapOptions = {
  center: {
    lat: 12.9716,
    lng: 77.5946,
  },
  zoom: 18,
  mapId: "DEMO_MAP_ID",
  disableDefaultUI: true,
  gestureHandling: "greedy",
};

const getGeoLoc = async (type: string, params: any = {}) => {
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
};

function GMapLocModal({
  show,
  callback,
  enableGeoLoc = false,
  lat,
  lng,
  title = "Set Delivery Location",
}: Props) {
  const appToast = useAppToast();

  const { pickLocation } = useGeoLocation();

  const [address, setAddress] = useState<{
    lat: null | number;
    lng: null | number;
    loc: string;
    state: string;
    district: string;
    town: string;
    pincode: string;
  }>({ ...defaultAddrVal });

  const [list, setList] = useState<Array<any>>([]);

  const [showPopup, setShowPopup] = useState(false);

  const [loading, setLoading] = useState(false);

  const [showTownSelection, setShowTownSelect] = useState(false);

  const [searching, setSearching] = useState(false);

  // Toggle between searching by place name and entering raw lat/lng coordinates
  const [searchMode, setSearchMode] = useState<"search" | "latlng">("search");

  const [latLngInput, setLatLngInput] = useState("");

  const pincodesDataRef = useRef<Array<any>>([]);

  const mapRef = useRef<any>(null);

  const mapObjRef = useRef<any>(null);

  const markerObjRef = useRef<any>(null);

  // popupRef removed: suggestions are rendered inline

  const inpSearchRef = useRef<HTMLInputElement>(null);

  const prevLatLngRef = useRef({ lat: 0, lng: 0 });

  const init = useCallback(async (lat?: number, lng?: number) => {
    try {
      const { Map } = (await google.maps.importLibrary("maps")) as any;

      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        "marker",
      )) as any;

      if (lat && lng) {
        mapOptions.zoom = 18;
        mapOptions.center = {
          lat,
          lng,
        };
      }

      prevLatLngRef.current = mapOptions.center;

      mapObjRef.current = new Map(mapRef.current, mapOptions);

      markerObjRef.current = new AdvancedMarkerElement({
        map: mapObjRef.current,
        position: mapOptions.center,
        gmpDraggable: true,
        // content: markerImg
      });

      markerObjRef.current.addListener("dragend", async (e: any) => {
        const newLat =
          typeof e.latLng?.lat === "function" ? e.latLng.lat() : e.latLng.lat;
        const newLng =
          typeof e.latLng?.lng === "function" ? e.latLng.lng() : e.latLng.lng;
        prevLatLngRef.current = { lat: newLat, lng: newLng };
        await plotAddress(newLat, newLng);
      });

      mapObjRef.current.addListener("dragend", async () => {
        const t = mapObjRef.current.getCenter();
        const lat = t.lat();
        const lng = t.lng();
        prevLatLngRef.current = { lat, lng };
        markerObjRef.current.position = { lat, lng };
        await plotAddress(lat, lng);
      });

      mapObjRef.current.addListener("zoom_changed", () => {
        mapObjRef.current.setCenter(prevLatLngRef.current);
        mapObjRef.current.panTo(prevLatLngRef.current);
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    let t: any;
    if (show) {
      setAddress({ ...defaultAddrVal });
      setSearchMode("search");
      setLatLngInput("");
      setShowPopup(false);
      t = setTimeout(() => {
        if (lat && lng) {
          init(lat, lng);
          plotAddress(lat, lng);
          return;
        }

        if (enableGeoLoc) {
          pickLocation((r) => {
            if (r?.errMsg) {
              alert(r.errMsg);
            }
            if (r.lat && r.lng) {
              init(r.lat, r.lng);
              plotAddress(r.lat, r.lng);
            } else {
              init();
            }
          });
        } else {
          init();
        }
      }, 500);
    }
    return () => {
      clearTimeout(t);
    };
  }, [enableGeoLoc, init, lat, lng, pickLocation, show]);

  const plotAddress = async (lat: number, lng: number) => {
    setLoading(true);
    const r = await getGeoLoc("reverse", {
      lat,
      lng,
    });
    setLoading(false);
    let addr = { ...defaultAddrVal };
    if (r?.length > 0) {
      const a = r?.length > 0 ? r[0] : [];
      const t = CommonService.googleAddrCmpFormatter(a.address_components);
      addr = {
        lat: a?.geometry?.location?.lat || null,
        lng: a?.geometry?.location?.lng || null,
        loc: a?.formatted_address,
        ...t,
      };
      setAddress(addr);
    } else {
      setAddress(addr);
    }
    return addr;
  };

  const onAddressSearch = debounce(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v.length < 3) {
        setShowPopup(false);
        setSearching(false);
        return;
      }
      setSearching(true);
      const r = await CommonService.getGoogleMapPlaces(v);
      setSearching(false);
      setList(r.data);
      setShowPopup(true);
      if (inpSearchRef.current) {
        inpSearchRef.current.focus();
      }
    },
    800,
  );

  const closeMap = () => {
    callback({ action: "close" });
  };

  const onPopupDismiss = () => {
    setShowPopup(false);
  };

  const onAddressSelect = async (addr: any) => {
    const lat = addr.geometry.location.lat;
    const lng = addr.geometry.location.lng;

    if (!lat || !lng) {
      appToast.show({
        msg: "Location information not found",
        color: "danger",
      });
      return;
    }

    setLoading(true);

    const r = await getGeoLoc("reverse", {
      lat,
      lng,
    });

    setLoading(false);

    setShowPopup(false);

    if (r.length > 0) {
      const a = r?.length > 0 ? r[0] : [];
      const t = CommonService.googleAddrCmpFormatter(a.address_components);
      setAddress({
        lat,
        lng,
        loc: a?.formatted_address,
        ...t,
      });

      mapObjRef.current.setCenter({ lng, lat });

      mapObjRef.current.panTo({ lat, lng });

      markerObjRef.current.position = { lat, lng };

      prevLatLngRef.current = { lat, lng };

      if (inpSearchRef.current) {
        inpSearchRef.current.value = "";
      }
    } else {
      appToast.show({
        msg: "Location information not found",
        color: "danger",
      });
    }
  };

  const triggerCb = useCallback(
    (pincodeData: any) => {
      callback({
        action: "submit",
        address: {
          ...address,
          town: pincodeData.town,
          district: pincodeData.district,
          state: pincodeData.state,
        },
      });
    },
    [address, callback],
  );

  const setLocation = async () => {
    const a = address;

    if (!a.loc) {
      appToast.show({
        msg: "Please search or choose location to proceed",
        color: "danger",
      });
      return;
    }

    // fetch pincode details
    if (a.pincode) {
      const r = await FranchiseService.getAddressOnPincode(a.pincode);
      const d = Array.isArray(r.data) ? r.data : [];
      if (d.length > 0) {
        triggerCb(d[0]);
      } else {
        // no pincode data found - fallback to using the lat/lng
        // appToast.show({
        //   msg: "Pincode lookup failed — using selected location coordinates",
        //   color: "warning",
        // });

        callback({
          action: "submit",
          address: {
            ...a,
          },
        });
      }
    } else {
      // no pincode available — use the lat/lng from the Google-provided address
      // appToast.show({
      //   msg: "Pincode not available — using selected location coordinates",
      // });

      callback({
        action: "submit",
        address: {
          ...a,
        },
      });
    }
  };

  const townSelectCb = useCallback(
    (e: any) => {
      if (e.action == "selected") {
        triggerCb(e.data);
      }
      setShowTownSelect(false);
    },
    [triggerCb],
  );

  // Parse a "lat, lng" string, recenter the map/marker and reverse-geocode it
  const goToLatLng = async () => {
    const parts = latLngInput.split(",").map((s) => s.trim());

    if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
      appToast.show({
        msg: "Enter latitude and longitude separated by a comma",
        color: "danger",
      });
      return;
    }

    const lat = Number(parts[0]);
    const lng = Number(parts[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      appToast.show({
        msg: "Invalid coordinates. Use format: 12.9716, 77.5946",
        color: "danger",
      });
      return;
    }

    const inLatRange = (n: number) => n >= -90 && n <= 90;
    const inLngRange = (n: number) => n >= -180 && n <= 180;

    // Detect a reversed lng, lat entry: the first value can't be a latitude
    // (>90) but works as a longitude, and the second value is a valid latitude.
    if (!inLatRange(lat) && inLngRange(lat) && inLatRange(lng)) {
      appToast.show({
        msg: "Coordinates look reversed. Enter as latitude, longitude: 12.9716, 77.5946",
        color: "danger",
      });
      return;
    }

    if (!inLatRange(lat) || !inLngRange(lng)) {
      appToast.show({
        msg: "Invalid coordinates. Use format: 12.9716, 77.5946",
        color: "danger",
      });
      return;
    }

    if (!mapObjRef.current) {
      await init(lat, lng);
    } else {
      mapObjRef.current.setCenter({ lat, lng });
      mapObjRef.current.panTo({ lat, lng });
      markerObjRef.current.position = { lat, lng };
    }

    prevLatLngRef.current = { lat, lng };
    await plotAddress(lat, lng);
  };

  const onPickCurrentLocation = () => {
    pickLocation((r) => {
      if (r?.errMsg) {
        appToast.show({
          msg: r.errMsg,
          color: "danger",
        });
        return;
      }
      if (r.lat && r.lng) {
        mapObjRef.current?.setCenter({ lat: r.lat, lng: r.lng });
        mapObjRef.current?.panTo({ lat: r.lat, lng: r.lng });
        markerObjRef.current.position = { lat: r.lat, lng: r.lng };
        prevLatLngRef.current = { lat: r.lat, lng: r.lng };
        plotAddress(r.lat, r.lng);
      }
    });
  };

  return (
    <>
      <AppModal
        show={show}
        callback={callback}
        className="tw:h-[90vh]"
        disableSwipe={true}
      >
        <AppModal.Title onClose={closeMap}>
          <div className="tw:font-semibold">{title}</div>
        </AppModal.Title>
        <AppModal.Content className="tw:max-h-[90vh] tw:!p-0 tw:!overflow-hidden">
          <div>
            {/* Mode toggle: search by place name vs. enter raw coordinates */}
            <div className="tw:flex tw:items-center tw:gap-4 tw:mb-3 tw:text-sm">
              <label className="tw:flex tw:items-center tw:gap-1.5 tw:cursor-pointer">
                <input
                  type="radio"
                  name="geoSearchMode"
                  value="search"
                  checked={searchMode === "search"}
                  onChange={() => {
                    setSearchMode("search");
                    setShowPopup(false);
                  }}
                />
                <span>Search</span>
              </label>
              <label className="tw:flex tw:items-center tw:gap-1.5 tw:cursor-pointer">
                <input
                  type="radio"
                  name="geoSearchMode"
                  value="latlng"
                  checked={searchMode === "latlng"}
                  onChange={() => {
                    setSearchMode("latlng");
                    setShowPopup(false);
                  }}
                />
                <span>Lat, Lng</span>
              </label>
            </div>

            {searchMode === "search" ? (
              <div className="tw:relative tw:mb-4">
                <Search className="tw:absolute tw:left-3 tw:top-2 tw:text-2xl" />
                <input
                  className="tw:w-full tw:bottom-1 tw:h-10 tw:bg-white tw:shadow tw:p-2 tw:outline-none tw:rounded-full tw:ps-12 tw:pe-20 tw:border tw:border-gray-200"
                  placeholder="Search"
                  onChange={onAddressSearch}
                  ref={inpSearchRef}
                />

                {searching || loading ? (
                  <Loader2 className="tw:absolute tw:right-4 tw:top-1 tw:text-xl tw:animate-spin" />
                ) : (
                  <button
                    className="tw:absolute tw:right-2 tw:top-1 tw:text-xl tw:p-1 tw:hover:bg-gray-100 tw:rounded-full tw:cursor-pointer"
                    onClick={onPickCurrentLocation}
                    title="Use current location"
                  >
                    <MapPin className="tw:text-gray-600" />
                  </button>
                )}

                {/* suggestions dropdown (replaces IonPopover) */}
                {showPopup ? (
                  <div className="tw:absolute tw:left-0 tw:right-0 tw:mt-2 tw:bg-white tw:rounded tw:shadow tw:z-50">
                    {!loading && !list.length ? (
                      <div className="tw:text-center tw:text-sm tw:p-4">
                        No results found
                      </div>
                    ) : null}

                    {list.map((x, k) => (
                      <div
                        className="tw:border-b tw:text-sm tw:px-4 tw:py-2 tw:cursor-pointer"
                        key={k}
                        onClick={() => onAddressSelect(x)}
                      >
                        <div className="tw:font-medium tw:mb-1">{x.name}</div>
                        <div>{x.formatted_address}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="tw:relative tw:mb-4 tw:flex tw:items-center tw:gap-2">
                <div className="tw:relative tw:flex-1">
                  <MapPin className="tw:absolute tw:left-3 tw:top-2 tw:text-2xl tw:text-gray-600" />
                  <input
                    className="tw:w-full tw:h-10 tw:bg-white tw:shadow tw:p-2 tw:outline-none tw:rounded-full tw:ps-12 tw:pe-4 tw:border tw:border-gray-200"
                    placeholder="e.g. 12.9716, 77.5946"
                    value={latLngInput}
                    onChange={(e) => setLatLngInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        goToLatLng();
                      }
                    }}
                  />
                </div>
                <AppButton
                  onClick={goToLatLng}
                  color="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="tw:text-xl tw:animate-spin" />
                  ) : (
                    "Go"
                  )}
                </AppButton>
              </div>
            )}
          </div>

          <div className="tw:h-96" ref={mapRef}></div>
        </AppModal.Content>
        {address?.loc ? (
          <AppModal.Footer>
            <div className="tw:w-full tw:flex-col tw:gap-2">
              <div className="tw:font-semibold tw:mb-1 tw:text-sm">
                Address Details:
              </div>
              <div className="tw:text-sm tw:flex-1">{address.loc}</div>
              <div className="tw:text-right">
                <AppButton onClick={setLocation} color="primary">
                  Continue
                </AppButton>
              </div>
            </div>
          </AppModal.Footer>
        ) : null}
      </AppModal>

      {/* town selection for multiple pincode */}
      <GMapAddrTownSelect
        show={showTownSelection}
        callback={townSelectCb}
        data={pincodesDataRef.current}
      />
    </>
  );
}

export default GMapLocModal;
