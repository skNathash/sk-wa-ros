import { Outlet, redirect } from "react-router";
import "../i18n";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";

const AppLayout: React.FC = () => {
  return <Outlet />;
};

export async function clientLoader({ request }: { request: Request }) {
  try {
    const token = AuthService.getLoggedInToken();
    if (!token) return null;

    const decoded = MiscService.decodeJwt(token);
    if (decoded?.userType !== "Runner") return null;

    const pathname = new URL(request.url).pathname;
    // A Runner may only access the login page and the runner app.
    if (pathname.startsWith("/auth/login") || pathname.startsWith("/runner/")) {
      return null;
    }

    return redirect("/runner/home");
  } catch (e) {
    return null;
  }
}

export default AppLayout;
