import useScreenView from "~/hooks/useScreenView";
import type { ViewToggleType } from "~/types/CommonTypes";
import { useState } from "react";
import MobileView from "./MobileView";
import DesktopView from "./DesktopView";

type Props = {
  users: any[];
  callback: (args: { action: string; data?: any }) => void;
};

const SpecificUsers = ({ users, callback }: Props) => {
  const { isMobile } = useScreenView();
  const [view, setView] = useState<ViewToggleType>("list");

  return <MobileView data={users} callback={callback} />;
};

export default SpecificUsers;
