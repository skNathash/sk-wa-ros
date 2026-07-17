import { route } from "@react-router/dev/routes";

export default [
  route("auth/init", "routes/auth/init/index.tsx"),
  route("auth/login", "routes/auth/login/index.tsx"),
  route("auth/logout", "routes/auth/logout/index.tsx"),
  route("auth/forgot-password", "routes/auth/forgot-password/index.tsx"),
  route("auth/reset-password", "routes/auth/reset-password/index.tsx"),
  route("auth/notifications", "routes/auth/notifications/index.tsx"),
  route("auth/signup", "routes/auth/signup/index.tsx"),
  route("auth/signup/register", "routes/auth/signup/register/index.tsx"),
  route("auth/signup/success", "routes/auth/signup/success/index.tsx"),
  route("auth/unauthorized", "routes/auth/unauthorized/index.tsx"),
  route("auth/master/login", "routes/auth/master/login/index.tsx"),
  route("auth/master/stores", "routes/auth/master/stores/index.tsx"),
  route("auth/signup/intro", "routes/auth/signup/intro/index.tsx"),

  // Signup Route
  route("auth/signup/mobile", "routes/auth/signup/mobile/index.tsx"),
  route(
    "auth/signup/personal-info",
    "routes/auth/signup/personal-info/index.tsx",
  ),
  route(
    "auth/signup/store-location",
    "routes/auth/signup/store-location/index.tsx",
  ),
  route("auth/signup/store-info", "routes/auth/signup/store-info/index.tsx"),
  route("auth/verify-token", "routes/auth/verify-token/index.tsx"),
  route("auth/rd", "routes/auth/rd/index.tsx"),
];
