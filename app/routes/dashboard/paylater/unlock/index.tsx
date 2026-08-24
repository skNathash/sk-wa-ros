import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Store, UserPlus, Users } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import PaylaterKycModal from "~/shared/accounts/paylater/kyc-form/PaylaterKycModal";
import {
  buildKycPrefill,
  buildPaylaterKycPayload,
  fetchPaylaterUserDetails,
} from "~/shared/accounts/paylater/kyc-form/helper";
import type { TabItem } from "~/types/CommonTypes";
import type { UserItem, UserType } from "./helper";
import UserSelectModal from "./modals/user-select/UserSelectModal";
import UnlockView from "./components/UnlockView";
import SuccessModal from "../assign/modals/SuccessModal";

const TABS: TabItem[] = [
  { name: "B2C Customers", key: "b2c", langKey: "b2c", icon: <Users size={18} /> },
  { name: "B2B Retailers", key: "b2b", langKey: "b2b", icon: <Store size={18} /> },
];

const PaylaterUnlockPage = () => {
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  // theme-2 reads sub-navs as free-standing pills; the other themes keep the
  // segmented bar (same split as the barcode scan sub-nav).
  const isTheme2 = useTheme() === "theme-2";
  const [searchParams, setSearchParams] = useSearchParams();

  const type = (searchParams.get("type") || "b2c") as UserType;
  const activeTab = type;
  const isManpower = AuthService.isManpowerLoggedIn();
  // Once a user is picked the page is about that user, and the B2C/B2B switch
  // would just throw the selection away — the "Change" action on the customer
  // block is the way back out.
  const userId = searchParams.get("userId");
  const hasUser = !!userId;

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  // Raw profile behind the selection — what the shared payload builder reads
  // when the seller unlocks without opening the KYC form.
  const [userDetails, setUserDetails] = useState<Record<string, any> | null>(
    null,
  );
  const [showUserModal, setShowUserModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  // Limit the seller picked, held while the confirmation dialog is open — the
  // request only goes out once it is confirmed.
  const [pendingLimit, setPendingLimit] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  // KYC captured in the modal (data mode) — merged into the unlock payload
  // instead of being submitted as its own request.
  const [kycPayload, setKycPayload] = useState<Record<string, any> | null>(null);

  // Sync URL when tab changes.
  const handleTabChange = (tab: TabItem) => {
    const nextType = tab.key as UserType;
    setSearchParams({ type: nextType });
    setSelectedUser(null);
    setKycPayload(null);
  };

  // If a user id is passed in the URL, load its profile — the same details
  // call the assign flow makes, so both flows read one shape and the unlock
  // payload can be handed to the shared KYC builder below.
  useEffect(() => {
    if (!userId) {
      setSelectedUser(null);
      setUserDetails(null);
      setInitialLoading(false);
      return;
    }

    let mounted = true;
    // The page loader only belongs on a cold load (deep link with ?userId=,
    // nothing on screen yet). A pick from the modal already has the list row's
    // data rendered, so its profile fetch refreshes in place instead of
    // blanking the page for a couple of seconds.
    const isColdLoad = !selectedUser;
    if (isColdLoad) setInitialLoading(true);
    const fetchUser = async () => {
      try {
        const raw = await fetchPaylaterUserDetails(userId, type);
        if (mounted && raw) {
          setUserDetails(raw);
          // The profile response carries identity, not the network stats the
          // list row derived (bills, avg bill, reliability) — keep whatever the
          // picker already handed over so the score panel doesn't reset to 0.
          setSelectedUser((prev) => ({
            ...prev,
            ...raw,
            id: raw._id || raw.id,
            name: raw.name || raw.ownerDetails?.name || prev?.name,
            mobile: raw.mobile || prev?.mobile,
            initials: prev?.initials,
            bills: prev?.bills,
            avgBillValue: prev?.avgBillValue,
            fulfillmentRate: prev?.fulfillmentRate,
            suggestedLimit: prev?.suggestedLimit,
          }));
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };
    fetchUser();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type]);

  const handleSelectUser = useCallback((user: UserItem) => {
    setSelectedUser(user);
    // A different user means the captured KYC no longer applies.
    setKycPayload(null);
    // Persist selection in URL so a refresh keeps the context.
    setSearchParams((prev) => {
      prev.set("userId", user.id || user._id || "");
      return prev;
    });
  }, [setSearchParams]);

  // Changing the user drops the current selection out of the URL as well as
  // state, so the B2C/B2B switch comes back with the picker — otherwise the
  // seller is stuck picking within the type they arrived on.
  const handleChangeUser = () => {
    setSearchParams((prev) => {
      prev.delete("userId");
      return prev;
    });
    setSelectedUser(null);
    setKycPayload(null);
    setShowUserModal(true);
  };

  const handleUpdateKyc = () => {
    if (!selectedUser) return;
    setShowKycModal(true);
  };

  // Granting credit is not undoable from here, so the limit is parked and the
  // dialog asks before anything is posted.
  const handleUnlock = (limit: number) => {
    if (!selectedUser) return;
    setPendingLimit(limit);
  };

  const submitUnlock = async () => {
    if (!selectedUser || pendingLimit === null) return;
    const limit = pendingLimit;
    setPendingLimit(null);

    setUnlocking(true);
    try {
      // Same payload the assign flow sends. KYC captured in this session
      // already went through the shared builder (address, documents,
      // nominees); without it, build the same shape from whatever the profile
      // already knows, so the two flows never post different bodies to the
      // same endpoint. The limit is chosen after KYC, so it lands last.
      const payload = {
        ...(kycPayload ||
          buildPaylaterKycPayload(
            selectedUser,
            type,
            buildKycPrefill(userDetails, type).values,
          )),
        approvedLimit: limit,
        kycStatus: "Approved",
      };
      // Manpower can't grant credit itself — it raises a request for approval,
      // exactly as the assign flow does.
      const resp: any = isManpower
        ? await PaylaterService.createRequest(payload)
        : await PaylaterService.enablePaylater(type, payload);

      if (resp?.statusCode === 200) {
        setShowSuccessModal(true);
      } else {
        appToast.show({
          msg:
            resp?.data?.message ||
            (isManpower
              ? "Failed to create PayLater request"
              : "Failed to unlock PayLater"),
          color: "danger",
        });
      }
    } catch {
      appToast.show({
        msg: "Something went wrong. Please try again.",
        color: "danger",
      });
    } finally {
      setUnlocking(false);
    }
  };

  // Data mode — the modal hands the captured KYC back instead of submitting it,
  // so it rides along with the unlock request.
  const handleKycSubmit = (payload: Record<string, any>) => {
    setKycPayload(payload);
    appToast.show({ msg: "KYC captured", color: "success" });
  };

  return (
    <div className="tw:space-y-4">
      <BusyLoader show={initialLoading} message="Loading user details..." />
      {/* Sub-nav, same split as the barcode scan tabs: a chip strip on mobile
          and the pill row (theme-2) / segmented bar (other themes) from md up.
          Only one of the two is visible at a time — and neither once a user is
          selected. */}
      {!hasUser && (
        <>
          <AppTab
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="pills"
            // The PayLater layout already pins its own chip band under the
            // header, so this strip pins below that one
            // (`app-nav-chips-under-tabs`).
            className="app-nav-chips app-nav-chips-under-tabs tw:mb-2 tw:md:hidden"
            // Mobile only: the band drops its side padding so the pills scroll
            // edge to edge; the swiper supplies the inset.
            slideOffset={isMobile ? 16 : 0}
          />
          <AppTab
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant={isTheme2 ? "pills" : "tabs"}
            compact={!isTheme2}
            // theme-2 takes the shared pill band (`barcode-tabs-pills`) — the
            // same white, gutter-bleeding strip the barcode scan and wallet
            // sub-navs use, so the row reads as its own sheet instead of
            // floating on the page-bg.
            className={`tw:hidden tw:md:block tw:mb-4 ${
              isTheme2 ? "barcode-tabs-pills" : ""
            }`}
          />
        </>
      )}

      {/* On a cold load the profile is still in flight behind the busy loader,
          so the "no user selected" card would flash before the view swaps in —
          it comes back if that fetch fails and leaves nothing to show. */}
      {!selectedUser && initialLoading ? null : !selectedUser ? (
        <AppCard
          noPadding
          bodyClassName="tw:p-8 tw:text-center"
          className="tw:border-dashed"
        >
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3">
            <div className="tw:w-14 tw:h-14 tw:rounded-full tw:bg-violet-50 tw:flex tw:items-center tw:justify-center tw:text-violet-600">
              <UserPlus size={28} />
            </div>
            <h3 className="tw:text-base tw:font-semibold tw:text-gray-800">
              No user selected
            </h3>
            <p className="tw:text-sm tw:text-gray-500 tw:max-w-sm">
              Select a {type === "b2c" ? "B2C customer" : "B2B retailer"} from
              your network to view their unlock details and assign a PayLater
              limit.
            </p>
            <AppButton
              color="primary"
              onClick={() => setShowUserModal(true)}
              className="tw:mt-2"
            >
              Select {type === "b2c" ? "Customer" : "Retailer"}
            </AppButton>
          </div>
        </AppCard>
      ) : (
        <UnlockView
          user={selectedUser}
          type={type}
          onUpdateKyc={handleUpdateKyc}
          onChangeUser={handleChangeUser}
          onUnlock={handleUnlock}
          loading={unlocking}
          kycCaptured={!!kycPayload}
        />
      )}

      <AppAlertDialog
        show={pendingLimit !== null}
        title={isManpower ? "Confirm PayLater Request" : "Confirm PayLater Unlock"}
        description={
          isManpower
            ? `Raise a PayLater request of ₹${(pendingLimit || 0).toLocaleString("en-IN")} for ${selectedUser?.name || "this user"}? It goes to your approver for review.`
            : `Unlock PayLater with a limit of ₹${(pendingLimit || 0).toLocaleString("en-IN")} for ${selectedUser?.name || "this user"}?`
        }
        okText={isManpower ? "Raise Request" : "Unlock"}
        onConfirm={submitUnlock}
        onCancel={() => setPendingLimit(null)}
      />

      <UserSelectModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
        type={type}
        onSelect={handleSelectUser}
      />

      {selectedUser && (
        <PaylaterKycModal
          show={showKycModal}
          onClose={() => setShowKycModal(false)}
          user={{
            _id: selectedUser._id || selectedUser.id,
            id: selectedUser._id || selectedUser.id,
            // The modal builds the whole unlock payload in data mode, so it
            // needs the identity fields the request carries too.
            userId: selectedUser.userId || selectedUser._id || selectedUser.id,
            subType: selectedUser.subType,
            email: selectedUser.email,
            name: selectedUser.name,
            mobile: selectedUser.mobile,
            franchiseId: selectedUser.franchiseId,
            refNo: selectedUser.refNo,
            initials: selectedUser.initials,
          }}
          type={type}
          title={`Update PayLater KYC - ${selectedUser.name || "User"}`}
          submitLabel="Save KYC"
          mode="data"
          onSubmit={handleKycSubmit}
        />
      )}

      <SuccessModal
        show={showSuccessModal}
        isManpower={false}
        customerName={selectedUser?.name}
        parentRetailerName={AuthService.getLoggedInUser()?.name}
        onClose={() => {
          setShowSuccessModal(false);
          // The freshly unlocked wallet has its full limit free, so land on the
          // combined book filtered to Available rather than the type-specific
          // list — the new wallet is right there at the top of that slice.
          appNav.to("/dashboard/paylater/wallets/all", {
            tab: "all-wallets",
            status: "Available",
          });
        }}
      />
    </div>
  );
};

export default PaylaterUnlockPage;
