import { useState } from "react";

import { useEffect } from "react";
import MiscService from "~/services/MiscService";

const useScreenView = () => {
  const [isMobile, setIsMobile] = useState<boolean>(MiscService.isMobile());

  useEffect(() => {
    setIsMobile(MiscService.isMobile());

    const handleResize = () => {
      setIsMobile(MiscService.isMobile());
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile };
};

export default useScreenView;
