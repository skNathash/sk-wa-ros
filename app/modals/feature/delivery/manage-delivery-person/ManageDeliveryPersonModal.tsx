import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppTab from "~/components/core/tab/AppTab";
import Personal from "./components/Personal";
import Address from "./components/Address";
import Vehicle from "./components/Vehicle";
import type { TabItem } from "~/types/CommonTypes";

interface ManageDeliveryPersonModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  deliveryPerson?: any; // For editing existing delivery person
}

interface FormData {
  // Personal Information
  fullName: string;
  email: string;
  phoneNumber: string;
  licenseNo: string;
  status: string;

  // Address Information
  street: string;
  pincode: string;

  // KYC Information
  idProofType: string;
  idProofNumber: string;
  addressProofType: string;
  addressProofNumber: string;
  verificationStatus: string;
  backgroundCheckCompleted: boolean;

  // Vehicle Information
  hasOwnVehicle: boolean;
  vehicleNo: string;
  vehicleType: string;
  capacity: string;
}

const ManageDeliveryPersonModal: React.FC<ManageDeliveryPersonModalProps> = ({
  show,
  callback,
  deliveryPerson,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const tabs: TabItem[] = [
    { name: "Personal", key: "personal", icon: "User" },
    { name: "Address & KYC", key: "address-kyc", icon: "MapPin" },
    { name: "Vehicle", key: "vehicle", icon: "Car" },
  ];

  const formMethods = useForm<FormData>({
    defaultValues: {
      fullName: deliveryPerson?.fullName || "",
      email: deliveryPerson?.email || "",
      phoneNumber: deliveryPerson?.phoneNumber || "",
      licenseNo: deliveryPerson?.licenseNo || "",
      status: deliveryPerson?.status || "active",
      street: deliveryPerson?.street || "",
      pincode: deliveryPerson?.pincode || "",
      idProofType: deliveryPerson?.idProofType || "",
      idProofNumber: deliveryPerson?.idProofNumber || "",
      addressProofType: deliveryPerson?.addressProofType || "",
      addressProofNumber: deliveryPerson?.addressProofNumber || "",
      verificationStatus: deliveryPerson?.verificationStatus || "pending",
      backgroundCheckCompleted:
        deliveryPerson?.backgroundCheckCompleted || false,
      hasOwnVehicle: deliveryPerson?.hasOwnVehicle || false,
      vehicleNo: deliveryPerson?.vehicleNo || "",
      vehicleType: deliveryPerson?.vehicleType || "",
      capacity: deliveryPerson?.capacity || "",
    },
  });

  const handleClose = () => {
    callback({ action: "close" });
    formMethods.reset();
    setActiveTab("personal");
  };

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const handleSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      // Here you would typically make an API call to save the delivery person

      callback({
        action: "submit",
        data: {
          ...data,
          id: deliveryPerson?.id, // Include ID if editing
        },
      });

      formMethods.reset();
    } catch (error) {
      console.error("Error saving delivery person:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-2xl">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {deliveryPerson ? "Edit Delivery Person" : "Add New Delivery Person"}
        </div>
        <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
          Manage personnel details, KYC, and vehicle information.
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <FormProvider {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(handleSubmit)}
            className="tw:space-y-6"
          >
            {/* Tabs */}
            <AppTab
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant="tabs"
              className="tw:mb-6"
            />

            {/* Tab Content */}
            {activeTab === "personal" && <Personal />}
            {activeTab === "address-kyc" && (
              <div className="tw:space-y-6">
                <Address />
              </div>
            )}
            {activeTab === "vehicle" && <Vehicle />}
          </form>
        </FormProvider>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            color="light"
            fill="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </AppButton>
          <AppButton
            color="primary"
            onClick={formMethods.handleSubmit(handleSubmit)}
            isLoading={submitting}
          >
            {submitting ? "Saving..." : deliveryPerson ? "Update" : "Save"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ManageDeliveryPersonModal;
