import { route } from "@react-router/dev/routes";

export default [
  route("user/my-profile", "routes/user/my-profile/index.tsx"),
  route("user/documents", "routes/user/documents/index.tsx"),
  route("user/store-photos", "routes/user/store-photos/index.tsx"),
  route("user/store-branding", "routes/user/store-branding/index.tsx"),
  route("user/emp-profile", "routes/user/emp-profile/index.tsx"),
  route("user/store-policies", "routes/user/store-policies/index.tsx"),
  route("user/notification-logs", "routes/user/notification-logs/index.tsx"),
  route("user/store-notes", "routes/user/store-notes/index.tsx"),
];
