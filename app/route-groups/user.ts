import { route } from "@react-router/dev/routes";

export default [
  route("user/my-profile", "routes/user/my-profile/index.tsx"),
  route("user/emp-profile", "routes/user/emp-profile/index.tsx"),
  route(
    "user/notification-logs",
    "routes/user/notification-logs/index.tsx",
  ),
];
