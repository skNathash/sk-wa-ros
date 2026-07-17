import { useCallback } from "react";

type Options = {
  header?: string;
  subHeader?: string;
  msg?: string;
  successCb?: () => void;
  okText?: string;
  cancelText?: string;
  cancelCb?: () => void;
};

function useAppAlert() {
  const alert = useCallback(async (options: Options) => {}, []);

  const confirm = useCallback(async (options: Options) => {}, []);

  return { alert, confirm };
}

export default useAppAlert;
