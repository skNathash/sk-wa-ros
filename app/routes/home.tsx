import { useEffect } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import type { Route } from "./+types/home";

// export async function clientLoader() {
//   if (AuthService.isUserLoggedIn()) {
//     const [activePlan, balance] = await Promise.all([
//       FranchiseService.getActivePlan(),
//       FranchiseService.getBalance(AuthService.getLoggedInUserId(true)),
//     ]);
//     return { activePlan, balance };
//   }
//   return null;
// }

export function meta({}: Route.MetaArgs) {
  return [
    { title: "StoreKing POS App" },
    { name: "description", content: "StoreKing POS" },
  ];
}

export default function Home() {
  const { replace } = useAppNav();

  useEffect(() => {
    const timer = setTimeout(() => {
      replace("/auth/init");
    }, 500);

    return () => clearTimeout(timer);
  }, [replace]);

  return (
    <div className="tw:flex tw:justify-center tw:items-center tw:min-h-dvh tw:bg-white">
      <ImgRender src="/ai/loader.gif" alt="StoreKing" className="tw:h-20" />
    </div>
  );
}
