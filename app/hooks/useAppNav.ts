import { useCallback } from "react";
import { useNavigate, type NavigateOptions } from "react-router";

const useAppNav = () => {
  const navigate = useNavigate();

  /**
   * `options` is passed straight through to react-router's `navigate` — use it
   * for things like `{ preventScrollReset: true }` when the destination is a
   * tab sitting further down the page and the scroll position should stay put.
   */
  const to = useCallback(
    (path: string, params?: Record<string, any>, options?: NavigateOptions) => {
      navigate(path + (params ? `?${convertToParams(params)}` : ""), options);
    },
    [navigate],
  );

  /** Same as `to`, but swaps the current history entry instead of pushing one. */
  const replace = useCallback(
    (path: string, params?: Record<string, any>, options?: NavigateOptions) => {
      navigate(path + (params ? `?${convertToParams(params)}` : ""), {
        replace: true,
        state: params,
        ...options,
      });
    },
    [navigate],
  );

  const back = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const openInNewTab = useCallback(
    (url: string, params?: Record<string, any>) => {
      const prefixedUrl = `${url}`;
      window.open(
        prefixedUrl + (params ? `?${convertToParams(params)}` : ""),
        "_blank",
      );
    },
    [],
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
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? "")}`,
    )
    .join("&");
};

export default useAppNav;
