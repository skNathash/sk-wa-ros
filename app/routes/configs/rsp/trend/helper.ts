import type { BreadcrumbItem } from "~/types/CommonTypes";

export const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Manage Price",
    redirect: {
      path: "/configs/rsp",
    },
  },
  {
    label: "Trend Watch",
  },
];
