import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";

import AppHeader from "~/components/core/header/AppHeader";
import DepositMoneyForm from "./components/DepositMoneyForm";
import AppCard from "~/components/core/card/AppCard";
import DynamicUpi from "./components/DynamicUpi";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import useGeoLocation from "~/hooks/useGeoLocation";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import PaymentService from "~/services/PaymentService";
import useAppNav from "~/hooks/useAppNav";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import HostToHost from "./components/HostToHost";
import DepositMoneyTab from "../components/DepositMoneyTab";

// Add a type for bank data
interface BankData {
  name: string;
  acNumber?: string;
  acName?: string;
  branchName?: string;
  ifsc?: string;
  [key: string]: any;
}

interface DepositMoneyFormData {
  depositVia: string;
  paymentMode: string;
  amount: number | null;
  remarks: string;
  bank: string | null;
  fromBank: string | null;
  utr: string;
  bankPincode: string;
  branchName: string;
  chequeDt: string;
  chequeNo: string;
  slip: { id: string }[];
  lat: number | null;
  lng: number | null;
  iagree: boolean;
  selectedBankData: BankData | null;
  fromBankData: BankData | null;
  bankTown: string;
  bankDistrict: string;
  bankState: string;
}

const defaultFormData: DepositMoneyFormData = {
  depositVia: "bankDeposit",
  paymentMode: "cash",
  amount: null,
  remarks: "",
  bank: null,
  fromBank: null,
  utr: "",
  bankPincode: "",
  branchName: "",
  chequeDt: "",
  chequeNo: "",
  slip: [],
  lat: null,
  lng: null,
  iagree: true,
  selectedBankData: null,
  fromBankData: null,
  bankTown: "",
  bankDistrict: "",
  bankState: "",
};

const DepositMoneyPage = () => {
  const appNav = useAppNav();

  const [loading, setLoading] = useState(true);
  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    message?: string;
  }>({ show: false });
  const [hostData, setHostData] = useState<any>([]);

  const methods = useForm({
    defaultValues: defaultFormData,
  });

  const { reset } = methods;

  const toast = useAppToast();
  const geoLocation = useGeoLocation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const franchiseId = AuthService.getLoggedInUserId(true);
        const resp = await AccountService.getHostToHostData({
          franchiseId,
        });
        setHostData(resp.data?.data || []);
      } catch (e) {
        setHostData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const f = methods.getValues();
    let msg = "";
    if (!f.depositVia) {
      msg = "Please choose Deposit Via";
    } else if (f.depositVia !== "pg" && !f.paymentMode) {
      msg = "Please choose Payment Mode";
    } else if (
      ["cheque", "cash"].indexOf(f.paymentMode) != -1 &&
      !(f.selectedBankData && f.selectedBankData.name)
    ) {
      msg = "Please choose StoreKing Bank";
    } else if (
      f.paymentMode === "cheque" &&
      !(f.fromBankData && f.fromBankData.name)
    ) {
      msg = "Please choose Cheque Bank";
    } else if (f.paymentMode === "cheque" && !f.chequeNo) {
      msg = "Please provide Cheque No";
    } else if (f.paymentMode === "cheque" && !f.chequeDt) {
      msg = "Please provide Cheque Date";
    } else if (f.paymentMode === "cash" && !f.branchName) {
      msg = "Please provide Deposit Branch Name";
    } else if (f.paymentMode === "cash" && !f.bankPincode) {
      msg = "Please provide Deposit Bank Pincode";
    } else if (f.paymentMode === "cash" && ("" + f.bankPincode).length != 6) {
      msg = "Please provide valid Deposit Bank Pincode";
    } else if (
      f.depositVia === "netBanking" &&
      !(f.fromBankData && f.fromBankData.name)
    ) {
      msg = "Please choose From Bank Name";
    } else if (f.depositVia === "netBanking" && !f.utr) {
      msg = "Please provide UTR No.";
    } else if (!f.amount) {
      msg = "Please provide Amount";
    } else if (f.depositVia !== "pg" && f.amount < 100) {
      msg = "Amount cannot be less than Rs.100";
    } else if (f.depositVia === "pg" && f.amount < 1) {
      msg = "Amount cannot be less than Rs.1";
    } else if (!f.remarks) {
      msg = "Please provide Remarks";
    } else if (f.depositVia !== "pg" && !f.slip) {
      msg = "Please provide Desposit Slip";
    } else if (f.depositVia === "bankDeposit" && !f.iagree) {
      msg = "Please read and tick the checkbox";
    } else {
      msg = "";
    }
    return {
      status: msg ? false : true,
      msg,
    };
  };

  const onSubmit = async () => {
    const validation = validateForm();
    if (!validation.status) {
      toast.show({ msg: validation.msg });
      return;
    }

    setBusyLoader({
      show: true,
      message: "Validating geolocation, please wait...",
    });
    // Get geolocation after validation
    geoLocation.pickLocation(
      (geo) => {
        if (geo.lat && geo.lng) {
          methods.setValue("lat", geo.lat);
          methods.setValue("lng", geo.lng);
          if (geo.town) methods.setValue("bankTown", geo.town);
          if (geo.district) methods.setValue("bankDistrict", geo.district);
          if (geo.state) methods.setValue("bankState", geo.state);
          // Call generateReceipt after lat/lng are set
          generateReceipt();
        } else if (geo.errMsg) {
          setBusyLoader({ show: false });
          toast.show({ msg: geo.errMsg });
          return;
        }
      },
      true // true to get geocode info
    );
  };

  // Prepare payload for API submission
  const preparePayload = () => {
    const f = methods.getValues();
    const accNo = AuthService.getUserAccountId() || "";
    let param: any = {};
    param.franchiseId = AuthService.getLoggedInUserId(true);
    param.accountNo = accNo;
    param.amount = Number(f.amount);
    if (f.selectedBankData && f.selectedBankData.name) {
      param.bank = f.selectedBankData.name;
      if (f.selectedBankData._id) {
        param.bankId = f.selectedBankData._id;
      }
      param.acName = f.selectedBankData.acName || "";
      param.acNumber = f.selectedBankData.acNumber || "";
      param.ifscCode = f.selectedBankData.ifsc || "";
    }
    param.slipImage = f.slip.map((e) => e.id);

    if (f.paymentMode === "cash") {
      param.paymentType = "Cash";
      param.makerComments = f.remarks;
      param.sourceBankName = "";
      param.sourceBankBranchName = f.branchName;
      param.sourceBankPinCode = Number(f.bankPincode);
    } else if (f.paymentMode === "cheque") {
      param.paymentType = "Cheque";
      param.fromBank = f.fromBankData?.name || "";
      param.chequeNo = f.chequeNo;
      param.chequeDate = f.chequeDt;
      param.makerComments = f.remarks;
    } else if (f.depositVia === "netBanking") {
      param.fromBank = f.fromBankData?.name || "";
      param.utr = f.utr;
      param.paymentType = f.paymentMode?.toUpperCase() || "";
    }

    if (f.depositVia === "pg" || f.depositVia === "wallet") {
      const paymentTypeIs: any = {
        pg: "PG",
        wallet: "Wallet",
      };
      param = {
        franchiseId: AuthService.getLoggedInUserId(),
        accountNo: accNo,
        amount: Number(f.amount),
        paymentType: paymentTypeIs[f.depositVia],
      };
    }

    param.geoLocation = {
      lat: Number(f.lat),
      long: Number(f.lng),
    };

    return param;
  };

  // Generate receipt and handle API response
  const generateReceipt = async () => {
    const payload = preparePayload();
    setBusyLoader({
      show: true,
      message: "Generating receipt, please wait...",
    });
    const data = await AccountService.generateReceipt(payload);
    setBusyLoader({ show: false });
    let errorMsg = "Failed to generate receipt, please try again";
    if (data?.statusCode && data.statusCode !== 200) {
      toast.show({
        msg: data?.data?.message || errorMsg,
        color: "danger",
      });
      return;
    }
    if (methods.getValues().depositVia === "pg") {
      PaymentService.setTempData({
        moduleType: "depositMoney",
        amount: Number(methods.getValues().amount),
        transactionId: data.data?.ref_no,
      });
      appNav.to("/payment");
    } else {
      toast.show({ msg: "Receipt generated successfully", color: "success" });
    }
    reset(defaultFormData);
  };

  return (
    <>
      <AppHeader title="Deposit Money" showCart={false} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbsData} className="tw:mb-4" />

          {/* <DepositMoneyTab activeTab="create" className="tw:mb-4" /> */}

          {/* <HostToHost hostData={hostData} /> */}

          {loading ? (
            <div className="tw-text-center tw-py-8">Loading...</div>
          ) : (
            <>
              {/* <DynamicUpi /> */}
              <FormProvider {...methods}>
                <AppCard>
                  <DepositMoneyForm hostData={hostData} />
                  <div className="tw:mt-4 tw:text-end">
                    <AppButton type="button" onClick={onSubmit} expand="block">
                      Submit
                    </AppButton>
                  </div>
                </AppCard>
              </FormProvider>
            </>
          )}
        </div>
      </div>
      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

const breadcrumbsData: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Deposit Money",
    redirect: {
      path: "/dashboard/deposit-money/options",
    },
  },
  {
    label: "Deposit",
  },
];

export default DepositMoneyPage;
