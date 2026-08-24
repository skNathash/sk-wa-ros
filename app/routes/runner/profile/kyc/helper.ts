/** A check the platform holds on the runner, and what it shows once cleared. */
export interface RunnerKycDoc {
  key: string;
  _labelLbl: string;
  /** The number or match as the runner sees it — masked to its last digits. */
  _valueLbl: string;
  _statusLbl: string;
}

export const KYC_DOCS: RunnerKycDoc[] = [
  {
    key: "phone",
    _labelLbl: "Phone verified",
    _valueLbl: "+91 98452 33101",
    _statusLbl: "Verified",
  },
  {
    key: "aadhaar",
    _labelLbl: "Aadhaar",
    _valueLbl: "XXXX XXXX 4821",
    _statusLbl: "Verified",
  },
  {
    key: "selfie",
    _labelLbl: "Selfie",
    _valueLbl: "Matched 98%",
    _statusLbl: "Verified",
  },
  {
    key: "licence",
    _labelLbl: "Driving license",
    _valueLbl: "KA01 20240012345",
    _statusLbl: "Verified",
  },
  {
    key: "vehiclePhoto",
    _labelLbl: "Vehicle photo",
    _valueLbl: "Honda Activa · KA 01 HK 4821",
    _statusLbl: "Verified",
  },
  {
    key: "bank",
    _labelLbl: "Bank account",
    _valueLbl: "HDFC ****4821 · ashok@ybl",
    _statusLbl: "Verified",
  },
];

/** The line that tells the runner what the whole set adds up to. */
export const KYC_STATE = {
  _titleLbl: "All verified · 100% trust",
  _captionLbl: "Retailers can assign you any job type",
};

export const KYC_NOTE_LBL =
  "Your ID documents are encrypted and only used for face-match. StoreKing never shares your Aadhaar or bank details with retailers or customers.";
