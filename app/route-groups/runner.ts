import { layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/runner/layout.tsx", [
    route("runner/home", "routes/runner/home/index.tsx"),
    route("runner/jobs", "routes/runner/jobs/index.tsx"),
    route("runner/earnings", "routes/runner/earnings/index.tsx"),
    route("runner/chats", "routes/runner/chats/index.tsx"),
    layout("routes/runner/profile/layout.tsx", [
      route("runner/profile", "routes/runner/profile/about/index.tsx"),
      route("runner/profile/kyc", "routes/runner/profile/kyc/index.tsx"),
      route("runner/profile/vehicle", "routes/runner/profile/vehicle/index.tsx"),
      route("runner/profile/service", "routes/runner/profile/service/index.tsx"),
      route("runner/profile/reviews", "routes/runner/profile/reviews/index.tsx"),
    ]),
  ]),
  // A thread owns the full screen: the composer sits where the tab bar would,
  // so the detail route stays outside the shell layout.
  route("runner/chats/:chatId", "routes/runner/chats/detail/index.tsx"),
];
