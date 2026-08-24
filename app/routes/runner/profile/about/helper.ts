/** A single fact on the runner's record, and the icon that names it. */
export interface RunnerProfileField {
  key: string;
  /** Field name, set small above the value. */
  _labelLbl: string;
  /** The value as the runner should read it — masked where it is an account. */
  _valueLbl: string;
  /** Lucide icon name for the leading tile. */
  _iconName: string;
}

export const PROFILE_FIELDS: RunnerProfileField[] = [
  {
    key: "phone",
    _labelLbl: "Phone",
    _valueLbl: "+91 98452 33101",
    _iconName: "phone",
  },
  {
    key: "runnerId",
    _labelLbl: "Runner ID",
    _valueLbl: "R-101",
    _iconName: "user",
  },
  {
    key: "homeArea",
    _labelLbl: "Home area",
    _valueLbl: "Kumbalgudu · Bengaluru",
    _iconName: "map-pin",
  },
  {
    key: "pincode",
    _labelLbl: "Pincode",
    _valueLbl: "560074",
    _iconName: "map",
  },
  {
    key: "since",
    _labelLbl: "With SK since",
    _valueLbl: "Jan 2025",
    _iconName: "clock",
  },
  {
    key: "bank",
    _labelLbl: "Bank",
    _valueLbl: "HDFC ****4821",
    _iconName: "landmark",
  },
  {
    key: "upi",
    _labelLbl: "UPI",
    _valueLbl: "ashok@ybl",
    _iconName: "wallet",
  },
];

/** A switch on the runner's own terms of work. */
export interface RunnerPreference {
  key: string;
  _labelLbl: string;
  /** Where the switch starts — the runner's saved setting. */
  isOn: boolean;
}

export const PROFILE_PREFERENCES: RunnerPreference[] = [
  { key: "cod", _labelLbl: "Accept COD", isOn: true },
  { key: "b2b", _labelLbl: "Accept B2B / bulk orders", isOn: true },
  { key: "surge", _labelLbl: "Night surge (after 8 PM)", isOn: false },
  { key: "language", _labelLbl: "Language: English", isOn: true },
];

/** A door out of the profile — help, the playbook, a dispute, or the way out. */
export interface RunnerSupportLink {
  key: string;
  _labelLbl: string;
  _captionLbl: string;
  _iconName: string;
  /** Set on the one row that ends the session, so it reads apart from help. */
  _isDanger: boolean;
}

export const PROFILE_SUPPORT_LINKS: RunnerSupportLink[] = [
  {
    key: "chat",
    _labelLbl: "Chat with StoreKing",
    _captionLbl: "Usually replies in 5 min",
    _iconName: "message-circle",
    _isDanger: false,
  },
  {
    key: "playbook",
    _labelLbl: "How rates & bonuses work",
    _captionLbl: "Read the runner playbook",
    _iconName: "book-open",
    _isDanger: false,
  },
  {
    key: "issue",
    _labelLbl: "Report an issue",
    _captionLbl: "Missing payment, disputes",
    _iconName: "shield-alert",
    _isDanger: false,
  },
  {
    key: "signout",
    _labelLbl: "Sign out",
    _captionLbl: "",
    _iconName: "log-out",
    _isDanger: true,
  },
];

/** Section labels above the two lists that are not the record itself. */
export const PREFERENCES_LBL = "Preferences";
export const SUPPORT_LBL = "Support";
