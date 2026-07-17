import { useEffect, useState } from "react";

type Props = {
  seconds?: number;
  callback?: (a: { action: string }) => void;
};

const Timer = ({ seconds = 60, callback }: Props) => {
  const [timer, setTimer] = useState(seconds);

  useEffect(() => {
    const t = setInterval(() => {
      setTimer((v) => {
        const t = v - 1;
        return t <= 0 ? 0 : t;
      });
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (timer == 0 && callback) {
      callback({ action: "completed" });
    }
  }, [callback, timer]);

  const display =
    timer >= 60
      ? `${Math.floor(timer / 60)}min${timer % 60 ? ` ${timer % 60}s` : ""}`
      : `${timer}s`;

  return <>{display}</>;
};

export default Timer;
