import { useEffect, useState } from "react";
import { useRevalidator, useRouteLoaderData } from "react-router";
import PageLoader from "~/components/core/page-loader/PageLoader";
import CustomerUpdateModal from "~/shared/users/modals/customer-update/CustomerUpdateModal";
import BasicInfo from "./components/BasicInfo";
import RecentActivity from "./components/RecentActivity";

export default function Overview() {
  const loadedData = useRouteLoaderData(
    "routes/dashboard/network/view/b2c/layout",
  ) as any;
  const revalidator = useRevalidator();

  const [user, setUser] = useState<any | null>(null);
  const [activities, setActivities] = useState<Array<any>>([]);
  const [updateModal, setUpdateModal] = useState<{
    show: boolean;
    inputs: string[];
  }>({ show: false, inputs: [] });

  useEffect(() => {
    if (loadedData) {
      const payload =
        loadedData && loadedData.data ? loadedData.data : loadedData;

      const addrObj = payload?.address;
      const address = addrObj
        ? [
            addrObj.street,
            addrObj.city,
            addrObj.district,
            addrObj.state,
            addrObj.postcode,
          ]
            .filter(Boolean)
            .join(", ")
        : payload?.address || payload?.location || null;

      setUser({
        _id: payload?._id,
        name: payload?.name ?? null,
        email: payload?.email ?? null,
        mobile: payload?.mobile ?? null,
        age: payload?.age ?? null,
        gender: payload?.gender ?? null,
        dob: payload?.dob ?? null,
        maritalStatus: payload?.maritalStatus ?? null,
        monthlyShoppingExpenses: payload?.monthlyShoppingExpenses ?? null,
        registeredOn: payload?.dateOfRegistration ?? null,
        registeredStore: payload?.franchiseInfo?.name ?? null,
        address,
      });

      setActivities(
        Array.isArray(payload?.activities) ? payload.activities : [],
      );
    }
  }, [loadedData]);

  const handleEdit = (fields: string[]) => {
    setUpdateModal({ show: true, inputs: fields });
  };

  const handleUpdateCallback = (result: { action: string; data?: any }) => {
    setUpdateModal({ show: false, inputs: [] });
    if (result.action === "success") {
      revalidator.revalidate();
    }
  };

  if (!loadedData || !user) {
    return <PageLoader />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <div>
          <BasicInfo
            name={user.name}
            email={user.email}
            mobile={user.mobile}
            age={user.age}
            gender={user.gender}
            dob={user.dob}
            maritalStatus={user.maritalStatus}
            monthlyShoppingExpenses={user.monthlyShoppingExpenses}
            registeredOn={user.registeredOn}
            registeredStore={user.registeredStore}
            address={user.address}
            onEdit={handleEdit}
          />
        </div>
        <div className="md:tw:col-span-1">
          <RecentActivity activities={activities} />
        </div>
      </div>

      {user._id && (
        <CustomerUpdateModal
          cid={user._id}
          show={updateModal.show}
          inputs={updateModal.inputs}
          callback={handleUpdateCallback}
        />
      )}
    </>
  );
}
