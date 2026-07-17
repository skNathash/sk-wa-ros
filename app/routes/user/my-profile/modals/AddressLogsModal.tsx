import React, { useState, useCallback, useRef } from "react";
// removed i18n translation usage
import type { SwiperOptions } from "swiper/types";
import type Swiper from "swiper";
import AppModal from "~/components/core/modal/AppModal";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import StaticGMap from "~/components/core/map/StaticGMap";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";

interface AddressLog {
  comment?: string;
  createdAt: string;
  createdById: string;
  createdByName: string;
  createdByType: string;
  status: string;
  type: string;
  value: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    geoLocation?: {
      type: string;
      coordinates: number[];
    };
    latitude?: number;
    longitude?: number;
    pincode: string;
    state: string;
  };
  _id: string;
}

interface AddressLogsModalProps {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  addresses: AddressLog[];
}

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 16,
};

const AddressLogsModal: React.FC<AddressLogsModalProps> = ({
  show,
  callback,
  addresses = [],
}) => {
  // translation removed — using plain strings

  const [selectedIndex, setSelectedIndex] = useState(0);

  const swiperRef = useRef<Swiper | null>(null);

  const handleSlideClick = useCallback((index: number) => {
    setSelectedIndex(index);
    if (swiperRef.current) {
      try {
        swiperRef.current.slideTo(index);
      } catch (e) {
        // ignore
      }
    }
  }, []);
  const handleClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const onSwiperCallback = useCallback(
    (data: { swiper: Swiper; action: "init" | "slideChange" }) => {
      if (!data || !data.swiper) return;

      if (data.action === "init") {
        swiperRef.current = data.swiper;
      }

      if (data.action === "slideChange") {
        setSelectedIndex(data.swiper.activeIndex || 0);
      }
    },
    [],
  );

  const selectedAddress = addresses[selectedIndex] || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose} noShadow>
        Address Update History
      </AppModal.Title>

      <AppModal.Content className="tw:space-y-4 modal-bg tw:h-[90vh]">
        {addresses.length === 0 ? (
          <div className="tw:text-center tw:py-8 tw:text-gray-500">
            No address history available
          </div>
        ) : (
          <>
            {/* Swiper for versions */}
            <div className="tw:mb-3">
              <AppSwiper config={swiperConfig} callback={onSwiperCallback}>
                {addresses.map((address, index) => {
                  const isActive = index === selectedIndex;
                  const slideClass = `tw:text-center tw:py-2 tw:px-3 tw:rounded-lg tw:cursor-pointer ${
                    isActive
                      ? "tw:bg-blue-500 tw:text-white tw:shadow"
                      : "tw:bg-gray-50 tw:text-gray-700"
                  }`;

                  return (
                    <AppSwiper.Slide key={address._id} isAutoWidth>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSlideClick(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleSlideClick(index);
                          }
                        }}
                        className={slideClass}
                      >
                        <div
                          className={`tw:text-sm tw:font-semibold ${isActive ? "tw:text-white" : "tw:text-gray-700"}`}
                        >
                          Version {addresses.length - index}
                        </div>
                        <div
                          className={`tw:text-xs ${isActive ? "tw:text-white/90" : "tw:text-gray-500"} tw:mt-0.5`}
                        >
                          <DateFormat
                            value={address.createdAt}
                            formatStr="PPp"
                          />
                        </div>
                      </div>
                    </AppSwiper.Slide>
                  );
                })}
              </AppSwiper>
            </div>

            {/* Selected Address Details */}
            {selectedAddress && (
              <div className="tw:space-y-4">
                {/* Status Card */}
                <AppCard title="Status">
                  <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                    <div>
                      <KeyValue label="Status" size="sm">
                        <AppBadge
                          variant={getStatusColor(selectedAddress.status)}
                        >
                          {selectedAddress.status}
                        </AppBadge>
                      </KeyValue>
                    </div>

                    <div>
                      <KeyValue label="Submitted On" size="sm">
                        <DateFormat
                          value={selectedAddress.createdAt}
                          formatStr="PPp"
                        />
                      </KeyValue>
                    </div>

                    {selectedAddress.comment && (
                      <div className="tw:col-span-2">
                        <KeyValue label="Comment" size="sm">
                          {selectedAddress.comment}
                        </KeyValue>
                      </div>
                    )}
                  </div>
                </AppCard>

                {/* Address Card */}
                <AppCard title="Address">
                  <div className="tw:space-y-2">
                    <KeyValue label="Address Line 1" size="sm">
                      {selectedAddress.value.addressLine1 || "--"}
                    </KeyValue>

                    {selectedAddress.value.addressLine2 && (
                      <KeyValue label="Address Line 2" size="sm">
                        {selectedAddress.value.addressLine2}
                      </KeyValue>
                    )}

                    <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                      <KeyValue label="City" size="sm">
                        {selectedAddress.value.city || "--"}
                      </KeyValue>

                      <KeyValue label="District" size="sm">
                        {selectedAddress.value.district || "--"}
                      </KeyValue>

                      <KeyValue label="State" size="sm">
                        {selectedAddress.value.state || "--"}
                      </KeyValue>

                      <KeyValue label="Pincode" size="sm">
                        {selectedAddress.value.pincode || "--"}
                      </KeyValue>
                    </div>

                    {(selectedAddress.value.latitude ||
                      selectedAddress.value.longitude) && (
                      <KeyValue label="Coordinates" size="sm">
                        {selectedAddress.value.latitude},{" "}
                        {selectedAddress.value.longitude}
                      </KeyValue>
                    )}
                  </div>
                </AppCard>

                {/* Static Map Card */}
                {selectedAddress.value.latitude &&
                  selectedAddress.value.longitude && (
                    <AppCard title="Location on Map">
                      <div className="tw:h-64 tw:rounded-lg tw:overflow-hidden">
                        <StaticGMap
                          lat={selectedAddress.value.latitude}
                          lng={selectedAddress.value.longitude}
                          className="tw:w-full tw:h-full"
                        />
                      </div>
                    </AppCard>
                  )}
              </div>
            )}
          </>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default AddressLogsModal;
