import { route } from "@react-router/dev/routes";

export default [
  route("dashboard/employee/list", "routes/dashboard/employee/list/index.tsx"),
  route(
    "dashboard/employee/view/:id",
    "routes/dashboard/employee/view/index.tsx"
  ),
  route(
    "dashboard/employee/manage",
    "routes/dashboard/employee/manage/index.tsx"
  ),
];
