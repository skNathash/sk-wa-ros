import { useEffect } from "react";
import useAppNav from "~/hooks/useAppNav";
import PageAccessService from "~/services/PageAccessService";

export async function clientLoader() {
  return PageAccessService.canAccessPage();
}

const Dashboard = () => {
  const appNav = useAppNav();

  useEffect(() => {
    appNav.replace("/dashboard/main");
  }, []);

  return <></>;
};

export default Dashboard;
