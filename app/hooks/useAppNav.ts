import { useCallback } from "react";
import { useNavigate } from "react-router";

const useAppNav = () => {
  const navigate = useNavigate();

  const to = useCallback(
    (path: string, params?: Record<string, any>) => {
      navigate(path + (params ? `?${convertToParams(params)}` : ""));
    },
    [navigate]
  );

  const replace = useCallback(
    (path: string, params?: Record<string, any>) => {
      navigate(path + (params ? `?${convertToParams(params)}` : ""), {
        replace: true,
        state: params,
      });
    },
    [navigate]
  );

  const back = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const openInNewTab = useCallback(
    (url: string, params?: Record<string, any>) => {
      const prefixedUrl = `${url}`;
      window.open(
        prefixedUrl + (params ? `?${convertToParams(params)}` : ""),
        "_blank"
      );
    },
    []
  );

  return {
    to,
    back,
    replace,
    openInNewTab,
  };
};

const convertToParams = (params: Record<string, any>) => {
  return Object.keys(params)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? "")}`
    )
    .join("&");
};

export default useAppNav;
