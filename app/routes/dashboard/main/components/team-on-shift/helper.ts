/**
 * Static data source for the "Team on shift" card — who is in the shop right
 * now and who is off.
 */

export type ShiftStatus = "in" | "off";

export type TeamMember = {
  key: string;
  name: string;
  /** Avatar initials, pre-computed so the component stays presentational. */
  initials: string;
  /** Tailwind background for the avatar circle. */
  avatarClass: string;
  role: string;
  /** "07-14" shift window. */
  shift: string;
  status: ShiftStatus;
};

export type TeamOnShiftData = {
  heading: string;
  inCount: number;
  totalCount: number;
  linkLabel: string;
  linkTo: string;
  members: TeamMember[];
};

export const emptyTeamOnShift = (): TeamOnShiftData => ({
  heading: "",
  inCount: 0,
  totalCount: 0,
  linkLabel: "",
  linkTo: "",
  members: [],
});

export const getTeamOnShift = async (): Promise<TeamOnShiftData> =>
  Promise.resolve({
    heading: "Team on shift",
    inCount: 2,
    totalCount: 3,
    linkLabel: "Roster",
    linkTo: "/dashboard/employee",
    members: [
      {
        key: "manjula",
        name: "Manjula",
        initials: "M",
        avatarClass: "tw:bg-fuchsia-500",
        role: "Cashier",
        shift: "07-14",
        status: "in",
      },
      {
        key: "ravi",
        name: "Ravi P.",
        initials: "RP",
        avatarClass: "tw:bg-amber-500",
        role: "Runner",
        shift: "10-20",
        status: "in",
      },
      {
        key: "kiran",
        name: "Kiran",
        initials: "K",
        avatarClass: "tw:bg-sky-500",
        role: "Stockboy",
        shift: "06-12",
        status: "off",
      },
    ],
  });
